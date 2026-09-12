import type { Analysis, TickerData } from "@/lib/types"
import { directionTone, money, pct } from "@/lib/format"
import { PriceSparkline } from "./price-sparkline"

const STAGE_STEPS = ["Emerging", "Accelerating", "Peak", "Fading"] as const

export function VerdictHeader({ analysis, data }: { analysis: Analysis; data: TickerData }) {
  const tone = directionTone(analysis.direction)
  const up = (data.priceChange30dPct ?? 0) >= 0
  const activeStage = STAGE_STEPS.indexOf(analysis.hypeStage)

  return (
    <section className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="grid gap-px bg-border md:grid-cols-[1.1fr_1fr]">
        {/* Identity + verdict */}
        <div className="bg-card p-6 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-mono text-3xl font-semibold tracking-tight">{data.ticker}</h2>
                <span
                  className={`rounded border px-2 py-0.5 text-xs font-medium ${tone.text} ${tone.bg} ${tone.border}`}
                >
                  {tone.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                {data.companyName ?? "US-listed equity"}
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl font-semibold">{money(data.currentPrice)}</div>
              <div className={`font-mono text-sm ${up ? "text-positive" : "text-negative"}`}>
                {pct(data.priceChange30dPct)} 30d
              </div>
            </div>
          </div>

          <ConvictionGauge value={analysis.conviction} toneText={tone.text} />

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <Metric label="Recommended horizon" value={horizonLabel(analysis.recommendedHorizon)} />
            <Metric label="20-day MA" value={money(data.twentyDayMA)} />
            <Metric label="Extended vs MA" value={pct(data.extendedAboveMAPct)} />
          </div>
        </div>

        {/* Price + hype stage */}
        <div className="bg-card p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">30-day price / volume</span>
          </div>
          <PriceSparkline prices={data.prices} up={up} />
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Hype stage</span>
            <div className="mt-2 flex gap-1.5">
              {STAGE_STEPS.map((s, i) => (
                <div key={s} className="flex-1">
                  <div
                    className={`h-1.5 rounded-full ${i <= activeStage ? "bg-primary" : "bg-muted"}`}
                    aria-hidden
                  />
                  <span
                    className={`mt-1.5 block text-[10px] ${
                      i === activeStage ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ConvictionGauge({ value, toneText }: { value: number; toneText: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Conviction</span>
        <span className={`font-mono text-lg font-semibold ${toneText}`}>{value}<span className="text-muted-foreground text-sm">/100</span></span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-mono text-foreground">{value}</div>
    </div>
  )
}

function horizonLabel(h: "short" | "medium" | "long"): string {
  return { short: "Short (days–weeks)", medium: "Medium (1–3 mo)", long: "Long (3–12 mo)" }[h]
}
