---
name: fh:learnings
description: Analyze claude-mem observations to surface project improvement insights and, for plugin maintainers, auto-file GitHub issues for skill improvements.
user-invocable: true
---

Analyze recent claude-mem observations, surface insights, update CLAUDE.md, and file GitHub issues.

$ARGUMENTS

Parse `$ARGUMENTS` for flags:
- `--days N` — override the default 14-day window with N days
- `--dry-run` — show what would be filed without creating any GitHub issues
- `--plan` — after analysis, create a `/fh:plan-work` from accumulated GitHub issues

---

## Step 1: Prerequisites

### 1a. Check claude-mem availability

Call `mcp__plugin_claude-mem_mcp-search__search` with query `"test"` and limit 1.

- If the call succeeds: proceed.
- If the call fails or the tool is unavailable: stop and report:

  > claude-mem is not installed. Install it from the Claude Code marketplace to use /fh:learnings.

### 1b. Detect project identity

```bash
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if echo "$REMOTE_URL" | grep -q "cinjoff/fhhs-skills"; then
  echo "IS_FHHS_SKILLS=true"
else
  echo "IS_FHHS_SKILLS=false"
fi
```

Hold `IS_FHHS_SKILLS` for Step 4.

**Only if IS_FHHS_SKILLS is true**, check GitHub CLI authentication:

```bash
gh auth status
```

- If the command fails: stop and report: "GitHub CLI not authenticated. Run `gh auth login` first."

---

## Step 2: Collect Observations

Determine the date range. Default is 14 days ago. If `--days N` was passed, use N days ago instead.

Derive project name from `.planning/PROJECT.md` name field (fall back to basename of cwd).

### 2a. Broad time-window fetch

Call `mcp__plugin_claude-mem_mcp-search__search` with:
- No query text (empty string)
- `dateStart` = computed date
- `limit` = 100
- `project` = <project-name>

### 2b. Targeted semantic queries

Call these three in parallel:
1. query = `"error fail bug wrong broken"`, project, limit = 20
2. query = `"slow inefficient tokens expensive retry"`, project, limit = 20
3. query = `"workaround hack missing should"`, project, limit = 20

### 2c. Drill down for details

Collect unique observation IDs from 2a and 2b. For the most relevant ones (prioritize types: gotcha, decision, trade-off), call `get_observations` in batches of 20.

If temporal context helps, call `timeline` with the relevant topic.

The fully-resolved observations are your **working set**.

---

## Step 3: Analysis Dashboard

### 3a. What's working well

Call `search` with query = `"completed succeeded solved improved efficient"`, project, limit = 20.

Fetch top 5 relevant IDs via `get_observations`. Surface productive patterns:

**What's working well:**
- [3-5 bullet points]

Skip if no positive signal found.

### 3b. Usage stats

From the working set, count observations by type and list active projects:

| Type | Count |
|------|-------|
| decision | N |
| bugfix | N |
| ... | ... |

### 3c. Issues & improvements

Classify observations into: `skill-bug`, `workflow-gap`, `feature-idea`, `common-mistake`.

**Clustering rule:** Group observations sharing the same root cause. A cluster needs 2+ similar observations. Single `skill-bug` severity items may stand alone.

Rank by frequency then severity (`skill-bug` > `workflow-gap` > `common-mistake` > `feature-idea`).

| # | Type | Summary | Observations | Severity |
|---|------|---------|-------------|----------|
| 1 | skill-bug | [description] | N | high |
| ... | | | | |

### 3d. Project insights

From the working set (no new API calls), check observation text against:

| Category | Keywords |
|----------|----------|
| architecture | architecture, decision, component, structure, pattern, design, boundary, coupling |
| testing | test, coverage, bug, regression, broken, fix, failing, flaky |
| workflow | slow, blocked, stuck, retry, workaround, timeout, token, expensive |
| tech-debt | debt, cleanup, refactor, duplication, hack, temporary, todo, fixme |
| scope | scope, creep, large, split, took long, estimate, phase, overran |

For each category with 2+ matching observations:

**[Category] (N observations)**
- **What we observed:** [1-2 sentences]
- **Suggested action:** [Specific, concrete]
- **Priority:** high / medium / low

If no category qualifies: "No strong patterns detected in the last {N} days."

---

## Step 4: Actions

### If IS_FHHS_SKILLS is true: File GitHub Issues

For each issue from 3c:

#### 4a. Check for duplicates

```bash
gh issue list --repo cinjoff/fhhs-skills --state open --search "{summary keywords}" --limit 5
```

