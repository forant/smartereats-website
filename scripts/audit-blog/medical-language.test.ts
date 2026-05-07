/**
 * Tests for the medical / risky-language audit rules.
 *
 * Run with:
 *   pnpm audit:test
 *
 * Coverage:
 *   - explicit disease claims fire (blocker)
 *   - risk-reduction phrasing fires (high)
 *   - cholesterol-treatment language fires (high)
 *   - detox / immunity / heals language fires (high)
 *   - direct fear vocabulary fires (high)
 *   - unsupported absolutes fire (medium)
 *   - ordinary nutrition language does NOT fire (false-positive guard)
 *   - contextual goal-oriented language does NOT fire
 */

import { strict as assert } from "node:assert"
import { describe, test } from "node:test"
import { runMedicalLanguageChecks } from "./medical-language.ts"
import type { CheckId, ExtractedPost } from "./types.ts"

function makePost(text: string): ExtractedPost {
  return {
    slug: "test-post",
    filePath: "/tmp/test-post.mdx",
    filename: "test-post.mdx",
    title: "Test Post",
    description: "Test description.",
    date: "2026-01-01",
    h1: null,
    headings: [],
    postType: "other",
    isAreSubject: null,
    foods: [],
    internalLinks: [],
    bodyText: text,
    wordCount: text.split(/\s+/).length,
    emptyHeadings: [],
    duplicateHeadings: [],
    placeholderHits: [],
    rawContent: text,
    hasMetaTitle: true,
    hasMetaDescription: true,
    auditIgnore: [],
    topicTags: [],
  }
}

function checkIds(text: string): CheckId[] {
  return runMedicalLanguageChecks(makePost(text)).map((i) => i.check_id)
}

// ---------------------------------------------------------------------------
// True positives — these SHOULD fire.
// ---------------------------------------------------------------------------

describe("disease claims (blocker)", () => {
  test("'prevents cancer' fires disease-claim", () => {
    assert.ok(checkIds("Eating broccoli prevents cancer.").includes("medical.disease-claim"))
  })
  test("'cures inflammation' fires disease-claim", () => {
    assert.ok(checkIds("This food cures inflammation.").includes("medical.disease-claim"))
  })
  test("'reverses insulin resistance' fires disease-claim", () => {
    assert.ok(
      checkIds("Studies show it reverses insulin resistance.").includes(
        "medical.disease-claim"
      )
    )
  })
  test("'treats obesity' fires disease-claim", () => {
    assert.ok(checkIds("This snack treats obesity.").includes("medical.disease-claim"))
  })
  test("'fights diabetes' fires disease-claim", () => {
    assert.ok(
      checkIds("Whole grains fight diabetes over time.").includes("medical.disease-claim")
    )
  })
  test("issue surfaced for disease claim is severity blocker", () => {
    const issues = runMedicalLanguageChecks(makePost("This prevents cancer."))
    const hit = issues.find((i) => i.check_id === "medical.disease-claim")
    assert.ok(hit)
    assert.equal(hit.severity, "blocker")
  })
})

describe("risk-reduction phrasing (high)", () => {
  test("'reduces risk of heart disease' fires treatment-claim", () => {
    assert.ok(
      checkIds("This food reduces risk of heart disease.").includes(
        "medical.treatment-claim"
      )
    )
  })
  test("'protects against diabetes' fires treatment-claim", () => {
    assert.ok(
      checkIds("Daily fiber protects against diabetes.").includes("medical.treatment-claim")
    )
  })
})

describe("cholesterol claims (high)", () => {
  test("'lowers cholesterol' fires", () => {
    assert.ok(checkIds("Oats lower cholesterol.").includes("medical.cholesterol-claim"))
  })
  test("'reduces LDL cholesterol' fires", () => {
    assert.ok(
      checkIds("This reduces LDL cholesterol significantly.").includes(
        "medical.cholesterol-claim"
      )
    )
  })
})

describe("detox / immunity / heal claims (high)", () => {
  test("'detoxifies' fires detox-claim", () => {
    assert.ok(
      checkIds("Lemon water detoxifies the liver.").includes("medical.detox-claim")
    )
  })
  test("'cleanses your body' fires detox-claim", () => {
    assert.ok(
      checkIds("This juice cleanses your body.").includes("medical.detox-claim")
    )
  })
  test("'boosts immunity' fires immunity-claim", () => {
    assert.ok(
      checkIds("Elderberry boosts immunity during cold season.").includes(
        "medical.immunity-claim"
      )
    )
  })
  test("'heals your gut' fires treatment-claim", () => {
    assert.ok(
      checkIds("Bone broth heals your gut.").includes("medical.treatment-claim")
    )
  })
  test("'repairs metabolism' fires treatment-claim", () => {
    assert.ok(
      checkIds("Intermittent fasting repairs metabolism.").includes(
        "medical.treatment-claim"
      )
    )
  })
})

describe("fear-based rhetoric (high)", () => {
  test("'toxic' fires fear-rhetoric", () => {
    assert.ok(
      checkIds("These chips are toxic and full of garbage.").includes(
        "medical.fear-rhetoric"
      )
    )
  })
  test("'poison' fires fear-rhetoric", () => {
    assert.ok(checkIds("Soda is liquid poison.").includes("medical.fear-rhetoric"))
  })
  test("'destroys your metabolism' fires fear-rhetoric", () => {
    assert.ok(
      checkIds("Sugar destroys your metabolism over time.").includes(
        "medical.fear-rhetoric"
      )
    )
  })
  test("'wrecks your gut' fires fear-rhetoric", () => {
    assert.ok(
      checkIds("Seed oils wreck your gut.").includes("medical.fear-rhetoric")
    )
  })
  test("'fake food' fires fear-rhetoric", () => {
    assert.ok(
      checkIds("This is fake food, not real nutrition.").includes(
        "medical.fear-rhetoric"
      )
    )
  })
  test("'endocrine-disrupting' fires fear-rhetoric", () => {
    assert.ok(
      checkIds("It's an endocrine-disrupting nightmare.").includes(
        "medical.fear-rhetoric"
      )
    )
  })
})

