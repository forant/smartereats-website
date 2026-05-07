/**
 * Topic hub data layer.
 *
 * Each .json file in /content/topics is one hub. This module:
 *   - loads + parses + validates configs at build time
 *   - exposes lookup helpers for routes, sitemap, and per-post backlinks
 *   - throws loudly on bad data so misconfiguration surfaces in dev/CI
 *
 * The site repo owns rendering and routing; the content engine will later
 * emit topic JSONs (or attach posts to them) — keep this layer cheap and
 * decoupled from any UI.
 */

import fs from "node:fs"
import path from "node:path"
import {
  getAllPosts,
  getPostBySlug,
  getPostsByTopic,
  type PostMeta,
} from "./blog"

const TOPICS_DIR = path.join(process.cwd(), "content", "topics")

/** Optional sub-grouping of posts inside a hub (e.g. "Comparisons", "Best for…"). */
export type TopicSection = {
  /** Section heading. Renders as an h2. */
  title: string
  /** Optional paragraph under the heading explaining the grouping. */
  description?: string
  /** Slugs of posts in this section, in display order. */
  postSlugs: string[]
}

export type TopicMeta = {
  /** URL slug, e.g. "high-protein-snacks". Filename without extension by default. */
  slug: string
  title: string
  /** Short blurb. Used as meta description and as the hub's lede paragraph. */
  description: string
  /** SEO keywords. Surfaced as <meta name="keywords"> + a CollectionPage hint. */
  keywords: string[]
  /** Optional longer paragraph(s) of intro copy, rendered after the description. */
  intro?: string
  /** Hand-picked top posts shown above the sections. */
  featuredPostSlugs?: string[]
  /** Optional grouped sub-collections. Hubs can ship without sections. */
  sections?: TopicSection[]
  /** Other hubs that complement this one. Used for cross-link suggestions. */
  relatedTopicSlugs?: string[]
  /** Optional hero image (path under /public). */
  image?: string
}

/** A topic with all referenced post metadata pre-resolved for rendering. */
export type ResolvedTopic = TopicMeta & {
  featured: PostMeta[]
  resolvedSections: { title: string; description?: string; posts: PostMeta[] }[]
  related: TopicMeta[]
  /** Total posts associated with this hub (deduped across featured + sections). */
  postCount: number
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

let cache: TopicMeta[] | null = null

/**
 * Load every topic config, validate, return in alphabetical-by-title order.
 * Throws on any invalid configuration. Result is memoized for the process.
 */
export function getAllTopics(): TopicMeta[] {
  if (cache) return cache
  if (!fs.existsSync(TOPICS_DIR)) {
    cache = []
    return cache
  }

  const filenames = fs
    .readdirSync(TOPICS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()

  const topics = filenames.map((filename) => parseTopicFile(filename))
  validateTopicSet(topics)
  topics.sort((a, b) => a.title.localeCompare(b.title))
  cache = topics
  return topics
}

export function getTopicBySlug(slug: string): TopicMeta | null {
  return getAllTopics().find((t) => t.slug === slug) ?? null
}

export function getAllTopicSlugs(): string[] {
  return getAllTopics().map((t) => t.slug)
}

/**
 * Find peer posts that share at least one topic hub with this post — used as
 * an auto-fallback for posts whose body doesn't include an explicit
 * `<RelatedPosts>` section. Ranks by shared-hub count then by recency.
 *
 * Returns an empty array when the post isn't in any hub. The caller decides
 * whether to render a fallback section.
 */
export function findRelatedPosts(
  postSlug: string,
  limit = 4
): PostMeta[] {
  const myTopics = getTopicsForPost(postSlug)
  if (myTopics.length === 0) return []

  const scores = new Map<string, { post: PostMeta; shared: number }>()
  for (const topic of myTopics) {
    const resolved = resolveTopic(topic)
    const peers = [
      ...resolved.featured,
      ...resolved.resolvedSections.flatMap((s) => s.posts),
    ]
    for (const peer of peers) {
      if (peer.slug === postSlug) continue
      const existing = scores.get(peer.slug)
      if (existing) existing.shared += 1
      else scores.set(peer.slug, { post: peer, shared: 1 })
    }
  }

  return [...scores.values()]
    .sort((a, b) => {
      if (a.shared !== b.shared) return b.shared - a.shared
      return a.post.date < b.post.date ? 1 : -1
    })
    .slice(0, limit)
    .map((entry) => entry.post)
}

/**
 * Topics that contain a given post slug, for "this post belongs to…" badges.
 * Cheap O(topics × sections) — fine at our scale.
 */
export function getTopicsForPost(postSlug: string): TopicMeta[] {
  const out: TopicMeta[] = []
  for (const t of getAllTopics()) {
    const all = collectSlugs(t)
    if (all.has(postSlug)) out.push(t)
  }
  return out
}

/** Resolve a topic into render-ready shape (post metadata pre-fetched). */
export function resolveTopic(topic: TopicMeta): ResolvedTopic {
  const seen = new Set<string>()
  const featured: PostMeta[] = []
  for (const slug of topic.featuredPostSlugs ?? []) {
    const p = getPostBySlug(slug)
    if (p && !seen.has(slug)) {
      featured.push(p)
      seen.add(slug)
    }
  }
  const resolvedSections = (topic.sections ?? []).map((s) => ({
    title: s.title,
    description: s.description,
    posts: s.postSlugs
      .map((slug) => {
        const p = getPostBySlug(slug)
        if (p) seen.add(slug)
        return p
      })
      .filter((p): p is NonNullable<typeof p> => p !== null) as PostMeta[],
  }))

  // Auto-merge frontmatter-tagged posts not already listed manually.
  // Lets the content engine attach posts to hubs without editing JSON.
  const taggedExtras = getPostsByTopic(topic.slug).filter(
    (p) => !seen.has(p.slug)
  )
  if (taggedExtras.length > 0) {
    for (const p of taggedExtras) seen.add(p.slug)
    resolvedSections.push({
      title: "More in this topic",
      description: undefined,
      posts: taggedExtras,
    })
  }

  const allTopics = getAllTopics()
  const related = (topic.relatedTopicSlugs ?? [])
    .map((slug) => allTopics.find((t) => t.slug === slug))
    .filter((t): t is TopicMeta => t !== undefined)
  return {
    ...topic,
    featured,
    resolvedSections,
    related,
    postCount: seen.size,
  }
}

// ---------- Parsing & validation ----------

function parseTopicFile(filename: string): TopicMeta {
  const filepath = path.join(TOPICS_DIR, filename)
  const raw = fs.readFileSync(filepath, "utf8")
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch (err) {
    throw new Error(
      `Topic config ${filename}: invalid JSON — ${(err as Error).message}`
    )
  }

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error(`Topic config ${filename}: must be a JSON object.`)
  }
  const obj = data as Record<string, unknown>

  const fileSlug = filename.replace(/\.json$/, "")
  const slug =
    typeof obj.slug === "string" && obj.slug.length > 0 ? obj.slug : fileSlug

  if (!SLUG_RE.test(slug)) {
    throw new Error(
      `Topic config ${filename}: slug "${slug}" must be lowercase kebab-case.`
    )
  }
  requireString(obj, "title", filename)
  requireString(obj, "description", filename)

  const keywords = Array.isArray(obj.keywords)
    ? (obj.keywords as unknown[]).filter((k): k is string => typeof k === "string")
    : []

  const featuredPostSlugs = optionalStringArray(obj.featuredPostSlugs)
  const relatedTopicSlugs = optionalStringArray(obj.relatedTopicSlugs)

  let sections: TopicSection[] | undefined
  if (Array.isArray(obj.sections)) {
    sections = obj.sections.map((raw, i) =>
      parseSection(raw, filename, i)
    )
  }

  return {
    slug,
    title: String(obj.title),
    description: String(obj.description),
    keywords,
    intro: typeof obj.intro === "string" ? obj.intro : undefined,
    featuredPostSlugs,
    sections,
    relatedTopicSlugs,
    image: typeof obj.image === "string" ? obj.image : undefined,
  }
}

function parseSection(raw: unknown, filename: string, i: number): TopicSection {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(`Topic ${filename} sections[${i}]: must be an object.`)
  }
  const r = raw as Record<string, unknown>
  if (typeof r.title !== "string" || r.title.length === 0) {
    throw new Error(`Topic ${filename} sections[${i}]: "title" required.`)
  }
  if (!Array.isArray(r.postSlugs)) {
    throw new Error(
      `Topic ${filename} sections[${i}]: "postSlugs" must be an array.`
    )
  }
  return {
    title: r.title,
    description: typeof r.description === "string" ? r.description : undefined,
    postSlugs: (r.postSlugs as unknown[]).filter(
      (s): s is string => typeof s === "string"
    ),
  }
}

