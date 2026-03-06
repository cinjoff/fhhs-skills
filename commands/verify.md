---
description: "Standalone verification of work. Combines GSD goal-backward verification with Superpowers evidence-based verification."
---

Standalone verification of work. Combines GSD goal-backward verification with Superpowers evidence-based verification.

What to verify (phase number, branch name, or leave blank for current work): $ARGUMENTS

This command runs in a single context. No subagents — verification should be direct and observable.

---

## Step 1: Detect Scope

Determine what to verify:

| Argument | Action |
|----------|--------|
| Phase number (e.g., "13") | Load all PLAN.md in `.planning/phases/{phase}/`. Extract `must_haves`. |
| Branch name | Run `git diff {base}...HEAD`. Infer truths from diff and associated PLAN.md files. |
| No argument | Read `.planning/STATE.md` for current position. Find most recent phase with plans. |

Report: "Verifying [scope]: N plans, M must-have truths, K requirement IDs."

---

## Step 2: Goal-Backward Verification

For each `must_haves.truth` across all plans in scope:

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | {truth} | VERIFIED / FAILED | {file path, content snippet, test output} |

**Artifacts (GSD mode — use gsd-tools):**

```bash
# For each PLAN.md in scope:
node ./.claude/get-shit-done/bin/gsd-tools.cjs verify artifacts "${PLAN_PATH}"
```

This checks that all `must_haves.artifacts` exist on disk with expected content markers. If gsd-tools unavailable, manually check file existence and content markers.

**Key links (GSD mode — use gsd-tools):**

```bash
node ./.claude/get-shit-done/bin/gsd-tools.cjs verify key-links "${PLAN_PATH}"
```

This verifies that artifacts are wired together as specified in `must_haves.key_links`. If gsd-tools unavailable, manually grep for cross-references and verify paths.

**Requirements** (GSD only): Does every requirement ID from ROADMAP appear in at least one SUMMARY.md's `requirements-completed`?

---

## Step 3: Evidence-Based Verification

**REQUIRED SUB-SKILL:** Follow `superpowers:verification-before-completion` completely.

1. Run test suites relevant to scope — read full output, check exit codes
2. Run build commands if applicable — verify clean build
3. Run linter/type-checker if applicable — verify no new errors
4. Verify file existence for all expected artifacts

**No claims without fresh proof.** Every "VERIFIED" in the truth table must have a command run or file read backing it.

If any files in scope are `.tsx`, `.css`, or component files: "Frontend files in scope — consider running `/verify-ui` for visual verification."

---

## Step 4: Anti-Pattern Detection

**GSD mode — use gsd-tools for structural checks:**

```bash
# Check all plans have summaries
node ./.claude/get-shit-done/bin/gsd-tools.cjs verify phase-completeness "${PHASE_NUM}"

# Check plan structure is valid
node ./.claude/get-shit-done/bin/gsd-tools.cjs verify plan-structure "${PLAN_PATH}"
```

Then manually check for:
- **Orphaned artifacts** — files created but not referenced by anything
- **Missing tests** — new behavior without corresponding test files
- **Uncommitted changes** — `git status` shows modified files not yet committed
- **Partial completion** — PLAN.md tasks where `<done>` criteria aren't met

---

## Step 5: Report

**If GSD phase — scaffold with gsd-tools:**

```bash
node ./.claude/get-shit-done/bin/gsd-tools.cjs template fill verification \
  --phase "${PHASE_NUM}" \
  --fields '{"status":"passed|failed", "score":"N/M"}'
```

Then fill in body tables: truth table, artifacts, key link verification, requirements coverage, anti-patterns.

If gsd-tools unavailable, write `{phase}-VERIFICATION.md` manually:

```yaml
---
phase: {phase}
verified: {ISO timestamp}
status: passed|failed
score: N/total must-haves verified
---
```

Update STATE.md with verification result.

**Always:** Print terminal report with PASSED/FAILED, score, truth table, gaps.

**If FAILED:** Suggest next actions:

| Gap type | Suggestion |
|----------|-----------|
| Bug / test failure | `/fix` |
| Missing functionality | `/plan` |
| Structural issue | `/refactor` |
| Minor gap | Describe what's needed |

---

## Step 5.5: Gap-Closure Plans (if FAILED)

For each FAILED truth in the truth table, auto-generate a lightweight gap-closure plan:

1. Write to `.planning/phases/{phase}/XX-NN-gap-PLAN.md` with `gap_closure: true` in frontmatter
2. Each plan has 1 task: the specific fix needed, with the failed truth as the `done` criterion
3. These are intentionally single-task — an exception to /plan's 2-3 task scope guideline
4. `/build` processes them like normal plans (they match `*-PLAN.md` and lack a SUMMARY.md)

Report: "Created N gap-closure plans. Run `/build` or `/fix` to address."
