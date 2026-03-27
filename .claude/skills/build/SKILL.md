---
name: fh:build
description: Execute a plan — turns your PLAN.md into working code with tests and quality checks.
user-invocable: true
---

Execute an existing plan. Delegates task execution to subagents for optimal context usage.

What to build or which plan to execute: $ARGUMENTS

You are a **lean orchestrator**. Stay under 15% context usage. Delegate all heavy work to subagents.

> **Dependency check:** Verify `.planning/PROJECT.md` exists (required — if missing, tell user to run `/fh:new-project` first).

> **Execution pipeline:**
> Task execution: **`general-purpose`** subagents with `model: "sonnet"` using `references/implementer-prompt.md`. Fresh context per task.
> Subagents write code but do NOT commit. Orchestrator makes one commit per plan after all waves complete.
> Do not use `gsd-executor` or `gsd-planner` — their state management conflicts with this orchestrator.

> **GSD project context:**
> Read `STATE.md` and `ROADMAP.md` for current position. All state updates use `gsd-tools.cjs`.

---

## Step 0.5: Codebase Freshness Check

If `.planning/codebase/.last-mapped` exists:
```bash
MAPPED_SHA=$(cat .planning/codebase/.last-mapped 2>/dev/null)
if [ -n "$MAPPED_SHA" ]; then
  CHANGED=$(git diff --stat "$MAPPED_SHA" HEAD -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.py' '*.go' '*.rs' 2>/dev/null | tail -1)
  [ -n "$CHANGED" ] && echo "STALE: $CHANGED" || echo "FRESH"
fi
```
If STALE, warn: "Codebase mapping is outdated ($CHANGED). Consider `/fh:map-codebase` for fresh context."
If `.planning/codebase/` doesn't exist, skip silently.
Advisory only — never block.

---

## Step 1: Find the Plan

Locate the plan to execute:
- If the user specified a plan path, use that
- If a GSD project is active, check `.planning/phases/` for incomplete plans (PLAN without matching SUMMARY)
- If plans exist in `.planning/plans/`, use the most recent
- If no plan exists, tell the user to run `/fh:plan-work` first

Read only the plan frontmatter and task list — don't load all context files yet.

**Resume detection:** If multiple plans exist with partial SUMMARY.md coverage, report: "Found N plans, M already completed. Continuing from plan X." Skip completed plans.

**Previous phase check (GSD only):** If a previous SUMMARY exists, scan for unresolved "Issues Encountered". If found, ask user: "Previous plan had unresolved issues — proceed anyway, address first, or review?"

---

## Step 2: Analyze Waves

Group tasks by their `wave` number (or dependency order if no waves specified):
- Wave 1: tasks with no dependencies (can run in parallel)
- Wave 2+: tasks that depend on earlier waves

Test tasks marked `wave: same` as their implementation task run in the same wave when they test independent interfaces.

Report the execution plan to the user: "N tasks in M waves. Wave 1 has X parallel tasks."

```bash
PLAN_START_EPOCH=$(date +%s)
WAVE_START_SHA=$(git rev-parse HEAD)
AUTO_MODE=$(node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs config-get workflow.auto_advance 2>/dev/null || echo "false")
```

If `AUTO_MODE` is `"true"` AND `.planning/DECISIONS.md` exists, include the last 10 entries for this phase as `{DECISIONS_CONTEXT}`. Otherwise empty string.

### Pre-Index Source Files

If ctx_batch_execute is available, index all source files listed in the plan's `files_modified` frontmatter field. These are the files agents will need to read for context.

```
ctx_batch_execute([
  // For each file in files_modified:
  { label: "{filename}", cmd: "cat {filepath}" },
  // Also index the PLAN.md itself and CONTEXT.md
  { label: "PLAN", cmd: "cat {planPath}" },
  { label: "CONTEXT", cmd: "cat .planning/phases/{phase}/{phase}-CONTEXT.md" },
], queries: [
  "existing patterns in modified files",
  "locked decisions for this phase",
  "plan tasks and requirements"
])
```

If the Phase Context Bootstrap ran in a prior step (plan-work or plan-review), the stable docs (ARCHITECTURE, CONVENTIONS, etc.) are already in the index. Only source files and mutable planning docs need fresh indexing.

If ctx_batch_execute is not available, skip silently.

---

## Step 3: Execute Waves

For each wave, dispatch **one subagent per task** using the Agent tool with **`subagent_type: "general-purpose"`** and **`model: "sonnet"`**.

**Task tracking (optional):** On first dispatch, try `TaskCreate` for the task. If it works, update status on dispatch (`in_progress`) and completion (`completed`). If TaskCreate fails, skip all tracking silently.

### Subagent prompt

Use the structured template at `references/implementer-prompt.md`. Fill its placeholders:

