import type { ExtractedPost, Issue } from "./types"

const MIN_WORD_COUNT = 250

/**
 * Brand names that should be treated as PLURAL (use "Are"), even when the
 * subject phrase happens to end in a non-`s` letter. Substring-matched, so
 * "Cheerios - Blueberry" picks up "cheerios" and gets flagged as plural.
 */
const KNOWN_PLURAL_BRANDS = [
  "cheerios",
  "cheez-its",
  "cheez its",
  "pop corners",
  "popcorners",
  "pop-tarts",
  "pop tarts",
  "rxbar minis",
  "veggie straws",
].map((s) => s.toLowerCase())

/**
 * Brand names that LOOK plural (end in -s) but are singular product names.
 * Beats the trailing-`s` heuristic.
 */
const KNOWN_SINGULAR_BRANDS = new Set(
  [
    "fruifuls",
    "gogurt",
    "go-gurt",
    "go gurt",
    "snickers",
    "reese's",
    "m&m's",
    "lay's",
    "doritos cool ranch", // brand-with-flavor — singular product
  ].map((s) => s.toLowerCase())
)

export function runDeterministicChecks(
  post: ExtractedPost,
  allPosts: ExtractedPost[]
): Issue[] {
  const issues: Issue[] = []
  const slugIndex = new Set(allPosts.map((p) => p.slug))
  const filenameSlugCollisions = findFilenameSlugCollisions(allPosts)

  const push = (
    severity: Issue["severity"],
    category: Issue["issue_category"],
    issue: string,
    fix: string,
    humanReview = false
  ) => {
    issues.push({
      slug: post.slug,
      title: post.title,
      status: "issue",
      severity,
      issue_category: category,
      issue,
      recommended_fix: fix,
      human_review_needed: humanReview,
    })
  }

  // --- Metadata ---
  if (!post.hasMetaTitle || !post.title.trim()) {
    push(
      "blocker",
      "metadata",
      "Missing frontmatter `title`.",
      "Add a `title:` field to frontmatter."
    )
  }
  if (!post.hasMetaDescription || !post.description.trim()) {
    push(
      "blocker",
      "metadata",
      "Missing frontmatter `description`.",
      "Add a `description:` field — used as meta description and on the index."
    )
  }
  if (!post.date) {
    push(
      "blocker",
      "metadata",
      "Missing frontmatter `date`.",
      "Add a `date:` field in YYYY-MM-DD format."
    )
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date)) {
    push(
      "high",
      "metadata",
      `Invalid date format: "${post.date}".`,
      "Use ISO format YYYY-MM-DD."
    )
  }

  // --- Title / H1 ---
  if (post.h1 && post.h1.trim().toLowerCase() !== post.title.trim().toLowerCase()) {
    push(
      "medium",
      "structure",
      `MDX H1 ("${post.h1}") doesn't match frontmatter title ("${post.title}").`,
      "Either remove the MDX H1 (page renders one from the title) or align the two."
    )
  }
  const mdxH1Count = (post.rawContent.match(/^#\s+/gm) ?? []).length
  if (mdxH1Count > 1) {
    push(
      "high",
      "structure",
      `Multiple MDX H1 headings (${mdxH1Count}). Should be at most one.`,
      "Demote extra H1s to H2 or remove them — the page already renders an H1 from the title."
    )
  }

  // --- Is/Are grammar ---
  // Runs on any title with a leading "Is X Healthy" / "Are X Healthy" — even
  // hybrid titles like "Is Cheez-Its Healthy? (Cheez-Its vs Pringles)" that
  // postType classifies as "comparison".
  if (post.isAreSubject) {
    const { verb, subject } = post.isAreSubject
    const subjectLower = subject.toLowerCase()
    if (verb === "Is" && looksPlural(subjectLower)) {
      push(
        "medium",
        "grammar",
        `Title uses "Is" with a plural-looking subject ("${subject}").`,
        `Consider "Are ${subject} Healthy?" — flagged for human review since some brand names are singular despite ending in -s.`,
        true
      )
    }
    if (
      verb === "Are" &&
      !looksPlural(subjectLower) &&
      !KNOWN_SINGULAR_BRANDS.has(subjectLower)
    ) {
      push(
        "medium",
        "grammar",
        `Title uses "Are" with a singular-looking subject ("${subject}").`,
        `Consider "Is ${subject} Healthy?".`,
        true
      )
    }
  }

  // --- Empty / duplicate sections ---
  for (const empty of post.emptyHeadings) {
    push(
      "high",
      "structure",
      `Empty section: heading "${empty}" has no content.`,
      "Add content under the heading or remove the heading."
    )
  }
  for (const dup of post.duplicateHeadings) {
    push(
      "medium",
      "duplicate",
      `Duplicate heading: "${dup}" appears more than once.`,
      "Rename one of the headings or merge the sections."
    )
  }

  // --- Placeholders ---
  for (const ph of post.placeholderHits) {
    push(
      "blocker",
      "content_quality",
      `Placeholder text detected: "${ph}".`,
      "Replace placeholder with real content before publishing."
    )
  }

  // --- Word count ---
  if (post.wordCount < MIN_WORD_COUNT) {
    push(
      post.wordCount < MIN_WORD_COUNT / 2 ? "high" : "medium",
      "content_quality",
      `Low word count: ${post.wordCount} words (threshold: ${MIN_WORD_COUNT}).`,
      "Expand with comparison details, ingredient breakdowns, or context."
    )
  }

  // --- Internal links ---
  for (const link of post.internalLinks) {
    const targetSlug = link.replace(/^\/blog\//, "").replace(/\/$/, "")
    if (!targetSlug) {
      // Bare /blog link is the index — fine
      continue
    }
    if (!slugIndex.has(targetSlug)) {
      push(
        "high",
        "links",
        `Internal link points to missing post: ${link}`,
        `Either fix the slug, point to an existing post, or remove the link.`
      )
    }
  }

  // --- Duplicate slug across posts ---
  const slugCollisions = allPosts.filter((p) => p.slug === post.slug)
  if (slugCollisions.length > 1 && slugCollisions[0].filename === post.filename) {
    // Only flag once, on the first occurrence.
    const others = slugCollisions
      .filter((p) => p.filename !== post.filename)
      .map((p) => p.filename)
    push(
      "blocker",
      "duplicate",
      `Slug "${post.slug}" is shared with: ${others.join(", ")}.`,
      "Rename one of the files or set distinct `slug:` values in frontmatter."
    )
  }
  // Also flag filename / explicit-slug mismatches (will route via the slug, but is confusing):
  if (filenameSlugCollisions.has(post.filename)) {
    push(
      "low",
      "metadata",
      `Filename and frontmatter slug differ. Routes via "${post.slug}", file is "${post.filename}".`,
      "Either rename the file to match the slug, or remove the explicit slug field."
    )
  }

  return issues
}

function looksPlural(s: string): boolean {
  // Subject contains a known plural brand as a whole word? Plural.
  for (const brand of KNOWN_PLURAL_BRANDS) {
    const re = new RegExp(`\\b${brand.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`)
    if (re.test(s)) return true
  }
  if (KNOWN_SINGULAR_BRANDS.has(s)) return false
  // Crude heuristic — ends in -s but not -ss/-us/-is.
  return /s$/.test(s) && !/(ss|us|is)$/.test(s)
}

function findFilenameSlugCollisions(posts: ExtractedPost[]): Set<string> {
  const out = new Set<string>()
  for (const p of posts) {
    const fileSlug = p.filename.replace(/\.mdx?$/, "")
    if (fileSlug !== p.slug) out.add(p.filename)
  }
  return out
}
