---
description: "Safe code restructuring with behavior preservation. Use when the user says 'refactor', 'restructure', 'reorganize', 'clean up this code', 'extract', 'rename', or 'move'. Not for bugs (/fix) or new features (/build). Tests must stay green at every step."
---

Restructure existing code safely. Not a bug (use /fix). Not new functionality (use /build). Behavior preservation is the iron law.

The refactoring goal: $ARGUMENTS

> **Dependency check:** Read `references/dependency-check.md` from the fhhs-skills plugin directory. Verify Superpowers is available (required for verification and review). GSD and Impeccable are optional.

This command runs in a single context by default. For large refactors (10+ files), write a PLAN.md and delegate to subagents.

---

## Iron Law

**Tests never go red during refactoring.** If a test goes red after a structural change, REVERT immediately. Do NOT debug forward. Revert, understand why, try differently.

---

## Step 1: Scope

Identify the blast radius:
1. Find all files involved in the refactoring target
2. Map dependencies: what imports/calls the target, what does the target import/call
3. Estimate: how many files change, which subsystems affected

Report: "This refactoring touches N files across M subsystems. Blast radius: [description]."

If large (10+ files or 3+ subsystems), suggest writing a PLAN.md via `/plan` first.

---

## Step 2: Capture Baseline

Run the existing test suite for the affected area. Record: X tests, all GREEN.

**If coverage is insufficient** (key behaviors have no tests):
1. Write characterization tests capturing current behavior — not desired behavior
2. These document what the code does today, even if imperfect
3. Commit: `test(refactor): add characterization tests for <area>`
4. Run again — all GREEN

**Baseline established.** From here, tests must stay GREEN at every step.

---

## Step 3: Plan Atomic Steps

Break refactoring into the smallest atomic steps where each:
- Makes exactly one structural change
- Preserves all behavior (tests stay GREEN)
- Can be committed independently

Order: safest and most independent changes first, riskiest last.

Present the step sequence to the user. Wait for approval.

---

## Step 4: Execute

For each step:
1. Make the structural change
2. Run the full test suite
3. **GREEN** → commit: `refactor(scope): <what changed and why>`
4. **RED** → REVERT immediately (`git checkout -- .`), analyze why, try differently

Do NOT fix the test or hack around it. The iron law is absolute.

Report progress after each commit.

---

## Step 5: Review

Two-stage review via `superpowers:requesting-code-review`:
1. **Spec compliance:** "Is behavior unchanged?" — test suite is the evidence
2. **Code quality:** "Is structure actually better?" — readability, cohesion, coupling

If refactoring touches frontend files (`.tsx`, `.css`, component files), add a third review pass:
3. **Design consistency:** "Does the restructured code maintain design consistency per `.planning/DESIGN.md`?"

Fix issues. Tests must remain GREEN after fixes.

---

## Step 6: Verify

Invoke `superpowers:verification-before-completion`:
- Run FULL test suite (not just affected area) — check exit code
- Verify no behavior changes escaped characterization tests
- Only claim complete with evidence

---

## Step 7: Complete

If on a feature branch, invoke `superpowers:finishing-a-development-branch`.

If GSD project active:
- Generate SUMMARY.md with refactoring steps, commit hashes, before/after metrics, test evidence
- Update STATE.md: note refactoring completed, structural changes made

Report: what was restructured, why it's better, test evidence confirming behavior preserved.
