---
name: fh:learnings
description: Analyze claude-mem observations to surface project improvement insights and, for plugin maintainers, auto-file GitHub issues for skill improvements.
user-invocable: true
---

Analyze recent claude-mem observations for workflow patterns, surface insights, and file GitHub issues for skill improvements.

$ARGUMENTS

Parse `$ARGUMENTS` for flags:
- `--days N` — override the default 14-day window with N days
- `--dry-run` — show what would be filed without creating any GitHub issues
- `--update-claude-md` — run only Section 4.5 (CLAUDE.md maintenance); skip GitHub issues / plan-from-insights

---

## Section 1: Prerequisites Check

### 1a. Check claude-mem availability

Call `mcp__plugin_claude-mem_mcp-search__search` with query `"test"` and limit 1.

- If the call succeeds: proceed.
- If the call fails or the tool is unavailable: stop and report:

  > claude-mem is not installed. Install it from the Claude Code marketplace to use /fh:learnings.

### 1b. Check GitHub CLI (conditional)

Detect project identity first:

```bash
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if echo "$REMOTE_URL" | grep -q "cinjoff/fhhs-skills"; then
  echo "IS_FHHS_SKILLS=true"
else
  echo "IS_FHHS_SKILLS=false"
fi
```

Set `IS_FHHS_SKILLS=true` if REMOTE_URL contains `cinjoff/fhhs-skills`, else `IS_FHHS_SKILLS=false`. Hold this value for use in Sections 4 and beyond.

**Only if IS_FHHS_SKILLS is true**, check GitHub CLI authentication:

```bash
gh auth status
```

- If the command fails or returns an unauthenticated state: stop and report:

  > GitHub CLI not authenticated. Run `gh auth login` first.

If IS_FHHS_SKILLS is false, skip this check — GitHub CLI is not needed for the insights + plan-work flow.

### 1c. Project identity confirmed

Hold `IS_FHHS_SKILLS` for later sections. Proceed to Section 2.

---

## Section 2: Collect Observations

Determine the date range. Default is 14 days ago. If `--days N` was passed, use N days ago instead. Compute `dateStart` as an ISO 8601 date string (e.g. `2026-03-13T00:00:00Z` for 14 days before today).

### 2a. Broad time-window fetch

Derive project name from `.planning/PROJECT.md` name field (fall back to basename of cwd). Use this as the `project` parameter for all claude-mem calls.

Call `mcp__plugin_claude-mem_mcp-search__search` with:
- No query text (empty string — retrieves all observations in the window)
- `dateStart` = computed date above
- `limit` = 100
- `project` = <project-name>

### 2b. Targeted semantic queries

Call `mcp__plugin_claude-mem_mcp-search__search` three times in parallel:
1. query = `"error fail bug wrong broken"`, project = <project-name>, limit = 20
2. query = `"slow inefficient tokens expensive retry"`, project = <project-name>, limit = 20
3. query = `"workaround hack missing should"`, project = <project-name>, limit = 20

### 2c. Drill down for full details

From 2a and 2b results, collect all unique observation IDs. Deduplicate by observation ID — keep each observation once.

For observations that appear most relevant (prioritize types: gotcha, decision, trade-off), call `mcp__plugin_claude-mem_mcp-search__get_observations` with ids=[...] in batches of up to 20 IDs to fetch full observation details. This replaces the lightweight index with rich detail needed for accurate classification in Sections 3 and 3.5.

If temporal context would help understand patterns (e.g., a cluster of errors around a specific date), call `mcp__plugin_claude-mem_mcp-search__timeline` with query=the relevant topic, depth_before=3.

The fully-resolved observations are your **working set**.

---

## Section 3: Insights Dashboard

### 3a. What's working well (present first)

Call `mcp__plugin_claude-mem_mcp-search__search` with:
- query = `"completed succeeded solved improved efficient"`
- project = <project-name>
- limit = 20

From the returned index, identify the top 5 relevant observation IDs and call `mcp__plugin_claude-mem_mcp-search__get_observations` with ids=[...] to fetch full details. Review for productive patterns: skills that worked cleanly, efficient multi-step workflows, successful approaches, good tool choices.

Present as:

**What's working well:**
- [3–5 bullet points describing productive patterns observed]

Examples of the kind of insight to surface:
- "plan-work → build pipeline completed 3 phases cleanly across 2 sessions"
- "TDD workflow caught 2 bugs before they shipped"
- "/fh:review caught an architecture issue during planning"

If no positive signal is found, skip this section.

### 3b. Usage stats summary

From the working set:
- Count observations by type: `decision`, `bugfix`, `feature`, `refactor`, `discovery`, `change`
- List the distinct projects that had activity in this window

Present as a compact summary table:

