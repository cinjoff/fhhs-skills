# /fix Command Dry-Run Trace

## Scenario

User reports: "I'm getting 3 independent test failures: auth tests fail with 'session not found' in `src/lib/__tests__/auth.test.ts`, billing tests fail with 'invoice amount NaN' in `src/lib/__tests__/billing.test.ts`, and notification tests fail with 'channel undefined' in `src/lib/__tests__/notifications.test.ts`. These are in different subsystems."

Project: TaskFlow (Next.js, TypeScript, Tailwind, Supabase)
Current state: Phase 01-auth, plan 1, in progress.

---

## Step 1: Triage

### 1.1 Dependency Check

The fix command begins with a dependency check: verify `.planning/PROJECT.md` exists. It does -- contains the TaskFlow project definition. Requirement satisfied.

### 1.2 Search for Error Messages

Before classifying depth, the command says to spend <5% context on triage. I would perform three quick searches in parallel:

- `grep -r "session not found" src/` -- locate where "session not found" is thrown or expected
- `grep -r "invoice amount" src/` or `grep -r "NaN" src/lib/__tests__/billing.test.ts` -- locate the billing failure context
- `grep -r "channel undefined" src/` or `grep -r "channel" src/lib/__tests__/notifications.test.ts` -- locate the notification failure context

### 1.3 Run Relevant Test Suites

I would run the three test files to confirm the failures:

```bash
npx jest src/lib/__tests__/auth.test.ts src/lib/__tests__/billing.test.ts src/lib/__tests__/notifications.test.ts 2>&1
```

This confirms each failure is real and captures the exact error output.

### 1.4 Depth Assessment

Applying the triage table from the fix command:

| Signal | Assessment |
|--------|-----------|
| 3+ independent failures | YES -- auth, billing, notifications are separate subsystems |
| Different error messages | YES -- "session not found", "invoice amount NaN", "channel undefined" |
| Different test files | YES -- three separate test files in different domains |
| Shared root cause likely? | NO -- errors are semantically unrelated |

**Depth: PARALLEL**

**Announcement:** "Multiple independent failures. Dispatching parallel debug agents."

This matches the triage table row:
> 3+ independent failures -> PARALLEL -> Debugger agent per subsystem

---

## Step 1 (continued): Execute PARALLEL Path

The fix command specifies for PARALLEL depth:

> Dispatch one **`gsd-debugger`** agent per subsystem (specialized -- scientific debugging with hypothesis tracking). Each agent gets: the specific failure, relevant files, and instruction to produce root cause + proposed fix. Collect results. Then Step 2 for each fix.

### Agent Dispatch Plan

I would dispatch **three `gsd-debugger` agents** in parallel using the `dispatching-parallel-agents` skill pattern. Each agent is spawned via the Task/subagent mechanism with `subagent_type: gsd-debugger`.

---

#### Agent 1: Auth Subsystem (`gsd-debugger`)

**Subagent type:** `gsd-debugger`

**Prompt to agent:**

```
Investigate the test failure in src/lib/__tests__/auth.test.ts.

Error: "session not found"

Context: This is a TaskFlow app (Next.js, TypeScript, Supabase). The auth subsystem
handles user authentication (boards, tasks, assignments).

Your task:
1. Read src/lib/__tests__/auth.test.ts completely
2. Read the production auth code it imports (likely src/lib/auth.ts or similar)
3. Find root cause of "session not found" error
4. Use scientific method: form falsifiable hypotheses, test one at a time
5. Produce: root cause + proposed minimal fix

Goal: find_root_cause_only
symptoms_prefilled: true

<symptoms>
expected: Auth tests pass -- sessions are found/created correctly
actual: Tests fail with "session not found"
errors: "session not found" in auth.test.ts
</symptoms>

Do NOT fix the code. Return ROOT CAUSE FOUND with evidence and suggested fix direction.
```

**What the agent would do (per gsd-debugger SKILL.md):**
1. Skip symptom gathering (symptoms_prefilled: true)
2. Create debug file: `.planning/debug/2026-03-06-session-not-found.md` with status: investigating
3. Phase 1 - Evidence gathering: Read auth.test.ts and auth.ts completely, search for "session not found" string, identify where sessions are created vs looked up
4. Phase 2 - Form hypothesis: e.g., "Session lookup fails because the test setup does not initialize the session store before calling the auth function"
5. Phase 3 - Test hypothesis: Check test setup/beforeEach, check if session creation is async and awaited
6. Phase 4 - Evaluate: Confirm or eliminate, form new hypothesis if needed
7. Return structured `ROOT CAUSE FOUND` with evidence summary, files involved, and suggested fix direction

