import { HyperadarApp } from "@/components/hyperadar/hyperadar-app"

export default function Page() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <header className="mb-8 flex flex-col gap-4 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <RadarMark />
              <span className="font-mono text-lg font-semibold tracking-tight">
                Hype<span className="text-primary">Radar</span>
              </span>
            </div>
            <h1 className="mt-4 max-w-xl text-balance text-2xl font-semibold leading-tight md:text-3xl">
              Is the hype leading the price, or already priced in?
            </h1>
            <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
              A six-agent AI team reads real market, social, and SEC data to find social arbitrage in US stocks —
              where crowd attention moves ahead of, or behind, the tape.
            </p>
          </div>
          <ul className="flex shrink-0 flex-col gap-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary" aria-hidden /> Live Nasdaq prices & fundamentals
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary" aria-hidden /> StockTwits, Reddit & News chatter
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary" aria-hidden /> SEC EDGAR insider filings
            </li>
          </ul>
        </header>

        <HyperadarApp />

        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          HypeRadar is educational analysis only, not financial advice. Data is best-effort from public sources and may
          be delayed or incomplete.
        </footer>
      </div>
    </main>
  )
}

function RadarMark() {
  return (
    <span className="relative flex h-7 w-7 items-center justify-center rounded-md border border-primary/40 bg-primary/10">
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
        <path d="M12 12 L19 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="16" cy="9" r="1.4" fill="currentColor" />
      </svg>
    </span>
  )
}
