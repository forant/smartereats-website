# smartereats-website

Marketing site, blog, and content engine for SmarterEats. Next.js 16 (app router) statically exported and served via Cloudflare Pages.

## Common commands

```sh
pnpm install        # one-time
pnpm dev            # local dev server (http://localhost:3000)
pnpm build          # static export to out/
pnpm audit:blog     # QA audit of content/blog/*.mdx (see below)
```

## Blog QA auditor (`pnpm audit:blog`)

Reads every post in [`content/blog/`](content/blog) and writes an issue report to `audit-output/`. Built to catch the 10–20% of programmatically generated posts that need human review before publishing — not to autocorrect everything.

The auditor is **read-only**. It never modifies post files. A `--fix` flag may be added later but does not exist today.

### What it checks

**Deterministic** (always run, no API key needed):

- Required frontmatter present: `title`, `description`, `date` (YYYY-MM-DD).
- Title vs MDX H1 alignment; flags multiple H1s.
- "Is" vs "Are" subject-verb agreement (heuristic — flags for human review since brand names like "Cheerios" are tricky).
- Empty sections (heading with no body content and no nested subheadings).
- Duplicate headings within a post.
- Placeholder strings in the body: `TODO`, `TBD`, `lorem ipsum`, `[insert ...]`, `XXX`, `{{...}}`, etc.
- Minimum word count (250 words).
- Internal `/blog/<slug>` links resolve to existing posts.
- Slug collisions across posts; filename ↔ frontmatter `slug:` mismatches.

**LLM-based** (only when `ANTHROPIC_API_KEY` is set):

Each post is sent to Claude with a cached editorial-review system prompt. Returns structured judgments on:

- Does the comparison make sense?
- If the framing is unusual (healthy-coded vs junk-coded food), is it justified by an explicit nutrition insight?
- Does the verdict match the data shown?
- Are suggested alternatives relevant?
- Does the post feel useful, or generic/spammy?
- Specific contradictions or awkward claims (each surfaced as its own issue).

LLM checks default to `claude-opus-4-7` with adaptive thinking and `medium` effort, with the system prompt cached via `cache_control` to amortize cost across the run. Override the model and effort with `--model` and `--effort`.

## Topic hubs

Topic hubs are SEO-optimized cluster pages that group related posts into a category landing experience. They live at `/topics/[slug]` with an index at [/topics](app/topics/page.tsx). Each hub is a single JSON config — the content engine (or a human) just drops in slug references; the rendering, SEO, sitemap inclusion, and validation are all handled here.

### Hub configuration

Each `content/topics/*.json` is one hub:

```jsonc
{
  "slug": "high-protein-snacks",
  "title": "High Protein Snacks",
  "description": "Used as the meta description and the lede paragraph.",
  "keywords": ["high protein snacks", "protein bars", ...],
  "intro": "Optional second paragraph of category context.",
  "featuredPostSlugs": ["..."],            // Hand-picked top picks
  "sections": [
    {
      "title": "Best Protein Bars",
      "description": "Optional explanation under the section heading.",
      "postSlugs": ["...", "..."]
    }
  ],
  "relatedTopicSlugs": ["protein-bars", "weight-loss-snacks"]
}
```

Required: `slug`, `title`, `description`. Everything else is optional. Hubs with no sections render a "growing collection" placeholder with related-topic suggestions.

### Adding a new hub

1. Drop a new `<slug>.json` into [content/topics/](content/topics/).
2. List the post slugs you want to feature.
3. `pnpm build` — the validator throws if any slug is invalid; clean build means it's live.

That's it. No code changes. The `/topics` index, sitemap, and JSON-LD all pick the hub up automatically.

### Validation

Run automatically at build time via [lib/topics.ts](lib/topics.ts) (loaded by the route + sitemap). Catches:

- Duplicate `slug` across configs
- Missing required fields (`title`, `description`)
- Slugs not in lowercase kebab-case
- `postSlugs` referencing non-existent blog posts
- `relatedTopicSlugs` referencing non-existent topics
- A topic listing itself as related

Failures throw with a clear message like:

```
Topic "bad-topic": references missing post slug "does-not-exist".
Either add the post, fix the slug, or remove the reference.
```

CI catches these because the build fails. No silent drift.

### Looking up a post's hubs

The `getTopicsForPost(postSlug)` helper in [lib/topics.ts](lib/topics.ts) returns every hub a post belongs to. Useful when adding a "this post is in:" badge on individual blog posts later — not wired into the post page yet, but the API's there.

### Two ways to attach a post to a hub

Both work, both are merged at build time, and a post can use either or both.

**1. JSON `postSlugs` (manual curation)**

Edit `content/topics/<hub>.json` and list the slug under a section's `postSlugs`. Use this for hand-picked featured posts or thoughtfully grouped sub-collections (e.g. "Kind Bars", "RXBAR" inside the Protein Bars hub). The section heading and ordering are explicit.

**2. Post frontmatter `topics:` (generator-friendly)**

Add the hub slug to the post's frontmatter:

```yaml
---
title: "Are New Brand Bars Healthy?"
description: "..."
date: "2026-05-15"
topics: ["protein-bars", "high-protein-snacks"]
---
```