---

#### Agent 2: Billing Subsystem (`gsd-debugger`)

**Subagent type:** `gsd-debugger`

**Prompt to agent:**

```
Investigate the test failure in src/lib/__tests__/billing.test.ts.

Error: "invoice amount NaN"

Context: This is a TaskFlow app (Next.js, TypeScript, Supabase). The billing subsystem
handles invoicing and payments.

Your task:
1. Read src/lib/__tests__/billing.test.ts completely
2. Read the production billing code it imports (likely src/lib/billing.ts or similar)
3. Find root cause of "invoice amount NaN" error
4. Use scientific method: form falsifiable hypotheses, test one at a time
5. Produce: root cause + proposed minimal fix

Goal: find_root_cause_only
symptoms_prefilled: true

<symptoms>
expected: Billing tests pass -- invoice amounts compute correctly as numbers
actual: Tests fail with "invoice amount NaN"
errors: "invoice amount NaN" in billing.test.ts
</symptoms>

Do NOT fix the code. Return ROOT CAUSE FOUND with evidence and suggested fix direction.
```

**What the agent would do:**
1. Skip symptom gathering
2. Create debug file: `.planning/debug/2026-03-06-invoice-amount-nan.md`
3. Evidence gathering: Read billing.test.ts and billing.ts, search for amount calculation logic, check for parseInt/parseFloat on undefined values, string-to-number coercion issues
4. Form hypothesis: e.g., "Invoice amount is NaN because a price field from the database comes back as a string and is multiplied with quantity without parsing, or a required field is undefined"
5. Test hypothesis by tracing data flow from test fixture through computation
6. Return `ROOT CAUSE FOUND`

---

#### Agent 3: Notifications Subsystem (`gsd-debugger`)

**Subagent type:** `gsd-debugger`

**Prompt to agent:**

```
Investigate the test failure in src/lib/__tests__/notifications.test.ts.

Error: "channel undefined"

Context: This is a TaskFlow app (Next.js, TypeScript, Supabase). The notifications subsystem
handles sending notifications to users through channels (email, in-app, etc.).

Your task:
1. Read src/lib/__tests__/notifications.test.ts completely
2. Read the production notification code it imports (likely src/lib/notifications.ts or similar)
3. Find root cause of "channel undefined" error
4. Use scientific method: form falsifiable hypotheses, test one at a time
5. Produce: root cause + proposed minimal fix

Goal: find_root_cause_only
symptoms_prefilled: true

<symptoms>
expected: Notification tests pass -- channel is defined and messages are sent
actual: Tests fail with "channel undefined"
errors: "channel undefined" in notifications.test.ts
</symptoms>

Do NOT fix the code. Return ROOT CAUSE FOUND with evidence and suggested fix direction.
```

**What the agent would do:**
1. Skip symptom gathering
2. Create debug file: `.planning/debug/2026-03-06-channel-undefined.md`
3. Evidence gathering: Read notifications.test.ts and notifications.ts, search for where `channel` is referenced, check if it is a config value, constructor parameter, or lookup result
4. Form hypothesis: e.g., "Channel is undefined because the notification config/factory does not set a default channel, or the test setup omits the channel parameter"
5. Test hypothesis by tracing channel value through the code path
6. Return `ROOT CAUSE FOUND`

---

### Collecting Agent Results

After all three agents return, I (the orchestrator) would:

1. Read each agent's `ROOT CAUSE FOUND` structured return
2. Read the debug session files they created in `.planning/debug/`
3. Verify the three root causes are genuinely independent (no shared cause)
4. If any agent returned `INVESTIGATION INCONCLUSIVE`, escalate that subsystem to MODERATE path or recommend `/gsd:debug`

---

## Step 2: TDD Fix (Per Subsystem)

The fix command says: "Then Step 2 for each fix." This invokes the `test-driven-development` skill for each subsystem. Since these are independent, I could dispatch three more agents or handle sequentially. Given the fixes are informed by root causes from Step 1, and they touch different files, I would apply TDD fixes sequentially in the main context (to avoid merge conflicts from parallel file edits).

