# Business Review Sections (1–6)

These sections evaluate business alignment and engineering soundness. Run after Step 0 (scope + mode agreed).

## Section 1: Architecture Review
Evaluate and diagram:
* Overall system design and component boundaries. Draw the dependency graph.
* Data flow — all four paths. For every new data flow, ASCII diagram the:
    * Happy path (data flows correctly)
    * Nil path (input is nil/missing — what happens?)
    * Empty path (input is present but empty/zero-length — what happens?)
    * Error path (upstream call fails — what happens?)
* State machines. ASCII diagram for every new stateful object. Include impossible/invalid transitions and what prevents them.
* Coupling concerns. Which components are now coupled that weren't before? Is that coupling justified? Draw the before/after dependency graph.
* Research alignment — if RESEARCH.md exists, does the plan follow its recommendations? Flag any deviation from recommended stack, ignored pitfalls, or hand-rolled solutions for solved problems.
* Single points of failure. Map them.
* Rollback posture. If this ships and immediately breaks, what's the rollback procedure? How long?

**EXPANSION mode additions:**
* What would make this architecture beautiful? Not just correct — elegant. Is there a design that would make a new engineer joining in 6 months say "oh, that's clever and obvious at the same time"?
* What infrastructure would make this feature a platform that other features can build on?

Required ASCII diagram: full system architecture showing new components and their relationships to existing ones.

**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY. If no issues or fix is obvious, state what you'll do and move on — don't waste a question. Do NOT proceed until user responds.

## Section 2: Error & Rescue Map
This is the section that catches silent failures. It is not optional.

> **Note:** If `/fh:plan-work` already produced a lightweight Error/Rescue Map during the discussion phase, read it first and extend it rather than starting from scratch. This section produces the COMPREHENSIVE version across the entire plan.

For every new method, service, or codepath that can fail, fill in this table:
```
  METHOD/CODEPATH          | WHAT CAN GO WRONG           | ERROR TYPE
  -------------------------|-----------------------------|-----------------
  ExampleService.call()    | API timeout                 | TimeoutError
                           | API returns 429             | RateLimitError
                           | API returns malformed JSON  | ParseError
                           | DB connection exhausted     | ConnectionError
                           | Record not found            | NotFoundError
  -------------------------|-----------------------------|-----------------

  ERROR TYPE                   | RESCUED?  | RESCUE ACTION          | USER SEES
  -----------------------------|-----------|------------------------|------------------
  TimeoutError                 | Y         | Retry 2x, then raise   | "Service temporarily unavailable"
  RateLimitError               | Y         | Backoff + retry         | Nothing (transparent)
  ParseError                   | N ← GAP   | —                      | 500 error ← BAD
  ConnectionError              | N ← GAP   | —                      | 500 error ← BAD
  NotFoundError                | Y         | Return nil, log warning | "Not found" message
```

Rules for this section:
* Generic catch-all error handling is ALWAYS a smell. Name the specific error types.
* Logging only the error message is insufficient. Log the full context: what was being attempted, with what arguments, for what user/request.
* Every rescued error must either: retry with backoff, degrade gracefully with a user-visible message, or re-raise with added context. "Swallow and continue" is almost never acceptable.
* For each GAP (unrescued error that should be rescued): specify the rescue action and what the user should see.
* For LLM/AI service calls specifically: what happens when the response is malformed? When it's empty? When it hallucinates invalid JSON? When the model returns a refusal? Each of these is a distinct failure mode.

**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY. If no issues or fix is obvious, state what you'll do and move on — don't waste a question. Do NOT proceed until user responds.

## Section 3: Security & Threat Model
Security is not a sub-bullet of architecture. It gets its own section.

Evaluate:
* Attack surface expansion. What new attack vectors does this plan introduce? New endpoints, new params, new file paths, new background jobs?
* Input validation. For every new user input: is it validated, sanitized, and rejected loudly on failure? What happens with: nil, empty string, string when integer expected, string exceeding max length, unicode edge cases, injection attempts?
* Authorization. For every new data access: is it scoped to the right user/role? Can user A access user B's data by manipulating IDs?
* Secrets and credentials. New secrets? In env vars, not hardcoded? Rotatable?
* Dependency risk. New packages? Security track record?
* Data classification. PII, payment data, credentials? Handling consistent with existing patterns?
* Injection vectors. SQL, command, template, LLM prompt injection — check all.
* Audit logging. For sensitive operations: is there an audit trail?

For each finding: threat, likelihood (High/Med/Low), impact (High/Med/Low), and whether the plan mitigates it.

**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY. If no issues or fix is obvious, state what you'll do and move on — don't waste a question. Do NOT proceed until user responds.

## Section 4: Data Flow & Interaction Edge Cases
This section traces data through the system and interactions through the UI with adversarial thoroughness.

