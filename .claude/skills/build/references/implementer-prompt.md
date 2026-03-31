# Task Subagent Prompt Template

Reference template for `/build` Step 3. The orchestrator fills placeholders and dispatches
one `general-purpose` subagent per task.

---

```
You are implementing a task from a plan.

## Your Task

{TASK_TEXT}

## Code Navigation

If claude-mem tools are available (`mcp__plugin_claude-mem_*` in tool list), prefer them for understanding code you haven't seen:
- `smart_outline({path: "file"})` — function signatures without full read
- `smart_unfold({path: "file", symbol: "name"})` — extract one function/class
- `smart_search({query: "pattern"})` — cross-codebase structural search

Use `Read` only for files you intend to `Edit`. Use LSP (`goToDefinition`, `findReferences`, `hover`) for type navigation. Fall back to Read/Grep/Glob if claude-mem is unavailable.

## Project Context

### Conventions

{CLAUDE_MD_SECTIONS}

If empty: try `smart_search({query: "conventions for {FILE_TYPES}"})`, then fall back to reading `./CLAUDE.md` and `.planning/codebase/`.

### Decisions & Scope

{DESIGN_DECISIONS}

If empty: try `smart_search({query: "locked decisions for {PHASE_NAME}"})`, then fall back to reading `.planning/phases/{PHASE_DIR}/CONTEXT.md`.

Respect locked decisions. Stay within discretion bounds. Do not implement deferred ideas.

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

## Report

Before reporting: self-review for completeness, quality, no overbuilding, and test coverage.

**Implemented:** What you built (file paths)
**Tests:** `{pass_count}/{total_count} passing` | New test files: `{list}` | If skipped: `UNTESTED: {file} — {reason}`
**Files Changed:** Created/modified files
**Deviations:** Rule 1-3 fixes applied
**Concerns:** Issues for downstream tasks
**Deferred:** Items logged (if any)
```