### 2.1 Auth Fix (TDD Cycle)

**RED:** Write a failing test that captures the specific bug. For example, if root cause is "session store not initialized before lookup":

```typescript
test('returns session when session store is properly initialized', () => {
  const store = createSessionStore();
  const session = store.getSession('user-123');
  expect(session).toBeDefined();
  expect(session.userId).toBe('user-123');
});
```

Run: `npx jest src/lib/__tests__/auth.test.ts --testNamePattern="returns session"` -- confirm it fails with "session not found".

**GREEN:** Apply minimal fix based on root cause from Agent 1. For example, ensure session store initialization happens before lookup.

Run: confirm the new test passes, AND the original failing auth tests pass.

**REFACTOR:** Clean up if needed. Ensure all auth tests remain green.

**Commit:** `fix: initialize session store before lookup in auth module`

### 2.2 Billing Fix (TDD Cycle)

**RED:** Write a failing test that captures the NaN bug:

```typescript
test('computes invoice amount as a valid number', () => {
  const invoice = createInvoice({ items: [{ price: '29.99', quantity: 2 }] });
  expect(invoice.amount).toBe(59.98);
  expect(Number.isNaN(invoice.amount)).toBe(false);
});
```

Run: confirm it fails with NaN.

**GREEN:** Apply minimal fix based on root cause from Agent 2. For example, add `parseFloat()` on the price field, or ensure the field is always a number type.

Run: confirm test passes, all billing tests pass.

**REFACTOR:** Clean up.

**Commit:** `fix: parse price as number before computing invoice amount`

### 2.3 Notifications Fix (TDD Cycle)

**RED:** Write a failing test:

```typescript
test('sends notification with resolved channel', () => {
  const result = sendNotification({ userId: 'user-1', message: 'Hello' });
  expect(result.channel).toBeDefined();
  expect(result.status).toBe('sent');
});
```

Run: confirm it fails with "channel undefined".

**GREEN:** Apply minimal fix based on root cause from Agent 3. For example, provide a default channel or fix the config lookup.

Run: confirm test passes, all notification tests pass.

**REFACTOR:** Clean up.

**Commit:** `fix: resolve notification channel from config before sending`

### 2.4 Deferred Items

During investigation and TDD fixing, any adjacent issues discovered (pre-existing warnings, unrelated code smells, other test warnings) are logged to deferred items, NOT fixed inline. Per the fix command:

```
{phase_dir}/deferred-items.md:
- [fix-20260306] Billing module uses string concatenation for currency display (found in src/lib/billing.ts:42)
- [fix-20260306] Auth module missing type annotations on session callbacks (found in src/lib/auth.ts:18)
- [fix-20260306] Notification test has hardcoded timeout of 5000ms (found in src/lib/__tests__/notifications.test.ts:7)
```

These are explicitly NOT addressed during this fix cycle.

---

## Step 3: Frontend Check

The fix command says: "If the fix touches `.tsx`, `.css`, components, or styles..."

In this scenario, the three fixes touch `.ts` files in `src/lib/` (auth, billing, notifications logic). These are backend/library modules, not `.tsx` or `.css` files.

**Result: Frontend check is NOT applicable.** Skip this step.

---

## Step 4: Quick Spec Review

The fix command requires verification for PARALLEL depth:

### 4.1 Root Cause Check (all depths)

For each fix:

| Fix | Addresses root cause, not symptom? |
|-----|-----------------------------------|
| Auth: initialize session store | YES -- root cause was missing initialization, not a workaround like try/catch |
| Billing: parse price as number | YES -- root cause was type coercion, not a workaround like `amount \|\| 0` |
| Notifications: resolve channel | YES -- root cause was missing channel resolution, not swallowing the error |

### 4.2 MODERATE/PARALLEL Additional Checks

**Does the failing test from Step 2 actually reproduce the reported bug (not a different one)?**

- Auth test: Reproduces "session not found" exactly -- YES
- Billing test: Reproduces "invoice amount NaN" exactly -- YES
- Notifications test: Reproduces "channel undefined" exactly -- YES

**Are there other callers/consumers of the changed code that could be affected?**

- Auth: Check `grep -r "getSession\|createSessionStore" src/` for other callers. If API routes or middleware use the same auth functions, confirm they still work.
- Billing: Check `grep -r "createInvoice\|amount" src/` for other callers. If payment processing or reports use the same billing functions, confirm compatibility.
- Notifications: Check `grep -r "sendNotification\|channel" src/` for other callers. If event handlers or cron jobs send notifications, confirm they still work.

