---
name: fh:learnings
description: Analyze claude-mem observations to find workflow issues and auto-file GitHub issues for skill improvements.
user-invocable: true
---

Analyze recent claude-mem observations for workflow patterns, surface insights, and file GitHub issues for skill improvements.

$ARGUMENTS

Parse `$ARGUMENTS` for flags:
- `--days N` — override the default 14-day window with N days
- `--dry-run` — show what would be filed without creating any GitHub issues

---

## Section 1: Prerequisites Check

### 1a. Check claude-mem availability

Call `mcp__plugin_claude-mem_mcp-search__smart_search` with query `"test"` and limit 1.

- If the call succeeds: proceed.
- If the call fails or the tool is unavailable: stop and report:

  > claude-mem is not installed. Install it from the Claude Code marketplace to use /fh:learnings.

### 1b. Check GitHub CLI

```bash
gh auth status
```

- If the command fails or returns an unauthenticated state: stop and report:

  > GitHub CLI not authenticated. Run `gh auth login` first.

---

## Section 2: Collect Observations

Determine the date range. Default is 14 days ago. If `--days N` was passed, use N days ago instead. Compute `dateStart` as an ISO 8601 date string (e.g. `2026-03-13T00:00:00Z` for 14 days before today).

### 2a. Broad time-window fetch

Call `mcp__plugin_claude-mem_mcp-search__search` with:
- No query text (empty string — retrieves all observations in the window)
- `dateStart` = computed date above
- `limit` = 100
- No project filter (cross-project)

### 2b. Targeted semantic queries

Call `mcp__plugin_claude-mem_mcp-search__smart_search` three times in parallel:
1. query = `"error fail bug wrong broken"`, limit = 20
2. query = `"slow inefficient tokens expensive retry"`, limit = 20
3. query = `"workaround hack missing should"`, limit = 20

### 2c. Merge and deduplicate

Combine all results from 2a and 2b. Deduplicate by observation ID — keep each observation once. This is your **working set**.

---

## Section 3: Insights Dashboard

### 3a. What's working well (present first)

Call `mcp__plugin_claude-mem_mcp-search__smart_search` with:
- query = `"completed succeeded solved improved efficient"`
- limit = 20

Review results for productive patterns: skills that worked cleanly, efficient multi-step workflows, successful approaches, good tool choices.

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

## Section 4: File GitHub Issues

For each identified issue in the ranked list from Section 3c:

### 4a. Check for existing open issues

```bash
gh issue list --repo cinjoff/fhhs-skills --state open --search "{summary keywords}" --limit 5
```

- If a matching open issue exists: skip this issue. Note: "Already tracked in #N"
- If no match: proceed to create.

### 4b. Prepare issue body

Read the issue template from `.claude/skills/learnings/references/issue-template.md`.

Fill in the placeholders:
- `{{TITLE}}` — concise issue title
- `{{TYPE}}` — one of: `skill-bug`, `workflow-gap`, `feature-idea`, `common-mistake`
- `{{SUMMARY}}` — 1–2 sentence description of the issue
- `{{OBSERVATIONS}}` — bullet list of the raw observation snippets that evidence this issue (quote key phrases)
- `{{IMPACT}}` — brief statement of user impact
- `{{SUGGESTION}}` — what the skill could do differently to address this

### 4c. Create the issue

```bash
gh issue create \
  --repo cinjoff/fhhs-skills \
  --title "{title}" \
  --body "{filled template}" \
  --label "learnings,{type}"
```

Replace `{type}` with the issue classification (e.g. `skill-bug`, `workflow-gap`, `feature-idea`, `common-mistake`).

### 4d. Report results

After processing all issues:

> Created N issues, skipped M (already tracked).

List each created issue with its URL and each skipped issue with its existing issue number.

If `--dry-run` was passed: do NOT call `gh issue create`. Instead, print each issue that would be created with its title, type, and evidence count. Report: "Dry run complete — N issues would be filed, M already tracked."

---

## Section 5: Offer Extended Scope

After completing Section 4, present:

> Analyzed last {N} days. Want to look further back? Reply with `30`, `60`, or `90` to extend the window.

If the user responds with a number:
- Set `dateStart` to that many days ago
- Collect observations from Section 2 again, but **exclude observation IDs already processed** in the current session
- Run Sections 3 and 4 on the new observations only
- Report: "Extended to {N} days. Found X additional observations."
