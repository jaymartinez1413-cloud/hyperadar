import type { Catalyst } from "@/lib/types"
import { SectionTitle } from "./agent-findings"

export function Catalysts({ catalysts }: { catalysts: Catalyst[] }) {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <SectionTitle title="Upcoming catalysts" sub="What to watch" />
      {catalysts.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">No dated catalysts identified from available data.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {catalysts.map((c, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 rounded border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-xs text-primary">
                {c.date}
              </span>
              <span className="text-sm leading-relaxed text-foreground/90 text-pretty">{c.event}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
