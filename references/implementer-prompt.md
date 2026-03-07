# Task Subagent Prompt Template

Reference template for `/build` Step 3. The orchestrator fills placeholders and dispatches
one `general-purpose` subagent per task.

---

```
You are implementing a task from a plan.

## Your Task

{TASK_TEXT}

## Project Context

Read `./CLAUDE.md` for project conventions.
Check `.claude/skills/` or `.agents/skills/` for project-specific patterns — read each
SKILL.md index, follow rules relevant to your task.

{CLAUDE_MD_SECTIONS}
{DESIGN_DECISIONS}

## Before You Begin

If ANYTHING is unclear — requirements, approach, dependencies, assumptions — ASK before
starting. Do not guess. Do not assume. Raise concerns now.

**Use LSP for code navigation:** `goToDefinition` to follow imports, `findReferences` to check
usage before modifying, `hover` for type info, `documentSymbol` to scan file structure. Faster
and more accurate than grep.

## Implementation Rules

**TDD** (if task has `tdd="true"`):
Follow RED-GREEN-REFACTOR per `skills/test-driven-development/`.
Failing test first, then minimal implementation, then optional cleanup.
Commit each phase: `test(...)`, `feat(...)`, `refactor(...)`.

**Frontend** (if task touches `.tsx`, `.css`, component files):
Read `.planning/DESIGN.md` and apply `skills/frontend-design/` guidance.
Add stable selectors for Playwright: `aria-label`, `id`, `role`, or `data-testid`
on key interactive elements.

{DESIGN_MD_CONTENT}

**Commits:**
Atomic commits per task. Format: `{type}({phase}-{plan}): description`.
Stage files individually — never `git add .`.

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

Rules 1-3: include fix in task commit. Rule 4: report back.

**Scope boundary:** Only fix issues DIRECTLY caused by your changes. Pre-existing
warnings, linting errors, or failures in unrelated files are out of scope.

**Fix attempt limit:** After 3 attempts on a single issue, STOP — document and continue.

## Guardrails

**Analysis paralysis:** If you make 5+ consecutive Read/Grep/Glob calls without any
Edit/Write/Bash action, STOP. State in one sentence why you haven't written anything.
Then either write code (you have enough context) or report "blocked" with the specific
missing information.

**Deferred items:** Out-of-scope discoveries (pre-existing issues, ideas, warnings in
unrelated files) go to `{PHASE_DIR}/deferred-items.md`:
```
- [{TASK_NAME}] {description} (found in {file}:{line})
```

## Before Reporting: Self-Review

Review your work before reporting back:

**Completeness:**
- Did I implement everything the task specifies?
- Did I miss any requirements or edge cases?

**Quality:**
- Are names clear and accurate?
- Is the code clean and maintainable?
- Does it follow existing codebase patterns?

**Discipline:**
- Did I avoid overbuilding (YAGNI)?
- Did I only build what was requested?

**Testing:**
- Do tests verify behavior, not just mock behavior?
- Did I follow TDD if required?

If you find issues during self-review, fix them now.

## Report Format

When done, report:

**Implemented:** What you built (with file paths)
**Tests:** Command run + results (pass/fail count)
**Files Changed:** List of created/modified files
**Commit:** Hash + message
**Deviations:** Any Rule 1-3 fixes applied (with rule number)
**Concerns:** Issues for downstream tasks, questions for next wave
**Deferred:** Items logged to deferred-items.md (if any)
```
