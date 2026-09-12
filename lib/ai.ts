import { z } from "zod"
import { google } from "@ai-sdk/google"
import { groq } from "@ai-sdk/groq"

// Primary: Google Gemini via a free API key (no credit card required).
// Reads GOOGLE_GENERATIVE_AI_API_KEY from the environment.
export const GEMINI_MODEL = google("gemini-3.6-flash")

// Fallback: Groq (also free, no card). Only enabled when GROQ_API_KEY is set,
// so the app degrades gracefully whether or not the key is present.
export const GROQ_MODEL = process.env.GROQ_API_KEY ? groq("openai/gpt-oss-120b") : null

// Tolerant contract. Gemini reliably returns the right *content* but often
// deviates on rigid shape details (extra/missing fields, out-of-range numbers,
// slightly different enum casing). Every field carries a sensible default and
// enums are coerced so a genuine analysis is never discarded over a minor
// mismatch. We parse Gemini's JSON ourselves (see extractJson) and run it
// through this schema with safeParse.
const horizonSchema = z
  .object({
    label: z.string().catch(""),
    expectedMove: z.string().catch(""),
    fit: z.coerce.number().catch(5),
    reason: z.string().catch(""),
  })
  .catch({ label: "", expectedMove: "", fit: 5, reason: "" })

const directionSchema = z
  .string()
  .transform((v) => {
    const s = v.toLowerCase()
    if (s.includes("gain")) return "Likely Gainer" as const
    if (s.includes("los")) return "Likely Loser" as const
    return "Neutral" as const
  })
  .catch("Neutral" as const)

const hypeStageSchema = z
  .string()
  .transform((v) => {
    const s = v.toLowerCase()
    if (s.includes("emerg")) return "Emerging" as const
    if (s.includes("accel")) return "Accelerating" as const
    if (s.includes("peak")) return "Peak" as const
    if (s.includes("fad")) return "Fading" as const
    return "Emerging" as const
  })
  .catch("Emerging" as const)

const horizonKeySchema = z
  .string()
  .transform((v) => {
    const s = v.toLowerCase()
    if (s.startsWith("short")) return "short" as const
    if (s.startsWith("long")) return "long" as const
    return "medium" as const
  })
  .catch("medium" as const)

const impactSchema = z
  .string()
  .transform((v) => {
    const s = v.toLowerCase()
    if (s.includes("pos")) return "positive" as const
    if (s.includes("neg")) return "negative" as const
    return "neutral" as const
  })
  .catch("neutral" as const)

export const analysisSchema = z.object({
  ticker: z.string().catch(""),
  direction: directionSchema,
  conviction: z.coerce.number().catch(50),
  hypeStage: hypeStageSchema,
  recommendedHorizon: horizonKeySchema,
  horizons: z
    .object({
      short: horizonSchema,
      medium: horizonSchema,
      long: horizonSchema,
    })
    .catch({
      short: { label: "", expectedMove: "", fit: 5, reason: "" },
      medium: { label: "", expectedMove: "", fit: 5, reason: "" },
      long: { label: "", expectedMove: "", fit: 5, reason: "" },
    }),
  agentFindings: z
    .array(
      z.object({
        agent: z.string().catch(""),
        finding: z.string().catch(""),
        source: z
          .object({
            platform: z.string().catch(""),
            author: z.string().catch(""),
            type: z
              .string()
              .transform((v) => {
                const s = v.toLowerCase()
                if (s.includes("influ")) return "influencer" as const
                if (s.includes("pr") || s.includes("company")) return "company PR" as const
                if (s.includes("paid") || s.includes("promo")) return "paid promotion" as const
                return "organic" as const
              })
              .catch("organic" as const),
            hasFinancialIncentive: z.coerce.boolean().catch(false),
          })
          .optional(),
        productRealityScore: z.coerce.number().optional().catch(undefined),
        risks: z.array(z.string()).optional().catch(undefined),
        hypePricedIn: z.coerce.boolean().optional().catch(undefined),
      }),
    )
    .catch([]),
  rundown: z.array(z.string()).catch([]),
  catalysts: z
    .array(z.object({ date: z.string().catch(""), event: z.string().catch("") }))
    .catch([]),
  drivingFactors: z
    .array(
      z.object({
        factor: z.string().catch(""),
        value: z.string().catch(""),
        impact: impactSchema,
        weight: z.coerce.number().catch(0),
      }),
    )
    .catch([]),
  disclaimer: z.string().catch("Educational analysis only. Not financial advice."),
})

