import type { Fundamentals, PricePoint } from "@/lib/types"

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

type PriceResult = {
  companyName: string | null
  currentPrice: number | null
  prices: PricePoint[]
  twentyDayMA: number | null
  extendedAboveMAPct: number | null
  priceChange30dPct: number | null
}

// 30 days of daily price/volume from the Yahoo Finance chart endpoint (keyless).
export async function getPriceHistory(ticker: string): Promise<PriceResult> {
  const empty: PriceResult = {
    companyName: null,
    currentPrice: null,
    prices: [],
    twentyDayMA: null,
    extendedAboveMAPct: null,
    priceChange30dPct: null,
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      ticker,
    )}?range=1mo&interval=1d`
    const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" })
    if (!res.ok) return empty

    const json = await res.json()
    const result = json?.chart?.result?.[0]
    if (!result) return empty

    const timestamps: number[] = result.timestamp ?? []
    const quote = result.indicators?.quote?.[0] ?? {}
    const closes: (number | null)[] = quote.close ?? []
    const volumes: (number | null)[] = quote.volume ?? []
    const meta = result.meta ?? {}

    const prices: PricePoint[] = timestamps
      .map((t, i) => ({
        date: new Date(t * 1000).toISOString().slice(0, 10),
        close: closes[i] ?? 0,
        volume: volumes[i] ?? 0,
      }))
      .filter((p) => p.close > 0)

    if (prices.length === 0) return empty

    const currentPrice = meta.regularMarketPrice ?? prices[prices.length - 1].close
    const first = prices[0].close
    const priceChange30dPct = first ? ((currentPrice - first) / first) * 100 : null

    const last20 = prices.slice(-20)
    const twentyDayMA = last20.reduce((s, p) => s + p.close, 0) / last20.length
    const extendedAboveMAPct = twentyDayMA ? ((currentPrice - twentyDayMA) / twentyDayMA) * 100 : null

    return {
      companyName: meta.longName ?? meta.shortName ?? null,
      currentPrice,
      prices,
      twentyDayMA,
      extendedAboveMAPct,
      priceChange30dPct,
    }
  } catch {
    return empty
  }
}

// Best-effort fundamentals via Yahoo quoteSummary. Often crumb-gated; failures return nulls.
export async function getFundamentals(ticker: string): Promise<Fundamentals> {
  const empty: Fundamentals = {
    revenueGrowth: null,
    grossMargin: null,
    totalDebt: null,
    totalCash: null,
    shortInterest: null,
    nextEarningsDate: null,
    marketCap: null,
  }

  try {
    const modules = "financialData,defaultKeyStatistics,calendarEvents,price"
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
      ticker,
    )}?modules=${modules}`
    const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" })
    if (!res.ok) return empty

    const json = await res.json()
    const r = json?.quoteSummary?.result?.[0]
    if (!r) return empty

    const fin = r.financialData ?? {}
    const stats = r.defaultKeyStatistics ?? {}
    const cal = r.calendarEvents?.earnings ?? {}
    const price = r.price ?? {}

    const earningsTs = cal?.earningsDate?.[0]?.raw
    return {
      revenueGrowth: fin.revenueGrowth?.raw ?? null,
      grossMargin: fin.grossMargins?.raw ?? null,
      totalDebt: fin.totalDebt?.raw ?? null,
      totalCash: fin.totalCash?.raw ?? null,
      shortInterest: stats.shortPercentOfFloat?.raw ?? null,
      nextEarningsDate: earningsTs ? new Date(earningsTs * 1000).toISOString().slice(0, 10) : null,
      marketCap: price.marketCap?.raw ?? null,
    }
  } catch {
    return empty
  }
}
