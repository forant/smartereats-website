/**
 * Blog data layer. File-based: every .mdx in /content/blog is a post.
 *
 * Drop a new file in, rebuild, it appears in the index. No DB, no CMS.
 * Used by /app/blog and /app/blog/[slug].
 */

import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

const BLOG_DIR = path.join(process.cwd(), "content", "blog")

export type PostMeta = {
  /** URL slug. Defaults to filename if not in frontmatter. */
  slug: string
  title: string
  description: string
  /** ISO date (YYYY-MM-DD). */
  date: string
  /** Optional hero image path (under /public). */
  image?: string
  /**
   * Topic hub slugs this post belongs to. Generator-emitted; merged into
   * /topics/[slug] hubs at build time alongside the manually-curated lists
   * in content/topics/*.json. Unknown slugs are tolerated (audit flags them).
   */
  topics?: string[]
}

export type Post = PostMeta & {
  /** Raw MDX body, frontmatter stripped. */
  content: string
}

function readPost(filename: string): Post | null {
  if (!filename.endsWith(".mdx") && !filename.endsWith(".md")) return null

  const filePath = path.join(BLOG_DIR, filename)
  const raw = fs.readFileSync(filePath, "utf8")
  const { data, content } = matter(raw)

  const fileSlug = filename.replace(/\.mdx?$/, "")
  const slug = (data.slug as string | undefined) ?? fileSlug

  // Skip drafts: any post with `draft: true` in frontmatter is excluded.
  if (data.draft === true) return null

  if (!data.title || !data.description || !data.date) {
    throw new Error(
      `Blog post "${filename}" is missing required frontmatter (title, description, date).`
    )
  }

  return {
    slug,
    title: String(data.title),
    description: String(data.description),
    date: normalizeDate(data.date, filename),
    image: data.image ? String(data.image) : undefined,
    topics: parseTopics(data.topics),
    content,
  }
}

/**
 * Coerce a frontmatter date to a YYYY-MM-DD string.
 *
 * YAML parses unquoted dates (`date: 2026-05-07`) as JS Date objects, but
 * quoted ones (`date: "2026-05-07"`) stay as strings. Normalize both shapes
 * here so downstream code can assume a clean ISO date string.
 */
function normalizeDate(value: unknown, filename: string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const s = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  throw new Error(
    `Blog post "${filename}" has invalid date "${s}" — expected YYYY-MM-DD.`
  )
}

function parseTopics(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const out = (value as unknown[]).filter(
    (v): v is string => typeof v === "string" && v.length > 0
  )
  return out.length > 0 ? out : undefined
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  return fs
    .readdirSync(BLOG_DIR)
    .map(readPost)
    .filter((p): p is Post => p !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(({ content: _content, ...meta }) => meta)
}

/** Posts that listed `topics:` in their frontmatter. Newest-first. */
export function getPostsByTopic(topicSlug: string): PostMeta[] {
  return getAllPosts().filter((p) => p.topics?.includes(topicSlug))
}

export function getPostBySlug(slug: string): Post | null {
  if (!fs.existsSync(BLOG_DIR)) return null
  for (const filename of fs.readdirSync(BLOG_DIR)) {
    const post = readPost(filename)
    if (post && post.slug === slug) return post
  }
  return null
}

export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug)
}

/** Pretty-print an ISO date for display. */
export function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })
}
