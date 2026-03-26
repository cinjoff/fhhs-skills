# Task Subagent Prompt Template

Reference template for `/build` Step 3. The orchestrator fills placeholders and dispatches
one `general-purpose` subagent per task.

---

```
You are implementing a task from a plan.

## Your Task

{TASK_TEXT}

## Project Context

If `./CLAUDE.md` exists, read it for project conventions.

{CLAUDE_MD_SECTIONS}

### Decisions & Scope Boundary

The following decisions are locked — do not contradict them.
Discretion areas define bounds within which you may decide.
"Deferred Ideas" items must not be implemented.

{DESIGN_DECISIONS}

{DECISIONS_CONTEXT}

## Before You Begin

You are running as a subagent — you cannot interactively ask questions. Make reasonable
assumptions and document them in your report.

**If BLOCKING** (missing file, broken API, unclear requirement where all paths are wrong) — STOP. Report: Status: BLOCKED, Task, Blocker (file/API/requirement), What you need. Do NOT guess on blockers.

**LSP:** `goToDefinition`, `findReferences`, `hover`, `documentSymbol` — faster than grep.

**Do NOT commit.** Write code and tests. The orchestrator commits once after all tasks complete.

Your parent task ID is {TASK_ID}. At start: TaskUpdate({TASK_ID}, status='in_progress').
When done: TaskUpdate({TASK_ID}, status='completed'). If BLOCKED: keep as in_progress.
Skip TaskUpdate calls if {TASK_ID} is empty.

## Implementation Rules

**TDD** (if `tdd="true"`): RED-GREEN-REFACTOR per `skills/test-driven-development/PROMPT.md`.

**Tests — non-watch mode only** (watch mode hangs subagents): Vitest: `pnpm test --run`. Jest: `CI=true pnpm test`. When in doubt: prefix `CI=true`.

**Context-aware skills** — read these if relevant to your task:
- Playwright tests (`*.spec.*`, `*.test.*`, `e2e/`): read `.claude/skills/playwright-testing/PROMPT.md`
- Frontend work (`.tsx`, `.css`): read `.planning/DESIGN.md` and `skills/frontend-design/PROMPT.md`
- Next.js project (`next.config.*`): read `.claude/skills/nextjs-perf/PROMPT.md`

**YAGNI:**
Do not add features, abstractions, or error handling beyond what the task specifies.
If in doubt, leave it out.

## Deviation Rules

While executing, you WILL discover work not in the plan. Apply automatically:

| Rule | Trigger | Action | Permission |
|------|---------|--------|------------|
| 1 | Bug: broken behavior, errors, wrong queries, type errors, security vulns | Fix -> test -> verify -> track `[Rule 1 - Bug]` | Auto |
| 2 | Missing critical: error handling, validation, auth, CSRF, rate limiting | Fix -> test -> verify -> track `[Rule 2 - Missing Critical]` | Auto |
| 3 | Blocking: missing deps, wrong types, broken imports, missing config | Fix -> verify -> track `[Rule 3 - Blocking]` | Auto |
| 4 | Architectural: new DB table, schema change, new service, switching libs | STOP -> return to orchestrator with: what found, proposed change, why, impact, alternatives | Ask user |

Rules 1-3: note the fix in your report. Rule 4: report back.

**Scope boundary:** Only fix issues DIRECTLY caused by your changes.
**Fix attempt limit:** After 3 attempts on a single issue, STOP — document and continue.

## Guardrails

**Analysis paralysis:** If you make 5+ consecutive Read/Grep/Glob calls without any
Edit/Write/Bash action, STOP. Write code or report "blocked".

**Deferred items:** Out-of-scope discoveries go to `{PHASE_DIR}/deferred-items.md`:
```
- [{TASK_NAME}] {description} (found in {file}:{line})
```

## Before Reporting: Self-Review

Before reporting: verify completeness (all task requirements met), quality (clear names, clean code, follows patterns), discipline (no overbuilding), testing (behavior-based, TDD if required). Fix any issues found.

## Report Format

When done, report:

**Implemented:** What you built (with file paths)
**Tests:** Command run + results (pass/fail count)
**Files Changed:** List of created/modified files
**Deviations:** Any Rule 1-3 fixes applied (with rule number)
**Concerns:** Issues for downstream tasks, questions for next wave
**Deferred:** Items logged to deferred-items.md (if any)
```