| Type | Count |
|------|-------|
| decision | N |
| bugfix | N |
| ... | ... |

**Active projects:** [list]

Then add this note:

> For full session history and deep exploration, open the **claude-mem dashboard**: run `claude-mem dashboard` or visit the claude-mem web UI.

### 3c. Issues & improvements

Classify each observation (or cluster of related observations) into one of:
- `skill-bug` — A skill produced wrong output or failed
- `workflow-gap` — Missing capability or a painful workflow step
- `feature-idea` — Suggestion for improvement based on usage patterns
- `common-mistake` — Users repeatedly hit the same issue; a skill could prevent it

**Clustering rule:** Group observations that share the same root cause into one issue. A cluster requires at minimum 2 similar observations to constitute a pattern. Single isolated observations may still be filed if they are `skill-bug` severity.

Rank by:
1. Frequency (more observations = higher priority)
2. Severity: `skill-bug` > `workflow-gap` > `common-mistake` > `feature-idea`

Present a summary table:

| # | Type | Summary | Observations | Severity |
|---|------|---------|-------------|----------|
| 1 | skill-bug | [one-line description] | N | high |
| 2 | workflow-gap | ... | N | medium |
| ... | | | | |

---

## Section 3.5: Project Insights

Classify observations from the **working set** (Section 2c) by keyword matching. Do NOT make any new claude-mem API calls — use only observations already collected.

For each observation in the working set, check its text against these keyword categories:

| Category | Keywords |
|----------|----------|
| architecture | architecture, decision, component, structure, pattern, design, boundary, coupling |
| testing | test, coverage, bug, regression, broken, fix, failing, flaky |
| workflow | slow, blocked, stuck, retry, workaround, timeout, token, expensive |
| tech-debt | debt, cleanup, refactor, duplication, hack, temporary, todo, fixme |
| scope | scope, creep, large, split, took long, estimate, phase, overran |

An observation matches a category if any of its keywords appear in the observation text (case-insensitive). An observation may match multiple categories.

**For each category with 2 or more matching observations**, produce an insight:

Present a summary table first:

| Category | Observations | Date Range | Pattern |
|----------|-------------|------------|---------|
| [category] | N | [earliest] – [latest] | [one-line summary of the pattern] |

Then for each qualifying category, provide a detailed recommendation block:

**[Category] (N observations)**

- **What we observed:** [Describe the recurring pattern in 1–2 sentences]
- **Why this matters:** [Impact on productivity, quality, or reliability]
- **Suggested action:** [Specific, concrete action — not vague. E.g. "Add a pre-flight check in /fh:build that detects X before running Y" rather than "Improve the build skill"]
- **Priority:** high / medium / low

If fewer than 2 observations match any category, output:

> No strong patterns detected in the last {N} days.

### Codebase Mapping Drift Check

If `.planning/codebase/` exists:
1. Count observations from the working set matching architecture/convention drift keywords: `architecture`, `convention`, `structure`, `pattern`, `boundary`, `coupling`, `design`, `changed`, `refactor`, `moved`, `renamed`.
2. If 3+ drift signals detected:
   Add to insights dashboard:
   "📐 Codebase mapping drift detected — {N} convention/architecture changes since last mapping. Recommend `/fh:map-codebase --refresh-stale`"

---

## Section 3.6: User Workflow Coaching

Analyze observations for patterns that suggest workflow improvements the user could make.

Do NOT make any new claude-mem API calls — use only observations already collected in the working set.

**Pattern categories to detect:**

1. **Repeated context loss**: User re-explains the same thing across sessions → suggest saving to CLAUDE.md or claude-mem
2. **Manual steps that could be automated**: User runs the same sequence of commands repeatedly → suggest creating a skill or alias
3. **Suboptimal tool usage**: Using Read when smart_outline would suffice, reading full files when smart_unfold targets one function → suggest tool efficiency improvements
4. **Planning gaps**: Jumping to implementation without planning, or plans that miss edge cases → suggest using /fh:plan-work or /fh:plan-review
5. **Testing anti-patterns**: Skipping tests, writing tests after implementation, mocking too much → suggest TDD workflow
6. **Context window waste**: Loading unnecessary files, not using progressive disclosure → suggest context-mode or claude-mem patterns

For each pattern category, scan the working set for keyword signals:

| Pattern | Keywords |
|---------|----------|
| Repeated context loss | re-explained, forgot, context, repeated, same issue, again |
| Manual steps | manual, sequence, same commands, repeat, every time |
| Suboptimal tool usage | read full file, loaded, unnecessary, token, expensive |
| Planning gaps | jumped to, skipped planning, missed, edge case, no plan |
| Testing anti-patterns | skip test, wrote tests after, no tests, mocked, brittle |
| Context window waste | loaded unnecessary, full file, context full, window |

