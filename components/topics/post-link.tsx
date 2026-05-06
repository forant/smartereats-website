import Link from "next/link"
import type { PostMeta } from "@/lib/blog"
import { formatDate } from "@/lib/blog"

/**
 * Single post entry on a topic hub. Renders title + description with the
 * post's *current* metadata, so renames propagate without source edits.
 *
 * Used inside `<ul role="list">` on the hub pages — accessibility is handled
 * by the parent.
 */
export function PostLink({ post, showDate = false }: { post: PostMeta; showDate?: boolean }) {
  return (
    <article>
      <Link
        href={`/blog/${post.slug}`}
        className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <h3 className="text-lg font-medium leading-snug group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          {post.description}
        </p>
        {showDate && (
          <time
            dateTime={post.date}
            className="mt-1 block text-xs text-muted-foreground/80"
          >
            {formatDate(post.date)}
          </time>
        )}
      </Link>
    </article>
  )
}
