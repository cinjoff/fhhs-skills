---
name: refactor
description: Safe code restructuring with behavior preservation. Use when the user says 'refactor', 'restructure', 'reorganize', 'clean up this code', 'extract', 'rename', or 'move'. Not for bugs (/fix) or new features (/build). Tests must stay green at every step.
user-invokable: true
---

Restructure existing code safely. Not a bug (use /fix). Not new functionality (use /build). Behavior preservation is the iron law.

The refactoring goal: $ARGUMENTS

> **Dependency check:** Verify `.planning/PROJECT.md` exists (required — if missing, tell user to run `/fh:new-project` first). Engineering disciplines (verification, review) are built into this plugin.

This command runs in a single context by default. For large refactors (10+ files), write a PLAN.md and delegate to subagents.

---

## Iron Law

**Tests never go red during refactoring.** If a test goes red after a structural change, REVERT immediately. Do NOT debug forward. Revert, understand why, try differently.

---

## Step 1: Scope

Identify the blast radius:
1. Find all files involved in the refactoring target. **Use LSP first — faster and more precise than grep:**
   - `findReferences` on the target symbol to get precise usage sites
   - `incomingCalls`/`outgoingCalls` to map the call graph
   - `documentSymbol` to understand file structure before planning changes
   - For renames: use LSP `rename` — it atomically updates all references across files
2. Map dependencies: what imports/calls the target, what does the target import/call
3. Estimate: how many files change, which subsystems affected

Report: "This refactoring touches N files across M subsystems. Blast radius: [description]."

If large (10+ files or 3+ subsystems), suggest writing a PLAN.md via `/plan-work` first.

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
1. Make the structural change. Use LSP `findReferences` before each modification to verify you've found all usage sites. For symbol renames, prefer LSP `rename` over manual find-and-replace.
2. Run the full test suite
3. **GREEN** → commit: `refactor(scope): <what changed and why>`
4. **RED** → REVERT immediately (`git checkout -- .`), analyze why, try differently

Do NOT fix the test or hack around it. The iron law is absolute.

Report progress after each commit.

---

## Step 5: Review

Dispatch review via `skills/requesting-code-review/` with **`subagent_type: "code-reviewer"`** (specialized agent).

Two review focuses:
1. **Behavior preservation:** "Is behavior unchanged?" — test suite is the evidence. All tests that passed before must still pass.
2. **Structural quality:** "Is the code actually better?" — readability, cohesion, coupling, naming clarity.

If refactoring touches frontend files (`.tsx`, `.css`, component files), add a third focus:
3. **Design consistency:** "Does the restructured code maintain design consistency per `.planning/DESIGN.md`?"

Fix issues. Tests must remain GREEN after fixes.

---

## Step 5b: Simplify

After review fixes, invoke `skills/simplify/` on the refactoring diff. Refactoring often introduces new abstractions or moves code around — simplify catches:

- Extracted utilities that duplicate existing ones elsewhere in the codebase
- Restructured code with missed efficiency opportunities (sequential → parallel, redundant reads)
- Copy-paste remnants from the restructuring

Fix issues. Tests must remain GREEN (iron law still applies). Commit: `refactor(scope): simplify pass`

---

## Step 6: Verify

Invoke `skills/verification-before-completion/`:
- Run FULL test suite (not just affected area) — check exit code
- Verify no behavior changes escaped characterization tests
- Only claim complete with evidence

---

## Step 7: Complete

If on a feature branch, invoke `skills/finishing-a-development-branch/`.

Generate SUMMARY.md with refactoring steps, commit hashes, before/after metrics, test evidence.
Update STATE.md: note refactoring completed, structural changes made.

Report: what was restructured, why it's better, test evidence confirming behavior preserved.