The topic page automatically appends every post tagged this way under a "More in this topic" section, in newest-first order. **Posts already listed manually in a section are not duplicated** — manual placement always wins.

This is the path the content engine should use for new posts. Each post tags its own hubs at generation time; no manual JSON edits needed for routine additions.

**Validation**

The auditor's `topics.unknown-tag` check flags any `topics:` value that doesn't match a real hub config. Build doesn't fail (unknown tags are silently dropped from rendering), but the audit surfaces them so they're easy to clean up.

### Linking between posts (`<RelatedPosts>`)

Internal post-to-post links use a server component, not hardcoded markdown links. This way, when you rename a post's title, every "Related Comparisons" section that links to it picks up the new title automatically — no drift.

In MDX:

```mdx
## Related Comparisons

<RelatedPosts slugs="is-cheez-its-healthy-vs-pringles,is-gatorade-healthy-vs-coca-cola" />
```

`slugs` is a comma-separated string (not a JSX array — `next-mdx-remote/rsc` doesn't evaluate JSX expression attributes by default; string attributes are reliable). The component is registered as an MDX component in [app/blog/[slug]/page.tsx](app/blog/%5Bslug%5D/page.tsx) and lives in [components/blog/related-posts.tsx](components/blog/related-posts.tsx).

Unknown slugs are skipped silently at render time and surfaced loudly by the auditor's `links.missing-target` check.

### Suppressing false positives (`audit_ignore`)

Some checks are heuristic and over-fire on edge cases (a singular product whose name happens to contain a plural noun, etc.). Suppress per post by adding an `audit_ignore` list in frontmatter — each entry is a stable `check_id`:

```yaml
---
title: "Is Cheerios Protein Bar Healthy? (Cheerios Protein Bar vs Snickers)"
description: "..."
date: "2026-05-02"
audit_ignore: ["grammar.is-are-mismatch"]
---
```

The auditor counts suppressions in the summary so they're not invisible. To re-include them in a run for review, pass `--show-ignored`.

Available `check_id`s are listed in [`scripts/audit-blog/types.ts`](scripts/audit-blog/types.ts) (`CheckId` union). Adding a new check? Add it to that union too.

### Severity levels

- **blocker** — do not publish (placeholder text, missing required frontmatter, broken internal link, slug collision, factual contradiction).
- **high** — fix soon (empty section, multiple H1s, verdict contradicts data).
- **medium** — okay to publish, improve later (grammar nudges, duplicate headings, alternatives off, low word count).
- **low** — cosmetic.

The script exits non-zero if any **blocker** is found — handy for gating in CI before a publish step.

### Output

```
audit-output/
  audit-report.json   # full report: summary + every issue
  audit-report.csv    # one row per issue with the same fields
```

Both files share these columns:

`slug, title, status, severity, issue_category, issue, recommended_fix, human_review_needed`

`audit-output/` is gitignored.

### Usage

```sh
pnpm audit:blog                              # full audit (deterministic + LLM if key present)
pnpm audit:blog -- --no-llm                  # deterministic only
pnpm audit:blog -- --limit 5                 # first 5 posts (alphabetical)
pnpm audit:blog -- --slugs a,b,c             # specific slugs only
pnpm audit:blog -- --model claude-haiku-4-5  # cheaper LLM model
pnpm audit:blog -- --effort low              # cheaper thinking effort
pnpm audit:blog -- --out audit-output        # change output directory
pnpm audit:blog -- --show-ignored            # include suppressed issues in the report
```

### CI

[`.github/workflows/blog-audit.yml`](.github/workflows/blog-audit.yml) auto-runs the audit on any push to `main` or PR that touches `content/blog/**`, the auditor source, or the workflow itself. Deterministic-only by default — no API key needed in CI. The workflow:

- uploads the report (`audit-output/`) as a GitHub artifact (`blog-audit-report`)
- comments on PRs with a summary + the top 10 issues
- fails on **blocker**-severity issues (the script exits non-zero), so a problem post can't merge to `main`

To enable LLM checks in CI, set `ANTHROPIC_API_KEY` as a repository secret and dispatch the workflow manually with `run_llm: true` (Actions tab → Blog audit → Run workflow). Push/PR runs always stay deterministic to keep CI free.

### Layout

```
scripts/audit-blog/
  index.ts          # CLI entry, run loop, summary
  extract.ts        # parse frontmatter + body, derive H1, headings, foods, links
  deterministic.ts  # the rule-based checks
  llm.ts            # Claude API editorial review with prompt caching
  output.ts         # CSV/JSON writer + summary printer
  types.ts          # shared types
```

### Cost notes

Opus 4.7 with the cached system prompt is ~free for the system tokens after the first request — every subsequent post in the same run reads the cached prefix at ~10% of the input price. The variable cost per post is the body itself (a few thousand tokens) plus the structured output. For an audit of ~100 posts, expect single-digit dollars at Opus pricing or under a dollar with `--model claude-haiku-4-5`. Run `--limit 3` first to spot-check quality on your model of choice.

If `ANTHROPIC_API_KEY` is unset and `--no-llm` was not passed, the script prints a warning and runs deterministic-only.