function validateTopicSet(topics: TopicMeta[]): void {
  // Duplicate slugs
  const seen = new Map<string, string>()
  for (const t of topics) {
    if (seen.has(t.slug)) {
      throw new Error(
        `Topic slug collision: "${t.slug}" appears in multiple configs.`
      )
    }
    seen.set(t.slug, t.title)
  }

  // Cross-references: relatedTopicSlugs must resolve.
  const slugSet = new Set(topics.map((t) => t.slug))
  for (const t of topics) {
    for (const rel of t.relatedTopicSlugs ?? []) {
      if (!slugSet.has(rel)) {
        throw new Error(
          `Topic "${t.slug}": relatedTopicSlugs references unknown topic "${rel}".`
        )
      }
    }
    if (t.relatedTopicSlugs?.includes(t.slug)) {
      throw new Error(`Topic "${t.slug}": cannot list itself in relatedTopicSlugs.`)
    }
  }

  // Post references must exist.
  const postSlugs = new Set(getAllPosts().map((p) => p.slug))
  for (const t of topics) {
    const refs = collectSlugs(t)
    for (const ref of refs) {
      if (!postSlugs.has(ref)) {
        throw new Error(
          `Topic "${t.slug}": references missing post slug "${ref}". Either add the post, fix the slug, or remove the reference.`
        )
      }
    }
  }
}

function collectSlugs(t: TopicMeta): Set<string> {
  const out = new Set<string>()
  for (const s of t.featuredPostSlugs ?? []) out.add(s)
  for (const sec of t.sections ?? []) for (const s of sec.postSlugs) out.add(s)
  return out
}

function requireString(
  obj: Record<string, unknown>,
  key: string,
  filename: string
): void {
  const v = obj[key]
  if (typeof v !== "string" || v.length === 0) {
    throw new Error(`Topic config ${filename}: "${key}" required.`)
  }
}

function optionalStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined
  return (v as unknown[]).filter((x): x is string => typeof x === "string")
}