- `{TASK_TEXT}` — Full task content (files, action, verify, done). Copy the text, don't reference the plan file.
- `{CLAUDE_MD_SECTIONS}` — Relevant sections from CLAUDE.md for this task type (UI work → CONVENTIONS.md + DESIGN.md; new files → STRUCTURE.md; API work → ARCHITECTURE.md; tests → TESTING.md). **Always populate** — agents with ctx_search may skip it, agents without rely on it.
- `{DESIGN_DECISIONS}` — If `.planning/phases/{phase}/{phase}-CONTEXT.md` exists, include the "Decisions", "Discretion Areas", and "Deferred Ideas" sections. **Always populate** — agents with ctx_search may prefer the index, but agents without plugins need this content injected.
- `{PHASE_DIR}` — Path to `.planning/phases/{phase}/` for deferred items logging.
- `{PHASE_NAME}` — Phase directory name for ctx_search queries (e.g. "13-pending-payments-invoicing").
- `{FILE_TYPES}` — Comma-separated file type descriptions for convention queries (e.g. "tsx components", "test files").
- `{TASK_NAME}` — Task identifier for deferred items format.
- `{TASK_ID}` — Native task ID if tracking is active. Empty string otherwise.

### Context-Mode Acceleration

Before reading CONTEXT.md and DECISIONS.md files directly, check if ctx_search is available:
- If available: use `ctx_search` with queries like "locked decisions for phase {phase}" and "decisions affecting {files}" to retrieve relevant entries. This is faster and consumes less context than reading full files.
- If not available: fall back to the existing pattern of reading the files directly.

The ctx_search results replace the file reads — they provide the same information in a more compact, relevance-ranked format.

The template tells subagents to self-discover relevant skill context (Playwright, Next.js, frontend design) by reading skill files when their task involves those domains. No orchestrator pre-processing needed.

### Checkpoint protocol

If a task has `type="checkpoint:*"`, handle inline:

- `checkpoint:human-verify` — Show the subagent's output (screenshot/command output), await user approval. In auto-mode: auto-approve (confidence=MEDIUM).
- `checkpoint:decision` — Present options with pros/cons, await user choice. In auto-mode: auto-select first option (confidence=MEDIUM).
- `checkpoint:human-action` — Describe the manual step needed, await confirmation. In auto-mode: STOP (auth gates cannot be automated).

When auto-approving checkpoints, log as a decision in `.planning/DECISIONS.md` with `confidence=MEDIUM`, `step='build checkpoint'`. Follow format from `references/decisions-template.md`.

### After each wave completes

### Post-Wave Re-Index

If ctx_batch_execute is available, re-index files that were modified by agents in the completed wave. Parse each agent's report for "Files Changed" and re-index:

```
ctx_batch_execute([
  // For each file in agent reports' "Files Changed":
  { label: "{filename}-v{wave}", cmd: "cat {filepath}" },
], queries: ["updated implementation"])
```

This ensures the next wave sees fresh content when using ctx_search. Skip silently if ctx_batch_execute is not available.

Triage subagent outcomes:

**BLOCKED:** Surface immediately:
```
⚠ Task "{task}" is BLOCKED: {blocker}
Options:
  A) Fix the blocker and retry
  B) Skip and defer
  C) Adjust the plan
```
Do not proceed to the next wave until resolved or skipped.

**Interrupted/stuck:** Re-dispatch with revised prompt or clarify with user.

**Silent failure (no files changed):** Treat as BLOCKED.

Once all tasks are accounted for:
1. **Spot-check:** verify key files from subagent reports exist on disk (`[ -f path ]`)
2. **Done criteria check:** compare each task's `done` criteria against subagent output — flag mismatches
3. **Report** results to user

---

## Step 4: Commit + Verify + SUMMARY

### Single commit

After all waves complete, stage all changed files and make **one commit** for the entire plan:

```
{type}({phase}-{plan}): {description}
```

Stage files individually — never `git add .`. The commit type is usually `feat` or `refactor` based on the plan's objective.

### Verification

Run verification commands directly:

