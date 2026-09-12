import type { SamplePost } from "@/lib/types"

const UA = "web:hyperadar:v1.0 (social arbitrage research tool)"

// Subreddits we search directly via their public JSON endpoints (keyless).
const SUBREDDITS = ["wallstreetbets", "stocks"]

export type RedditResult = {
  available: boolean
  mentions: number | null
  sentiment: number | null
  posts: SamplePost[]
}

const bullish = /moon|buy|calls|long|squeeze|bullish|rip|undervalued|breakout/i
const bearish = /puts|short|sell|dump|bearish|overvalued|crash|baghold|scam/i

// Real Reddit chatter via the per-subreddit search endpoint (append .json, no auth).
export async function getReddit(ticker: string): Promise<RedditResult> {
  const empty: RedditResult = { available: false, mentions: null, sentiment: null, posts: [] }
  const q = encodeURIComponent(`$${ticker} OR ${ticker} stock`)

  try {
    const results = await Promise.all(
      SUBREDDITS.map(async (sub) => {
        // restrict_sr=1 keeps results inside the subreddit; sort=new, last month.
        const url = `https://www.reddit.com/r/${sub}/search.json?q=${q}&restrict_sr=1&sort=new&limit=25&t=month`
        try {
          const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" })
          if (!res.ok) return [] as any[]
          const json = await res.json()
          return (json?.data?.children ?? []).map((c: any) => c.data)
        } catch {
          return [] as any[]
        }
      }),
    )

    const items = results.flat().filter(Boolean)
    if (items.length === 0) return { ...empty, available: true, mentions: 0, sentiment: 0 }

    const posts: SamplePost[] = items
      .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
      .slice(0, 5)
      .map((d) => ({
        platform: `r/${d?.subreddit ?? "reddit"}`,
        author: d?.author ?? "unknown",
        followers: null,
        engagement: (d?.score ?? 0) + (d?.num_comments ?? 0),
        createdAt: d?.created_utc ? new Date(d.created_utc * 1000).toISOString() : "",
        text: (d?.title ?? "").slice(0, 240),
      }))

    // Lightweight keyword sentiment as a proxy (Reddit has no bull/bear tag).
    let score = 0
    let counted = 0
    for (const d of items) {
      const title: string = d?.title ?? ""
      if (bullish.test(title)) {
        score++
        counted++
      } else if (bearish.test(title)) {
        score--
        counted++
      }
    }
    const sentiment = counted > 0 ? score / counted : 0

    return { available: true, mentions: items.length, sentiment, posts }
  } catch {
    return empty
  }
}
