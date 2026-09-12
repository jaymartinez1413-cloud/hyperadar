import type { AnalyzeResponse } from "@/lib/types"

// Process-wide in-memory cache of the last successful analysis per ticker.
// Survives across requests within a running server instance (the v0 preview
// and a warm Vercel lambda). It is intentionally best-effort: a cold start
// simply starts empty. Its jobs are (1) instant repeat scans and (2) a
// fallback payload to serve when a live data source or the AI call fails.

const TTL_MS = 30 * 60 * 1000 // 30 minutes

type Entry = { response: AnalyzeResponse; at: number }

// Persist the map on globalThis so Next.js dev/HMR module reloads don't wipe it.
const store: Map<string, Entry> = ((globalThis as Record<string, unknown>).__hyperadarCache as Map<
  string,
  Entry
>) ?? new Map<string, Entry>()
;(globalThis as Record<string, unknown>).__hyperadarCache = store

export function getCached(ticker: string): AnalyzeResponse | null {
  const entry = store.get(ticker.toUpperCase())
  return entry ? entry.response : null
}

// True only when a cached entry exists and is within its TTL window.
export function isFresh(ticker: string): boolean {
  const entry = store.get(ticker.toUpperCase())
  return !!entry && Date.now() - entry.at < TTL_MS
}

export function setCached(ticker: string, response: AnalyzeResponse): void {
  store.set(ticker.toUpperCase(), { response, at: Date.now() })
}
