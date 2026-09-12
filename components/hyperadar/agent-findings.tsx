import type { AgentFinding } from "@/lib/types"

const AGENT_META: Record<string, { role: string }> = {
  Scout: { role: "Mention velocity" },
  "Sentiment Analyst": { role: "Sentiment & bot signals" },
  "Origin Tracer": { role: "Where the hype started" },
  "Product Detective": { role: "Is the product real" },
  "Fundamentals Auditor": { role: "Can they monetize it" },
  "Risk Officer": { role: "What could go wrong" },
}

// Canonical roster + order. Used to render placeholder cards so the panel is
// never blank even when the model returns no agentFindings.
const AGENT_ORDER = [
  "Scout",
  "Sentiment Analyst",
  "Origin Tracer",
  "Product Detective",
  "Fundamentals Auditor",
  "Risk Officer",
]

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function AgentFindings({ findings }: { findings: AgentFinding[] }) {
  const hasFindings = Array.isArray(findings) && findings.length > 0
  // When empty/missing, synthesize six placeholder cards from the known roster.
  const items: AgentFinding[] = hasFindings
    ? findings
    : AGENT_ORDER.map((agent) => ({ agent, finding: "" }))

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <SectionTitle title="AI Team" sub="Six specialists, one verdict" />
      <ol className="mt-5 space-y-0">
        {items.map((f, i) => {
          const name = f.agent || AGENT_ORDER[i] || `Agent ${i + 1}`
          const empty = !f.finding
          return (
            <li key={name + i} className="relative flex gap-4 pb-6 last:pb-0">
              {/* connector line */}
              {i < items.length - 1 && (
                <span className="absolute left-[15px] top-8 bottom-0 w-px bg-border" aria-hidden />
              )}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-semibold ${
                  empty
                    ? "border-border bg-muted text-muted-foreground"
                    : "border-primary/40 bg-primary/10 text-primary"
                }`}
                aria-hidden
              >
                {initials(name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h4 className="text-sm font-semibold">{name}</h4>
                  <span className="text-xs text-muted-foreground">{AGENT_META[name]?.role}</span>
                  {typeof f.productRealityScore === "number" && (
                    <Tag>Product reality {f.productRealityScore}/10</Tag>
                  )}
                  {typeof f.hypePricedIn === "boolean" && (
                    <Tag tone={f.hypePricedIn ? "warn" : "ok"}>
                      {f.hypePricedIn ? "Hype priced in" : "Room to run"}
                    </Tag>
                  )}
                </div>
                {empty ? (
                  <p className="mt-1 text-sm italic leading-relaxed text-muted-foreground">
                    No finding returned
                  </p>
                ) : (
                  <p className="mt-1 text-sm leading-relaxed text-foreground/90 text-pretty">{f.finding}</p>
                )}

                {f.source && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-mono">{f.source.platform}</span>
                    <span aria-hidden>·</span>
                    <span>@{f.source.author}</span>
                    <Tag tone={f.source.hasFinancialIncentive ? "warn" : "muted"}>{f.source.type}</Tag>
                    {f.source.hasFinancialIncentive && <Tag tone="warn">financial incentive</Tag>}
                  </div>
                )}

                {f.risks && f.risks.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {f.risks.map((r, ri) => (
                      <li key={ri} className="flex gap-2 text-sm text-foreground/80">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-negative" aria-hidden />
                        <span className="text-pretty">{r}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function Tag({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "ok" | "warn" }) {
  const cls =
    tone === "ok"
      ? "text-positive border-positive/40 bg-positive/10"
      : tone === "warn"
        ? "text-warning border-warning/40 bg-warning/10"
        : "text-muted-foreground border-border bg-muted"
  return <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${cls}`}>{children}</span>
}

export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider">{title}</h3>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}
