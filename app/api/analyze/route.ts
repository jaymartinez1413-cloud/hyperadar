import { generateText } from "ai"
import { aggregateTickerData } from "@/lib/data/aggregate"
import { analysisSchema, extractJson, MODEL, SYSTEM_PROMPT } from "@/lib/ai"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const raw = typeof body?.ticker === "string" ? body.ticker.trim() : ""

    if (!raw || !/^[A-Za-z.\-]{1,8}$/.test(raw)) {
      return Response.json({ error: "Enter a valid US ticker symbol (e.g. NVDA)." }, { status: 400 })
    }

    const data = await aggregateTickerData(raw)

    if (data.prices.length === 0) {
      return Response.json(
        { error: `No market data found for "${data.ticker}". Check the symbol and try again.` },
        { status: 404 },
      )
    }

    const { text } = await generateText({
      model: MODEL,
      system: SYSTEM_PROMPT,
      prompt: `Analyze this ticker and respond with ONLY a single JSON object (no markdown fences, no commentary) matching the output contract described in your instructions. Here is the JSON input:\n\n${JSON.stringify(
        data,
      )}`,
    })

    const parsed = analysisSchema.safeParse(extractJson(text))
    if (!parsed.success) {
      console.log("[v0] schema parse failed:", parsed.error.message)
      return Response.json({ error: "Analysis failed. Please try again." }, { status: 502 })
    }

    return Response.json({ analysis: parsed.data, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.log("[v0] analyze route error:", message)

    if (/api[_ ]?key|GOOGLE_GENERATIVE_AI_API_KEY|permission|API key not valid/i.test(message)) {
      return Response.json(
        {
          error:
            "The Google Gemini API key is missing or invalid. Get a free key at aistudio.google.com/apikey (no credit card required) and add it as GOOGLE_GENERATIVE_AI_API_KEY in your project settings.",
        },
        { status: 401 },
      )
    }

    return Response.json({ error: "Analysis failed. Please try again." }, { status: 500 })
  }
}
