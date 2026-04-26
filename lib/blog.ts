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
    date: String(data.date),
    image: data.image ? String(data.image) : undefined,
    content,
  }
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
