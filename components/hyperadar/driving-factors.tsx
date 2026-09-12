import type { DrivingFactor } from "@/lib/types"
import { SectionTitle } from "./agent-findings"

export function DrivingFactors({ factors }: { factors: DrivingFactor[] }) {
  const sorted = [...factors].sort((a, b) => b.weight - a.weight)
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <SectionTitle title="Driving factors" sub="Weighted inputs to the call" />
      <ul className="mt-5 space-y-4">
        {sorted.map((f, i) => {
          const tone =
            f.impact === "positive" ? "bg-positive" : f.impact === "negative" ? "bg-negative" : "bg-warning"
          return (
            <li key={i}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-pretty">{f.factor}</span>
                <span className="font-mono text-xs text-muted-foreground shrink-0">{f.value}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.round(f.weight * 100)}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
