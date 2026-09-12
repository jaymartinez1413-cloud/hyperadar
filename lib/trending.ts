import type { Direction, HypeStage } from "@/lib/types"
import { getPriceHistory } from "./data/nasdaq"
import { getStockTwits } from "./data/stocktwits"
import { getCached } from "./cache"

// Lightweight, AI-free snapshot for the Trending Now cards. Running the full
// six-agent AI pipeline for five tickers on every page load blows the Gemini
// free-tier request limit, so trending uses a cheap deterministic heuristic
// over two fast sources (price momentum + StockTwits sentiment). The deep AI
// scan only runs when a user actually picks a ticker.
//
// If a deep scan has already been run for a ticker, its cached verdict is
// reused here so the card shows the real AI call instead of the heuristic.
export type TrendingItem = {
  ticker: string
  direction: Direction
  conviction: number
  hypeStage: HypeStage
  priceChange30dPct: number | null
  available: boolean
  // "ai" when reusing a cached deep-scan verdict, "quick" for the heuristic.
  source: "ai" | "quick"
}

export const TRENDING_TICKERS = ["NVDA", "GME", "PLTR", "TSLA", "SOFI"] as const

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function heuristic(
  momentum: number | null,
  extendedAboveMAPct: number | null,
  sentiment: number | null,
  mentions: number | null,
): { direction: Direction; conviction: number; hypeStage: HypeStage } {
  const m = momentum ?? 0
  const s = sentiment ?? 0
  const ext = extendedAboveMAPct ?? 0

  // Direction: agreement between price momentum and social sentiment.
  let direction: Direction = "Neutral"
  if (s > 0.15 && m > -5) direction = "Likely Gainer"
  else if (s < -0.15 || m < -12) direction = "Likely Loser"
  else if (m > 8 && s >= 0) direction = "Likely Gainer"

  // Conviction: heuristic-only, so intentionally capped below what the deep
  // AI scan can reach. Rewards agreement and magnitude, penalizes thin data.
  const magnitude = Math.abs(s) * 34 + clamp(Math.abs(m), 0, 26)
  const agreement = Math.sign(s) === Math.sign(m) && s !== 0 ? 8 : 0
  const thin = mentions !== null && mentions < 5 ? 12 : 0
  const conviction = Math.round(clamp(38 + magnitude + agreement - thin, 10, 78))

  // Hype stage: mention/price posture.
  let hypeStage: HypeStage = "Emerging"
  if (ext > 15) hypeStage = "Peak"
  else if (m > 4 && s > 0.1) hypeStage = "Accelerating"
  else if (m < -4) hypeStage = "Fading"
  else hypeStage = "Emerging"

  return { direction, conviction, hypeStage }
}

export async function getTrendingSnapshot(rawTicker: string): Promise<TrendingItem> {
  const ticker = rawTicker.toUpperCase()

  // Prefer a real AI verdict if a deep scan already ran for this ticker.
  const cached = getCached(ticker)
  if (cached) {
    return {
      ticker,
      direction: cached.analysis.direction,
      conviction: cached.analysis.conviction,
      hypeStage: cached.analysis.hypeStage,
      priceChange30dPct: cached.data.priceChange30dPct,
      available: true,
      source: "ai",
    }
  }

  try {
    // Price first, then StockTwits — sequential to stay under Nasdaq's burst limit.
    const price = await getPriceHistory(ticker)
    const stocktwits = await getStockTwits(ticker)
    const available = price.prices.length > 0
    const h = heuristic(
      price.priceChange30dPct,
      price.extendedAboveMAPct,
      stocktwits.sentiment,
      stocktwits.mentions,
    )
    return {
      ticker,
      direction: h.direction,
      conviction: h.conviction,
      hypeStage: h.hypeStage,
      priceChange30dPct: price.priceChange30dPct,
      available,
      source: "quick",
    }
  } catch {
    return {
      ticker,
      direction: "Neutral",
      conviction: 0,
      hypeStage: "Emerging",
      priceChange30dPct: null,
      available: false,
      source: "quick",
    }
  }
}

// Server-side memo so repeat page loads don't re-fetch within the window.
// Only fully-successful snapshots are cached; a partial or failed run is
// retried on the next request instead of being pinned for the whole TTL.
let cache: { at: number; items: TrendingItem[] } | null = null
const TTL_MS = 5 * 60_000

export async function getTrending(): Promise<TrendingItem[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.items

  // Two at a time: fast enough for the page, gentle enough for Nasdaq.
  const items: TrendingItem[] = []
  for (let i = 0; i < TRENDING_TICKERS.length; i += 2) {
    const batch = TRENDING_TICKERS.slice(i, i + 2)
    items.push(...(await Promise.all(batch.map(getTrendingSnapshot))))
  }

  if (items.every((it) => it.available)) cache = { at: Date.now(), items }
  return items
}
