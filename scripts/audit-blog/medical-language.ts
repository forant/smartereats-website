/**
 * Medical / risky-language audit pass.
 *
 * Catches three classes of problem:
 *   1. Disease, treatment, prevention, cure, or "reverses X" claims.
 *   2. Fear-based wellness rhetoric ("toxic", "poison", "destroys your gut", …).
 *   3. Unsupported absolutes ("this is healthy", "everyone should avoid", …).
 *
 * Severity convention (mapped onto the auditor's existing 4-tier scheme):
 *   - blocker  → "critical" in the brief: explicit disease / treatment claims.
 *   - high     → strong implied medical claims, fear rhetoric.
 *   - medium   → unsupported absolutes, misleading certainty.
 *   - low      → tone/style nits (none defined here yet).
 *
 * Rules are deliberately conservative on **false positives**. Ordinary
 * nutrition language ("high in sodium", "calorie dense", "low in protein",
 * "highly processed", "less filling", "easy to overeat") is intentionally
 * NOT matched — see the test suite for the canonical safe-language list.
 *
 * To extend: add a Rule object to RULES and a matching test case.
 */

import type {
  CheckId,
  ExtractedPost,
  Issue,
  IssueCategory,
  Severity,
} from "./types"

type Rule = {
  id: CheckId
  severity: Severity
  /** Short human-readable label of *what* class of problem this is. */
  label: string
  /** Why this phrasing is risky — one or two sentences. */
  why: string
  /** Suggested safer rewrite or a rewriting heuristic. */
  suggest: string
  /**
   * Patterns to match. A rule fires if *any* pattern matches. Patterns are
   * matched against title, description, and body text independently.
   * Each pattern should be defined with the `g` flag so we can collect every
   * match for capping/dedup.
   */
  patterns: RegExp[]
}

const CATEGORY: IssueCategory = "medical_language"
const MAX_MATCHES_PER_RULE_PER_POST = 3

// ---------------------------------------------------------------------------
// Vocabulary used to compose patterns. Kept as data so updates are reviewable.
// ---------------------------------------------------------------------------

/** Disease / condition terms that trigger a treatment-verb pattern. */
const CONDITIONS = [
  "cancer",
  "diabetes",
  "heart disease",
  "alzheimer'?s",
  "alzheimers",
  "obesity",
  "insulin resistance",
  "metabolic syndrome",
  "hypertension",
  "high blood pressure",
  "stroke",
  "arthritis",
  "depression",
  "anxiety",
  "ibs",
  "crohn'?s",
  "celiac",
  "ulcers?",
  // Only fires when paired with a treatment verb ("cures", "treats", "heals").
  // Standalone uses like "anti-inflammatory" or "inflammatory foods" stay safe.
  "inflammation",
]

/** Verbs that convert a condition into a medical claim. */
const TREATMENT_VERBS = [
  "prevents?",
  "treats?",
  "cures?",
  "heals?",
  "reverses?",
  "diagnoses?",
  "fights?(?:\\s+off)?",
  "kills?",
  "eliminates?",
  "ends?",
]

/** "Reduces risk of …" phrasing — softer, but still a medical implication. */
const RISK_PHRASES = [
  "lowers?\\s+(?:your\\s+)?risk\\s+of",
  "reduces?\\s+(?:your\\s+)?risk\\s+of",
  "cuts?\\s+(?:your\\s+)?risk\\s+of",
  "protects?\\s+(?:against|from)",
  "shields?\\s+(?:against|from)",
]

/** Words flagged as "fear rhetoric" — see RULES.fear for nuance. */
const FEAR_TERMS_DIRECT = [
  // Direct toxicity language
  "\\btoxic\\b",
  "\\bpoison(?:ous)?\\b",
  "\\bdangerous\\s+chemicals?\\b",
  "\\bfake\\s+food\\b",
  "\\bgarbage\\s+food\\b",
  "\\bjunk\\s+poison\\b",
  "\\baddictive\\s+poison\\b",
  "\\bultra[\\s-]?toxic\\b",
  "\\bendocrine[\\s-]?disrupting\\b",
  "\\binflammatory\\s+toxins?\\b",
]

/** "Destroys/wrecks your X" patterns. */
const DESTROYS_VERBS = ["destroys?", "wrecks?", "ruins?", "annihilates?"]
const DESTROYS_TARGETS = ["metabolism", "gut", "body", "hormones?", "liver"]

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

