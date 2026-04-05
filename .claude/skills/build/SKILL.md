---
name: fh:build
description: Execute a plan — turns your PLAN.md into working code with tests and quality checks.
user-invocable: true
---

Execute an existing plan. Delegates task execution to subagents for optimal context usage.

What to build or which plan to execute: $ARGUMENTS

You are a **lean orchestrator**. Stay under 15% context usage. Delegate all heavy work to subagents.

> **Dependency check:** Verify `.planning/PROJECT.md` exists (required — if missing, tell user: "No project found.

→ Run /fh:new-project — set up project tracking before building").
> If no unexecuted plan exists in the current phase, tell user: "No plan to execute.

→ Run /fh:plan-work — create a plan first".

> **Execution pipeline:**
> Task execution: **`general-purpose`** subagents using `references/implementer-prompt.md`. Model is resolved from config via `gsd-tools resolve-model gsd-executor --raw`. Fresh context per task.
> Subagents write code but do NOT commit. Orchestrator makes one commit per plan after all waves complete.
> Do not use `fh:gsd-executor` or `fh:gsd-planner` — their state management conflicts with this orchestrator.

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
# Ensure GSD CLI symlink exists (self-heals if /fh:setup wasn't run)
if [ ! -f "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" ]; then
  _FHHS="$(ls -d "$HOME/.claude/plugins/cache/fhhs-skills/fh"/*/ 2>/dev/null | sort | tail -1)"
  _FHHS="${_FHHS%/}"
  if [ -n "$_FHHS" ] && [ -d "$_FHHS/bin" ]; then
    mkdir -p "$HOME/.claude/get-shit-done"
    ln -sfn "$_FHHS/bin" "$HOME/.claude/get-shit-done/bin"
    [ -d "$_FHHS/hooks" ] && ln -sfn "$_FHHS/hooks" "$HOME/.claude/get-shit-done/hooks"
  fi
fi

PLAN_START_EPOCH=$(date +%s)
WAVE_START_SHA=$(git rev-parse HEAD)
AUTO_MODE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.auto_advance 2>/dev/null || echo "false")
```

If `AUTO_MODE` is `"true"` AND `.planning/DECISIONS.md` exists, include the last 10 entries for this phase as `{DECISIONS_CONTEXT}`. Otherwise empty string.

### Smart Context Loading

If claude-mem is available (check tool list for `mcp__plugin_claude-mem_*`), use smart_search to find relevant patterns before reading files. Use smart_outline to understand file structure before editing. Don't read full files to find one function — use smart_outline then smart_unfold, then Read only when you need to Edit.

Specifically before wave execution:
1. `smart_search({query: "patterns in <primary module>"})` to find existing conventions
2. `smart_outline({path: "<plan target files>"})` to understand structure without full reads
3. `smart_search({query: "locked decisions for <phase>"})` to retrieve phase context compactly

If claude-mem is not available, fall back to Read/Grep/Glob directly — read the planning docs and source files as needed. Zero behavioral change for systems without claude-mem.

### Reference Warm-Up (once per build)

Shared references (`testing-guide.md`, `claude-mem-rules.md`) are static between plugin updates. Extract task-relevant sections once here and inject into all subagent prompts — eliminates N redundant full-file reads per build.

**If claude-mem is available** (smart_outline/smart_unfold tools):
1. `smart_outline({path: ".claude/skills/shared/testing-guide.md"})` — get heading structure
2. For each task type, `smart_unfold` the relevant section:
   - Tasks with `tdd="true"`: `smart_unfold({path: "...", symbol: "Part B"})` + `smart_unfold({..., symbol: "Part C"})`
   - Tasks with E2E/Playwright scope: `smart_unfold({..., symbol: "Part D"})` + `smart_unfold({..., symbol: "Part C"})`
   - All other tasks: `smart_unfold({..., symbol: "Part A"})` + `smart_unfold({..., symbol: "Part C"})`
3. For tasks involving tests (tdd="true", test tasks, or E2E tasks): also read `.planning/codebase/TESTING.md` if it exists — inject project-specific test patterns (runner, mocking approach, fixture conventions) alongside testing-guide.md sections for full TDD discipline.
4. Store extracted sections as `SHARED_REFERENCES_CACHE`

**Project-specific testing context:**
For test runner commands, mocking patterns, fixture locations, and coverage targets: inject from `.planning/codebase/TESTING.md` (project-specific).
For TDD discipline and philosophy: inject from `testing-guide.md` (universal).
If claude-mem available: `smart_search({query: "test patterns for {task type}"})` to find the right source.
Never read both full docs when only one is needed.

**If claude-mem is not available**: Read `testing-guide.md` once via the Read tool. Store full content as `SHARED_REFERENCES_CACHE`.

**If both fail**: Leave `SHARED_REFERENCES_CACHE` empty — subagents will read files directly (graceful degradation).

Inject `SHARED_REFERENCES_CACHE` into each subagent prompt via the `{SHARED_REFERENCES}` placeholder in the implementer-prompt.

---

## Step 2.5: Test-Spec Generation

Resolve the execution model (needed for both this step and Step 3):

```bash
EXEC_MODEL=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" resolve-model gsd-executor --raw)
```

If the plan has `must_haves.truths` and at least one task modifies `.ts`, `.tsx`, `.js`, `.jsx` files (excluding config-only, types-only, or constants-only files):

Dispatch a **test-spec subagent** (`general-purpose`, model `$EXEC_MODEL`) **before Wave 1 begins**. This agent writes test skeletons from the plan specification — it has NOT seen the implementation code. Wave 1 subagents will find these test files already on disk and can implement code to make them pass.

**Subagent prompt:**
```
You are writing test skeletons from a plan specification. You have NOT seen the implementation.

