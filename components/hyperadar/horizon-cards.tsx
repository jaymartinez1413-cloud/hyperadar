import type { Analysis } from "@/lib/types"
import { SectionTitle } from "./agent-findings"

const ORDER: Array<{ key: "short" | "medium" | "long"; window: string }> = [
  { key: "short", window: "Days – weeks" },
  { key: "medium", window: "1 – 3 months" },
  { key: "long", window: "3 – 12 months" },
]

export function HorizonCards({ analysis }: { analysis: Analysis }) {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <SectionTitle title="Time horizons" sub="Best-fit holding period" />
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {ORDER.map(({ key, window }) => {
          const h = analysis.horizons[key]
          const active = analysis.recommendedHorizon === key
          return (
            <div
              key={key}
              className={`rounded-md border p-4 ${
                active ? "border-primary/50 bg-primary/5" : "border-border bg-background/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{h.label}</span>
                {active && (
                  <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    Recommended
                  </span>
                )}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">{window}</div>
              <div className="mt-3 font-mono text-lg font-semibold text-foreground">{h.expectedMove}</div>
              <FitBar value={h.fit} />
              <p className="mt-3 text-sm leading-relaxed text-foreground/80 text-pretty">{h.reason}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function FitBar({ value }: { value: number }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${(value / 10) * 100}%` }} />
      </div>
      <span className="font-mono text-xs text-muted-foreground">{value}/10</span>
    </div>
  )
}
