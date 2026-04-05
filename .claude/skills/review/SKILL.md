---
name: fh:review
description: Code review. Checks quality, architecture, and whether the code actually achieves the goal. Use --quick for a fast check.
user-invocable: true
---

> **Project context check:** If `.planning/PROJECT.md` exists, read it for project context. If missing, show a one-time note: "Tip: Run `/fh:new-project` to set up project tracking for richer reviews." — then continue with the review normally using git diffs. Do NOT block the review.

Comprehensive code review — quality, architecture, spec verification, goal verification, gap analysis.

Context or flags: $ARGUMENTS

You are a **lean orchestrator**. Stay under 15% context usage. Delegate all analysis to subagents.

**IMPORTANT:** This skill does NOT touch GSD state (STATE.md, ROADMAP.md). State updates are the caller's responsibility.

---

## Modes

| Flag | What runs | When to use |
|------|-----------|-------------|
| *(default — full)* | All steps including Step 2.5 (Quality Refinement) | Deep scrutiny before promoting |
| `--quick` | Steps 1, 1.5, 1.7, 1.8, 2, 3, 4, 5, 6, 7 — **skips Step 2.5** | Fast pre-commit sanity check |

---

## Step 1: Scope

Determine the diff range, file list, and project type.

```bash
BASE_BRANCH=$(git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null || echo "HEAD~10")
git diff --stat "$BASE_BRANCH..HEAD" -- ':!.planning/' ':!*.lock' ':!pnpm-lock.yaml' ':!package-lock.json' ':!yarn.lock' ':!.next/' ':!*.map'
```

**IMPORTANT — diff pathspec exclusions:** Every `git diff` command in this skill MUST include the pathspec exclusions as literal arguments (not via a shell variable — variable expansion of pathspecs breaks in fish and some bash configurations):
```
-- ':!.planning/' ':!*.lock' ':!pnpm-lock.yaml' ':!package-lock.json' ':!yarn.lock' ':!.next/' ':!*.map'
```
Also always quote the diff range as `"$BASE_BRANCH..HEAD"` to prevent word-splitting issues.

Detect project type:
- **Next.js** — `next.config.*` exists
- **TypeScript** — `tsconfig.json` exists
- **GSD project** — `.planning/` directory with PLAN.md files

Record: `BASE_BRANCH`, file list, project type, total lines changed.

---

## Step 1.5: Runtime Error Check

Check if the local error store has runtime errors related to the changed code.

1. Check if `.sentry-local/events.db` exists:
```bash
[ -f ".sentry-local/events.db" ] && echo "STORE_EXISTS" || echo "NO_STORE"
```

2. If `STORE_EXISTS`, query recent errors:
```bash
node lib/sentry-local-query.mjs recent --minutes 120
```

3. Cross-reference errors against the diff file list from Step 1. Match on **basename** (e.g. `login.ts`), not full path — sentry stack traces use absolute paths while git diff uses relative paths.
   - If errors reference files in the diff (by basename match) → flag as "Runtime errors in changed code" and pass to Agent 2 (Gap Analysis) as additional input
   - If errors exist but don't match the diff → note in report as "Unrelated runtime errors detected (N)" but don't block
   - If no errors → note "No runtime errors" in the report

4. If `NO_STORE`: skip this step silently. Do not mention observability in the report.

Budget: less than 2% context. Don't deep-dive errors — just surface file matches for the gap analysis agent.

---

### Past Learnings Check

Follow **Pattern A** (Past Learnings Check) from `shared/claude-mem-rules.md`. Keywords: primary module name, file paths from diff scope, "review gap anti-pattern regression". Use findings to bias agent dispatch toward known weak spots.

---

## Step 1.7: Static Analysis (if available)

If `fallow` is installed, run static analysis to provide ground truth data for the review agents.

```bash
if command -v fallow &>/dev/null; then
  FALLOW_CHECK=$(fallow check --changed-since "$BASE_BRANCH" --format json --quiet 2>/dev/null) || FALLOW_CHECK=""
  FALLOW_DUPES=$(fallow dupes --format json --quiet 2>/dev/null) || FALLOW_DUPES=""
  FALLOW_HEALTH=$(fallow health --format json --quiet 2>/dev/null) || FALLOW_HEALTH=""
fi
```

