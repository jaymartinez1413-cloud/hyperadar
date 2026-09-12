import { getTrending } from "@/lib/trending"

export const maxDuration = 30

export async function GET() {
  try {
    const items = await getTrending()
    return Response.json({ items })
  } catch (err) {
    console.log("[v0] trending route error:", err instanceof Error ? err.message : String(err))
    return Response.json({ items: [] }, { status: 200 })
  }
}
