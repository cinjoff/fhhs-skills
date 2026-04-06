---
name: fh:build
description: Execute a plan — turns your PLAN.md into working code with tests and quality checks.
user-invocable: true
---

Execute an existing plan. Delegates task execution to subagents for optimal context usage.

What to build or which plan to execute: $ARGUMENTS

You are the **build orchestrator**. Follow every step below — each one exists because skipping it caused real failures in past sessions. Delegate implementation work to subagents, but own the orchestration fully.

> This skill handles interactive builds. For autonomous execution, `/fh:auto` dispatches tasks directly — see `auto-orchestrator.cjs`.

> **Dependency check:** Verify `.planning/PROJECT.md` exists (required — if missing, tell user: "No project found.
→ Run /fh:new-project — set up project tracking before building").
> If no unexecuted plan exists in the current phase, tell user: "No plan to execute.
→ Run /fh:plan-work — create a plan first".

> **Execution pipeline:**
> Task execution: **`general-purpose`** subagents using the **Subagent Prompt Template** (inlined in Step 3). Model is resolved from config via `gsd-tools resolve-model gsd-executor --raw`. Fresh context per task.
> Subagents write code but do NOT commit. Orchestrator makes one commit per plan after all waves complete.
> Do not use `fh:gsd-executor` or `fh:gsd-planner` — their state management conflicts with this orchestrator.

> **GSD project context:**
> Read `STATE.md` and `ROADMAP.md` for current position. All state updates use `gsd-tools.cjs`.
> For context ordering in subagent prompts, see @.claude/skills/shared/context-api-contract.md.

---

## Step 0: Tool Readiness

claude-mem and ast-grep are manifest-required tools that power this entire skill. claude-mem tools are **deferred** — they must be fetched before they can be called. Do this first, before any other work.

```
ToolSearch("select:mcp__plugin_claude-mem_mcp-search__smart_search,mcp__plugin_claude-mem_mcp-search__smart_outline,mcp__plugin_claude-mem_mcp-search__smart_unfold,mcp__plugin_claude-mem_mcp-search__search,mcp__plugin_claude-mem_mcp-search__get_observations")
```

Also verify ast-grep CLI is available:
```bash
command -v sg &>/dev/null || command -v ast-grep &>/dev/null || echo "WARN: ast-grep not found"
```

These tools are used throughout:
- **smart_outline** — see file structure without reading the whole file (11-27x cheaper than Read)
- **smart_unfold** — extract one function/section from a file (never truncates)
- **smart_search** — cross-codebase structural search by intent
- **search + get_observations** — find prior decisions, gotchas, learnings from past sessions
- **ast-grep (sg)** — structural code search and bulk transforms on source files

**If ToolSearch returns empty for claude-mem:** Fall back to Read-based approach for this session. Note: this means reduced efficiency — the skill will still work but will use more context.

---

## Step 0.5: Codebase Freshness Check

See @.claude/skills/shared/freshness-check.md

---

## Step 1: Find the Plan

### 1a. Locate the plan file

Query claude-mem **first**, by intent — not by file path:

```
search({query: "current plan active tasks {phase-name}", project: "<project>", limit: 5})
```

Scan results for relevant observations (prioritize types: plan-artifact, decision, gotcha). If fresh observations found: use as primary input and skip redundant file reads.

If no useful observations (or claude-mem unavailable): fall back to the resolution chain:
1. Read `.planning/STATE.md` → extract current_phase + active_plan path
2. `.planning/phases/{current_phase}/` → find PLAN*.md without matching SUMMARY.md
3. Glob `.planning/plans/PLAN*.md` → most recent by mtime

If the user specified a plan path, use that directly.

Read only the plan frontmatter and task list — don't load all context files yet.

### 1b. Load Spec Context

If plan frontmatter has `spec:` field:
1. `smart_unfold({path: "<spec-path>", symbol: "Architecture"})` — loads only that section
2. `smart_unfold({path: "<spec-path>", symbol: "Failure Modes"})` — if relevant
3. `smart_unfold({path: "<spec-path>", symbol: "Quality Rubrics"})` — if relevant
4. `smart_unfold({path: "<spec-path>", symbol: "Data Flow"})` — if relevant
5. Map to placeholders: `{SPEC_ARCHITECTURE}`, `{SPEC_FAILURE_MODES}`, `{SPEC_QUALITY_RUBRICS}`, `{SPEC_DATA_FLOW}`
6. Never load the whole SPEC.md at once

### 1c. Load Context Decisions

```
smart_search({query: "locked decisions for {phase-name}"})
```

If no results: read CONTEXT.md directly via `smart_unfold({path: "...", symbol: "Decisions"})` + `smart_unfold({..., symbol: "Discretion Areas"})`.

Store as `{DESIGN_DECISIONS}` for subagent prompts.

### 1d. Resume detection

If multiple plans exist with partial SUMMARY.md coverage, report: "Found N plans, M already completed. Continuing from plan X." Skip completed plans.

**Task-level resume:** Check `.planning/build/` for `task-{plan}-*-state.md` files per @references/task-state-protocol.md (Resume Protocol). `completed` tasks are skipped; `in-progress` tasks revert to `pending`; `failed` tasks with 2+ attempts surface to user before proceeding.

### 1e. Phase dependency check

Check if the current phase has declared prerequisites (in CONTEXT.md, RESEARCH.md, or ROADMAP.md — look for "depends on Phase", "requires Phase", "prerequisite"). For each declared dependency, verify the prerequisite phase is complete in STATE.md. If incomplete: **WARN** "Phase X depends on Phase Y (status: {status}). Building on incomplete prerequisites risks rework. Proceed anyway?" Wait for user confirmation.

**Previous plan check (GSD only):** If a previous SUMMARY exists, scan for unresolved "Issues Encountered". If found, ask user: "Previous plan had unresolved issues — proceed anyway, address first, or review?"

---

## Step 2: Prepare for Execution

### 2a. Analyze Waves

> Plan parsing logic is shared with the auto-orchestrator via `.claude/skills/auto/lib/wave-analysis.cjs`. When modifying plan format, update both.

Group tasks by their `wave` number (or dependency order if no waves specified):
- Wave 1: tasks with no dependencies (can run in parallel)
- Wave 2+: tasks that depend on earlier waves

Test tasks marked `wave: same` as their implementation task run in the same wave when they test independent interfaces.

Report the execution plan to the user: "N tasks in M waves. Wave 1 has X parallel tasks."

```bash
PLAN_START_EPOCH=$(date +%s)
WAVE_START_SHA=$(git rev-parse HEAD)
```

### 2b. Reference Warm-Up (do this once, reuse across all subagents)

Shared references (testing-guide.md, claude-mem-rules.md) are the same across all tasks. Extract relevant sections once here and inject into all subagent prompts — this eliminates N redundant full-file reads per build.

1. `smart_outline({path: ".claude/skills/shared/testing-guide.md"})` — get heading structure
2. For each task type, `smart_unfold` the relevant section:
   - Tasks with `tdd="true"`: `smart_unfold({..., symbol: "Part B"})` + `smart_unfold({..., symbol: "Part C"})`
   - Tasks with E2E/Playwright scope: `smart_unfold({..., symbol: "Part D"})` + `smart_unfold({..., symbol: "Part C"})`
   - All other tasks: `smart_unfold({..., symbol: "Part A"})` + `smart_unfold({..., symbol: "Part C"})`
3. If tasks involve tests: also check `.planning/codebase/TESTING.md` for project-specific test patterns (runner, mocking approach, fixture conventions)
4. Store extracted sections as `SHARED_REFERENCES_CACHE` — inject into each subagent prompt as `{SHARED_REFERENCES}`

**If smart tools returned nothing useful**: Read `testing-guide.md` once via Read tool. Store as `SHARED_REFERENCES_CACHE`.

### 2c. Past Learnings Check

Query claude-mem for prior mistakes in this domain:

```
smart_search({query: "past mistakes {primary_module} build-learning"})
search({query: "gotcha decision trade-off {phase-name}", project: "<project>", limit: 10})
```

For relevant results: `get_observations({ids: [top 2-3]})`. Store as `{PAST_LEARNINGS}` for subagent prompts.

### 2d. Populate Project Constraints

Read the `## Gotchas` section from `./CLAUDE.md`. Extract each gotcha as an imperative constraint:
- Convert "X renamed Y to Z" → "Use Z, not Y"
- Convert "X are async" → "Always await X"
- Convert "X uses TEXT IDs" → "All FKs to X tables must be TEXT, never UUID"

Store as `{PROJECT_CONSTRAINTS}`. Max 15 lines. If no Gotchas section exists, leave empty.

### 2e. Populate Conventions Context

Route by task type — load only relevant codebase mapping files:
- UI tasks (`.tsx`, `.css`, `.scss`) → CONVENTIONS.md + STRUCTURE.md
- API tasks (routes, handlers, endpoints) → ARCHITECTURE.md + CONVENTIONS.md
- DB tasks (migrations, models, schemas) → ARCHITECTURE.md + STACK.md
- Test tasks → TESTING.md + CONVENTIONS.md
- Infrastructure/config tasks → STACK.md + INTEGRATIONS.md
- General tasks → STRUCTURE.md + CONVENTIONS.md

Use `smart_search` for task-relevant conventions instead of reading full files. Store as `{CLAUDE_MD_SECTIONS}`.

### 2f. Test-Spec Generation

Resolve the execution model:

```bash
EXEC_MODEL=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" resolve-model gsd-executor --raw)
```

Follow @references/test-spec-generation.md (if plan has `must_haves.truths` and code tasks exist).

---

## Step 3: Execute Waves

Use `$EXEC_MODEL` resolved in Step 2f (or resolve here if skipped):

```bash
[ -z "$EXEC_MODEL" ] && EXEC_MODEL=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" resolve-model gsd-executor --raw)
```

**Before dispatching each task:** Create a state file `.planning/build/task-{plan}-{task-id}-state.md` with `status: pending` per @references/task-state-protocol.md. Update to `in-progress` on dispatch, `completed` or `failed` on result.

For each wave, dispatch **one subagent per task** using the Agent tool with **`subagent_type: "general-purpose"`** and **`model: "$EXEC_MODEL"`** (use the resolved value, e.g. `"sonnet"` or `"opus"`).

### 3a. Build each subagent prompt

> Task prompt structure follows `.claude/skills/auto/lib/context-injection.cjs`. Include: task instructions, phase goal, CONTEXT.md decisions, project constraints, smart tool discovery instructions.

Use the template below. Fill all `{PLACEHOLDERS}` from data gathered in Steps 1 and 2. Do NOT write ad-hoc prompts — the template exists because subagents need the Tool Decision Tree, Code Navigation, and Deviation Rules to work effectively.

**ast-grep hint (per task):** When the task involves renaming, moving, extracting, or replacing patterns across multiple files, prepend this to `{TASK_TEXT}`:
```
**Tool hint:** This task involves multi-file structural changes. Use ast-grep (`sg`) for the transform — it's faster and more reliable than editing files one by one. See the Tool Decision Tree below.
```
Detect by scanning the task for keywords: "rename", "move", "extract", "replace across", "refactor", "migrate", "update all", or tasks listing 3+ files with the same kind of change.

**File context pre-loading (per task, before dispatching):**

Each task lists files it will modify. Pre-load their structure so the subagent doesn't waste tool calls on exploration:

1. For each file in the task's `Files:` list, run `smart_outline({path: "<file>"})` — this returns function/class/export signatures without reading the full file (~11-27x cheaper than Read).
2. Collect all outlines into `{FILE_OUTLINES}` — inject after `{TASK_TEXT}` in the prompt.
3. For each file being modified, trace imports using ast-grep for structural accuracy:
   ```bash
   sg --pattern 'import $$$IMPORTS from "$FILE"' --lang typescript src/
   ```
   Replace `$FILE` with the file's import path (e.g. `@/lib/repositories/obligations` for `src/lib/repositories/obligations.ts`). This finds all files that structurally import from the target — no false positives from comments or strings.
   If ast-grep is unavailable, fall back to `Grep` for `from.*<filename>`.
   If LSP tools are available, `findReferences` on key exports is even more precise.
4. Summarize as `{IMPACT_CONTEXT}`: "Files that import X: [list]. Changes to exported interfaces in X may affect these consumers."

This gives the subagent a structural map of every file it needs to touch, plus awareness of what depends on those files — without reading any source code as orchestrator.

**SPEC.md enrichment (per task, before dispatching):**

1. If SPEC.md exists: use `smart_unfold` to extract sections relevant to the task domain. Map to `{SPEC_ARCHITECTURE}`, `{SPEC_FAILURE_MODES}`, `{SPEC_QUALITY_RUBRICS}`, `{SPEC_DATA_FLOW}`.
2. Query claude-mem for past mistakes: `smart_search({query: "past mistakes {task_domain} build-learning"})`. Populate `{PAST_LEARNINGS}`.
3. If `.planning/DECISIONS.md` exists, extract entries affecting this task's files. Populate `{DECISION_RATIONALE}`.
4. If no SPEC.md: leave spec placeholders empty — the template guards ("If empty, skip this section") handle graceful degradation.

---

### SUBAGENT PROMPT TEMPLATE

Copy this template verbatim for each task. Fill `{PLACEHOLDERS}` with values from Steps 1-2. Do not omit sections — each one prevents a class of failure.

````
You are implementing a task from a plan.

## Your Task

{TASK_TEXT}

## File Structure (pre-loaded by orchestrator)

{FILE_OUTLINES}

These are the function/class/export signatures of each file you'll modify. Use this to orient yourself — you already know the structure. Use `smart_unfold` to read specific functions when you need implementation details, and `Read` only when you're ready to `Edit`.

## Impact Context

{IMPACT_CONTEXT}

If empty, skip. If present: these files import or depend on the files you're modifying. Be aware of downstream effects — if you change an exported interface, check that callers still match.

## Tool Decision Tree

Choose the right tool for each change type:

| Change type | Primary tool | Fallback |
|-------------|-------------|---------|
| Structural transforms (rename pattern, extract across many files) | ast-grep CLI (`sg`) | Edit tool per file |
| Single-file targeted change | Edit tool | — |
| Non-code files (Markdown, JSON, YAML) | Edit tool | — |
| Find all instances of a code pattern | ast-grep MCP `find_code_by_rule` | Grep |

**ast-grep rules:**
- Only use ast-grep on source code files with language support (TypeScript, JavaScript, Python, etc.)
- Do NOT use ast-grep on Markdown files — no language support
- For bulk replace: verify each transform output before proceeding
- Check availability: `command -v sg &>/dev/null || command -v ast-grep &>/dev/null`

## Code Navigation

Use claude-mem smart tools for understanding code you haven't seen:
- `smart_outline({path: "file"})` — function signatures without full read
- `smart_unfold({path: "file", symbol: "name"})` — extract one function/class
- `smart_search({query: "pattern"})` — cross-codebase structural search

Use `Read` only for files you intend to `Edit`. Use LSP (`goToDefinition`, `findReferences`, `hover`) for type navigation if available.

## Project Context

### Conventions

{CLAUDE_MD_SECTIONS}

If empty: try `smart_search({query: "conventions for {FILE_TYPES}"})`, then fall back to reading relevant files in `.planning/codebase/` (CONVENTIONS.md for style, STRUCTURE.md for placement, ARCHITECTURE.md for layers).

### Decisions & Scope

{DESIGN_DECISIONS}

If empty: try `smart_search({query: "locked decisions for {PHASE_NAME}"})`, then fall back to reading `.planning/phases/{PHASE_DIR}/CONTEXT.md`.

Respect locked decisions. Stay within discretion bounds. Do not implement deferred ideas.

### Architecture Context

{SPEC_ARCHITECTURE}

If empty, skip this section.

### Data Flow

{SPEC_DATA_FLOW}

If empty, skip this section.

### Hard Constraints

{PROJECT_CONSTRAINTS}

If empty, read the "Gotchas" section of `./CLAUDE.md`. These are project-level rules — violations cause runtime failures.

## Before You Begin

You are a subagent — no interactive questions. Make reasonable assumptions and document them.

**BLOCKED?** (missing file, broken API, unclear requirement) — STOP immediately. Report: Status: BLOCKED, Task, Blocker, What you need. Do not guess on blockers.

**Do NOT commit.** The orchestrator commits once after all tasks complete.

## Testing

{SHARED_REFERENCES}

If the above is empty, read `.claude/skills/shared/testing-guide.md` for testing rules, TDD, stack defaults, and Playwright patterns.

**Key rules:**
- Write tests alongside implementation for any business logic, state, or data transformation
- Non-watch mode only (watch hangs subagents): `pnpm test --run` or prefix `CI=true`
- React: `@testing-library/react` with `getByRole` > `getByLabel` > `getByTestId`
- TDD tasks (`tdd="true"`): follow Part B (Red-Green-Refactor) — watch each test fail before implementing
- E2E/Playwright: read `.claude/skills/playwright-testing/PROMPT.md` for the full decision tree
- If pre-generated test skeletons exist in `__tests__/` or `e2e/`, implement to make them pass

**Context-aware references** — read if relevant:
- Frontend work (`.tsx`, `.css`): `.planning/DESIGN.md`
- Next.js (`next.config.*`): `.claude/skills/nextjs-perf/PROMPT.md`

Do not add features, abstractions, or error handling beyond what the task specifies.

## Deviation Rules

You will discover work not in the plan. Apply:

| Rule | Trigger | Action | Permission |
|------|---------|--------|------------|
| 1 | Bug: broken behavior, errors, type errors, security vulns | Fix -> test -> verify -> track `[Rule 1 - Bug]` | Auto |
| 2 | Missing critical: validation, auth, CSRF, rate limiting | Fix -> test -> verify -> track `[Rule 2 - Missing Critical]` | Auto |
| 3 | Blocking: missing deps, wrong types, broken imports | Fix -> verify -> track `[Rule 3 - Blocking]` | Auto |
| 4 | Architectural: new DB table, schema change, new service | STOP -> report to orchestrator: what, why, impact, alternatives | Ask user |

Only fix issues directly caused by your changes. After 3 failed attempts on one issue, document and move on.

## Guardrails

If you make 5+ consecutive read/search calls without writing code, you're stuck — either write code or report "blocked". This keeps you from over-analyzing when the task needs action.

Out-of-scope discoveries go to `{PHASE_DIR}/deferred-items.md`:
```
- [{TASK_NAME}] {description} (found in {file}:{line})
```

## Stub Check (before reporting)

Before reporting, scan all files you created or modified for stub patterns:
- Hardcoded empty values: `=[]`, `={}`, `=null`, `=""` that flow to UI rendering
- Placeholder text: "not available", "coming soon", "placeholder", "TODO", "FIXME"
- Components with no data source wired (props always receiving empty/mock data)

If any stubs exist, include them in your report under **Stubs** with file, line, and reason. Do NOT claim a task complete if stubs prevent the task's goal from being achieved.

## Spec Quality Targets

{SPEC_QUALITY_RUBRICS}

If empty, skip this section. If present: treat these rubrics as acceptance criteria.

{SPEC_FAILURE_MODES}

If empty, skip this section. If present: ensure your implementation handles each listed failure mode.

## Past Context

{PAST_LEARNINGS}

If empty, skip this section. If present: avoid repeating these past mistakes.

{DECISION_RATIONALE}

If empty, skip this section. If present: do not reverse these design decisions without flagging as a deviation.

## Self-Check (before reporting)

Verify your key claims:

```bash
# Check created files exist:
[ -f "path/to/created/file" ] && echo "FOUND" || echo "MISSING: path/to/created/file"
```

If any expected file is missing: fix it before reporting, or explain why it's absent.

## Report

Before reporting: self-review for completeness, quality, no overbuilding, and test coverage.

**Implemented:** What you built (file paths)
**Tests:** `{pass_count}/{total_count} passing` | New test files: `{list}` | If skipped: `UNTESTED: {file} — {reason}`
**Files Changed:** Created/modified files
**Deviations:** Rule 1-3 fixes applied
**Stubs:** Stub patterns found (if any) with file:line — or "None"
**Concerns:** Issues for downstream tasks
**Deferred:** Items logged (if any)
````

### END OF SUBAGENT PROMPT TEMPLATE

---

### 3b. Checkpoint protocol

If a task has `type="checkpoint:*"`, handle inline:

- `checkpoint:human-verify` — Show the subagent's output (screenshot/command output), await user approval.
- `checkpoint:decision` — Present options with pros/cons, await user choice.
- `checkpoint:human-action` — Describe the manual step needed, await confirmation.

### 3c. After each wave completes

**Post-wave triage:** Classify subagent outcomes (see @references/wave-execution.md for detailed triage patterns):

- **BLOCKED:** Surface immediately with options (fix/skip/adjust). Do not proceed to next wave until resolved.
- **Interrupted/stuck:** Re-dispatch with revised prompt.
- **Silent failure (no files changed):** Treat as BLOCKED.
- **`classifyHandoffIfNeeded` false failure:** If a subagent reports "failed" with this error, it's a Claude Code runtime bug. Spot-check key files on disk — if they exist and no `## Self-Check: FAILED` marker, treat as successful.

**Spot-check:** Verify key files from subagent reports exist on disk (`[ -f path ]`). Check for `## Self-Check: FAILED` marker. Compare each task's `done` criteria against subagent output.

**Quality gate:** Run structural checks per @references/quality-gate.md.
- PASS → proceed to next wave
- WARN → proceed, note in SUMMARY.md "Quality Warnings"
- FAIL → adaptive response per quality-gate.md (retry single task, stop for architectural or multiple failures)

**Pre-wave dependency check (wave 2+ only):** Before dispatching each subsequent wave, verify artifacts from prior waves are present:
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" verify key-links {phase_dir}/{plan}-PLAN.md 2>/dev/null
```
If key-links from prior wave artifacts fail verification, warn about cross-plan wiring gaps. Key-links referencing files in the upcoming wave itself are skipped.

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
5. **Spec test count:** If Step 2f ran, capture the test-spec subagent's reported test count as `spec_tests_count` in `test_metrics`. If Step 2f was skipped, set to 0.
6. **Test creation check:** If the plan included tasks with `tdd="true"` or companion test tasks, verify at least one `*.test.*` or `*.spec.*` file was created or modified in this build (check via `git diff --name-only $WAVE_START_SHA HEAD`). If none found: WARN "Plan required tests but no test files were created — check subagent reports for UNTESTED flags."

If any fail: flag in SUMMARY under "Issues Encountered". Do NOT claim success if verification failed.

### Step 5: Finalize

Read @references/finalize-build.md and execute all steps: reflection, SUMMARY.md generation, concerns review, drift check, persist findings, GSD state updates, phase completion detection, and report + route.

Pass these values: `PHASE_NUM`, `PLAN_NUM`, `PLAN_DESCRIPTION`, `WAVE_START_SHA`, `PLAN_START_EPOCH`, verification results, and subagent reports.

---

## Context Pressure Priority

If context is running low: Step 3 > Step 4 > Step 5. Never skip Step 3 or Step 4.