Read `.claude/skills/shared/testing-guide.md` for testing rules.

## Spec
Must-haves: {PLAN_MUST_HAVES}
Task acceptance criteria: {PLAN_DONE_CRITERIA}
Error cases: {ERROR_RESCUE_MAP_IF_AVAILABLE}

## Instructions
1. For each must_haves.truth → write 1-3 behavioral test cases
2. For each task's done criteria → write the test proving it
3. For error/rescue entries → write failure-path tests
4. Write to `__tests__/` or `tests/` matching project convention
5. Use Vitest + @testing-library/react for components. Playwright for E2E.
6. Use `getByRole` > `getByLabel` > `getByTestId` for selectors
7. Mark tests needing implementation with `it.todo()` if API is unclear
8. DO NOT import from files that don't exist yet — use expected paths from the plan

Report: test files created, test count, which must_haves.truths are covered.
```

Wait for this subagent to complete before dispatching Wave 1. This ensures implementation subagents see pre-existing test skeletons and can implement to pass them — orchestration-level TDD.

Skip if: no `must_haves.truths`, all tasks are config/docs only, or plan has fewer than 2 tasks.

---

## Step 3: Execute Waves

Use `$EXEC_MODEL` resolved in Step 2.5 (or resolve here if Step 2.5 was skipped):

```bash
[ -z "$EXEC_MODEL" ] && EXEC_MODEL=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" resolve-model gsd-executor --raw)
```

For each wave, dispatch **one subagent per task** using the Agent tool with **`subagent_type: "general-purpose"`** and **`model: "$EXEC_MODEL"`** (use the resolved value, e.g. `"sonnet"` or `"opus"`).

### Subagent prompt

Use the structured template at `references/implementer-prompt.md`. Fill its placeholders:

- `{TASK_TEXT}` — Full task content (files, action, verify, done). Copy the text, don't reference the plan file.
- `{CLAUDE_MD_SECTIONS}` — Relevant sections from CLAUDE.md for this task type, plus task-type-routed codebase mapping files from `.planning/codebase/`:
  - UI tasks (`.tsx`, `.css`, `.scss`) → inject CONVENTIONS.md + STRUCTURE.md
  - API tasks (routes, handlers, endpoints) → inject ARCHITECTURE.md + CONVENTIONS.md
  - DB tasks (migrations, models, schemas) → inject ARCHITECTURE.md + STACK.md
  - Test tasks → inject TESTING.md + CONVENTIONS.md
  - Infrastructure/config tasks → inject STACK.md + INTEGRATIONS.md
  - General tasks → inject STRUCTURE.md + CONVENTIONS.md

  If claude-mem available: use smart_search for task-relevant conventions instead of reading full files.
  If not available: Read the specific granular file directly.
- `{DESIGN_DECISIONS}` — If `.planning/phases/{phase}/{phase}-CONTEXT.md` exists, include the "Decisions", "Discretion Areas", and "Deferred Ideas" sections.
- `{PHASE_DIR}` — Path to `.planning/phases/{phase}/` for deferred items logging.
- `{PHASE_NAME}` — Phase directory name for smart_search queries (e.g. "13-pending-payments-invoicing").
- `{FILE_TYPES}` — Comma-separated file type descriptions for convention queries (e.g. "tsx components", "test files").
- `{TASK_NAME}` — Task identifier for deferred items format.
- `{PROJECT_CONSTRAINTS}` — See population rule below.
- `{SHARED_REFERENCES}` — Pre-loaded testing/TDD rules from `SHARED_REFERENCES_CACHE` (populated in Reference Warm-Up). Task-filtered: TDD tasks get Part B, E2E tasks get Part D, all get Part A + C. If empty, subagent reads files directly.

**{PROJECT_CONSTRAINTS} population:**
Read the `## Gotchas` section from `./CLAUDE.md`. Extract each gotcha as an imperative constraint:
- Convert "X renamed Y to Z" → "Use Z, not Y"
- Convert "X are async" → "Always await X"
- Convert "X uses TEXT IDs" → "All FKs to X tables must be TEXT, never UUID"
Inject as `{PROJECT_CONSTRAINTS}`. Max 15 lines.
If no Gotchas section exists, leave {PROJECT_CONSTRAINTS} empty (do not error).

