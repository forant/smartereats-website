import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import type { ExtractedPost, Issue } from "./types"

/**
 * LLM-driven editorial review per post. Defaults to Opus 4.7 with adaptive
 * thinking + medium effort. The system prompt is identical across all posts
 * and is cached via cache_control to amortize cost over a full audit run.
 *
 * Returns a structured JSON judgment which we map into Issue rows.
 */

const ReviewSchema = z.object({
  comparison_makes_sense: z.boolean().describe(
    "Does the food comparison/framing make sense to a knowledgeable reader? True for clear, useful pairings (e.g. snacks of similar category, or framing-justified unusual pairings)."
  ),
  comparison_makes_sense_reason: z.string().describe(
    "One sentence: why true or false. Required."
  ),
  unusual_framing_justified: z.boolean().describe(
    "If the comparison is unusual (very different food categories), is the unusual framing clearly justified by an explicit nutrition insight (sugar, calories, protein, processing, ingredients)? True if no unusual framing exists OR if the framing is clearly justified."
  ),
  unusual_framing_justified_reason: z.string().describe(
    "One sentence: why true or false. Required."
  ),
  explanation_matches_score: z.boolean().describe(
    "Does the post's verdict / takeaway match the data and arguments it presents? True if internally coherent."
  ),
  explanation_matches_score_reason: z.string().describe(
    "One sentence: why true or false. Required."
  ),
  alternatives_relevant: z.boolean().describe(
    "If the post suggests alternatives, are they relevant and reasonable? True if no alternatives are suggested OR if suggestions are appropriate."
  ),
  alternatives_relevant_reason: z.string().describe(
    "One sentence: why true or false. Required."
  ),
  feels_useful_and_non_spammy: z.boolean().describe(
    "Does the post feel substantive and useful — not generic SEO filler, not contradictory, not obviously AI-spammy?"
  ),
  feels_useful_reason: z.string().describe(
    "One sentence: why true or false. Required."
  ),
  contradictions_or_awkward_claims: z
    .array(z.string())
    .describe(
      "List of specific contradictions, factual errors, or awkward/wrong claims, each as a short quote or paraphrase. Empty array if none."
    ),
  overall_severity: z
    .enum(["blocker", "high", "medium", "low", "none"])
    .describe(
      "Worst severity across all issues found. 'none' if the post is publish-ready."
    ),
  notes: z
    .string()
    .optional()
    .describe(
      "Optional brief note for human reviewers — context that doesn't fit elsewhere."
    ),
})

type Review = z.infer<typeof ReviewSchema>

const SYSTEM_PROMPT = `You are an editorial QA reviewer for SmarterEats, a nutrition app. You review programmatically-generated food comparison blog posts.

Your job is to **identify the 10–20% of posts that need human attention** before publishing. Most posts are fine — flag the ones with real problems. Don't be precious; don't manufacture issues. Apply nutrition common sense, not strict science citation rules.

## Categories you'll see

1. **Comparison posts**: "X vs Y" — comparing two foods on nutrition.
2. **"Is X Healthy?"**: single-food deep dive.
3. **Unusual comparisons**: a healthy-coded food (Kind bar, granola bar, fruit snacks, oat milk) vs a junk-coded food (Snickers, Coke, Doritos). These ARE intentional — the editorial angle is "this 'healthy' food is closer to junk than you think." That framing is fine *if the post explicitly justifies it with sugar/calories/processing data*. Mark unusual_framing_justified = true when the post does this work. Mark false only when the comparison is genuinely random and the post doesn't explain why.

## Severity guide

- **blocker**: factually wrong, contradicts itself, contains placeholder text, makes claims that could mislead users about food safety or nutrition.
- **high**: logically inconsistent (verdict contradicts data shown), major awkward claim, comparison doesn't make sense and isn't justified.
- **medium**: minor logical glitch, weak alternatives, slightly off tone.
- **low**: cosmetic — tone nits, minor phrasing.
- **none**: post is publishable as-is.

## Important

- Be calibrated. Most posts should land at **none** or **low**. Only escalate when there's a real problem.
- Don't flag comparisons just because they're unusual — the editorial concept *is* unusual comparisons. The question is whether the post earns the framing.
- Don't penalize concise posts. Word count is a separate deterministic check.
- Think briefly before answering — judge each criterion independently, then summarize.

## Response format

You will respond using a structured JSON schema. Every reason field must be a single concise sentence. Be specific in 'contradictions_or_awkward_claims' — short quotes or paraphrases, not vague worry.`

export type LLMConfig = {
  apiKey: string
  model: string
  effort?: "low" | "medium" | "high" | "max"
}