If a matching issue exists: skip. Note: "Already tracked in #N"

#### 4b. Prepare issue body

Read `skills/learnings/references/issue-template.md`. Fill in: `{{TITLE}}`, `{{TYPE}}`, `{{SUMMARY}}`, `{{OBSERVATIONS}}`, `{{IMPACT}}`, `{{SUGGESTION}}`.

#### 4c. Confirm before filing

**Never auto-file issues.** Present all issues together:

> **Skill Issues to File** (N identified, M already tracked)
>
> For each: title, affected skill, evidence (N observations, key phrases quoted), proposed fix.
>
> Reply with numbers to approve (e.g. `1 3`), `all`, or `none`. Add `edit N` to modify before filing.

Wait for user reply.

#### 4d. Create approved issues

```bash
gh issue create \
  --repo cinjoff/fhhs-skills \
  --title "{title}" \
  --body "{filled template}" \
  --label "learnings,{type}"
```

Report: "Created N issues, skipped M (already tracked), skipped K (user declined)."

If `--dry-run`: skip filing, just show what would be created.

### If IS_FHHS_SKILLS is false: Suggest Plan

Check for GSD: `[ -f .planning/PROJECT.md ] && echo "GSD" || echo "NO_GSD"`

**If GSD:** Present top 3 insights from 3d, then:

> Reply `plan` to create a /fh:plan-work from the top findings, or `skip` to finish.

On `plan`: format insights as plan-work input and invoke `/fh:plan-work`.

**If NO GSD:** Present a structured improvement brief and suggest `/fh:new-project`.

---

## Step 5: CLAUDE.md Maintenance

### 5a. Check for CLAUDE.md

If missing: "No CLAUDE.md found — skipping." Proceed to Step 6.

### 5b. Read CLAUDE.md

Focus on: `## Gotchas`, `## Key Constraints`, `## Code Style`.

### 5c. Identify CLAUDE.md-worthy patterns

From observations already classified in 3d (no new API calls):

| Criterion | Threshold | Target section |
|-----------|-----------|----------------|
| Recurring gotcha | 3+ observations matching same mistake | `## Gotchas` |
| Convention violation | Any convention missed or misapplied | `## Code Style` |
| Constraint discovery | Broke with a repeatable, preventable lesson | `## Key Constraints` |

**Lean rule:** Only conventions, gotchas, and hard constraints. Exclude session-specific details, implementation specifics, and things obvious from the code.

### 5d. Deduplicate

For each candidate, extract 2-3 key terms. If all key terms appear in the same CLAUDE.md paragraph: duplicate, skip. Otherwise: new.

### 5e. Present and confirm

> **Suggested CLAUDE.md updates:**
> - **[Section]:** [description] *(high/medium/low confidence)*

> Approve? `yes` / `skip` / or list numbers (e.g. `1 3`).

### 5f. Write approved additions

Append to appropriate section:
```
- [description] *(learnings: YYYY-MM-DD)*
```

---

## Step 6: Record Timestamp & Offer More

### 6a. Write timestamp

```bash
mkdir -p .planning
date -u +"%Y-%m-%dT%H:%M:%SZ" > .planning/.learnings-last-run
```

This timestamp is read by the `fhhs-learnings.js` SessionStart hook to nudge users when it's been too long since the last run.

### 6b. Accumulated issues check (IS_FHHS_SKILLS only)

```bash
gh issue list --repo cinjoff/fhhs-skills --label learnings --state open --json number --jq length
```

If 5+ open learnings issues:

> You have {N} accumulated learnings issues. Run `/fh:learnings --plan` to create a plan that addresses them, or review them at: `gh issue list --repo cinjoff/fhhs-skills --label learnings --state open`

### 6c. Offer extended window

> Analyzed last {N} days. Reply with `30`, `60`, or `90` to extend the window.

If the user extends: re-run Steps 2-4 with new date range, excluding already-processed observation IDs.

### 6d. --plan flag handling

If `--plan` was passed (or user replied `plan`):

```bash
gh issue list --repo cinjoff/fhhs-skills --label learnings --state open --json title,body,number --limit 20
```

Collect issue titles and bodies. Group by label (skill-bug, workflow-gap, feature-idea, common-mistake). Format as a plan-work prompt:

> Address {N} accumulated learnings issues:
> 1. [skill-bug] #{number}: {title} — {one-line summary}
> 2. [workflow-gap] #{number}: {title} — {one-line summary}
> ...

Invoke `/fh:plan-work` with this prompt.
