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
```

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
