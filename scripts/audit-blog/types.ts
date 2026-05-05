export type Severity = "blocker" | "high" | "medium" | "low"

export type IssueCategory =
  | "metadata"
  | "structure"
  | "links"
  | "grammar"
  | "content_quality"
  | "comparison_logic"
  | "duplicate"

/** Stable check identifier — used to suppress specific issues per post. */
export type CheckId =
  | "metadata.missing-title"
  | "metadata.missing-description"
  | "metadata.missing-date"
  | "metadata.invalid-date"
  | "metadata.filename-slug-mismatch"
  | "structure.h1-mismatch"
  | "structure.multiple-h1"
  | "structure.empty-section"
  | "duplicate.heading"
  | "duplicate.slug"
  | "grammar.is-are-mismatch"
  | "content.placeholder"
  | "content.low-word-count"
  | "links.missing-target"
  | "llm.comparison-sense"
  | "llm.unusual-framing"
  | "llm.verdict-match"
  | "llm.alternatives"
  | "llm.useful-non-spammy"
  | "llm.contradiction"
  | "llm.note"

export type Issue = {
  slug: string
  title: string
  status: "issue"
  /** Stable check id — pin in `audit_ignore` frontmatter to suppress. */
  check_id: CheckId
  severity: Severity
  issue_category: IssueCategory
  issue: string
  recommended_fix: string
  human_review_needed: boolean
}

export type PostType =
  | "comparison" // "X vs Y"
  | "is_x_healthy" // "Is X Healthy?"
  | "are_x_healthy" // "Are X Healthy?"
  | "other"

export type ExtractedPost = {
  slug: string
  filePath: string
  filename: string
  title: string
  description: string
  date: string
  /** First H1 in MDX body, if any. Most posts have no MDX H1 — the page renders one from the title. */
  h1: string | null
  /** All H2+ headings, in document order. */
  headings: { level: number; text: string }[]
  postType: PostType
  /**
   * Subject between "Is"/"Are" and "Healthy" in the title, regardless of any
   * trailing "vs Y" portion. Lets us run subject-verb agreement checks on
   * hybrid titles like "Is Cheez-Its Healthy? (Cheez-Its vs Pringles)" that
   * postType classifies as "comparison".
   */
  isAreSubject: { verb: "Is" | "Are"; subject: string } | null
  /** Foods/entities being discussed, derived from title. */
  foods: string[]
  /** Internal blog links found in the body (path-only, e.g. "/blog/foo"). */
  internalLinks: string[]
  /** Plain-text body for word counting and content scans. */
  bodyText: string
  wordCount: number
  /** Headings that have no content between them and the next heading. */
  emptyHeadings: string[]
  /** Heading texts that appear more than once. */
  duplicateHeadings: string[]
  /** Placeholder strings detected in the body (TODO, lorem, etc.). */
  placeholderHits: string[]
  rawContent: string
  hasMetaTitle: boolean
  hasMetaDescription: boolean
  /** Check ids the post explicitly opts out of (from `audit_ignore:` frontmatter). */
  auditIgnore: CheckId[]
}

export type AuditReport = {
  generatedAt: string
  model: string | null
  llmUsed: boolean
  summary: {
    totalPosts: number
    postsAudited: number
    postsWithIssues: number
    totalIssues: number
    /** Issues silenced by per-post `audit_ignore:` frontmatter. */
    suppressedIssues: number
    bySeverity: Record<Severity, number>
    byCategory: Record<IssueCategory, number>
  }
  issues: Issue[]
}
