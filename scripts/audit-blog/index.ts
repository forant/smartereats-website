#!/usr/bin/env node
/**
 * Blog QA auditor for the SmarterEats content engine.
 *
 * Usage:
 *   pnpm audit:blog                          # deterministic + LLM (if ANTHROPIC_API_KEY set)
 *   pnpm audit:blog -- --no-llm              # deterministic only
 *   pnpm audit:blog -- --limit 5             # audit the first 5 posts
 *   pnpm audit:blog -- --slugs a,b,c         # audit specific slugs
 *   pnpm audit:blog -- --model claude-haiku-4-5    # cheaper LLM model
 *   pnpm audit:blog -- --effort low          # cheaper thinking effort
 *   pnpm audit:blog -- --out audit-output    # output directory
 *
 * Read-only: reads content/blog/*.mdx, writes audit-output/{audit-report.json,audit-report.csv}.
 * Never modifies posts. A future --fix flag can be layered in if/when desired.
 */

import { extractPost, listPostFilenames } from "./extract"
import { runDeterministicChecks } from "./deterministic"
import { LLMReviewer } from "./llm"
import { buildReport, printSummary, writeReport } from "./output"
import type { ExtractedPost, Issue } from "./types"

const DEFAULT_MODEL = "claude-opus-4-7"
const DEFAULT_OUT = "audit-output"

type Args = {
  llm: boolean
  limit: number | null
  slugs: string[] | null
  model: string
  effort: "low" | "medium" | "high" | "max"
  out: string
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    llm: true,
    limit: null,
    slugs: null,
    model: DEFAULT_MODEL,
    effort: "medium",
    out: DEFAULT_OUT,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const next = () => argv[++i]
    switch (a) {
      case "--no-llm":
        args.llm = false
        break
      case "--limit":
        args.limit = parseInt(next(), 10)
        break
      case "--slugs":
        args.slugs = next().split(",").map((s) => s.trim()).filter(Boolean)
        break
      case "--model":
        args.model = next()
        break
      case "--effort": {
        const v = next()
        if (!["low", "medium", "high", "max"].includes(v)) {
          throw new Error(`--effort must be low|medium|high|max (got: ${v})`)
        }
        args.effort = v as Args["effort"]
        break
      }
      case "--out":
        args.out = next()
        break
      case "-h":
      case "--help":
        printHelp()
        process.exit(0)
      default:
        if (a.startsWith("--")) {
          console.error(`Unknown flag: ${a}`)
          printHelp()
          process.exit(2)
        }
    }
  }
  return args
}

function printHelp() {
  console.log(`Usage: tsx scripts/audit-blog/index.ts [options]

Options:
  --no-llm          Skip LLM checks (deterministic only).
  --limit N         Audit only the first N posts (alphabetical).
  --slugs a,b,c     Audit specific slugs only.
  --model ID        LLM model (default: ${DEFAULT_MODEL}).
  --effort LEVEL    LLM effort: low | medium | high | max (default: medium).
  --out DIR         Output directory (default: ${DEFAULT_OUT}).
  -h, --help        Show this message.
`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const allFilenames = listPostFilenames()
  console.log(`Found ${allFilenames.length} blog post file(s).`)

  // Always extract every post — needed for slug-collision and link-target checks.
  const allExtracted: ExtractedPost[] = []
  for (const f of allFilenames) {
    try {
      allExtracted.push(extractPost(f))
    } catch (err) {
      console.warn(`! Skipping ${f}: ${(err as Error).message}`)
    }
  }

  // Apply selection filter for which posts get audited.
  let toAudit: ExtractedPost[] = allExtracted
  if (args.slugs) {
    const want = new Set(args.slugs)
    toAudit = toAudit.filter((p) => want.has(p.slug))
    if (toAudit.length === 0) {
      console.error(`No posts matched --slugs ${args.slugs.join(",")}`)
      process.exit(1)
    }
  }
  if (args.limit !== null) {
    toAudit = toAudit.slice(0, args.limit)
  }

  // Resolve LLM availability.
  const apiKey = process.env.ANTHROPIC_API_KEY
  let llmEnabled = args.llm && Boolean(apiKey)
  if (args.llm && !apiKey) {
    console.warn(
      "! ANTHROPIC_API_KEY not set — running deterministic checks only. Pass --no-llm to silence this warning."
    )
    llmEnabled = false
  }
  const reviewer = llmEnabled
    ? new LLMReviewer({ apiKey: apiKey!, model: args.model, effort: args.effort })
    : null

  console.log(
    `Auditing ${toAudit.length} post(s)${
      llmEnabled ? ` with LLM (${args.model}, effort=${args.effort})` : ""
    }...`
  )

  const issues: Issue[] = []
  let postIndex = 0
  for (const post of toAudit) {
    postIndex += 1
    process.stdout.write(`[${postIndex}/${toAudit.length}] ${post.slug} `)

    issues.push(...runDeterministicChecks(post, allExtracted))

    if (reviewer) {
      try {
        const { issues: llmIssues } = await reviewer.review(post)
        issues.push(...llmIssues)
        process.stdout.write("✓\n")
      } catch (err) {
        process.stdout.write(`✗ (${(err as Error).message})\n`)
      }
    } else {
      process.stdout.write("✓ (deterministic only)\n")
    }
  }

  const report = buildReport({
    totalPosts: allExtracted.length,
    postsAudited: toAudit.length,
    issues,
    model: llmEnabled ? args.model : null,
    llmUsed: llmEnabled,
  })

  writeReport(report, args.out)
  printSummary(report)

  if (reviewer) {
    const stats = reviewer.stats()
    console.log("")
    console.log("LLM usage:")
    console.log(`  Requests:           ${stats.requests}`)
    console.log(`  Cache reads (tok):  ${stats.cacheHits}`)
    console.log(`  Cache writes (tok): ${stats.cacheCreations}`)
    console.log(`  Input tokens:       ${stats.inputTokens}`)
    console.log(`  Output tokens:      ${stats.outputTokens}`)
  }

  console.log("")
  console.log(`Wrote ${args.out}/audit-report.csv and audit-report.json`)

  // Exit non-zero if any blockers — useful for CI gating.
  const blockers = report.summary.bySeverity.blocker
  if (blockers > 0) {
    console.log("")
    console.log(`! ${blockers} blocker(s) found — review before publishing.`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("Audit failed:", err)
  process.exit(1)
})
