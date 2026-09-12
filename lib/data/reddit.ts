import type { SamplePost } from "@/lib/types"

const UA = "web:hyperadar:v1.0 (social arbitrage research tool)"

export type RedditResult = {
  available: boolean
  mentions: number | null
  sentiment: number | null
  posts: SamplePost[]
}

// Real Reddit chatter via the public search endpoint (keyless, requires User-Agent).
export async function getReddit(ticker: string): Promise<RedditResult> {
  const empty: RedditResult = { available: false, mentions: null, sentiment: null, posts: [] }

  try {
    const q = encodeURIComponent(`$${ticker} OR ${ticker} stock`)
    const url = `https://www.reddit.com/search.json?q=${q}&sort=new&limit=40&t=month`
    const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" })
    if (!res.ok) return empty

    const json = await res.json()
    const children: any[] = json?.data?.children ?? []
    if (children.length === 0) return { ...empty, available: true, mentions: 0 }

    const posts: SamplePost[] = children
      .map((c) => c.data)
      .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
      .slice(0, 5)
      .map((d) => ({
        platform: "Reddit",
        author: d?.author ?? "unknown",
        followers: null,
        engagement: (d?.score ?? 0) + (d?.num_comments ?? 0),
        createdAt: d?.created_utc ? new Date(d.created_utc * 1000).toISOString() : "",
        text: (d?.title ?? "").slice(0, 240),
      }))

    // Lightweight keyword sentiment as a proxy (Reddit has no bull/bear tag).
    const bullish = /moon|buy|calls|long|squeeze|bullish|rip|undervalued|breakout/i
    const bearish = /puts|short|sell|dump|bearish|overvalued|crash|baghold|scam/i
    let score = 0
    let counted = 0
    for (const c of children) {
      const title: string = c?.data?.title ?? ""
      if (bullish.test(title)) {
        score++
        counted++
      } else if (bearish.test(title)) {
        score--
        counted++
      }
    }
    const sentiment = counted > 0 ? score / counted : 0

    return { available: true, mentions: children.length, sentiment, posts }
  } catch {
    return empty
  }
}