describe("unsupported absolutes (medium)", () => {
  test("'is healthy.' fires absolute-claim", () => {
    assert.ok(
      checkIds("This snack is healthy.").includes("medical.absolute-claim")
    )
  })
  test("'is unhealthy.' fires absolute-claim", () => {
    assert.ok(
      checkIds("This drink is unhealthy.").includes("medical.absolute-claim")
    )
  })
  test("'the healthiest' fires absolute-claim", () => {
    assert.ok(
      checkIds("Greek yogurt is the healthiest snack.").includes(
        "medical.absolute-claim"
      )
    )
  })
  test("'is not the healthiest' does NOT fire — hedge, not a claim", () => {
    assert.deepEqual(checkIds("Gogurt is not the healthiest choice."), [])
  })
  test("'still not the healthiest' does NOT fire", () => {
    assert.deepEqual(
      checkIds("It's lighter than Snickers but still not the healthiest option."),
      []
    )
  })
  test("'may not be the healthiest' does NOT fire", () => {
    assert.deepEqual(
      checkIds("With 9g sugar, they may not be the healthiest option."),
      []
    )
  })
  test("'isn't the healthiest' does NOT fire", () => {
    assert.deepEqual(
      checkIds("Snickers isn't the healthiest option."),
      []
    )
  })
  test("'everyone should avoid' fires absolute-claim", () => {
    assert.ok(
      checkIds("Everyone should avoid sugar.").includes("medical.absolute-claim")
    )
  })
  test("'nobody should eat' fires absolute-claim", () => {
    assert.ok(checkIds("Nobody should eat trans fats.").includes("medical.absolute-claim"))
  })
  test("'never eat' fires absolute-claim", () => {
    assert.ok(checkIds("Never eat after 8 PM.").includes("medical.absolute-claim"))
  })
})

// ---------------------------------------------------------------------------
// False-positive guards — these should NOT fire.
// ---------------------------------------------------------------------------

describe("ordinary nutrition language does not fire", () => {
  const safePhrases = [
    "This snack is high in sodium.",
    "Doritos are calorie dense.",
    "Low in protein and fiber.",
    "Highly processed packaged snack.",
    "Less filling than higher-protein options.",
    "Higher in added sugar than the alternative.",
    "Lower in fiber than whole grains.",
    "Easy to overeat without realizing it.",
    "May fit some goals better than others.",
    "Ultra-processed and easy to mindlessly snack on.",
    "Contains 12g of added sugar per serving.",
    "Roughly the same calories as a Snickers bar.",
    "May cause sharper post-meal energy swings due to refined carbs.",
    "Less aligned with goals focused on satiety.",
    "More aligned with weight loss goals than a candy bar.",
    "Inflammation is reduced by adequate sleep.", // factual, not a claim about food
  ]
  for (const phrase of safePhrases) {
    test(`safe: "${phrase}"`, () => {
      assert.deepEqual(checkIds(phrase), [])
    })
  }
})

describe("contextual goal-oriented language does not fire", () => {
  const safePhrases = [
    "Depending on your goals, this can fit a balanced eating pattern.",
    "Less ideal for satiety-focused goals because it's mostly liquid sugar.",
    "Fits some eating patterns better than others.",
    "Higher in sodium than the alternative we compared it to.",
    "If your goal is weight loss, this is calorie-dense for the volume.",
    "May be a reasonable occasional choice in a varied diet.",
    "Cholesterol management depends on overall diet, not single foods.",
    "Blood sugar response varies by individual and meal context.",
  ]
  for (const phrase of safePhrases) {
    test(`safe: "${phrase}"`, () => {
      assert.deepEqual(checkIds(phrase), [])
    })
  }
})

describe("question-style titles don't fire", () => {
  // Site convention is "Is/Are X Healthy?" titles — these are questions, not absolutes.
  const titles = [
    "Is Doritos Healthy?",
    "Are Cheez-Its Healthy?",
    "Is Vitamin Water Healthy?",
  ]
  for (const t of titles) {
    test(`safe: "${t}"`, () => {
      assert.deepEqual(checkIds(t), [])
    })
  }
})

// ---------------------------------------------------------------------------
// Issue shape sanity
// ---------------------------------------------------------------------------

describe("issue payload shape", () => {
  test("includes offending text + suggested rewrite", () => {
    const issues = runMedicalLanguageChecks(makePost("Soda is liquid poison."))
    const hit = issues.find((i) => i.check_id === "medical.fear-rhetoric")
    assert.ok(hit)
    assert.match(hit.issue, /poison/i)
    assert.match(hit.recommended_fix, /(processed|calorie|sugar|sodium)/i)
    assert.equal(hit.human_review_needed, true)
  })

  test("caps repeated matches per rule per post at 3", () => {
    // Five 'toxic's, one rule.
    const text = "toxic toxic toxic toxic toxic"
    const issues = runMedicalLanguageChecks(makePost(text))
    const fearIssues = issues.filter((i) => i.check_id === "medical.fear-rhetoric")
    assert.ok(fearIssues.length <= 3)
  })
})
