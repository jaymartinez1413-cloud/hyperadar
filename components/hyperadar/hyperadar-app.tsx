"use client"

import { useState } from "react"
import type { AnalyzeResponse } from "@/lib/types"
import { SearchBar } from "./search-bar"
import { VerdictHeader } from "./verdict-header"
import { AgentFindings } from "./agent-findings"
import { HorizonCards } from "./horizon-cards"
import { Rundown } from "./rundown"
import { DrivingFactors } from "./driving-factors"
import { Catalysts } from "./catalysts"
import { PlatformSignals } from "./platform-signals"
import { DataProvenance } from "./data-provenance"
import { EmptyState, ErrorState, LoadingState } from "./states"

export function HyperadarApp() {
  const [loading, setLoading] = useState(false)
  const [ticker, setTicker] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)

  async function analyze(t: string) {
    setLoading(true)
    setError(null)
    setResult(null)
    setTicker(t)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: t }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error ?? "Something went wrong.")
      } else {
        setResult(json as AnalyzeResponse)
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <SearchBar onSubmit={analyze} loading={loading} />

      {loading && <LoadingState ticker={ticker} />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && !result && <EmptyState />}

      {!loading && result && (
        <div className="flex flex-col gap-6">
          <div className="animate-rise">
            <VerdictHeader analysis={result.analysis} data={result.data} />
          </div>
          <div className="animate-rise" style={{ animationDelay: "0.06s" }}>
            <Rundown rundown={result.analysis.rundown} />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col gap-6 animate-rise" style={{ animationDelay: "0.12s" }}>
              <AgentFindings findings={result.analysis.agentFindings} />
              <HorizonCards analysis={result.analysis} />
            </div>
            <div className="flex flex-col gap-6 animate-rise" style={{ animationDelay: "0.18s" }}>
              <PlatformSignals data={result.data} />
              <DrivingFactors factors={result.analysis.drivingFactors} />
              <Catalysts catalysts={result.analysis.catalysts} />
            </div>
          </div>
          <DataProvenance data={result.data} />
          <p className="text-center text-xs text-muted-foreground">{result.analysis.disclaimer}</p>
        </div>
      )}
    </div>
  )
}
