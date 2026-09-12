"use client"

import { useState } from "react"

const EXAMPLES = ["NVDA", "GME", "PLTR", "TSLA", "SOFI"]

export function SearchBar({
  onSubmit,
  loading,
}: {
  onSubmit: (ticker: string) => void
  loading: boolean
}) {
  const [value, setValue] = useState("")

  function submit() {
    const t = value.trim().toUpperCase()
    if (t && !loading) onSubmit(t)
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">
            $
          </span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^a-zA-Z.\-]/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) submit()
            }}
            placeholder="Enter a US ticker — e.g. NVDA"
            aria-label="Ticker symbol"
            maxLength={8}
            className="w-full rounded-md border border-input bg-card py-3 pl-8 pr-3 font-mono text-sm uppercase tracking-wide text-foreground placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
        <button
          onClick={submit}
          disabled={loading || !value.trim()}
          className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Scanning…" : "Scan"}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Try:</span>
        {EXAMPLES.map((t) => (
          <button
            key={t}
            onClick={() => {
              setValue(t)
              if (!loading) onSubmit(t)
            }}
            disabled={loading}
            className="rounded border border-border bg-card px-2 py-0.5 font-mono text-xs text-foreground/80 transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}
