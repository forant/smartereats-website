import fs from "node:fs"
import path from "node:path"
import type { AuditReport, Issue, IssueCategory, Severity } from "./types"

const SEVERITIES: Severity[] = ["blocker", "high", "medium", "low"]
const CATEGORIES: IssueCategory[] = [
  "metadata",
  "structure",
  "links",
  "grammar",
  "content_quality",
  "comparison_logic",
  "duplicate",
]

const CSV_COLUMNS = [
  "slug",
  "title",
  "status",
  "severity",
  "issue_category",
  "issue",
  "recommended_fix",
  "human_review_needed",
] as const

export function buildReport(opts: {
  totalPosts: number
  postsAudited: number
  issues: Issue[]
  model: string | null
  llmUsed: boolean
}): AuditReport {
  const bySeverity = Object.fromEntries(
    SEVERITIES.map((s) => [s, 0])
  ) as Record<Severity, number>
  const byCategory = Object.fromEntries(
    CATEGORIES.map((c) => [c, 0])
  ) as Record<IssueCategory, number>

  for (const i of opts.issues) {
    bySeverity[i.severity] += 1
    byCategory[i.issue_category] += 1
  }

  const slugsWithIssues = new Set(opts.issues.map((i) => i.slug))

  return {
    generatedAt: new Date().toISOString(),
    model: opts.model,
    llmUsed: opts.llmUsed,
    summary: {
      totalPosts: opts.totalPosts,
      postsAudited: opts.postsAudited,
      postsWithIssues: slugsWithIssues.size,
      totalIssues: opts.issues.length,
      bySeverity,
      byCategory,
    },
    issues: sortIssues(opts.issues),
  }
}

export function writeReport(report: AuditReport, outDir: string): void {
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(
    path.join(outDir, "audit-report.json"),
    JSON.stringify(report, null, 2),
    "utf8"
  )
  fs.writeFileSync(
    path.join(outDir, "audit-report.csv"),
    issuesToCsv(report.issues),
    "utf8"
  )
}

export function printSummary(report: AuditReport): void {
  const s = report.summary
  console.log("")
  console.log("=== Blog audit summary ===")
  console.log(`Posts in repo:       ${s.totalPosts}`)
  console.log(`Posts audited:       ${s.postsAudited}`)
  console.log(`Posts with issues:   ${s.postsWithIssues}`)
  console.log(`Total issues:        ${s.totalIssues}`)
  console.log(`LLM used:            ${report.llmUsed ? `yes (${report.model})` : "no"}`)
  console.log("")
  console.log("By severity:")
  for (const sev of SEVERITIES) {
    const n = s.bySeverity[sev]
    if (n > 0) console.log(`  ${sev.padEnd(8)} ${n}`)
  }
  console.log("")
  console.log("By category:")
  for (const cat of CATEGORIES) {
    const n = s.byCategory[cat]
    if (n > 0) console.log(`  ${cat.padEnd(18)} ${n}`)
  }
}

function sortIssues(issues: Issue[]): Issue[] {
  const order: Record<Severity, number> = { blocker: 0, high: 1, medium: 2, low: 3 }
  return [...issues].sort((a, b) => {
    if (order[a.severity] !== order[b.severity]) {
      return order[a.severity] - order[b.severity]
    }
    if (a.slug !== b.slug) return a.slug.localeCompare(b.slug)
    return a.issue_category.localeCompare(b.issue_category)
  })
}

function issuesToCsv(issues: Issue[]): string {
  const header = CSV_COLUMNS.join(",")
  const rows = issues.map((i) =>
    CSV_COLUMNS.map((col) => csvCell(formatCell(i, col))).join(",")
  )
  return [header, ...rows].join("\n") + "\n"
}

function formatCell(issue: Issue, col: (typeof CSV_COLUMNS)[number]): string {
  const v = issue[col]
  if (typeof v === "boolean") return v ? "true" : "false"
  return String(v ?? "")
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
