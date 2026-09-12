import type { Fundamentals, PricePoint } from "@/lib/types"

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

const HEADERS = {
  "User-Agent": UA,
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
}

// Yahoo Finance hard-blocks datacenter IPs (429), so both the v0 preview and any
// Vercel deployment cannot use it. Nasdaq's public quote API responds to server
// IPs and is keyless, so it is the primary source for price + fundamentals.

type PriceResult = {
  companyName: string | null
  currentPrice: number | null
  prices: PricePoint[]
  twentyDayMA: number | null
  extendedAboveMAPct: number | null
  priceChange30dPct: number | null
}

const ASSET_CLASSES = ["stocks", "etf"] as const

function ymd(d: Date) {
  return d.toISOString().slice(0, 10)
}

function toNumber(raw: unknown): number {
  if (typeof raw === "number") return raw
  if (typeof raw !== "string") return 0
  const n = Number(raw.replace(/[$,%\s]/g, "").replace(/,/g, ""))
  return Number.isFinite(n) ? n : 0
}

// Nasdaq needs the correct assetclass; try stocks then etf.
async function nasdaqFetch(path: string): Promise<any | null> {
  for (const assetclass of ASSET_CLASSES) {
    const sep = path.includes("?") ? "&" : "?"
    const url = `https://api.nasdaq.com/api/quote/${path}${sep}assetclass=${assetclass}`
    try {
      const res = await fetch(url, { headers: HEADERS, cache: "no-store" })
      if (!res.ok) continue
      const json = await res.json()
      if (json?.data) return json.data
    } catch {
      // try next assetclass
    }
  }
  return null
}

export async function getPriceHistory(ticker: string): Promise<PriceResult> {
  const empty: PriceResult = {
    companyName: null,
    currentPrice: null,
    prices: [],
    twentyDayMA: null,
    extendedAboveMAPct: null,
    priceChange30dPct: null,
  }

  const to = new Date()
  const from = new Date(to.getTime() - 50 * 24 * 60 * 60 * 1000) // ~50 calendar days -> ~30 trading days
  const chartData = await nasdaqFetch(
    `${encodeURIComponent(ticker)}/chart?fromdate=${ymd(from)}&todate=${ymd(to)}`,
  )
  const rows: any[] = chartData?.chart ?? []
  if (rows.length === 0) return empty

  const prices: PricePoint[] = rows
    .map((row) => {
      const z = row?.z ?? {}
      const close = toNumber(z.close ?? row?.y ?? z.value)
      const rawDate = z.dateTime as string | undefined
      const date = rawDate ? new Date(rawDate).toISOString().slice(0, 10) : ""
      return { date, close, volume: toNumber(z.volume) }
    })
    .filter((p) => p.close > 0 && p.date)

  if (prices.length === 0) return empty

  // Current price + company name from the info endpoint, falling back to last close.
  const info = await nasdaqFetch(`${encodeURIComponent(ticker)}/info`)
  const infoPrice = toNumber(info?.primaryData?.lastSalePrice)
  const lastClose = prices[prices.length - 1].close
  const currentPrice = infoPrice > 0 ? infoPrice : lastClose
  const companyName: string | null = info?.companyName ?? null

  const first = prices[0].close
  const priceChange30dPct = first ? ((currentPrice - first) / first) * 100 : null

  const last20 = prices.slice(-20)
  const twentyDayMA = last20.reduce((s, p) => s + p.close, 0) / last20.length
  const extendedAboveMAPct = twentyDayMA ? ((currentPrice - twentyDayMA) / twentyDayMA) * 100 : null

  return { companyName, currentPrice, prices, twentyDayMA, extendedAboveMAPct, priceChange30dPct }
}

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

  const summary = await nasdaqFetch(`${encodeURIComponent(ticker)}/summary`)
  const sd = summary?.summaryData
  if (!sd) return empty

  const marketCap = sd.MarketCap?.value ? toNumber(sd.MarketCap.value) : null

  // Nasdaq's keyless summary does not expose revenue growth, margins, debt/cash,
  // short interest, or the next earnings date — those remain null and are surfaced
  // in the aggregator's missingFields so the AI team can discount conviction honestly.
  return {
    revenueGrowth: null,
    grossMargin: null,
    totalDebt: null,
    totalCash: null,
    shortInterest: null,
    nextEarningsDate: null,
    marketCap: marketCap && marketCap > 0 ? marketCap : null,
  }
}