### claude-mem Context Acceleration

Before reading CONTEXT.md and DECISIONS.md files directly, check if claude-mem is available (tool list contains `mcp__plugin_claude-mem_*`):
- If available: use `smart_search({query: "locked decisions for phase {phase}"})` and `smart_search({query: "decisions affecting {files}"})` to find relevant entries. Use `smart_outline` to understand file structure before editing. Don't read full files to find one function — use `smart_outline` → `smart_unfold`, then Read only when you need to Edit.
- If not available: fall back to Read/Grep/Glob directly — skills work identically without claude-mem.

The template tells subagents to self-discover relevant skill context (Playwright, Next.js, frontend design) by reading skill files when their task involves those domains. No orchestrator pre-processing needed.

### Token Efficiency Notes

When executing tasks, be aware of tool call efficiency:
- **Default to Smart Explore** (smart_search/smart_outline/smart_unfold) for targeted lookups; escalate to Explore Agent only for open-ended synthesis
- **Avoid re-reading** files already in context from earlier steps (freshness check, plan read, CONTEXT.md injection)
- **Fallow output is authoritative** — do not re-derive dead code, complexity, or duplication findings that Fallow already provided
- **Note tool call patterns:** If you find yourself reading the same file multiple times across tasks, flag it as a context optimization opportunity in the SUMMARY.md

### Checkpoint protocol

If a task has `type="checkpoint:*"`, handle inline:

- `checkpoint:human-verify` — Show the subagent's output (screenshot/command output), await user approval. In auto-mode: auto-approve (confidence=MEDIUM).
- `checkpoint:decision` — Present options with pros/cons, await user choice. In auto-mode: auto-select first option (confidence=MEDIUM).
- `checkpoint:human-action` — Describe the manual step needed, await confirmation. In auto-mode: STOP (auth gates cannot be automated).

When auto-approving checkpoints, log as a decision in `.planning/DECISIONS.md` with `confidence=MEDIUM`, `step='build checkpoint'`. Follow format from `references/decisions-template.md`.

### After each wave completes

### Post-Wave Context

claude-mem's PostToolUse hook automatically observes all file reads and edits from each wave's agents. Subsequent waves can query these observations via `search` or `timeline` — no explicit re-indexing needed.

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

**`classifyHandoffIfNeeded` false failure:** If a subagent reports "failed" with error containing `classifyHandoffIfNeeded is not defined`, this is a Claude Code runtime bug — not a task failure. Spot-check instead: verify key files exist on disk and no `## Self-Check: FAILED` marker is present. If spot-checks pass, treat as successful.

Once all tasks are accounted for:
1. **Spot-check:** verify key files from subagent reports exist on disk (`[ -f path ]`). Also check for `## Self-Check: FAILED` marker in any subagent report.
2. **Done criteria check:** compare each task's `done` criteria against subagent output — flag mismatches
3. **Report** results to user

### Pre-wave dependency check (wave 2+ only)

Before dispatching each wave after wave 1, verify that artifacts from prior waves are actually present:

```bash
# For each plan in the upcoming wave, check key-links from prior waves:
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" verify key-links {phase_dir}/{plan}-PLAN.md 2>/dev/null
```

If any key-link from a prior wave's artifact fails verification:

```
## Cross-Plan Wiring Gap

| Plan | Link | From | Expected Pattern | Status |
|------|------|------|-----------------|--------|
| {plan} | {via} | {from} | {pattern} | NOT FOUND |

Wave N artifacts may not be properly wired. Options:
1. Investigate and fix before continuing
2. Continue (may cause cascading failures in next wave)
```

