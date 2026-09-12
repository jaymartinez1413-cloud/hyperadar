import type { TickerData } from "@/lib/types"
import { compact, sentimentLabel, sentimentTone } from "@/lib/format"
import { SectionTitle } from "./agent-findings"

export function PlatformSignals({ data }: { data: TickerData }) {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <SectionTitle title="Platform signals" sub="Mentions & sentiment" />
      <ul className="mt-5 divide-y divide-border">
        {data.platforms.map((p) => (
          <li key={p.platform} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${p.available ? "bg-primary" : "bg-muted-foreground/40"}`}
                aria-hidden
              />
              <span className="text-sm font-medium">{p.platform}</span>
            </div>
            {p.available ? (
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm text-foreground">{compact(p.mentions)}</span>
                <span className={`w-16 text-right text-xs font-medium ${sentimentTone(p.sentiment)}`}>
                  {sentimentLabel(p.sentiment)}
                </span>
              </div>
            ) : p.comingSoon ? (
              <span className="text-xs italic text-muted-foreground/60">Coming soon</span>
            ) : (
              <span className="text-xs text-muted-foreground">No free API</span>
            )}
          </li>
        ))}
      </ul>
      {data.samplePosts.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Top posts</span>
          <ul className="mt-3 space-y-3">
            {data.samplePosts.slice(0, 4).map((post, i) => (
              <li key={i} className="rounded-md border border-border bg-background/40 p-3">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">
                    {post.platform} · @{post.author}
                  </span>
                  <span>{compact(post.engagement)} eng.</span>
                </div>
                <p className="mt-1.5 text-sm leading-snug text-foreground/90 text-pretty">{post.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