1. **Test suite:** `npm test` (or the project's test command from package.json or CLAUDE.md)
2. **Build check:** `npm run build` (if the project has a build step)
3. **Lint:** `npm run lint` (if the project has a linter)

If any fail: flag in SUMMARY under "Issues Encountered". Do NOT claim success if verification failed.

### Generate SUMMARY.md

Read `references/summary-template.md` for the template. Write SUMMARY.md. Commit: `docs({phase}-{plan}): complete {description}`

### Learnings Digest (after SUMMARY.md)

If claude-mem is available, generate a learnings digest:
1. Call `mcp__plugin_claude-mem_mcp-search__timeline` with window=7d, limit=20
2. Call `mcp__plugin_claude-mem_mcp-search__smart_search` with current phase name, limit=10
3. Read existing `~/.claude/cache/learnings-digest.json` if present
4. Merge observations into digest using this deterministic algorithm:
   a. Load existing digest items (empty array if no file or corrupt)
   b. For each new observation, check if it matches improvement themes (keywords: mistake, pitfall, learning, retro, regression, "should have", "next time", bug, broke, failed):
      - If no theme match → skip
      - If an existing item's summary shares 2+ significant words (excluding stopwords) → bump that item's times_seen
      - Else → create new item with id="imp-{timestamp}", times_seen=1, priority="low", first_seen=today
   c. Priority escalation: times_seen >= 3 → "medium", times_seen >= 5 → "high" (never downgrade)
   d. Items addressed by this build session (if the build's work matches an item's suggested_action) → mark addressed=true, addressed_at=ISO timestamp
   e. Compute stats: scanned = total observations checked, pending = items where addressed is falsy, addressed_since_last = items addressed in this merge
5. Write updated digest to `~/.claude/cache/learnings-digest.json`
6. Skip silently if claude-mem not installed or any MCP call fails

Digest schema: `{ generated: ISO string, generated_by: "build"|"context-critical", project: cwd path, phase: current phase name, items: [{ id: string, priority: "low"|"medium"|"high", category: "retro"|"pattern"|"theme", summary: string, detail: string, suggested_action: string, times_seen: number, first_seen: ISO string, addressed: boolean, addressed_at?: ISO string }], stats: { scanned: number, pending: number, addressed_since_last: number } }`

Budget: <2% context for this substep.

---

## Step 5: GSD State Updates

**Skip if not in GSD mode.**

Read `references/gsd-state-updates.md` and run the batch state update command. This covers: advance-plan, update-progress, record-metric, add-decision, record-session, and roadmap update.

These run once at plan completion. No state writes during wave execution.

Use **`model: "haiku"`** — mechanical state updates don't require deep reasoning.

---

## Step 6: Phase Completion Detection

```bash
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs verify phase-completeness "${PHASE_NUM}"
```

**If NOT all plans complete:** Report "Plan X of Y complete, Z remaining." Suggest `/fh:build` for next plan. Done.

**If ALL plans complete (phase done):** Run completion gates.

### Gate 1 + Gate 2 (parallel)

Dispatch in parallel:

**Gate 1: Goal Verification**
- For each `must_haves.truth` across all phase plans: find evidence (file exists, content matches, test passes)
- Run `gsd-tools verify artifacts` and `gsd-tools verify key-links` for each plan
- Requirements coverage: every requirement ID from ROADMAP in any plan's `requirements` must appear in at least one SUMMARY

**Gate 2: Design Quality Gates (visual work only)**
- Read `.planning/DESIGN.MD` and `.planning/PROJECT.MD` for design context (skip if missing)
- Calculate visual file ratio across ALL phase plans (`.tsx`, `.css`, `.html`, `.svg` files / total files)
- If visual ratio > 30% OR phase targets UI:
  - **Round 1 (parallel):** `/fh:ui-critique` + `/fh:harden`. Fix Critical/High. Commit: `fix({phase}): critique + harden`
  - **Round 2 (parallel):** `/fh:polish` + `/fh:adapt`. Fix Critical/High. Commit: `fix({phase}): polish + adapt`
  - **Round 3:** `/fh:normalize` if design system defined. Commit: `fix({phase}): normalize`
- If visual ratio ≤ 30% and phase doesn't target UI, skip.

### Gate 3: Final Verification

Uses Step 4's verification results if from the same session. Only re-runs if Gate 2 made changes (design fixes could break tests).

Write `VERIFICATION.md` in the phase directory with test/build/lint results and must-haves coverage.

If any gate fails, stop and report to user.

**Only after all gates pass:**

`gsd-tools.cjs phase complete "${PHASE_NUM}"` — atomically updates STATE.md and ROADMAP.md.

---

## Step 7: Report + Route

Report what was built:
- Tasks completed, key files created/modified
- Verification results

Route based on phase status:

| Condition | Action |
|-----------|--------|
| More plans in phase | "Plan X of Y complete." Suggest `/fh:build` for next plan. |
| Phase complete, more phases | "Phase complete." Suggest `/fh:plan-work {next}` or `/fh:review`. Also suggest `/fh:revise-claude-md`. |
| Last phase in milestone | "Milestone complete." Run `gsd-tools.cjs milestone complete`. Suggest `/fh:revise-claude-md`. |

Suggest `/fh:review` for deeper scrutiny (adds spec verification + gap analysis).
If frontend changes: suggest `/fh:ui-test` for visual verification.

---

## Context Budget Rules

- **Orchestrator (you):** Stay lean. Don't read source files. Don't load more than 2 `.planning/` files at a time. Delegate all file reading to subagents.
- **Task subagents (Sonnet):** Fresh context each. Load only what that task needs.
- **GSD state updates (Haiku):** Mechanical commands only.

---

## Context Pressure Priority

If context is running low, prioritize in this order:

Step 3 (execute waves) > Step 4 (commit + verify + SUMMARY) > Step 6 (phase completion) > Step 5 (GSD state).

Never skip Step 3 or Step 4.
