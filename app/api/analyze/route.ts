import { generateText, Output } from "ai"
import { aggregateTickerData } from "@/lib/data/aggregate"
import { analysisSchema, MODEL, SYSTEM_PROMPT } from "@/lib/ai"

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

    const { output } = await generateText({
      model: MODEL,
      system: SYSTEM_PROMPT,
      output: Output.object({ schema: analysisSchema }),
      prompt: `Analyze this ticker. Here is the JSON input:\n\n${JSON.stringify(data)}`,
    })

    return Response.json({ analysis: output, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.log("[v0] analyze route error:", message)

    if (/credit card/i.test(message)) {
      return Response.json(
        {
          error:
            "AI Gateway needs a credit card on file before it will run analyses. Open your Vercel dashboard, go to the AI tab, and click \"Add credit card\" to unlock your free credits. No code changes are needed once that's done.",
        },
        { status: 402 },
      )
    }

    return Response.json({ error: "Analysis failed. Please try again." }, { status: 500 })
  }
}
