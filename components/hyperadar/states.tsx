const AGENTS = [
  "Scout",
  "Sentiment Analyst",
  "Origin Tracer",
  "Product Detective",
  "Fundamentals Auditor",
  "Risk Officer",
]

export function LoadingState({ ticker }: { ticker: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-8">
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
        </span>
        <p className="font-mono text-sm text-foreground">
          Scanning <span className="text-primary">{ticker}</span> — pulling market, social & SEC data
        </p>
      </div>
      <ul className="mt-6 space-y-3">
        {AGENTS.map((a, i) => (
          <li
            key={a}
            className="flex items-center gap-3 text-sm text-muted-foreground"
            style={{ animation: `pulse 1.6s ease-in-out ${i * 0.18}s infinite` }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary/60" aria-hidden />
            <span className="font-medium text-foreground/70">{a}</span>
            <span className="h-3 flex-1 rounded bg-muted" aria-hidden />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-negative/40 bg-negative/10 p-6">
      <p className="text-sm font-medium text-negative">{message}</p>
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/40 p-10 text-center">
      <p className="text-sm text-muted-foreground text-pretty">
        Enter a ticker to deploy the AI team. HypeRadar measures whether social hype is{" "}
        <span className="text-foreground">leading</span> or <span className="text-foreground">lagging</span> the price —
        and whether there is a real product behind the noise.
      </p>
    </div>
  )
}