**Post-filter:** For `FALLOW_DUPES` and `FALLOW_HEALTH`, filter to entries involving files in the diff (from Step 1's file list). Cap each output at 200 lines. Skip injection for any empty outputs.

If Fallow ran successfully and produced non-empty output, include it in the agent prompts dispatched in Step 2:
- **Agent 1 (Code Quality + Architecture):** receives all three non-empty outputs — dead code, circular deps, duplication, complexity
- **Agent 2 (Gap Analysis):** receives `FALLOW_CHECK` — unused exports/files for unwired code detection

If fallow is NOT installed or all commands fail: skip silently. Do not mention Fallow in the report.

Budget: less than 1% context. Fallow runs in <1 second.

---

## Step 1.8: Spec Verification (GSD projects only)

Only runs if a `.planning/` directory exists with PLAN.md files in scope.

Dispatch one `fh:code-reviewer` agent using `references/spec-gate-prompt.md` (co-located with this skill).

Agent receives:
- **Task specs:** done criteria from the relevant PLAN.md tasks
- **Branch diff:** `git diff $BASE_BRANCH..HEAD with pathspec exclusions`
- **Fallow output:** if available from Step 1.7, include `FALLOW_CHECK` under the `{FALLOW_OUTPUT}` placeholder

Agent checks:
- Missing requirements (spec says X — does code do X?)
- Stubs and placeholders (TODO/FIXME/PLACEHOLDER, hardcoded returns, no-op handlers)
- Unwired code (files created but never imported, functions never called)
- TypeScript strictness (`any` usage, unguarded `as` assertions, non-exhaustive switches)
- Wrong behavior (logic errors, type mismatches)

Results feed into Step 5 aggregation as "Spec verification" findings. A BLOCKING result from this agent is a blocking finding in the gate decision.

If no PLAN.md is in scope: skip this step silently.

Use **Pattern B** (Code Structure Exploration) from `shared/claude-mem-rules.md` for reading PLAN.md criteria and reviewing changed file context. Prefer smart_outline/smart_unfold over full Read.

---

## Step 2: Dispatch Analysis (full and --quick modes)

Based on mode, dispatch parallel subagents. Each agent receives ONLY the diff + its specific checklist — keep agent context lean.

### Full mode — dispatch 2 parallel agents:

**Agent 1 — Code Quality + Architecture** (`subagent_type: "fh:code-reviewer"`)
- Prompt: `skills/review/references/review-prompt.md`
- Also include: `skills/review/references/production-safety-checklist.md` (two-pass safety review)
- If Fallow data is available from Step 1.7, include it in the agent prompt under '## Static Analysis Findings'
- Input: full diff (`git diff $BASE_BRANCH..HEAD with pathspec exclusions`)
- Covers: naming, structure, error handling, DRY, complexity, test quality, cross-file consistency, dependency direction, separation of concerns, abstraction quality, API design, cross-cutting concerns
- If Next.js: include `.claude/skills/nextjs-perf/PROMPT.md` criteria
- **Note:** The production safety checklist has an explicit suppressions section — the subagent must honor it to reduce noise.

**Agent 2 — Gap Analysis** (`subagent_type: "fh:code-reviewer"`)
- Prompt: gap analysis section of `skills/review/references/review-prompt.md`
- Input: full diff
- If Fallow data is available from Step 1.7, include the `FALLOW_CHECK` unused-exports findings in the agent prompt
- Covers: untested code paths, unhandled error states, incomplete features (TODO/FIXME/PLACEHOLDER), missing edge cases, API contract gaps

For security vulnerability detection, run `/fh:secure` or configure a pre-PR hook (see `/fh:setup`).

### --quick mode — dispatch 1 agent:

**Agent 1 — Code Quality** (`subagent_type: "fh:code-reviewer"`)
- Same as full mode Agent 1, but skip architecture deep-dive
- Focus: naming, structure, error handling, test quality, cross-file consistency

---

## Step 2.5: Quality Refinement (full mode only)

**Triage findings from Steps 2 and dispatch sub-skills as needed.**

This step runs only in full mode (not `--quick`). Skip entirely in `--quick` mode.

### a. Evaluate findings against the trigger table

After Agent 1 (Code Quality) and Agent 2 (Gap Analysis) return, evaluate each finding category:

| Finding pattern | Sub-skill | Trigger condition |
|---|---|---|
| DRY violations, code duplication, redundant patterns | `/fh:simplify` | 2+ DRY/duplication findings |
| Unhandled error paths, missing edge cases, brittle patterns | `/fh:harden` | Any unhandled error path in changed code |
| Cross-device/responsive issues, accessibility gaps | `/fh:adapt` | Frontend files changed + accessibility/responsive findings |
| Design system drift, inconsistent tokens/spacing | `/fh:normalize` | Frontend files + design system defined in DESIGN.md |
| Visual quality issues, layout problems, AI slop | `/fh:ui-critique` | Visual file ratio > 30% OR explicit UI concerns in findings |
| Final polish pass | `/fh:polish` | Only after other sub-skills ran AND findings remain |

If **no findings trigger any sub-skill**: skip to Step 3 entirely. Most reviews won't need this step.

### b. Dispatch a single "quality-refine" subagent

If any trigger condition is met, dispatch **one** `quality-refine` subagent (general-purpose). Do NOT dispatch N sequential inline skill calls.

The subagent receives:
- Findings from Agent 1 and Agent 2 (verbatim)
- The trigger table above
- The changed file list (from Step 1)
- Project name (so subagent can call `mcp__plugin_claude-mem_mcp-search__smart_search` for cross-session pattern detection)

The subagent:
1. Decides which sub-skills to apply based on findings and the trigger table
2. Runs triggered sub-skills **in sequence**, scoped to changed files only — not the whole codebase
3. Reports back with: which sub-skills ran, what was changed, any remaining issues

### c. Performance checks (conditional)

- If Next.js project detected (Step 1) AND performance-related findings: reference `.claude/skills/nextjs-perf/PROMPT.md` criteria
- If frontend changes AND significant bundle/render concerns: suggest `/fh:ui-test` for visual verification

### d. Cross-session pattern detection

Use **Pattern A** from `shared/claude-mem-rules.md` to check if the same quality issues were flagged in prior reviews. Keywords: each triggered sub-skill category + primary module name. If a pattern recurs 3+ times: escalate severity (Minor → Important, Important → Critical) and annotate "⚠ Recurring pattern (seen N times)". Pass recurring-pattern context to the quality-refine subagent. Skip silently if claude-mem unavailable.

### e. Failure handling

If the quality-refine subagent times out or fails: log a warning ("Quality refinement skipped: subagent timeout/error") and continue to Step 3. Do NOT block the review.

---

## Step 3: Goal Verification (all modes)

**Inline — no subagent.** Runs only if a `.planning/` directory exists with PLAN.md files in scope.

For each relevant PLAN.md:

1. **Extract must_haves** — parse the must_have checklist from the plan. If frontmatter has `must_haves.truths`, use those. If not, check ROADMAP.md success_criteria for the phase. If neither exists, derive truths from the phase goal.

2. **Three-level artifact check** — for each artifact in the diff:

| Exists | Substantive | Wired | Status |
|--------|-------------|-------|--------|
| ✓ | ✓ | ✓ | PASS |
| ✓ | ✓ | ✗ | ORPHANED (blocking — exists but not imported/used) |
| ✓ | ✗ | — | STUB (placeholder, TODO, empty return, log-only) |
| ✗ | — | — | MISSING |

   - **Exists:** file is present
   - **Substantive:** not a stub — no placeholder comments, hardcoded returns, or empty handlers
   - **Wired:** imported and used (grep for import + usage outside the defining file)

3. **Export-level spot check** — for artifacts that pass Level 3 (wired), extract key exported symbols (functions, constants, classes — skip types/interfaces) and grep for call sites outside the defining file. Flag exports with zero external call sites as "exported but unused" (WARNING severity).

4. **Anti-pattern scan** — scan changed files for:

| Pattern | Severity |
|---------|----------|
| TODO/FIXME/XXX/HACK | Warning |
| `placeholder`, `coming soon`, `will be here` | Blocking |
| `return null` / `return {}` / `return []` / `=> {}` in non-trivial handlers | Warning |
| Functions containing only `console.log` | Warning |
| Hardcoded test/mock data in non-test files | Warning |

5. **Tool-assisted checks** — run if available:
   - `gsd-tools.cjs verify artifacts` — structured artifact check
   - `gsd-tools.cjs verify key-links` — wiring verification

6. **Truth table output:**

```
| must_have | evidence | status |
|-----------|----------|--------|
| User can log in | src/auth/login.ts exists, login.test.ts passes | PASS |
| Error boundary on /dashboard | No ErrorBoundary component found | FAIL |
```

Mark each as PASS / FAIL / PARTIAL. Any FAIL or STUB or ORPHANED is a blocking finding.

---

## Step 4: Evidence Collection (full and --quick modes)

Run verification commands fresh. Non-negotiable — no cached results.

```bash
# Tests
npm test 2>&1; echo "EXIT:$?"
# Build
npm run build 2>&1; echo "EXIT:$?"
# Lint
npm run lint 2>&1; echo "EXIT:$?"
```

Record: test count, pass/fail, build exit code, lint exit code, raw output excerpts.

**If frontend work** (`.tsx`/`.css` files changed): suggest `/fh:ui-test` for visual verification but don't block on it.

**If Step 2.5 dispatched sub-skills:** Re-run tests after sub-skill execution to verify refinements didn't introduce regressions. If tests fail post-refinement, flag as a blocking finding and report which sub-skill introduced the failure.

---

## Step 5: Aggregate + Classify

Collect all findings from Steps 1.8, 2, 3, and 4. Deduplicate (same file:line across agents). Classify:

| Source | Severity scale |
|--------|---------------|
| Code quality / architecture | Critical / Important / Minor / Nitpick |
| Gap analysis | Critical / Important / Minor |
| Spec verification | BLOCKING / WARN / PASS |
| Goal verification | PASS / FAIL / PARTIAL / ORPHANED / STUB |
| Evidence (tests/build/lint) | PASS / FAIL |
| Runtime errors | CRITICAL (in changed files) / INFO (unrelated) |

Sort: all blocking items first, then warnings, then informational.

---

## Step 6: Report + Route

Generate a structured report. For each finding above Minor, include a **Next action** recommendation:

| Finding type | Recommended action |
|---|---|
| Bug / broken behavior | `/fh:fix` |
| Structural / architectural issue | `/fh:refactor` |
| Missing functionality / incomplete feature | `/fh:plan-work` |
| Goal verification failure | `/fh:plan-work` for gap-closure |
| Style / naming | Fix directly |

### Report format:

```
## Comprehensive Review Report

### Code Quality + Architecture
- Score: X/10
- Critical: N | Important: N | Minor: N | Nitpick: N
- Key findings: [summary with next-action routing]

### Spec Verification (if applicable)
- Status: PASS/FAIL
- N issues found
- Truth table: [if applicable]
- Key findings: [summary with next-action routing]

### Gap Analysis
- Untested paths: N | Unhandled errors: N | Incomplete features: N
- Key findings: [summary with next-action routing]

### Goal Verification (if applicable)
- must_haves: N total | N PASS | N FAIL | N PARTIAL
- Truth table: [inline]
- Blocking gaps: [summary with next-action routing]

### Evidence
- Tests: N passed, N failed (exit code X)
- Build: PASS/FAIL (exit code X)
- Lint: PASS/FAIL (exit code X)
- [raw output excerpts as proof]

### Runtime Errors (if store exists)
- In changed files: N errors (details passed to gap analysis)
- Unrelated: N errors (INFO — not blocking)

### Gate Decision: PASS / WARN / BLOCK
- [reasoning]

### Recommended Next Actions
1. [ordered list of actions with skill routing]

### Recurring Findings (if any)
<!-- Only include if cross-session pattern detection found patterns seen 3+ times -->
- ⚠ {pattern} — seen N times across sessions → escalated to {severity}
- Suggestion: run `/fh:learnings` to persist these patterns to CLAUDE.md so future sessions are aware from the start
```

---

## Step 7: Gate Decision

| Finding | Decision |
|---------|----------|
| Code review Critical / Important | **BLOCK** — must fix |
| Spec verification BLOCKING | **BLOCK** — must fix before promoting |
| Goal verification FAIL | **BLOCK** — must close gaps |
| Evidence failures (tests/build/lint red) | **BLOCK** — must fix |
| Runtime errors in changed files | **WARN** — likely related to this work |
| MEDIUM code quality / Minor code | **PASS** with notes |
| Nitpick | **PASS** — note only |

**If BLOCKED:** Report all blocking findings with next-action routing. Do NOT auto-fix — present the findings and let the user decide which action to take (`/fh:fix`, `/fh:refactor`, `/fh:plan-work`, or manual).

**If WARN:** Present warnings. Proceed to Step 8 unless user wants to fix.

**If PASS:** Proceed to Step 8.

---

---

## Step 8: Promote

If all gates pass (or user explicitly overrides), read `skills/finishing-a-development-branch/PROMPT.md` and follow it.

**Conventional commit enforcement:** PR title / merge commit must follow:
```
type(scope): summary
```
Where `type` is one of: `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`, `perf`, `build`, `ci`.

Derive the type and scope from the diff analysis. Present options:
- Create PR
- Merge to main
- Keep branch (more work planned)
- Discard

---

### Persist Findings

Follow **Pattern D** (Persist Findings) from `shared/claude-mem-rules.md`. Use tag `[review-learning]`.

---

*Production safety checklist adapted from gstack review/checklist.md (v0.3.3).*
