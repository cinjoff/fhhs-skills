# /refactor Dry-Run Trace

**User request:** "Extract the shared validation logic from 3 API route handlers (src/app/api/auth/signup/route.ts, src/app/api/auth/login/route.ts, src/app/api/boards/create/route.ts) into a reusable validation middleware at src/lib/validation.ts"

**Project context:** TaskFlow -- a task management SaaS app (Next.js, TypeScript, Tailwind, Supabase). Currently in phase 01-auth, plan 1 of 2, status in_progress.

---

## Pre-flight: Dependency Check

Before any work begins, verify `.planning/PROJECT.md` exists.

- **Result:** `.planning/PROJECT.md` exists. It confirms this is the TaskFlow project using Next.js + TypeScript + Supabase. Dependency satisfied; proceed.

---

## Iron Law (stated up front)

**Tests never go red during refactoring.** If a test goes red after any structural change, REVERT immediately via `git checkout -- .`. Do NOT debug forward. Revert, understand why, try differently.

This law governs every step below.

---

## Step 1: Scope -- Identify Blast Radius

### 1.1 Find all files involved

Primary files (directly named in the request):
- `src/app/api/auth/signup/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/boards/create/route.ts`
- `src/lib/validation.ts` (new file to be created)

### 1.2 Map dependencies

For each of the 3 route handlers, I would:

1. **Read each file** to identify the inline validation logic (e.g., Zod schemas, manual checks, error response formatting).
2. **Grep for imports** of each route file to see if anything else references them (unlikely for Next.js route handlers, but must verify).
3. **Grep for any existing `src/lib/validation.ts`** or similar validation utilities that already exist -- avoid duplicating or conflicting.
4. **Check for shared types** -- do the route handlers import shared types from `src/types/` or `src/lib/` that the new validation module would also need?
5. **Check test files** -- find all test files for these routes:
   - `src/app/api/auth/signup/__tests__/` or `src/app/api/auth/signup/route.test.ts`
   - `src/app/api/auth/login/__tests__/` or `src/app/api/auth/login/route.test.ts`
   - `src/app/api/boards/create/__tests__/` or `src/app/api/boards/create/route.test.ts`
   - Any integration/e2e tests that exercise these endpoints.

### 1.3 Estimate

- **Files changed:** 4 (3 existing route handlers modified + 1 new validation module created)
- **Files potentially affected:** Test files for the 3 routes (3 more files), possibly a barrel export if `src/lib/index.ts` exists
- **Subsystems affected:** 2 (auth subsystem, boards subsystem)

### 1.4 Report

> "This refactoring touches 4 source files across 2 subsystems (auth, boards). Blast radius: 3 existing API route handlers will have validation logic extracted and replaced with imports from a new shared module. Test files for all 3 routes are in scope for baseline verification. This is under the 10-file threshold -- single-context execution is appropriate."

Since fewer than 10 files and only 2 subsystems, no need to escalate to `/plan` with subagents.

---

## Step 2: Capture Baseline

### 2.1 Run existing tests for the affected area

```bash
# Run tests scoped to the affected routes
npx jest --testPathPattern="api/auth|api/boards" --verbose
```

**Expected observation:** Record the exact output. Example: "12 tests, all GREEN (0 failures, 0 errors)."

### 2.2 Assess coverage sufficiency

For each route handler, check whether the existing tests cover:
- Valid input accepted (happy path)
- Invalid input rejected with correct error response (missing fields, wrong types, malformed data)
- Edge cases (empty strings, extra fields, boundary values)

**If coverage is insufficient** (e.g., the signup route has tests for happy path but no tests for validation rejection):

1. Write characterization tests that capture the CURRENT behavior -- not desired behavior. For example:
   ```typescript
   // test: POST /api/auth/signup with missing email returns 400
   // test: POST /api/auth/signup with invalid email format returns 400 with specific error shape
   // test: POST /api/auth/login with empty password returns 400
   // test: POST /api/boards/create with missing name returns 400
   ```
2. These tests document what the code does TODAY, including any quirks (e.g., if one route returns `{ error: "..." }` and another returns `{ errors: [...] }`, the characterization tests capture both shapes).
3. Commit: `test(refactor): add characterization tests for auth and board validation`
4. Run again -- confirm all GREEN.