Key-links referencing files in the upcoming wave itself are skipped. If `gsd-tools verify key-links` is unavailable, skip silently.

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
4. **Coverage report** (if Vitest/Jest config exists): `pnpm test --run --coverage 2>/dev/null || npx vitest run --coverage 2>/dev/null`
   Parse output for line/branch percentages. Include in SUMMARY.md `test_metrics` frontmatter.
   If coverage isn't configured or command fails, skip with note "Coverage not configured — consider adding vitest coverage."
5. **Spec test count:** If Step 2.5 ran, capture the test-spec subagent's reported test count as `spec_tests_count` in `test_metrics`. If Step 2.5 was skipped, set to 0.
6. **Test creation check:** If the plan included tasks with `tdd="true"` or companion test tasks, verify at least one `*.test.*` or `*.spec.*` file was created or modified in this build (check via `git diff --name-only $WAVE_START_SHA HEAD`). If none found: WARN "Plan required tests but no test files were created — check subagent reports for UNTESTED flags."

If any fail: flag in SUMMARY under "Issues Encountered". Do NOT claim success if verification failed.

### Generate SUMMARY.md

Read `references/summary-template.md` for the template. Write SUMMARY.md. Commit: `docs({phase}-{plan}): complete {description}`

### Concerns Review (after SUMMARY.md)

If `.planning/codebase/CONCERNS.md` exists, do a quick scan:
1. Read CONCERNS.md categories and items
2. Check if this build addressed any listed concerns (compare files modified against concern file paths)
3. If a concern was addressed: add a note to SUMMARY.md under "Concerns Addressed" with the concern title and what was done
4. If this build introduced patterns matching known concern categories (new tech debt, missing tests, security gaps): note in SUMMARY.md under "New Concerns" as advisory
5. If CONCERNS.md is stale (`.last-mapped` > 50 commits behind HEAD): note in SUMMARY.md: "Codebase concerns may be outdated — consider `/fh:map-codebase`"

This is advisory only — never block completion. Budget: <1% context.

### Post-build drift check (advisory)

If claude-mem is available and `.planning/codebase/` exists:
1. `smart_search({query: "new pattern convention not documented"})` across recent observations
2. If 3+ drift signals found since last mapping:
   - Log: "⚠️ Codebase mapping may be stale — {N} convention changes detected since last map. Consider `/fh:map-codebase --refresh-stale`"
3. Never auto-run mapping — just advise. User decides when to spend the tokens.

### Persist Findings (after SUMMARY.md)

Follow **Pattern D** (Persist Findings) from `shared/claude-mem-rules.md`. Use tag `[build-learning]`. Focus on: architectural decisions made during implementation, trade-offs chosen, patterns that worked or didn't.

---

## Step 5: GSD State Updates

**Skip if not in GSD mode.**

Read `references/gsd-state-updates.md` and run the batch state update command. This covers: advance-plan, update-progress, record-metric, add-decision, record-session, and roadmap update.

These run once at plan completion. No state writes during wave execution.

Resolve via `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" resolve-model gsd-codebase-mapper --raw` — mechanical state updates don't require deep reasoning.

---

## Step 6: Phase Completion Detection

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" verify phase-completeness "${PHASE_NUM}"
```

**If NOT all plans complete:** Report "Plan X of Y complete, Z remaining." Suggest `/fh:build` for next plan. Done.

**If ALL plans complete (phase done):** Run completion gates.

### Regression Gate (before goal verification)

Run prior phases' test suites to catch cross-phase regressions BEFORE verification.

**Skip if:** This is the first phase (no prior phases), or no prior VERIFICATION.md files exist.

```bash
# Find all VERIFICATION.md files from prior phases
PRIOR_VERIFICATIONS=$(find .planning/phases/ -name "*-VERIFICATION.md" ! -path "*${PHASE_NUM}*" 2>/dev/null)
```

For each VERIFICATION.md found, look for test file references (lines containing `test`, `spec`, or `__tests__` paths). Collect unique test file paths. If any found, run:

```bash
if [ -f "package.json" ]; then
  npx jest ${REGRESSION_FILES} --passWithNoTests --no-coverage -q 2>&1 || npx vitest run ${REGRESSION_FILES} 2>&1
