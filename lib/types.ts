// Shared types for HypeRadar: the aggregated input we feed the AI team,
// and the structured verdict the Portfolio Manager returns.

export type PricePoint = {
  date: string
  close: number
  volume: number
}

export type PlatformStat = {
  platform: string
  mentions: number | null
  sentiment: number | null // -1 (bearish) .. +1 (bullish)
  available: boolean
  // True for planned integrations (X/TikTok/etc.) shown as "Coming soon"
  // rather than a hard "No free API".
  comingSoon?: boolean
}

export type SamplePost = {
  platform: string
  author: string
  followers: number | null
  engagement: number // likes + comments + reposts, best effort
  createdAt: string
  text: string
}

export type Fundamentals = {
  revenueGrowth: number | null
  grossMargin: number | null
  totalDebt: number | null
  totalCash: number | null
  shortInterest: number | null
  nextEarningsDate: string | null
  marketCap: number | null
}

export type InsiderTransaction = {
  date: string
  form: string
  description: string
}

// The JSON object handed to the AI Portfolio Manager.
export type TickerData = {
  ticker: string
  companyName: string | null
  currentPrice: number | null
  priceChange30dPct: number | null
  twentyDayMA: number | null
  extendedAboveMAPct: number | null
  prices: PricePoint[]
  platforms: PlatformStat[]
  googleTrendsIndex: number | null
  samplePosts: SamplePost[]
  fundamentals: Fundamentals
  insiderTransactions: InsiderTransaction[]
  missingFields: string[]
  fetchedAt: string
}

// ---- AI output ----

export type Direction = "Likely Gainer" | "Likely Loser" | "Neutral"
export type HypeStage = "Emerging" | "Accelerating" | "Peak" | "Fading"
export type Horizon = "short" | "medium" | "long"

export type HorizonDetail = {
  label: string
  expectedMove: string
  fit: number
  reason: string
}

export type SourceInfo = {
  platform: string
  author: string
  type: "organic" | "influencer" | "company PR" | "paid promotion"
  hasFinancialIncentive: boolean
}

export type AgentFinding = {
  agent: string
  finding: string
  source?: SourceInfo
  productRealityScore?: number
  risks?: string[]
  hypePricedIn?: boolean
}

export type DrivingFactor = {
  factor: string
  value: string
  impact: "positive" | "negative" | "neutral"
  weight: number
}

export type Catalyst = {
  date: string
  event: string
}

export type Analysis = {
  ticker: string
  direction: Direction
  conviction: number
  hypeStage: HypeStage
  recommendedHorizon: Horizon
  horizons: {
    short: HorizonDetail
    medium: HorizonDetail
    long: HorizonDetail
  }
  agentFindings: AgentFinding[]
  rundown: string[]
  catalysts: Catalyst[]
  drivingFactors: DrivingFactor[]
  disclaimer: string
}

export type AnalyzeResponse = {
  analysis: Analysis
  data: TickerData
  // Set when live data or the AI call failed and we served a cached verdict.
  stale?: boolean
  // The raw model output, forwarded so the client can log it for shape verification.
  raw?: string
}
