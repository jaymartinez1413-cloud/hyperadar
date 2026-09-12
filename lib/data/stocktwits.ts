import type { SamplePost } from "@/lib/types"

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

export type StockTwitsResult = {
  available: boolean
  mentions: number | null
  sentiment: number | null // -1..+1
  recentDailyMentions: number[] // per-day counts within the returned window
  posts: SamplePost[]
}

// Real StockTwits social data from the public symbol stream (keyless).
export async function getStockTwits(ticker: string): Promise<StockTwitsResult> {
  const empty: StockTwitsResult = {
    available: false,
    mentions: null,
    sentiment: null,
    recentDailyMentions: [],
    posts: [],
  }

  try {
    const url = `https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(ticker)}.json`
    const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" })
    if (!res.ok) return empty

    const json = await res.json()
    const messages: any[] = json?.messages ?? []
    if (messages.length === 0) return { ...empty, available: true, mentions: 0 }

    let bull = 0
    let bear = 0
    const dayBuckets = new Map<string, number>()

    for (const m of messages) {
      const basic = m?.entities?.sentiment?.basic
      if (basic === "Bullish") bull++
      else if (basic === "Bearish") bear++
      const day = (m?.created_at ?? "").slice(0, 10)
      if (day) dayBuckets.set(day, (dayBuckets.get(day) ?? 0) + 1)
    }

    const rated = bull + bear
    const sentiment = rated > 0 ? (bull - bear) / rated : 0

    const recentDailyMentions = [...dayBuckets.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([, count]) => count)

    const posts: SamplePost[] = messages.slice(0, 6).map((m) => ({
      platform: "StockTwits",
      author: m?.user?.username ?? "unknown",
      followers: m?.user?.followers ?? null,
      engagement: (m?.likes?.total ?? 0) + (m?.reshares?.reshared_count ?? 0),
      createdAt: m?.created_at ?? "",
      text: (m?.body ?? "").slice(0, 240),
    }))

    return {
      available: true,
      mentions: messages.length,
      sentiment,
      recentDailyMentions,
      posts,
    }
  } catch {
    return empty
  }
}
