---
name: review
description: Pre-promotion code review workflow. Orchestrates quality review, security scan, evidence verification, and TypeScript strictness check before PR/merge. Use when the user says 'review', 'ready to merge', 'create PR', 'promote', or 'ship it'.
user-invokable: true
---

Pre-promotion review workflow. Orchestrates quality, security, evidence verification, and TypeScript strictness before promoting changes.

Context or flags: $ARGUMENTS

You are a **lean orchestrator**. Stay under 15% context usage. Delegate review work to specialized agents.

**IMPORTANT:** This skill does NOT touch GSD state (STATE.md, ROADMAP.md). GSD state updates are the caller's responsibility (e.g., /build Step 6). This is a pure quality gate.

---

## Step 1: Code Quality Review

Dispatch a code quality review via `skills/requesting-code-review/` with **`subagent_type: "code-reviewer"`** (specialized agent).

**Scope:** Full diff from branch base to HEAD.
```bash
BASE_BRANCH=$(git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null || echo "HEAD~10")
git diff $BASE_BRANCH..HEAD
```

**Focus areas:**
- Code quality: naming, structure, error handling, DRY
- Test quality: tests verify behavior (not mocks), edge cases covered
- Cross-file consistency: shared patterns, naming conventions, type alignment
- Architecture: separation of concerns, scalability

**If Next.js project** (check for `next.config.*`): include `skills/nextjs-perf/` patterns as review criteria — client-side waterfalls, caching (React.cache/LRU), unnecessary client components, barrel import bundle bloat.

Use the enhanced review template at `skills/review/references/review-prompt.md` for the reviewer prompt.

Collect findings classified as: Critical, Important, Minor, Nitpick.

---

## Step 2: Security Scan

Invoke `skills/secure/` on changed files.

The security scan dispatches 4 parallel agents covering:
- Injection + XSS
- Auth + Session
- Data Exposure
- Access Control + Config

Collect the gate output: `BLOCK`, `WARN`, or `PASS`.

---

## Step 3: Evidence Verification

Invoke `skills/verification-before-completion/` — follow it completely. This is **NON-NEGOTIABLE**. Every promotion must have evidence backing.

This means:
- Run all verification commands fresh (tests, build, linter)
- Read full output, check exit codes
- No claims without proof
- Record: test count, pass/fail, build status, lint status

**If frontend work** (`.tsx`/`.css` files changed): suggest `/fh:verify-ui` for visual verification but don't block on it.

---

## Step 4: TypeScript Strictness Check

Grep the diff for TypeScript strictness violations:

```bash
BASE_BRANCH=$(git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null || echo "HEAD~10")
# Check for 'any' usage in added lines
git diff $BASE_BRANCH..HEAD | grep '^\+' | grep -v '^\+\+\+' | grep -E '\bany\b' || echo "No 'any' found"
# Check for type assertions in added lines
git diff $BASE_BRANCH..HEAD | grep '^\+' | grep -v '^\+\+\+' | grep -E '\bas\b\s+\w' || echo "No type assertions found"
# Check for non-exhaustive switch/case (missing default)
git diff $BASE_BRANCH..HEAD | grep '^\+' | grep -v '^\+\+\+' | grep -E 'switch\s*\(' || echo "No switch statements found"
```

Report violations:
- `any` usage count and locations
- `as` type assertion count and locations
- Switch statements without exhaustive handling (check if `default` or `satisfies` is present)

---

## Step 5: Gate Decision

Aggregate all findings from Steps 1-4:

| Finding | Decision |
|---------|----------|
| CRITICAL security findings | **BLOCK** — Must fix before proceeding. Dispatch fix agents. |
| Code review Critical/Important | **BLOCK** — Must fix. |
| Verification failures (tests/build/lint red) | **BLOCK** — Must fix. |
| TypeScript `any` usage in new code | **BLOCK** — Must replace with proper types. |
| HIGH security findings | **WARN** — Log in review report, recommend fixing. |
| Code review Minor + MEDIUM/LOW security | **PASS** with notes. |
| Code review Nitpick | **PASS** — note only, don't block or warn. |

**If BLOCKED:**
1. Report all blocking findings to user
2. For security CRITICAL: dispatch fix agents (`general-purpose`) with finding details + file context
3. For code review Critical/Important: fix directly or dispatch agents
4. For verification failures: diagnose and fix
5. For `any` usage: replace with proper types
6. After fixes: **re-run the blocked steps** (not the entire pipeline — only re-check what failed)

**If WARN:** Present warnings to user. Proceed to Step 6 unless user wants to fix.

**If PASS:** Proceed to Step 6.

---

## Step 6: Review Report

Generate a structured review report:

```
## Pre-Promotion Review Report

### Code Quality
- Score: X/10
- Critical: N | Important: N | Minor: N | Nitpick: N
- Key findings: [summary]

### Security
- Status: PASS/WARN/BLOCK
- CRITICAL: N | HIGH: N | MEDIUM: N | LOW: N
- Key findings: [summary]

### Verification Evidence
- Tests: N passed, N failed (exit code X)
- Build: PASS/FAIL (exit code X)
- Lint: PASS/FAIL (exit code X)
- [raw output excerpts as proof]

### TypeScript Strictness
- `any` usage: N instances
- Type assertions (`as`): N instances
- Non-exhaustive switches: N instances

### Gate Decision: PASS / WARN / BLOCK
- [reasoning]
```

---

## Step 7: Promote

If all gates pass (or user explicitly overrides warnings), invoke `skills/finishing-a-development-branch/`.

**Conventional commit enforcement:** The PR title / merge commit message must follow:
```
type(scope): summary
```
Where `type` is one of: `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`, `perf`, `build`, `ci`.

If the caller provided context about what was built/fixed, use it to derive the conventional commit title. Otherwise, analyze the diff to determine the appropriate type and scope.

Present the user with options from `skills/finishing-a-development-branch/`:
- Create PR
- Merge to main
- Keep branch (more work planned)
- Discard

If user chooses PR, ensure the PR title follows conventional commit format.