fi
```

If all tests pass: `✓ Regression gate: N prior-phase test files passed — no regressions detected` → proceed.

If any fail: present a table of failing tests with their origin phase. Offer: 1) Fix regressions before verification (recommended), 2) Continue to verification anyway, 3) Abort. Use AskUserQuestion if available, otherwise ask inline.

### Gate 0: Integration Check (runs before goal verification)

Run fallow-based impact analysis on all files modified across the phase:

1. Collect all files from `files_modified` across all phase plans
2. Run `timeout 30 fallow dead-code --format json --quiet` and `timeout 30 fallow health --file-scores --format json --quiet`
3. Classify blast radius per file using fan_in thresholds:
   - fan_in >= 10 → CRITICAL (deep analysis)
   - fan_in >= 5 → HIGH (review)
   - fan_in >= 2 → MEDIUM (note)
   - fan_in < 2 → LOW (skip)
   For each CRITICAL/HIGH file:
   - Extract all downstream files from fallow's referenced_by
   - Check: are downstream files tested? (grep for test files importing them)
   - If `.planning/codebase/FLOWS.md` exists and does not contain `empty: true`, grep for affected flows
4. If any CRITICAL file has untested downstream consumers, WARN (do not block)

If fallow is not installed or times out (30s), skip Gate 0 with warning: "fallow unavailable, skipping integration check".
If fallow JSON is malformed, skip with warning: "fallow output unparseable, skipping integration check".

### Gate 1

**Gate 1: Goal Verification**
- For each `must_haves.truth` across all phase plans: find evidence (file exists, content matches, test passes)
- Run `gsd-tools verify artifacts` and `gsd-tools verify key-links` for each plan
- Requirements coverage: every requirement ID from ROADMAP in any plan's `requirements` must appear in at least one SUMMARY

### Gate 3: Final Verification

Uses Step 4's verification results if from the same session.

**Architecture artifact refresh:**
If `.planning/codebase/FLOWS.md` exists:
- Collect all `files:` entries from flow-meta YAML comments
- Intersect with files modified in this phase (from all plan files_modified)
- If intersection is non-empty: invoke `/fh:map-codebase` scoped to the affected flow sections only. Preserve unaffected sections.
- Validate all flow-meta file references still exist via `stat`
- If a referenced file was deleted, remove it from the flow and flag in report
- If flow-meta YAML is unparseable, regenerate that section from scratch with warning

If any plan in the phase included migration files (supabase/migrations/ or discovered migration path):
- Regenerate `.planning/codebase/ERD.md` from current migration SQL

If fallow is not available, skip fallow-dependent operations (import graph analysis) with warning but continue with:
- FLOWS.md file-reference validation via `stat` (no fallow needed)
- ERD.md regeneration from migration SQL (no fallow needed)
If FLOWS.md contains `empty: true`, skip flow cross-reference entirely.
Timeout: 30s per fallow operation.

Write `VERIFICATION.md` in the phase directory with test/build/lint results and must-haves coverage.

If any gate fails, stop and report to user.

**Only after all gates pass:**

`gsd-tools.cjs phase complete "${PHASE_NUM}"` — atomically updates STATE.md and ROADMAP.md.

### PROJECT.md Evolution (after phase complete)

PROJECT.md tracks validated requirements, decisions, and current state. Without this step, it falls behind silently across phases.

1. Read `.planning/PROJECT.md`
2. If it has a `## Validated Requirements` or `## Requirements` section: move requirements validated by this phase from Active → Validated, add note: `Validated in Phase {X}: {Name}`
3. If it has a `## Current State` section: update to reflect this phase's completion
4. Update the `Last updated:` footer to today's date
5. Commit:
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(phase-${PHASE_NUM}): evolve PROJECT.md after phase completion" --files .planning/PROJECT.md
```

**Skip if** `.planning/PROJECT.md` does not exist.

---

## Step 7: Report + Route

Report what was built:
- Tasks completed, key files created/modified
- Verification results

Route based on phase status:

| Condition | Action |
|-----------|--------|
| More plans in phase | "Plan X of Y complete." Suggest `/fh:build` for next plan. |
| Phase complete, more phases | "Phase complete." Suggest `/fh:plan-work {next}` or `/fh:review`. Also suggest `/fh:learnings`. |
| Last phase in milestone | "Milestone complete." Run `gsd-tools.cjs milestone complete`. Suggest `/fh:learnings`. |

Run `/fh:review` for quality refinement — it handles design quality, security, performance, and code simplification as needed.

If claude-mem is installed, add to the phase-complete and milestone-complete routes:

> Run `/fh:learnings` to surface patterns from your recent work and find improvement opportunities.

This nudge only appears when:
1. A phase or milestone just completed (not per-plan completions)
2. claude-mem is available

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
