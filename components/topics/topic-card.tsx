import Link from "next/link"
import type { TopicMeta } from "@/lib/topics"

/**
 * Compact topic card for the index page and "related topics" sections.
 * `postCount` is optional — index page shows it, related-topics list omits it.
 */
export function TopicCard({
  topic,
  postCount,
}: {
  topic: TopicMeta
  postCount?: number
}) {
  return (
    <Link
      href={`/topics/${topic.slug}`}
      className="group block rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
          {topic.title}
        </h3>
        {typeof postCount === "number" && postCount > 0 && (
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {postCount} {postCount === 1 ? "post" : "posts"}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
        {topic.description}
      </p>
    </Link>
  )
}