### 2.3 Baseline established

> "Baseline: N tests, all GREEN. From here forward, tests must stay GREEN at every step."

---

## Step 3: Plan Atomic Steps

Break the refactoring into the smallest possible steps, ordered safest-first:

### Step Sequence

**Step A: Create the shared validation module (additive only)**
- Create `src/lib/validation.ts` with the shared validation functions/schemas extracted from reading the 3 route handlers.
- This is purely additive -- no existing code changes. Zero risk to existing behavior.
- Run tests. Expect GREEN (nothing references the new file yet).
- Commit: `refactor(validation): create shared validation module`

**Step B: Migrate signup route to use shared validation**
- Modify `src/app/api/auth/signup/route.ts` to import from `src/lib/validation.ts` and remove its inline validation logic.
- Run tests. Must be GREEN.
- If RED: revert (`git checkout -- .`), analyze why, try differently.
- Commit: `refactor(auth): use shared validation in signup route`

**Step C: Migrate login route to use shared validation**
- Modify `src/app/api/auth/login/route.ts` to import from `src/lib/validation.ts` and remove its inline validation logic.
- Run tests. Must be GREEN.
- If RED: revert, analyze, retry.
- Commit: `refactor(auth): use shared validation in login route`

**Step D: Migrate board creation route to use shared validation**
- Modify `src/app/api/boards/create/route.ts` to import from `src/lib/validation.ts` and remove its inline validation logic.
- Run tests. Must be GREEN.
- If RED: revert, analyze, retry.
- Commit: `refactor(boards): use shared validation in board creation route`

**Step E: Clean up dead code (if any)**
- Remove any validation utilities left orphaned in the route files.
- Run tests. Must be GREEN.
- Commit: `refactor(validation): remove orphaned inline validation code`

### Ordering rationale
- Step A is safest (purely additive, zero blast radius).
- Steps B-D are independent of each other but each carries risk. Doing them one at a time means a RED on step C does not undo the committed work from step B.
- Step E is last because it depends on B-D being complete.

**Present this plan to the user and wait for approval before executing.**

---

## Step 4: Execute

For each step (A through E), the execution cycle is:

### Per-step protocol

1. **Make the structural change** (edit/create files).
2. **Run the full test suite** for the affected area:
   ```bash
   npx jest --testPathPattern="api/auth|api/boards" --verbose
   ```
3. **GREEN** --> commit with conventional commit message:
   ```bash
   git add src/lib/validation.ts  # (or the specific files changed)
   git commit -m "refactor(scope): <what changed and why>"
   ```
4. **RED** --> REVERT immediately:
   ```bash
   git checkout -- .
   ```
   Then analyze: Why did the test fail? Was the validation logic not truly identical? Did the error response shape change? Did import paths break? Adjust approach and retry.

### Iron Law enforcement during execution

- Do NOT fix the failing test to match new behavior. That would mean behavior changed, violating the iron law.
- Do NOT "debug forward" by tweaking the new validation module to make the test pass if the root cause is a behavioral difference. Instead, revert and make the extraction more faithful to the original.
- The only acceptable path from RED is: revert, understand, try again.

### Progress reporting

After each commit, report:
> "Step B complete. Signup route now uses shared validation. Tests: 12/12 GREEN. Commit: abc1234."

---

## Step 5: Review

### Dispatch review via `skills/requesting-code-review/`

The skill specifies dispatching review with **`subagent_type: "code-reviewer"`** -- this is a specialized agent, NOT a general-purpose agent. This is the exact agent type mandated by the refactor command.

### Procedure

1. **Get git SHAs:**
   ```bash
   BASE_SHA=$(git log --oneline | grep "characterization tests" | head -1 | awk '{print $1}')
   # or the commit just before Step A
   HEAD_SHA=$(git rev-parse HEAD)
   ```

