import type { Direction } from "@/lib/types"

export function pct(n: number | null, digits = 1): string {
  if (n === null || Number.isNaN(n)) return "—"
  const sign = n > 0 ? "+" : ""
  return `${sign}${n.toFixed(digits)}%`
}

export function money(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "—"
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function compact(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "—"
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n)
}

export function ratioPct(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "—"
  return `${(n * 100).toFixed(1)}%`
}

// Map a directional verdict to its semantic token classes.
export function directionTone(direction: Direction): {
  text: string
  bg: string
  border: string
  label: string
} {
  switch (direction) {
    case "Likely Gainer":
      return {
        text: "text-positive",
        bg: "bg-positive/10",
        border: "border-positive/40",
        label: "Likely Gainer",
      }
    case "Likely Loser":
      return {
        text: "text-negative",
        bg: "bg-negative/10",
        border: "border-negative/40",
        label: "Likely Loser",
      }
    default:
      return {
        text: "text-warning",
        bg: "bg-warning/10",
        border: "border-warning/40",
        label: "Neutral",
      }
  }
}

export function sentimentTone(s: number | null): string {
  if (s === null) return "text-muted-foreground"
  if (s > 0.15) return "text-positive"
  if (s < -0.15) return "text-negative"
  return "text-warning"
}

export function sentimentLabel(s: number | null): string {
  if (s === null) return "N/A"
  if (s > 0.15) return "Bullish"
  if (s < -0.15) return "Bearish"
  return "Mixed"
}