A pattern qualifies if **2 or more** observations match. Show **at most 3** workflow insights per run, prioritized by frequency (most repeated first).

If qualifying patterns are found, present:

```
## 🎓 Workflow Insights

Based on your recent sessions, here are opportunities to work more effectively:

### [Category]
**What I noticed:** [specific observation from claude-mem data]
**Suggestion:** [actionable improvement]
**Why it helps:** [brief benefit explanation]
```

Frame these as opportunities, not mistakes — helpful mentor tone, not critic.

If no patterns qualify (fewer than 2 matching observations per category), skip this section silently.

---

## Section 4: File GitHub Issues (or Plan from Insights)

### If IS_FHHS_SKILLS is true

For each identified issue in the ranked list from Section 3c:

#### 4a. Check for existing open issues

```bash
gh issue list --repo cinjoff/fhhs-skills --state open --search "{summary keywords}" --limit 5
```

- If a matching open issue exists: skip this issue. Note: "Already tracked in #N"
- If no match: proceed to confirmation.

#### 4b. Prepare issue body

Read the issue template from `.claude/skills/learnings/references/issue-template.md`.

Fill in the placeholders:
- `{{TITLE}}` — concise issue title
- `{{TYPE}}` — one of: `skill-bug`, `workflow-gap`, `feature-idea`, `common-mistake`
- `{{SUMMARY}}` — 1–2 sentence description of the issue
- `{{OBSERVATIONS}}` — bullet list of the raw observation snippets that evidence this issue (quote key phrases)
- `{{IMPACT}}` — brief statement of user impact
- `{{SUGGESTION}}` — what the skill could do differently to address this

#### 4c. Confirm before filing

**Never auto-file issues.** Present all identified issues (not yet skipped as duplicates) together in a single confirmation block, then wait for user input before filing any:

> **Skill Issues to File** (N identified, M already tracked)
>
> For each issue, show:
> - **Issue title**: [concise summary]
> - **Affected skill**: which /fh: skill
> - **Evidence**: [N observations — key phrases quoted]
> - **Proposed fix**: [what the issue would suggest]
>
> Reply with a space-separated list of numbers to approve (e.g. `1 3`), `all` to file everything, or `none` to skip all.
> Add `edit N` to modify issue N's title/description before filing (e.g. `1 3 edit 2`).

Wait for the user's reply before proceeding.

- **`all`**: file all issues as shown
- **`none`**: skip all issues; proceed to next section
- **Numbered list** (e.g. `1 3`): file only the listed issues
- **`edit N`** (in combination with approvals): prompt the user to modify issue N's title and body before filing

#### 4d. Create approved issues

For each approved issue (and after any `edit` modifications are applied):

```bash
gh issue create \
  --repo cinjoff/fhhs-skills \
  --title "{title}" \
  --body "{filled template}" \
  --label "learnings,{type}"
```

Replace `{type}` with the issue classification (e.g. `skill-bug`, `workflow-gap`, `feature-idea`, `common-mistake`).

#### 4e. Report results

After processing all issues:

> Created N issues, skipped M (already tracked), skipped K (user declined).

List each created issue with its URL and each skipped issue with its reason (already tracked or user declined).

If `--dry-run` was passed: do NOT call `gh issue create` and do NOT ask for confirmation. Instead, print each issue that would be created with its title, type, and evidence count. Report: "Dry run complete — N issues would be filed, M already tracked."

---

### If IS_FHHS_SKILLS is false

#### Section 4: Plan from Insights

Check whether GSD planning is active in this project:

```bash
[ -f .planning/PROJECT.md ] && echo "GSD" || echo "NO_GSD"
```

**If GSD exists:**

Present the top 3 insights from Section 3.5 (highest observation count, then highest priority). Then offer:

> Reply `plan` to create a /fh:plan-work from the top findings, or `skip` to finish.

If the user replies `plan`:
1. Collect the top 3 insights from Section 3.5 (by observation count).
2. Format a plan-work prompt grouped by category. For each insight include: the category, the observed pattern, and the suggested action as a concrete work item.
3. Confirm with the user: "Ready to invoke /fh:plan-work with these findings. Confirm?"
4. On confirmation, invoke `/fh:plan-work` with the formatted prompt.

If the user replies `skip`: proceed to Section 5.

**If NO GSD:**

Present a structured improvement brief:

> **Project Improvement Brief**
>
> Top 3 insights from the last {N} days:
>
> 1. **[Category]** — [Pattern summary] → [Suggested action]
> 2. **[Category]** — [Pattern summary] → [Suggested action]
> 3. **[Category]** — [Pattern summary] → [Suggested action]
>
> To turn these into a tracked plan, run `/fh:new-project` first to initialize GSD planning, then re-run `/fh:learnings`.