2. **Dispatch code-reviewer subagent** using the template at `skills/requesting-code-review/code-reviewer.md` with these filled placeholders:
   - `{WHAT_WAS_IMPLEMENTED}`: Extraction of shared validation logic from 3 API route handlers into `src/lib/validation.ts`
   - `{PLAN_OR_REQUIREMENTS}`: User request to consolidate duplicated validation across signup, login, and board-create routes into a reusable middleware
   - `{BASE_SHA}`: (the SHA before step A)
   - `{HEAD_SHA}`: (the SHA after step E)
   - `{DESCRIPTION}`: Refactored 3 API routes (auth/signup, auth/login, boards/create) to use a shared validation module at src/lib/validation.ts. 5 atomic commits, all tests GREEN throughout.

3. **Two mandatory review focuses** (as specified by /refactor):
   - **Behavior preservation:** "Is behavior unchanged?" -- the test suite is the evidence. All tests that passed at baseline must still pass identically.
   - **Structural quality:** "Is the code actually better?" -- Is `src/lib/validation.ts` well-organized? Are the imports clean? Is naming clear? Is coupling reduced? Is cohesion improved?

4. **Third focus check (conditional):** The refactor command says if frontend files (`.tsx`, `.css`, component files) are touched, add a design-consistency focus against `.planning/DESIGN.md`. In this case, the files are all `.ts` API routes -- no frontend files. **Third focus does NOT apply.**

5. **Act on feedback:**
   - Fix Critical issues immediately
   - Fix Important issues before proceeding
   - Note Minor issues for later
   - After any fixes: run tests again, must be GREEN

---

## Step 6: Verify

### Invoke `skills/verification-before-completion/`

This is the "evidence before claims" gate. The procedure is:

1. **Run the FULL test suite** -- not just the affected area, the entire project:
   ```bash
   npx jest --verbose
   ```
   Check the exit code. Count failures. Read the full output.

2. **Verify no behavior changes escaped characterization tests:**
   - Re-read the characterization tests written in Step 2.
   - Confirm they still test the exact same scenarios.
   - Confirm no characterization test was modified during the refactoring (which would indicate a behavior change was papered over).

3. **Only claim complete with evidence:**
   - Actual test output must show 0 failures.
   - Exit code must be 0.
   - No "should pass" or "looks correct" -- only verified output.

### What this step prevents

- Claiming success without running tests (the most common failure mode per the skill's "24 failure memories").
- Relying on partial verification (e.g., "the auth tests pass" when board tests were not run).
- Trusting that "it should work" because the code looks right.

---

## Step 7: Complete

### 7.1 Branch finishing (conditional)

If working on a feature branch, invoke `skills/finishing-a-development-branch/`. In this scenario, since STATE.md shows we are in an active development phase, this would apply if a branch was created for the refactoring.

### 7.2 Generate SUMMARY.md

Contents would include:
- **Refactoring steps:** Steps A-E with commit hashes
- **Before/after metrics:** e.g., "3 files with duplicated validation --> 1 shared module + 3 slim route handlers"
- **Test evidence:** "Baseline: N tests GREEN. Final: N tests GREEN. Zero behavior changes."

### 7.3 Update STATE.md

Add a note to `.planning/STATE.md`:
```markdown
## Last Session
- Date: 2026-03-06
- Stopped at: Completed validation extraction refactoring
- Notes: Extracted shared validation from auth/signup, auth/login, boards/create into src/lib/validation.ts. All tests green. No behavior changes.
```

### 7.4 Final report

> "Refactoring complete. Shared validation logic extracted from 3 API route handlers into `src/lib/validation.ts`. The code is better because: (1) validation rules are defined once (DRY), (2) route handlers are slimmer and focused on business logic, (3) adding new routes with the same validation is now a one-line import. Test evidence: N/N tests GREEN throughout all 5 atomic steps. Zero behavior regressions."

---

## Summary of Key Decisions

| Decision Point | Choice | Rationale |
|---|---|---|
| Single context vs. subagents | Single context | Under 10 files, only 2 subsystems |
| Step ordering | Additive first, then migrate one-by-one | Minimizes blast radius per step |
| Review agent type | **`code-reviewer`** (specialized) | Explicitly required by `/refactor` Step 5 |
| Design consistency review | Skipped | No frontend files (.tsx/.css) touched |
| Test scope during execution | Affected area per step | Full suite only at final verification (Step 6) |
| Iron law enforcement | Revert on any RED, no exceptions | Core principle of the /refactor command |
