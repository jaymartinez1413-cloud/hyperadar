import type { InsiderTransaction } from "@/lib/types"

// SEC requires a descriptive User-Agent with contact info per their fair-access policy.
const UA = "HypeRadar research tool contact@hyperadar.example"

let tickerMapCache: Record<string, string> | null = null

async function getCik(ticker: string): Promise<string | null> {
  try {
    if (!tickerMapCache) {
      const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
        headers: { "User-Agent": UA },
        cache: "no-store",
      })
      if (!res.ok) return null
      const json = await res.json()
      const map: Record<string, string> = {}
      for (const key of Object.keys(json)) {
        const entry = json[key]
        if (entry?.ticker) map[entry.ticker.toUpperCase()] = String(entry.cik_str).padStart(10, "0")
      }
      tickerMapCache = map
    }
    return tickerMapCache[ticker.toUpperCase()] ?? null
  } catch {
    return null
  }
}

// Recent SEC Form 4 (insider) filings from the EDGAR submissions API (keyless).
export async function getInsiderActivity(ticker: string): Promise<{
  available: boolean
  transactions: InsiderTransaction[]
}> {
  try {
    const cik = await getCik(ticker)
    if (!cik) return { available: false, transactions: [] }

    const res = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
      headers: { "User-Agent": UA },
      cache: "no-store",
    })
    if (!res.ok) return { available: false, transactions: [] }

    const json = await res.json()
    const recent = json?.filings?.recent
    if (!recent) return { available: false, transactions: [] }

    const forms: string[] = recent.form ?? []
    const dates: string[] = recent.filingDate ?? []
    const cutoff = Date.now() - 120 * 24 * 60 * 60 * 1000

    const transactions: InsiderTransaction[] = []
    for (let i = 0; i < forms.length; i++) {
      if (forms[i] === "4" && new Date(dates[i]).getTime() >= cutoff) {
        transactions.push({
          date: dates[i],
          form: "4",
          description: "Insider (Form 4) transaction filed",
        })
      }
      if (transactions.length >= 15) break
    }

    return { available: true, transactions }
  } catch {
    return { available: false, transactions: [] }
  }
}