export class LLMReviewer {
  private client: Anthropic
  private model: string
  private effort: "low" | "medium" | "high" | "max"
  private requestCount = 0
  private cacheHits = 0
  private cacheCreations = 0
  private inputTokens = 0
  private outputTokens = 0

  constructor(cfg: LLMConfig) {
    this.client = new Anthropic({ apiKey: cfg.apiKey })
    this.model = cfg.model
    this.effort = cfg.effort ?? "medium"
  }

  async review(post: ExtractedPost): Promise<{ review: Review; issues: Issue[] }> {
    const userMessage = renderPostForReview(post)

    const response = await this.client.messages.parse({
      model: this.model,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      output_config: {
        format: zodOutputFormat(ReviewSchema),
        effort: this.effort,
      },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    })

    this.requestCount += 1
    this.cacheHits += response.usage.cache_read_input_tokens ?? 0
    this.cacheCreations += response.usage.cache_creation_input_tokens ?? 0
    this.inputTokens += response.usage.input_tokens ?? 0
    this.outputTokens += response.usage.output_tokens ?? 0

    const review = response.parsed_output
    if (!review) {
      throw new Error(
        `LLM returned no parsed output for ${post.slug} (stop_reason=${response.stop_reason})`
      )
    }

    return { review, issues: mapReviewToIssues(post, review) }
  }

  stats() {
    return {
      requests: this.requestCount,
      cacheHits: this.cacheHits,
      cacheCreations: this.cacheCreations,
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
    }
  }
}

function renderPostForReview(post: ExtractedPost): string {
  return [
    `Slug: ${post.slug}`,
    `Title: ${post.title}`,
    `Description: ${post.description}`,
    `Post type: ${post.postType}`,
    `Foods: ${post.foods.join(" | ") || "(none extracted)"}`,
    "",
    "--- BODY ---",
    post.rawContent.replace(/^---[\s\S]*?---\n/, "").trim(),
  ].join("\n")
}

function mapReviewToIssues(post: ExtractedPost, review: Review): Issue[] {
  const issues: Issue[] = []
  const base = { slug: post.slug, title: post.title, status: "issue" as const }

  if (!review.comparison_makes_sense) {
    issues.push({
      ...base,
      check_id: "llm.comparison-sense",
      severity: "high",
      issue_category: "comparison_logic",
      issue: `LLM: comparison may not make sense — ${review.comparison_makes_sense_reason}`,
      recommended_fix:
        "Reframe the comparison or add context that makes the pairing meaningful.",
      human_review_needed: true,
    })
  }
  if (!review.unusual_framing_justified) {
    issues.push({
      ...base,
      check_id: "llm.unusual-framing",
      severity: "medium",
      issue_category: "comparison_logic",
      issue: `LLM: unusual comparison not justified — ${review.unusual_framing_justified_reason}`,
      recommended_fix:
        "Add explicit framing tying the comparison to a nutrition insight (sugar, calories, protein, processing, ingredients).",
      human_review_needed: true,
    })
  }
  if (!review.explanation_matches_score) {
    issues.push({
      ...base,
      check_id: "llm.verdict-match",
      severity: "high",
      issue_category: "content_quality",
      issue: `LLM: verdict doesn't match the data — ${review.explanation_matches_score_reason}`,
      recommended_fix:
        "Reconcile the verdict with the data presented or rewrite the data.",
      human_review_needed: true,
    })
  }
  if (!review.alternatives_relevant) {
    issues.push({
      ...base,
      check_id: "llm.alternatives",
      severity: "medium",
      issue_category: "content_quality",
      issue: `LLM: alternatives feel off — ${review.alternatives_relevant_reason}`,
      recommended_fix: "Suggest more relevant alternatives or omit the section.",
      human_review_needed: true,
    })
  }
  if (!review.feels_useful_and_non_spammy) {
    issues.push({
      ...base,
      check_id: "llm.useful-non-spammy",
      severity: "high",
      issue_category: "content_quality",
      issue: `LLM: post feels generic / spammy — ${review.feels_useful_reason}`,
      recommended_fix: "Tighten with specific data points or unique editorial angle.",
      human_review_needed: true,
    })
  }
  for (const claim of review.contradictions_or_awkward_claims) {
    issues.push({
      ...base,
      check_id: "llm.contradiction",
      severity: "medium",
      issue_category: "content_quality",
      issue: `LLM: contradiction or awkward claim — ${claim}`,
      recommended_fix: "Verify and correct or remove the claim.",
      human_review_needed: true,
    })
  }
  if (review.notes && review.notes.trim()) {
    issues.push({
      ...base,
      check_id: "llm.note",
      severity: "low",
      issue_category: "content_quality",
      issue: `LLM note: ${review.notes.trim()}`,
      recommended_fix: "Reviewer note — judge whether action needed.",
      human_review_needed: true,
    })
  }
  return issues
}
