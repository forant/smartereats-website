import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import type { ExtractedPost, PostType } from "./types"

const PLACEHOLDER_PATTERNS = [
  /\bTODO\b/i,
  /\bTBD\b/i,
  /lorem ipsum/i,
  /\[insert .+?\]/i,
  /\[your .+? here\]/i,
  /\bplaceholder\b/i,
  /\{\{.+?\}\}/,
  /\bxxx+\b/i,
]

const BLOG_DIR = path.join(process.cwd(), "content", "blog")

export function listPostFilenames(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .sort()
}

export function extractPost(filename: string): ExtractedPost {
  const filePath = path.join(BLOG_DIR, filename)
  const raw = fs.readFileSync(filePath, "utf8")
  const { data, content } = matter(raw)

  const fileSlug = filename.replace(/\.mdx?$/, "")
  const slug = (data.slug as string | undefined) ?? fileSlug
  const title = String(data.title ?? "")
  const description = String(data.description ?? "")
  const date = String(data.date ?? "")

  const h1 = extractH1(content)
  const headings = extractHeadings(content)
  const postType = inferPostType(title)
  const isAreSubject = extractIsAreSubject(title)
  const foods = extractFoods(title, postType)
  const internalLinks = extractInternalLinks(content)
  const bodyText = stripMarkdown(content)
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length
  const { emptyHeadings, duplicateHeadings } = analyzeSections(content, headings)
  const placeholderHits = findPlaceholders(content)

  return {
    slug,
    filePath,
    filename,
    title,
    description,
    date,
    h1,
    headings,
    postType,
    isAreSubject,
    foods,
    internalLinks,
    bodyText,
    wordCount,
    emptyHeadings,
    duplicateHeadings,
    placeholderHits,
    rawContent: raw,
    hasMetaTitle: Boolean(data.title),
    hasMetaDescription: Boolean(data.description),
  }
}

function extractH1(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : null
}

function extractHeadings(content: string): { level: number; text: string }[] {
  const out: { level: number; text: string }[] = []
  // Strip fenced code blocks first so we don't pick up `# comment` style lines as headings.
  const stripped = content.replace(/```[\s\S]*?```/g, "")
  const re = /^(#{1,6})\s+(.+)$/gm
  for (const m of stripped.matchAll(re)) {
    out.push({ level: m[1].length, text: m[2].trim() })
  }
  return out
}

/**
 * Pulls the subject from the leading "Is X Healthy" or "Are X Healthy" portion
 * of a title, even if it's followed by " (X vs Y)". Independent of postType so
 * grammar checks fire on hybrid titles too.
 */
function extractIsAreSubject(
  title: string
): { verb: "Is" | "Are"; subject: string } | null {
  const m = title.match(/^\s*(Is|Are)\s+(.+?)\s+Healthy\b/i)
  if (!m) return null
  const verb = m[1][0].toUpperCase() === "I" ? "Is" : "Are"
  return { verb, subject: m[2].trim() }
}

function inferPostType(title: string): PostType {
  if (/\bvs\.?\b/i.test(title)) return "comparison"
  if (/^\s*Is\b/i.test(title) && /healthy/i.test(title)) return "is_x_healthy"
  if (/^\s*Are\b/i.test(title) && /healthy/i.test(title)) return "are_x_healthy"
  return "other"
}

function extractFoods(title: string, type: PostType): string[] {
  const cleaned = title.replace(/[?:"'.]/g, "").trim()
  if (type === "comparison") {
    // "X vs Y" or "X vs Y: ..." — pull both sides.
    const m = cleaned.match(/^(.+?)\s+vs\.?\s+(.+?)(?:\s+(?:Which|The|A|An).*)?$/i)
    if (m) return [m[1].trim(), m[2].trim()]
  }
  if (type === "is_x_healthy" || type === "are_x_healthy") {
    const m = cleaned.match(/^(?:Is|Are)\s+(.+?)\s+Healthy/i)
    if (m) return [m[1].trim()]
  }
  return []
}

function extractInternalLinks(content: string): string[] {
  const out = new Set<string>()
  // Markdown links: [text](/blog/...) — strip query/hash, ignore protocol-absolute.
  const re = /\]\((\/[^)\s#?]+)/g
  for (const m of content.matchAll(re)) {
    const href = m[1]
    if (href.startsWith("/blog/")) out.add(href)
  }
  return [...out]
}

function stripMarkdown(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, " ") // fenced code
    .replace(/`[^`]+`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ") // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → text
    .replace(/^#{1,6}\s+/gm, "") // heading marks
    .replace(/[*_~]+/g, " ")
    .replace(/^\s*[-*+]\s+/gm, "") // list bullets
    .replace(/^\s*\d+\.\s+/gm, "") // ordered list
    .replace(/^\s*>\s?/gm, "") // blockquotes
    .replace(/\|/g, " ") // table pipes
    .replace(/\s+/g, " ")
    .trim()
}

function analyzeSections(
  content: string,
  headings: { level: number; text: string }[]
): { emptyHeadings: string[]; duplicateHeadings: string[] } {
  const stripped = content.replace(/```[\s\S]*?```/g, "")
  const lines = stripped.split("\n")

  type HeadingPos = { lineIdx: number; level: number; text: string }
  const positions: HeadingPos[] = []
  lines.forEach((line, i) => {
    const m = line.match(/^(#{1,6})\s+(.+)$/)
    if (m) positions.push({ lineIdx: i, level: m[1].length, text: m[2].trim() })
  })

  // A heading is "empty" if it has no body text AND no nested subheadings
  // before the next heading at the same or higher level. H1s that just contain
  // H2 sections are NOT empty — they're containers.
  const empty: string[] = []
  for (let h = 0; h < positions.length; h++) {
    const cur = positions[h]
    // Find the boundary: next heading at same or higher level (smaller/equal level number).
    let endLine = lines.length
    let hasNestedHeading = false
    for (let j = h + 1; j < positions.length; j++) {
      if (positions[j].level <= cur.level) {
        endLine = positions[j].lineIdx
        break
      }
      hasNestedHeading = true
    }
    if (hasNestedHeading) continue // container heading — fine

    const between = lines
      .slice(cur.lineIdx + 1, endLine)
      .map((l) => l.trim())
      .filter((l) => l && !/^#{1,6}\s+/.test(l))
    if (between.length === 0) empty.push(cur.text)
  }

  const seen = new Map<string, number>()
  for (const h of headings) {
    const key = h.text.toLowerCase()
    seen.set(key, (seen.get(key) ?? 0) + 1)
  }
  const duplicates = [...seen.entries()]
    .filter(([, n]) => n > 1)
    .map(([t]) => t)

  return { emptyHeadings: empty, duplicateHeadings: duplicates }
}

function findPlaceholders(content: string): string[] {
  const hits: string[] = []
  for (const pat of PLACEHOLDER_PATTERNS) {
    const m = content.match(pat)
    if (m) hits.push(m[0])
  }
  return hits
}
