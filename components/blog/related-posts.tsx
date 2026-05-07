import Link from "next/link"
import { getPostBySlug } from "@/lib/blog"

type Props = {
  /**
   * Comma-separated list of slugs. String, not array — `next-mdx-remote/rsc`
   * doesn't evaluate JSX expression attributes (`{[...]}`) by default, but
   * plain string attributes always parse cleanly.
   *
   * Example: `slugs="is-foo-healthy,bar-vs-baz"`
   */
  slugs: string
  /**
   * Optional section heading. Hidden by default — every existing post puts
   * `## Related Comparisons` in MDX above the component, so we'd render twice
   * if this defaulted to a value. Pass an explicit string to opt back in.
   */
  title?: string | null
}

/**
 * Renders a list of links to other blog posts. Pulls each post's *current*
 * title at build time, so titles never go out of sync with the destination.
 *
 * Drop into MDX:
 *
 *   <RelatedPosts slugs="is-foo-healthy,bar-vs-baz" />
 *
 * Unknown slugs are skipped silently and logged to the build output. The
 * auditor's `links.missing-target` check covers them with a louder warning.
 */
export function RelatedPosts({ slugs, title = null }: Props) {
  const slugList = (slugs ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  const resolved = slugList
    .map((slug) => {
      const post = getPostBySlug(slug)
      if (!post) {
        console.warn(`[RelatedPosts] Unknown slug: ${slug}`)
        return null
      }
      return { slug: post.slug, title: post.title }
    })
    .filter((p): p is { slug: string; title: string } => p !== null)

  if (resolved.length === 0) return null

  return (
    <>
      {title !== null && <h2>{title}</h2>}
      <ul>
        {resolved.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`}>{p.title}</Link>
          </li>
        ))}
      </ul>
    </>
  )
}
