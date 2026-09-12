import type { SamplePost } from "@/lib/types"

export type NewsResult = {
  available: boolean
  mentions: number | null
  sentiment: number | null
  posts: SamplePost[]
}

const bullish = /surge|soar|rally|beat|record|upgrade|jump|gain|bull|growth|profit|win/i
const bearish = /plunge|drop|miss|downgrade|fall|sink|lawsuit|probe|bear|loss|cut|warn|slump/i

// Decode the small set of XML/HTML entities Google News uses in RSS titles.
function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim()
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"))
  return m ? decode(m[1]) : ""
}

// Real headlines from the keyless Google News RSS search feed.
export async function getNews(ticker: string, companyName?: string | null): Promise<NewsResult> {
  const empty: NewsResult = { available: false, mentions: null, sentiment: null, posts: [] }
  const query = encodeURIComponent(`${ticker} stock${companyName ? ` ${companyName}` : ""}`)
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; hyperadar/1.0)" },
      cache: "no-store",
    })
    if (!res.ok) return empty

    const xml = await res.text()
    const blocks = xml.split(/<item>/).slice(1).map((b) => b.split("</item>")[0])
    if (blocks.length === 0) return { ...empty, available: true, mentions: 0, sentiment: 0 }

    const posts: SamplePost[] = blocks.slice(0, 6).map((b) => {
      const rawTitle = tag(b, "title")
      // Google News formats titles as "Headline - Publisher".
      const split = rawTitle.lastIndexOf(" - ")
      const headline = split > 0 ? rawTitle.slice(0, split) : rawTitle
      const publisher = tag(b, "source") || (split > 0 ? rawTitle.slice(split + 3) : "News")
      const pub = tag(b, "pubDate")
      return {
        platform: "News",
        author: publisher,
        followers: null,
        engagement: 0,
        createdAt: pub ? new Date(pub).toISOString() : "",
        text: headline,
      }
    })

    let score = 0
    let counted = 0
    for (const b of blocks) {
      const title = tag(b, "title")
      if (bullish.test(title)) {
        score++
        counted++
      } else if (bearish.test(title)) {
        score--
        counted++
      }
    }
    const sentiment = counted > 0 ? score / counted : 0

    return { available: true, mentions: blocks.length, sentiment, posts }
  } catch {
    return empty
  }
}