### Impact Radius Analysis (runs before data flow tracing)

For every plan with `files_modified`, run impact analysis using available tools:

**Step 1: Trace dependencies via LSP and grep**
If LSP is available, run `incomingCalls` on key exports for call-chain depth=2.
Timeout: 30s per LSP operation. Skip on timeout.
Fall back to grep-based import tracing if LSP is unavailable.

**Step 2: Classify blast radius for each file in files_modified**
Count grep/LSP import references per file:
- 10+ importers → CRITICAL (flag for deep analysis)
- 5–9 importers → HIGH (flag for review)
- 2–4 importers → MEDIUM (note)
- 0–1 importers → LOW (skip)

**Step 3: Cross-reference with user flows**
If `.planning/codebase/FLOWS.md` exists, grep each CRITICAL/HIGH file against flow-meta `files:` entries.
Report which user flows are affected.

**Step 4: Report**
Present as a table:
```
FILE                  | BLAST RADIUS | IMPORTERS | AFFECTED FLOWS        | DOWNSTREAM FILES
src/lib/auth.ts       | CRITICAL     | 21        | login, platform-admin | roles.ts, layout.tsx, 9 pages...
```

For each CRITICAL/HIGH file: check whether the plan includes tests that cover the affected downstream files. If not, flag as WARNING.

**Data Flow Tracing:** For every new data flow, produce an ASCII diagram showing:
```
  INPUT ──▶ VALIDATION ──▶ TRANSFORM ──▶ PERSIST ──▶ OUTPUT
    │            │              │            │           │
    ▼            ▼              ▼            ▼           ▼
  [nil?]    [invalid?]    [exception?]  [conflict?]  [stale?]
  [empty?]  [too long?]   [timeout?]    [dup key?]   [partial?]
  [wrong    [wrong type?] [OOM?]        [locked?]    [encoding?]
   type?]
```
For each node: what happens on each shadow path? Is it tested?

**Interaction Edge Cases:** For every new user-visible interaction, evaluate:
```
  INTERACTION          | EDGE CASE              | HANDLED? | HOW?
  ---------------------|------------------------|----------|--------
  Form submission      | Double-click submit    | ?        |
                       | Submit with stale token| ?        |
  Async operation      | User navigates away    | ?        |
                       | Operation times out    | ?        |
                       | Retry while in-flight  | ?        |
  List/table view      | Zero results           | ?        |
                       | 10,000 results         | ?        |
  Background job       | Job fails mid-batch    | ?        |
                       | Job runs twice (dup)   | ?        |
                       | Queue backs up 2 hours | ?        |
```
Flag any unhandled edge case as a gap. For each gap, specify the fix.

**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY. If no issues or fix is obvious, state what you'll do and move on — don't waste a question. Do NOT proceed until user responds.

## Section 5: Test Review
Make a complete diagram of every new thing this plan introduces:
```
  NEW UX FLOWS:
    [list each new user-visible interaction]

  NEW DATA FLOWS:
    [list each new path data takes through the system]

  NEW CODEPATHS:
    [list each new branch, condition, or execution path]

  NEW BACKGROUND JOBS / ASYNC WORK:
    [list each]

  NEW INTEGRATIONS / EXTERNAL CALLS:
    [list each]

  NEW ERROR/RESCUE PATHS:
    [list each — cross-reference Section 2]
```

For each item in the diagram:
* What type of test covers it? (Unit / Integration / System / E2E)
* Does a test for it exist in the plan? If not, write the test spec header.
* What is the happy path test?
* What is the failure path test? (Be specific — which failure?)
* What is the edge case test? (nil, empty, boundary values, concurrent access)

Test ambition check (all modes): For each new feature, answer:
* What's the test that would make you confident shipping at 2am on a Friday?
* What's the test a hostile QA engineer would write to break this?
* What's the chaos test?

Test pyramid check: Many unit, fewer integration, few E2E? Or inverted?
Flakiness risk: Flag any test depending on time, randomness, external services, or ordering.

**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY. If no issues or fix is obvious, state what you'll do and move on — don't waste a question. Do NOT proceed until user responds.

## Section 6: Long-Term Trajectory Review
Evaluate:
* Technical debt introduced. Code debt, operational debt, testing debt, documentation debt.
* Path dependency. Does this make future changes harder?
* Knowledge concentration. Documentation sufficient for a new engineer?
* Reversibility. Rate 1-5: 1 = one-way door, 5 = easily reversible.
* The 1-year question. Read this plan as a new engineer in 12 months — obvious?

**EXPANSION mode additions:**
* What comes after this ships? Phase 2? Phase 3? Does the architecture support that trajectory?
* Platform potential. Does this create capabilities other features can leverage?

**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY. If no issues or fix is obvious, state what you'll do and move on — don't waste a question. Do NOT proceed until user responds.
