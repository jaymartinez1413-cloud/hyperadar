import { SectionTitle } from "./agent-findings"

// The 6 fixed plain-English lines the Portfolio Manager returns, in order.
const LABELS = [
  "What the hype is",
  "Who started it",
  "Is the product real",
  "Can they monetize it",
  "Key risk",
  "Bottom line",
]

export function Rundown({ rundown }: { rundown: string[] }) {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <SectionTitle title="Plain-English rundown" sub="No jargon" />
      <dl className="mt-5 space-y-4">
        {rundown.map((line, i) => {
          const clean = stripLabel(line, LABELS[i])
          const last = i === rundown.length - 1
          return (
            <div key={i} className={last ? "rounded-md border border-primary/30 bg-primary/5 p-3" : ""}>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">{LABELS[i] ?? `Point ${i + 1}`}</dt>
              <dd className={`mt-0.5 text-sm leading-relaxed text-pretty ${last ? "text-foreground font-medium" : "text-foreground/90"}`}>
                {clean}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}

// The model may prefix each line with its own label; strip it to avoid duplication.
function stripLabel(line: string, label?: string): string {
  let out = line.trim()
  if (label) {
    const re = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:?\\s*`, "i")
    out = out.replace(re, "")
  }
  return out.replace(/^[-–:\s]+/, "")
}