If any answer is "unsure", investigate before proceeding.

---

## Step 5: Verify

Invoke `verification-before-completion` skill. This is the iron law: "No completion claims without fresh verification evidence."

### 5.1 Run All Verification Commands Fresh

```bash
# Run the three originally failing test files
npx jest src/lib/__tests__/auth.test.ts src/lib/__tests__/billing.test.ts src/lib/__tests__/notifications.test.ts 2>&1

# Run the full test suite to check for regressions
npx jest 2>&1

# Run linter
npx eslint src/lib/auth.ts src/lib/billing.ts src/lib/notifications.ts 2>&1

# Run type check
npx tsc --noEmit 2>&1
```

### 5.2 Read Full Output

- Check exit codes: all must be 0
- Count test results: all tests must pass, zero failures
- Check for warnings or errors in linter output
- Check for type errors in tsc output

### 5.3 Only Claim Fixed with Evidence

Report actual numbers: "All 3 previously failing test suites pass (X/X tests). Full suite: Y/Y tests pass. Linter: 0 errors. Type check: clean."

If ANY verification fails, do NOT claim success. Investigate the failure.

---

## Step 6: Complete

### 6.1 Branch Check

The fix command says: "If on a feature branch and fix is standalone, invoke `finishing-a-development-branch`."

Check current branch. If on a feature branch, follow the finishing skill. If on main, skip branch finishing.

### 6.2 Generate SUMMARY.md

Write to the phase directory (e.g., `.planning/phases/01-auth/SUMMARY.md` or appropriate location):

```yaml
---
phase: 01-auth
plan: fix-20260306-1200
subsystem: auth, billing, notifications
key-files:
  modified: [src/lib/auth.ts, src/lib/billing.ts, src/lib/notifications.ts]
key-decisions:
  - "Root cause (auth): session store not initialized before lookup"
  - "Root cause (billing): price field treated as string, causing NaN in arithmetic"
  - "Root cause (notifications): channel config not resolved, defaulting to undefined"
duration: ~25 min
completed: 2026-03-06T12:00:00Z
---

Three independent test failures fixed via parallel `gsd-debugger` investigation.

Auth: Session store initialization added before session lookup.
Billing: Price field parsed as number before invoice computation.
Notifications: Channel resolved from config with fallback default.

Tests added for each fix. All tests pass. No regressions.

Commits:
- fix: initialize session store before lookup in auth module
- fix: parse price as number before computing invoice amount
- fix: resolve notification channel from config before sending
```

### 6.3 Update STATE.md

Update `.planning/STATE.md`:

```markdown
## Last Session
- Date: 2026-03-06
- Stopped at: Fixed 3 independent test failures (auth, billing, notifications)
- Note: Parallel gsd-debugger agents used for independent root cause investigation
```

### 6.4 Check CONCERNS.md

If any of these failures were tracked as known issues in CONCERNS.md, note their resolution with commit hashes.

### 6.5 Final Report

```
Root causes:
1. Auth "session not found": session store not initialized before lookup
2. Billing "invoice amount NaN": price field string coercion in arithmetic
3. Notifications "channel undefined": channel config not resolved before send

Fixes applied: 3 independent minimal fixes, one per subsystem
Test coverage added: 3 new regression tests
Related concerns: [any CONCERNS.md items resolved]
Deferred items: 3 adjacent issues logged to deferred-items.md
```

---

## Summary of Key Decisions in This Trace

| Decision Point | Choice Made | Rationale |
|---------------|-------------|-----------|
| Triage depth | PARALLEL | 3 independent failures in different subsystems, different error types |
| Agent type | `gsd-debugger` (x3) | Fix command explicitly specifies `gsd-debugger` for PARALLEL path |
| Agent mode | `find_root_cause_only` | Agents diagnose; orchestrator applies TDD fixes to avoid parallel file conflicts |
| TDD fixes | Sequential in main context | Prevents merge conflicts from parallel edits to potentially shared files |
| Frontend check | Skipped | No .tsx/.css files touched |
| Deferred items | Logged, not fixed | Per fix command protocol |
| Verification | Full suite + linter + typecheck | Per verification-before-completion skill |
