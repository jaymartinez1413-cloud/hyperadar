import type { TickerData } from "@/lib/types"

const SOURCES = [
  "Nasdaq (price/volume/fundamentals)",
  "StockTwits",
  "Reddit (r/wallstreetbets, r/stocks)",
  "Google News",
  "SEC EDGAR (Form 4)",
]

export function DataProvenance({ data }: { data: TickerData }) {
  const when = new Date(data.fetchedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
  return (
    <section className="rounded-lg border border-border bg-card/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data provenance</h3>
        <span className="font-mono text-xs text-muted-foreground">Fetched {when}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {SOURCES.map((s) => (
          <span key={s} className="rounded border border-border bg-background/50 px-2 py-1 text-xs text-foreground/80">
            {s}
          </span>
        ))}
      </div>
      {data.missingFields.length > 0 && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground text-pretty">
          <span className="text-warning">Not available without paid APIs:</span> {data.missingFields.join(", ")}. The
          AI accounts for these gaps by reducing conviction.
        </p>
      )}
    </section>
  )
}
