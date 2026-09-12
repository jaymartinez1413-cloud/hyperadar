"use client"

import { useEffect, useState } from "react"
import type { AnalyzeResponse } from "@/lib/types"
import { directionTone, pct } from "@/lib/format"

const TRENDING = ["NVDA", "GME", "PLTR", "TSLA", "SOFI"] as const

type Status = "loading" | "ready" | "error"
type Item = { ticker: string; status: Status; response: AnalyzeResponse | null }

export function TrendingNow({
  activeTicker,
  onSelect,
}: {
  activeTicker: string
  onSelect: (ticker: string, cached: AnalyzeResponse | null) => void
}) {
  const [items, setItems] = useState<Item[]>(() =>
    TRENDING.map((t) => ({ ticker: t, status: "loading" as Status, response: null })),
  )

  useEffect(() => {
    let cancelled = false

    async function load(ticker: string) {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker }),
        })
        if (!res.ok) throw new Error(String(res.status))
        const json = (await res.json()) as AnalyzeResponse
        if (cancelled) return
        setItems((prev) =>
          prev.map((it) => (it.ticker === ticker ? { ...it, status: "ready", response: json } : it)),
        )
      } catch {
        if (cancelled) return
        setItems((prev) =>
          prev.map((it) => (it.ticker === ticker ? { ...it, status: "error", response: null } : it)),
        )
      }
    }

    // Fire all five in parallel; each fills in its card as it resolves.
    TRENDING.forEach(load)
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section aria-label="Trending tickers">
      <div className="mb-2 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Trending now</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it) => (
          <TrendingCard
            key={it.ticker}
            item={it}
            active={it.ticker === activeTicker}
            onClick={() => onSelect(it.ticker, it.response)}
          />
        ))}
      </div>
    </section>
  )
}

function TrendingCard({ item, active, onClick }: { item: Item; active: boolean; onClick: () => void }) {
  const a = item.response?.analysis
  const tone = a ? directionTone(a.direction) : null

  return (
    <button
      onClick={onClick}
      disabled={item.status === "loading"}
      className={`group flex flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-colors disabled:cursor-wait ${
        active ? "border-primary/60" : "border-border hover:border-primary/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold tracking-tight">{item.ticker}</span>
        {a && (
          <span className="font-mono text-xs text-muted-foreground">
            {pct(item.response!.data.priceChange30dPct)}
          </span>
        )}
      </div>

      {item.status === "loading" && (
        <div className="flex flex-col gap-1.5" aria-hidden>
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-2.5 w-14 animate-pulse rounded bg-muted" />
        </div>
      )}

      {item.status === "error" && <span className="text-xs text-muted-foreground">Unavailable</span>}

      {item.status === "ready" && a && tone && (
        <div className="flex flex-col gap-1.5">
          <span className={`inline-flex w-fit rounded border px-1.5 py-0.5 text-[10px] font-medium ${tone.text} ${tone.bg} ${tone.border}`}>
            {tone.label}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-foreground">{a.conviction}</span>
            <span className="text-[10px] text-muted-foreground">conviction</span>
            <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {a.hypeStage}
            </span>
          </div>
        </div>
      )}
    </button>
  )
}