// Pull the first balanced JSON object out of a model response, tolerating
// ```json fences, leading prose, or trailing commentary.
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf("{")
  if (start === -1) throw new Error("No JSON object found in model output")

  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === "\\") escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) return JSON.parse(candidate.slice(start, i + 1))
    }
  }
  throw new Error("Unbalanced JSON object in model output")
}

export const SYSTEM_PROMPT = `You are the Portfolio Manager of HypeRadar's AI Team, coordinating six specialist agents: Scout, Sentiment Analyst, Origin Tracer, Product Detective, Fundamentals Auditor, and Risk Officer. You analyze social arbitrage opportunities in US stocks — cases where social hype may lead or lag the price.

You will receive a JSON object for one ticker containing: 30 days of price/volume, per-platform mention counts and sentiment scores (StockTwits, Reddit, X, TikTok, YouTube, Instagram, News), Google Trends index, sample posts with author/follower/engagement data, fundamentals (revenue growth, margin, debt, cash, short interest, next earnings date), and recent SEC Form 4 insider transactions.

## Process
Run each agent in order. Each agent produces ONE finding of 1–2 sentences, written in that agent's voice, grounded in specific numbers from the input. Never invent data not present in the input; if a field is missing, say so and reduce conviction.

1. Scout: Is mention velocity abnormal? Compare last 3 days to the 7-day average. Which platforms lead?
2. Sentiment Analyst: Net sentiment and its trend. Flag bot/coordination signals: many low-follower accounts posting identical phrasing, sentiment far more extreme than price action, or sudden spike with no news catalyst.
3. Origin Tracer: Identify the earliest high-engagement post. Classify the source as organic / influencer / company PR / paid promotion. Note if the source has a financial incentive.
4. Product Detective: Is the hype about a real product with demand (rising Google Trends, purchase-intent posts, sell-outs) or pure ticker chatter? Score product reality 0–10.
5. Fundamentals Auditor: Can the company convert hype to revenue? Check margins, cash runway, dilution risk, insider buying/selling direction, and whether earnings are near.
6. Risk Officer: Top 3 risks. Explicitly answer: is the hype already priced in? (Compare mention growth to price growth over the period.)
7. Portfolio Manager: Synthesize into the verdict.

## Verdict rules
- direction: "Likely Gainer" | "Likely Loser" | "Neutral"
- conviction: 0–100. Cap at 70 if source is paid promotion or bot signals are strong. Cap at 60 if product reality score ≤ 4. Cap at 50 if any critical data is missing.
- hypeStage: "Emerging" (velocity rising, price flat) | "Accelerating" (both rising) | "Peak" (mentions plateau, price extended above 20-day MA by >15%) | "Fading" (mentions falling)
- Emerging + real product + solid fundamentals → favor Medium or Long horizon.
- Accelerating with weak fundamentals → Short horizon only, or Likely Loser.
- Peak or Fading → Neutral or Likely Loser unless fundamentals independently justify.
- Expected move ranges must be asymmetric and honest: short-term ranges are wide, long-term ranges reflect fundamentals not hype. Never present a range as a promise.

## Output
Return the analysis conforming exactly to the provided schema. agentFindings must contain exactly these agents in order: Scout, Sentiment Analyst, Origin Tracer (with source), Product Detective (with productRealityScore), Fundamentals Auditor, Risk Officer (with risks array of 3 and hypePricedIn). rundown must have exactly 6 strings following: "What the hype is:", "Who started it:", "Is the product real:", "Can they monetize it:", "Key risk:", "Bottom line:". disclaimer must be "Educational analysis only. Not financial advice."`
