import type { PlatformStat, SamplePost, TickerData } from "@/lib/types"
import { getFundamentals, getPriceHistory } from "./nasdaq"
import { getStockTwits } from "./stocktwits"
import { getReddit } from "./reddit"
import { getNews } from "./news"
import { getInsiderActivity } from "./sec"

// Pulls every real source in parallel and assembles the object the AI team analyzes.
// Fields we cannot source without paid/keyed APIs are marked unavailable and listed
// in missingFields so the agents can honestly reduce conviction.
export async function aggregateTickerData(rawTicker: string): Promise<TickerData> {
  const ticker = rawTicker.trim().toUpperCase()

  const [price, fundamentals, stocktwits, reddit, insider] = await Promise.all([
    getPriceHistory(ticker),
    getFundamentals(ticker),
    getStockTwits(ticker),
    getReddit(ticker),
    getInsiderActivity(ticker),
  ])
  // News query benefits from the resolved company name, so fetch it after price.
  const news = await getNews(ticker, price.companyName)

  // Working keyless feeds first, then planned integrations flagged comingSoon.
  const platforms: PlatformStat[] = [
    {
      platform: "StockTwits",
      mentions: stocktwits.mentions,
      sentiment: stocktwits.sentiment,
      available: stocktwits.available,
    },
    {
      platform: "Reddit",
      mentions: reddit.mentions,
      sentiment: reddit.sentiment,
      available: reddit.available,
    },
    {
      platform: "News",
      mentions: news.mentions,
      sentiment: news.sentiment,
      available: news.available,
    },
    { platform: "X", mentions: null, sentiment: null, available: false, comingSoon: true },
    { platform: "TikTok", mentions: null, sentiment: null, available: false, comingSoon: true },
    { platform: "YouTube", mentions: null, sentiment: null, available: false, comingSoon: true },
    { platform: "Instagram", mentions: null, sentiment: null, available: false, comingSoon: true },
  ]

  const samplePosts: SamplePost[] = [...stocktwits.posts, ...reddit.posts, ...news.posts]
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 8)

  const missingFields: string[] = []
  if (price.prices.length === 0) missingFields.push("price/volume history")
  if (fundamentals.revenueGrowth === null && fundamentals.grossMargin === null)
    missingFields.push("fundamentals (revenue growth, margins)")
  if (fundamentals.nextEarningsDate === null) missingFields.push("next earnings date")
  if (!insider.available) missingFields.push("SEC Form 4 insider transactions")
  missingFields.push("Google Trends index")

  return {
    ticker,
    companyName: price.companyName,
    currentPrice: price.currentPrice,
    priceChange30dPct: price.priceChange30dPct,
    twentyDayMA: price.twentyDayMA,
    extendedAboveMAPct: price.extendedAboveMAPct,
    prices: price.prices,
    platforms,
    googleTrendsIndex: null,
    samplePosts,
    fundamentals,
    insiderTransactions: insider.transactions,
    missingFields,
    fetchedAt: new Date().toISOString(),
  }
}
