"use client"

import { useEffect, useState } from "react"
import type { TrendingItem } from "@/lib/trending"
import { directionTone, pct } from "@/lib/format"

type Status = "loading" | "ready" | "error"

export function TrendingNow({
  activeTicker,
  onSelect,
}: {
  activeTicker: string
  onSelect: (ticker: string) => void
}) {
  const [status, setStatus] = useState<Status>("loading")
  const [items, setItems] = useState<TrendingItem[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/trending")
        if (!res.ok) throw new Error(String(res.status))
        const json = (await res.json()) as { items: TrendingItem[] }
        if (cancelled) return
        setItems(json.items ?? [])
        setStatus("ready")
      } catch {
        if (cancelled) return
        setStatus("error")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const skeletons = ["NVDA", "GME", "PLTR", "TSLA", "SOFI"]

  return (
    <section aria-label="Trending tickers">
      <div className="mb-2 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Trending now</h2>
        <span className="text-[10px] text-muted-foreground/70">quick read &middot; click for full scan</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {status === "loading" &&
          skeletons.map((t) => <SkeletonCard key={t} ticker={t} />)}

        {status === "error" && (
          <p className="col-span-full text-xs text-muted-foreground">Trending data is unavailable right now.</p>
        )}

        {status === "ready" &&
          items.map((it) => (
            <TrendingCard
              key={it.ticker}
              item={it}
              active={it.ticker === activeTicker}
              onClick={() => onSelect(it.ticker)}
            />
          ))}
      </div>
    </section>
  )
}

function SkeletonCard({ ticker }: { ticker: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <span className="font-mono text-sm font-semibold tracking-tight text-muted-foreground">{ticker}</span>
      <div className="h-4 w-20 animate-pulse rounded bg-muted" aria-hidden />
      <div className="h-2.5 w-14 animate-pulse rounded bg-muted" aria-hidden />
    </div>
  )
}

function TrendingCard({
  item,
  active,
  onClick,
}: {
  item: TrendingItem
  active: boolean
  onClick: () => void
}) {
  const tone = directionTone(item.direction)

  return (
    <button
      onClick={onClick}
      className={`group flex flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-colors ${
        active ? "border-primary/60" : "border-border hover:border-primary/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold tracking-tight">{item.ticker}</span>
        {item.priceChange30dPct !== null && (
          <span className="font-mono text-xs text-muted-foreground">{pct(item.priceChange30dPct)}</span>
        )}
      </div>

      {!item.available ? (
        <span className="text-xs text-muted-foreground">Unavailable</span>
      ) : (
        <div className="flex flex-col gap-1.5">
          <span
            className={`inline-flex w-fit rounded border px-1.5 py-0.5 text-[10px] font-medium ${tone.text} ${tone.bg} ${tone.border}`}
          >
            {tone.label}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-foreground">{item.conviction}</span>
            <span className="text-[10px] text-muted-foreground">conviction</span>
            <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {item.hypeStage}
            </span>
          </div>
        </div>
      )}
    </button>
  )
}
