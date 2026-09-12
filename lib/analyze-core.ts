import { generateText, type LanguageModel } from "ai"
import { aggregateTickerData } from "@/lib/data/aggregate"
import {
  analysisSchema,
  extractJson,
  GEMINI_MODEL,
  GROQ_MODEL,
  reconcileAnalysis,
  SYSTEM_PROMPT,
} from "@/lib/ai"
import { getCached, setCached } from "@/lib/cache"
import type { Analysis, AnalyzeResponse, TickerData } from "@/lib/types"

export class NoDataError extends Error {}

// De-dupe concurrent requests for the same ticker (e.g. Trending Now loading
// 5 tickers while a user also clicks one) so we never run the same expensive
// pipeline twice in parallel.
const inFlight = new Map<string, Promise<AnalyzeResponse>>()

function buildPrompt(data: TickerData): string {
  return `Analyze this ticker and respond with ONLY a single JSON object (no markdown fences, no commentary) matching the output contract described in your instructions. Here is the JSON input:\n\n${JSON.stringify(
    data,
  )}`
}

async function generateWith(
  model: LanguageModel,
  data: TickerData,
): Promise<{ analysis: Analysis; raw: string } | null> {
  const { text } = await generateText({ model, system: SYSTEM_PROMPT, prompt: buildPrompt(data) })
  // Log the raw model output so the JSON shape can be verified in the server logs.
  console.log("[v0] raw model response:", text)
  const parsed = analysisSchema.safeParse(extractJson(text))
  if (!parsed.success) {
    console.log("[v0] schema parse failed:", parsed.error.message)
    return null
  }
  return { analysis: reconcileAnalysis(parsed.data), raw: text }
}

// Runs the full pipeline for one ticker with layered resilience:
//   1. Fetch live data. If that fails, serve the cached result (stale) if any.
//   2. Analyze with Gemini, then Groq (when configured) as a fallback.
//   3. If every model fails, serve the cached result (stale) if any.
// Successful runs refresh the cache. Returns whether the payload is stale.
async function run(rawTicker: string): Promise<AnalyzeResponse> {
  const ticker = rawTicker.toUpperCase()

  let data: TickerData
  try {
    data = await aggregateTickerData(ticker)
    if (data.prices.length === 0) throw new NoDataError("no prices")
  } catch (err) {
    const cached = getCached(ticker)
    if (cached) {
      console.log("[v0] data fetch failed, serving cached result for", ticker)
      return { ...cached, stale: true }
    }
    if (err instanceof NoDataError) throw err
    throw new NoDataError(err instanceof Error ? err.message : String(err))
  }

  const models: Array<{ name: string; model: LanguageModel }> = [
    { name: "gemini", model: GEMINI_MODEL },
  ]
  if (GROQ_MODEL) models.push({ name: "groq", model: GROQ_MODEL })

  for (const { name, model } of models) {
    try {
      const generated = await generateWith(model, data)
      if (generated) {
        const response: AnalyzeResponse = { analysis: generated.analysis, data, raw: generated.raw }
        setCached(ticker, response)
        return response
      }
    } catch (err) {
      console.log(`[v0] ${name} generation error:`, err instanceof Error ? err.message : String(err))
    }
  }

  // Every model failed — fall back to a cached verdict paired with fresh data.
  const cached = getCached(ticker)
  if (cached) {
    console.log("[v0] AI failed, serving cached analysis for", ticker)
    return { analysis: cached.analysis, data, stale: true }
  }
  throw new Error("AI analysis failed and no cached result is available.")
}

export function runAnalysis(rawTicker: string): Promise<AnalyzeResponse> {
  const key = rawTicker.toUpperCase()
  const existing = inFlight.get(key)
  if (existing) return existing
  const p = run(key).finally(() => inFlight.delete(key))
  inFlight.set(key, p)
  return p
}
