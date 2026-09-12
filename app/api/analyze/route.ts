import { runAnalysis, NoDataError } from "@/lib/analyze-core"

export const maxDuration = 60

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const raw = typeof body?.ticker === "string" ? body.ticker.trim() : ""

  if (!raw || !/^[A-Za-z.\-]{1,8}$/.test(raw)) {
    return Response.json({ error: "Enter a valid US ticker symbol (e.g. NVDA)." }, { status: 400 })
  }

  try {
    const response = await runAnalysis(raw)
    return Response.json(response)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.log("[v0] analyze route error:", message)

    if (err instanceof NoDataError) {
      return Response.json(
        { error: `No market data found for "${raw.toUpperCase()}". Check the symbol and try again.` },
        { status: 404 },
      )
    }

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
