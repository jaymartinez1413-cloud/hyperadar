import type { PricePoint } from "@/lib/types"

// Renders the real 30-day close series as a line + volume bars. This is a data
// chart, not decoration — every point comes from the Yahoo Finance response.
export function PriceSparkline({ prices, up }: { prices: PricePoint[]; up: boolean }) {
  if (prices.length < 2) {
    return <div className="text-sm text-muted-foreground">No price series available.</div>
  }

  const w = 640
  const h = 140
  const pad = 4

  const closes = prices.map((p) => p.close)
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const range = max - min || 1

  const maxVol = Math.max(...prices.map((p) => p.volume)) || 1

  const x = (i: number) => pad + (i * (w - pad * 2)) / (prices.length - 1)
  const y = (v: number) => pad + (1 - (v - min) / range) * (h - pad * 2)

  const line = prices.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.close).toFixed(1)}`).join(" ")
  const area = `${line} L${x(prices.length - 1).toFixed(1)},${h - pad} L${x(0).toFixed(1)},${h - pad} Z`

  const stroke = up ? "var(--positive)" : "var(--negative)"

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="30-day price and volume">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {prices.map((p, i) => {
        const bh = (p.volume / maxVol) * 34
        return (
          <rect
            key={i}
            x={x(i) - 2}
            y={h - pad - bh}
            width={4}
            height={bh}
            fill="var(--muted-foreground)"
            opacity={0.22}
          />
        )
      })}
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