const RULES: Rule[] = [
  // 1. Direct disease/treatment claims (CRITICAL → blocker)
  {
    id: "medical.disease-claim",
    severity: "blocker",
    label: "Direct disease claim",
    why: "Implies food can prevent, treat, cure, reverse, or diagnose a medical condition. This is a regulated health claim and is outside the site's scope.",
    suggest:
      'Reframe descriptively. Instead of "prevents diabetes" → "may fit goals around steady blood sugar response, due to its fiber and protein content." Avoid naming specific diseases as outcomes.',
    patterns: [
      new RegExp(
        `\\b(${TREATMENT_VERBS.join("|")})\\s+(?:\\w+\\s+){0,3}(${CONDITIONS.join("|")})\\b`,
        "gi"
      ),
    ],
  },
  // 2. "Reduces risk of <disease>" — strong implication (HIGH)
  {
    id: "medical.treatment-claim",
    severity: "high",
    label: "Risk-reduction claim",
    why: "'Reduces/lowers/cuts risk of <disease>' is a quantitative medical claim. Even when widely-cited, the framing turns the food into a treatment.",
    suggest:
      'Reframe as nutrient-or-pattern description. Instead of "reduces risk of heart disease" → "is high in [nutrient] commonly studied in cardiovascular research."',
    patterns: [
      new RegExp(
        `\\b(${RISK_PHRASES.join("|")})\\s+(?:\\w+\\s+){0,3}(${CONDITIONS.join("|")})\\b`,
        "gi"
      ),
    ],
  },
  // 3. Cholesterol-as-treatment (HIGH) — common enough to deserve its own rule.
  {
    id: "medical.cholesterol-claim",
    severity: "high",
    label: "Cholesterol-treatment claim",
    why: "Claiming a food 'lowers cholesterol' frames it as a treatment. Some foods do influence lipid panels, but the wording matters: avoid presenting it as a clinical effect.",
    suggest:
      'Reframe descriptively, e.g. "high in soluble fiber, which has been studied in the context of cholesterol management." Avoid implying a guaranteed clinical outcome.',
    patterns: [
      /\b(lowers?|reduces?|cuts?|drops?)\s+(?:your\s+)?(?:bad\s+|ldl\s+|total\s+)?cholesterol\b/gi,
    ],
  },
  // 4. Detox / cleanse claims (HIGH)
  {
    id: "medical.detox-claim",
    severity: "high",
    label: "Detox/cleanse claim",
    why: "'Detox' / 'cleanse' framing is unsupported by mainstream nutrition science and reads as marketing.",
    suggest:
      "Describe the actual nutrient or mechanism instead — fiber, water content, antioxidants — without the detox framing.",
    patterns: [
      /\b(?:detoxif(?:ies|ying|ication|y)|detoxes?)\b/gi,
      /\bcleanses?\s+(?:your\s+)?(?:body|liver|colon|system)\b/gi,
    ],
  },
  // 5. Immunity-boost claims (HIGH)
  {
    id: "medical.immunity-claim",
    severity: "high",
    label: "Immunity-boost claim",
    why: "'Boosts immunity' implies a clinical effect on the immune system. Most foods don't do this in a meaningful, measurable way.",
    suggest:
      'Reframe as nutrient framing, e.g. "high in vitamin C and zinc, both of which support normal immune function." Avoid the verb "boost".',
    patterns: [
      /\b(boosts?|enhances?|supercharges?|strengthens?|bolsters?)\s+(?:your\s+)?immun(?:e\s+system|ity|e\s+response)\b/gi,
    ],
  },
  // 6. "Heals your gut" / "repairs metabolism" — body-system repair claims (HIGH)
  {
    id: "medical.treatment-claim",
    severity: "high",
    label: "Body-system repair claim",
    why: "Claiming food 'heals' or 'repairs' a body system is a treatment claim with no clinical basis at the food level.",
    suggest:
      'Describe the food\'s nutrient profile instead, e.g. "high in soluble fiber and fermented compounds associated with gut microbiome research."',
    patterns: [
      /\b(heals?|repairs?|fixes?|resets?|restores?)\s+(?:your\s+)?(metabolism|gut|microbiome|hormones?|body|insulin)\b/gi,
    ],
  },
  // 7. Direct fear-rhetoric vocabulary (HIGH)
  {
    id: "medical.fear-rhetoric",
    severity: "high",
    label: "Fear-based rhetoric",
    why: "Inflammatory or sensational language ('toxic', 'poison', 'fake food') overstates risk and reads as scaremongering rather than practical guidance.",
    suggest:
      'Use the practical descriptor that\'s actually true: "highly processed", "calorie dense", "high in added sugar / sodium / saturated fat", "easy to overeat". These tell the reader what they need to know without the alarm.',
    patterns: FEAR_TERMS_DIRECT.map((p) => new RegExp(p, "gi")),
  },
  // 8. "Destroys your metabolism / gut / body" — fear rhetoric variant (HIGH)
  {
    id: "medical.fear-rhetoric",
    severity: "high",
    label: "Fear-based rhetoric (destruction framing)",
    why: "'Destroys/wrecks/ruins your metabolism/gut/body' overstates the effect of any single food and crosses from practical guidance into scaremongering.",
    suggest:
      'Replace with practical effect language: "calorie dense and easy to overeat", "high in added sugar, which can drive sharper post-meal energy swings", etc.',
    patterns: [
      new RegExp(
        `\\b(${DESTROYS_VERBS.join("|")})\\s+(?:your\\s+)?(${DESTROYS_TARGETS.join("|")})\\b`,
        "gi"
      ),
    ],
  },
  // 9. Unsupported absolutes (MEDIUM)
  {
    id: "medical.absolute-claim",
    severity: "medium",
    label: "Unsupported absolute",
    why: "Bare absolutes ('this is healthy', 'everyone should avoid', 'the healthiest') drop the goal-and-tradeoff context the site stands for.",
    suggest:
      'Add goal context. Instead of "this is healthy" → "may fit goals focused on satiety / lower calorie density / minimizing added sugar". Instead of "everyone should avoid" → "less ideal for [specific goal] because [specific reason]".',
    patterns: [
      // "X is healthy." / "X is unhealthy." — declarative bare claim ending the sentence.
      /\b(?:is|are)\s+(?:totally\s+|completely\s+|definitely\s+)?(?:un)?healthy\s*[.!]/gi,
      // "the healthiest" superlative used absolutely.
      // Skips negated forms ("not the healthiest", "isn't the healthiest",
      // "may not be the healthiest", "still not really the healthiest") —
      // those are hedges, not absolute claims.
      /(?<!\bnot\s)(?<!\bnot\s\w+\s)(?<!\bnot\s\w+\s\w+\s)(?<!n't\s)(?<!n't\s\w+\s)(?<!n't\s\w+\s\w+\s)\bthe\s+healthiest\b/gi,
      // Universal-quantifier prescriptions
      /\beveryone\s+should\s+(?:avoid|eat|skip|stop|drink|consume|cut\s+out)\b/gi,
      /\bnobody\s+should\s+(?:eat|drink|consume|touch)\b/gi,
      // Hard prohibitions
      /\bnever\s+(?:eat|drink|consume|touch)\b/gi,
      // "Always" prescriptions
      /\balways\s+(?:eat|drink|choose|pick)\b/gi,
    ],
  },
]

/**
 * Run every rule against the post's title, description, and body text.
 * Caps to MAX_MATCHES_PER_RULE_PER_POST per (rule, post) to avoid drowning
 * the audit in repeated phrases.
 */
export function runMedicalLanguageChecks(post: ExtractedPost): Issue[] {
  const haystack = [post.title, post.description, post.bodyText]
    .filter(Boolean)
    .join("\n\n")

  const issues: Issue[] = []
  for (const rule of RULES) {
    const matches: string[] = []
    for (const pattern of rule.patterns) {
      // Reset lastIndex for safety since patterns are reused.
      pattern.lastIndex = 0
      for (const m of haystack.matchAll(pattern)) {
        matches.push(m[0])
        if (matches.length >= MAX_MATCHES_PER_RULE_PER_POST) break
      }
      if (matches.length >= MAX_MATCHES_PER_RULE_PER_POST) break
    }
    for (const matchedText of matches) {
      issues.push({
        slug: post.slug,
        title: post.title,
        status: "issue",
        check_id: rule.id,
        severity: rule.severity,
        issue_category: CATEGORY,
        issue: `${rule.label}: "${matchedText.trim()}". ${rule.why}`,
        recommended_fix: rule.suggest,
        human_review_needed: true,
      })
    }
  }
  return issues
}

/** Exported for tests. */
export const _internals = { RULES }