---

## Section 4.5: CLAUDE.md Maintenance

> **Skip condition:** If claude-mem is unavailable (Section 1a check failed), skip this section silently and proceed to Section 5.
> **Standalone mode:** If `--update-claude-md` was passed, run Sections 1a, 2, 3.5, and this section only — then stop (skip Sections 4 and 5).

### 4.5a. Check for CLAUDE.md

```bash
[ -f CLAUDE.md ] && echo "EXISTS" || echo "MISSING"
```

If `MISSING`: output a single line — "No CLAUDE.md found in project root — skipping CLAUDE.md maintenance." — then proceed to Section 5.

### 4.5b. Read relevant CLAUDE.md sections

Read `CLAUDE.md`. Focus on these sections (they are the canonical targets for new entries):
- `## Gotchas` (or similar heading)
- `## Key Constraints`
- `## Code Style`

Hold the current content of these sections as `CURRENT_CLAUDE_MD`.

### 4.5c. Identify CLAUDE.md-worthy patterns

From the observations already classified in Section 3.5, apply the following filter — do NOT make any new claude-mem API calls:

A pattern qualifies for CLAUDE.md if it meets **at least one** of these criteria:

| Criterion | Threshold | Target section |
|-----------|-----------|----------------|
| Recurring gotcha | 3+ observations matching the same mistake pattern | `## Gotchas` |
| Convention violation | Any pattern showing a convention was missed or misapplied | `## Code Style` |
| Constraint discovery | A thing that broke with a repeatable, preventable lesson | `## Key Constraints` |

**Lean rule (from claude-mem-rules.md):** Only surface conventions, gotchas, and hard constraints. Exclude:
- Session-specific details (dates, PR numbers, one-off fixes)
- Implementation specifics (exact function names, internal IDs)
- Items that are obvious from the code itself

### 4.5d. Deduplicate against existing CLAUDE.md

For each candidate, perform a fuzzy keyword match against `CURRENT_CLAUDE_MD`:
- Extract 2–3 key terms from the candidate (e.g. `str.replace`, `$&`, `dynamic content`)
- If all key terms appear within the same paragraph of `CURRENT_CLAUDE_MD`: mark candidate as **duplicate** and skip it
- If at least one key term is absent: mark as **new**

### 4.5e. Present proposed additions

If one or more new candidates remain after deduplication, present:

> **Suggested CLAUDE.md updates:**
> - **[Gotchas | Key Constraints | Code Style]:** [one-sentence description of the gotcha/constraint/convention]
> - ...

Include a confidence indicator for each:
- `(high)` — 3+ observations, clear pattern
- `(medium)` — 2 observations, inferred pattern
- `(low)` — 1 strong observation, worth noting

Then ask:

> Approve additions? Reply `yes` to write all, `skip` to discard, or list the numbers to approve selectively (e.g. `1 3`).

If no new candidates remain after deduplication:

> CLAUDE.md is up to date — no new patterns detected.

Proceed to Section 5 (or stop if `--update-claude-md` was passed).

### 4.5f. Write approved additions

Wait for user reply before writing anything.

On `yes` (all approved): append each addition to the appropriate section in CLAUDE.md. If the target section does not exist, create it at the end of the file.

On selective approval (e.g. `1 3`): write only the numbered candidates.

On `skip`: discard all candidates without editing CLAUDE.md.

Format for each appended entry:
```
- [one-sentence description] *(learnings: YYYY-MM-DD)*
```

Use today's date for the `YYYY-MM-DD` suffix so entries are traceable.

---

## Section 5: Offer Extended Scope

After completing Section 4, present:

> Analyzed last {N} days. Want to look further back? Reply with `30`, `60`, or `90` to extend the window. You can also run `/fh:learnings` after your next phase to track how patterns evolve over time.

If the user responds with a number:
- Set `dateStart` to that many days ago
- Collect observations from Section 2 again, but **exclude observation IDs already processed** in the current session
- Run Sections 3, 3.5, and 4 on the new observations only
- Report: "Extended to {N} days. Found X additional observations."

### Record analysis timestamp

After completing the full analysis (whether or not the user extends the window), update `~/.claude/cache/learnings-digest.json`:
- Set `last_full_analysis` to the current ISO timestamp (e.g. `2026-03-31T14:00:00Z`)
- If the file does not exist yet, create it with `{ "last_full_analysis": "<timestamp>", "pending": [] }`
- This field is read by the `fhhs-learnings.js` SessionStart hook to prevent over-recommending full analyses

The digest schema supports these fields:
- `last_full_analysis` — ISO timestamp of the most recent `/fh:learnings` run
- `last_digest_update` — ISO timestamp of the most recent digest cache refresh
- `pending` — array of unaddressed improvement items surfaced by past analyses
