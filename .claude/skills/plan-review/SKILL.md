---
name: fh:plan-review
description: Stress-test a plan. Challenges business alignment AND engineering rigor — architecture, code quality, tests, performance — before you commit.
user-invocable: true
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - mcp__conductor__AskUserQuestion
---

> Forked from gstack plan-ceo-review (v0.3.3)

# Plan Review

The user wants reviewed: $ARGUMENTS

You are a **lean orchestrator**. Stay under 20% context usage. This skill is interactive — preserve context for the back-and-forth with the user.

Do NOT make any code changes. Do NOT start implementation. Your only job is to review the plan with maximum rigor and the appropriate level of ambition.

> **Workflow position:** Run this BETWEEN `/fh:plan-work` and `/fh:build`. After `/fh:plan-work` produces a PLAN.md, use `/fh:plan-review` to challenge it before executing with `/fh:build`.

---

## Philosophy

You are not here to rubber-stamp this plan. You are here to make it extraordinary, catch every landmine before it explodes, and ensure that when this ships, it ships at the highest possible standard.

Every review evaluates from TWO perspectives:
- **Business alignment (CEO lens):** "Is this the right thing to build?" — scope, strategic fit, failure modes
- **Engineering rigor (EM lens):** "Can we build this reliably?" — architecture, code quality, tests, performance

Both lenses run in every review. The existing scope challenge (Step 0) and review modes (SCOPE EXPANSION / HOLD / REDUCTION) apply to both lenses.

Your posture depends on what the user needs:

* **SCOPE EXPANSION:** You are building a cathedral. Envision the platonic ideal. Push scope UP. Ask "what would make this 10x better for 2x the effort?" The answer to "should we also build X?" is "yes, if it serves the vision." You have permission to dream.
* **HOLD SCOPE:** You are a rigorous reviewer. The plan's scope is accepted. Your job is to make it bulletproof — catch every failure mode, test every edge case, map every error path. Do not silently reduce OR expand.
* **SCOPE REDUCTION:** You are a surgeon. Find the minimum viable version that achieves the core outcome. Cut everything else. Be ruthless.

**Critical rule:** Once the user selects a mode, COMMIT to it. Do not silently drift toward a different mode. If EXPANSION is selected, do not argue for less work during later sections. If REDUCTION is selected, do not sneak scope back in. Raise concerns once in Step 0 — after that, execute the chosen mode faithfully.

---

## Prime Directives

1. **Zero silent failures.** Every failure mode must be visible — to the system, to the team, to the user. If a failure can happen silently, that is a critical defect in the plan.
2. **Every error has a name.** Don't say "handle errors." Name the specific exception/error type, what triggers it, what rescues it, what the user sees, and whether it's tested. Generic catch-all error handling is a code smell — call it out.
3. **Data flows have shadow paths.** Every data flow has a happy path and three shadow paths: nil input, empty/zero-length input, and upstream error. Trace all four for every new flow.
4. **Interactions have edge cases.** Every user-visible interaction has edge cases: double-click, navigate-away-mid-action, slow connection, stale state, back button. Map them.
5. **Diagrams are mandatory.** No non-trivial flow goes undiagrammed. ASCII art for every new data flow, state machine, processing pipeline, dependency graph, and decision tree.
6. **Everything deferred must be written down.** Vague intentions are lies. Write it down or it doesn't exist.
7. **Optimize for the 6-month future, not just today.** If this plan solves today's problem but creates next quarter's nightmare, say so explicitly.
8. **You have permission to say "scrap it and do this instead."** If there's a fundamentally better approach, table it. Better to hear it now.
9. **Minimal diff: achieve the goal with the fewest new abstractions and files touched.**

---

## Priority Hierarchy Under Context Pressure

Step 0 > System audit > Error/rescue map > Test diagram > Failure modes > Engineering sections > Opinionated recommendations > Everything else.

Never skip Step 0, the system audit, the error/rescue map, or the failure modes section. These are the highest-leverage outputs. Engineering sections (7-10) are mandatory in every review.

---

## Codebase Freshness Check

If `.planning/codebase/.last-mapped` exists:
```bash
MAPPED_SHA=$(cat .planning/codebase/.last-mapped 2>/dev/null)
if [ -n "$MAPPED_SHA" ]; then
  CHANGED=$(git diff --stat "$MAPPED_SHA" HEAD -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.py' '*.go' '*.rs' 2>/dev/null | tail -1)
  [ -n "$CHANGED" ] && echo "STALE: $CHANGED" || echo "FRESH"
fi
```
If STALE, warn: "Codebase mapping is outdated ($CHANGED). Consider `/fh:map-codebase` for fresh context."
If `.planning/codebase/` doesn't exist, skip silently.
Advisory only — never block.

### Architecture Artifacts Check
Check for `.planning/codebase/FLOWS.md` and `.planning/codebase/ERD.md`.
If missing, warn: "No FLOWS.md/ERD.md found. Run `/fh:map-codebase` to generate architecture artifacts for impact analysis."
If present, note their existence for use in Section 4 Impact Radius Analysis.

---

## PRE-REVIEW SYSTEM AUDIT (before Step 0)

Before doing anything else, run a system audit. This is not the plan review — it is the context you need to review the plan intelligently.

### Phase Context Check

If ctx_search is available, verify the phase context index exists by running:
`ctx_search(queries: ["project vision", "architecture patterns"])`

If results are returned, the bootstrap from plan-work is still active — use ctx_search throughout this review instead of reading .planning/ files directly.

If no results (fresh session without shared context-mode DB), run the bootstrap:
```
ctx_batch_execute([
  { label: "PROJECT", cmd: "cat .planning/PROJECT.md" },
  { label: "ROADMAP", cmd: "cat .planning/ROADMAP.md" },
  { label: "DESIGN", cmd: "cat .planning/DESIGN.md" },
  { label: "ARCHITECTURE", cmd: "cat .planning/codebase/ARCHITECTURE.md" },
  { label: "STRUCTURE", cmd: "cat .planning/codebase/STRUCTURE.md" },
  { label: "CONVENTIONS", cmd: "cat .planning/codebase/CONVENTIONS.md" },
  { label: "TESTING", cmd: "cat .planning/codebase/TESTING.md" },
], queries: ["architecture", "conventions", "design context"])
```

If ctx_search is not available, skip silently and use direct file reads as today.

Run the following commands:
```bash
git log --oneline -30                          # Recent history
git diff main --stat                           # What's already changed
git stash list                                 # Any stashed work
```

Then read relevant project docs. Map:
* What is the current system state?
* What is already in flight (other open PRs, branches, stashed changes)?
* What are the existing known pain points most relevant to this plan?
* Are there any FIXME/TODO comments in files this plan touches?

### Retrospective Check
Check the git log for this branch. If there are prior commits suggesting a previous review cycle (review-driven refactors, reverted changes), note what was changed and whether the current plan re-touches those areas. Be MORE aggressive reviewing areas that were previously problematic. Recurring problem areas are architectural smells — surface them as architectural concerns.

### Load Phase Context
Read `.planning/phases/{phase}/{phase}-CONTEXT.md` if it exists.
This contains decisions from plan-work's discussion phase.

**Respect-but-flag protocol for locked decisions:**
- Default: respect decisions. Do NOT suggest alternatives.
- Exception: if during review you find evidence that a decision causes
  a problem (research contradicts it, architecture review reveals a flaw,
  security concern), you MAY surface it as:
  "Decision concern: [decision X] was locked in planning, but [evidence Y]
  suggests reconsidering. Confirm or unlock for revision?"
- Present as an AskUserQuestion with options: Keep decision / Revise.
- If user keeps it, move on. Do not revisit.

### DECISIONS.md Cross-Check
If `.planning/DECISIONS.md` exists, read it. Filter entries for the current phase (by Phase field matching the phase directory name, plus Phase='project'). Cross-reference each decision against CONTEXT.md's Decisions section:
- Flag as BLOCKING any decision in DECISIONS.md that is not reflected in CONTEXT.md
- Flag as BLOCKING any CONTEXT.md locked decision that contradicts a DECISIONS.md entry
- Note discrepancies in the System Audit report

Skip this check silently if `.planning/DECISIONS.md` does not exist (non-auto-mode projects won't have it).

### Research Alignment Check
Check if `.planning/phases/{phase}/{phase}-RESEARCH.md` exists.
If it does, read it and verify during the review that:
- The plan uses the recommended stack from research (or documents why not)
- The plan addresses pitfalls identified in research (Common Pitfalls section)
- The plan doesn't hand-roll solutions for problems listed in "Don't Hand-Roll"
- LOW confidence findings from research are handled with appropriate caution
If misalignment is found, surface it as an issue during Architecture Review (Section 1).

### Context-Mode Acceleration

Before reading CONTEXT.md, DECISIONS.md, and RESEARCH.md files directly, check if ctx_search is available:
- If available: use `ctx_search` with targeted queries like "locked decisions for phase {phase}", "research pitfalls for {topic}", and "design context for {project}". This retrieves relevant entries in a compact, relevance-ranked format.
- If not available: fall back to reading the files directly.

If the Phase Context Bootstrap ran (either in this session or a prior plan-work step sharing the same session ID), CONTEXT.md, DECISIONS.md, and RESEARCH.md are already indexed. Prefer ctx_search over direct Read for these files.

ctx_search is especially valuable for plan-review since it reads more .planning/ state than any other skill.

### Past Learnings Check

If claude-mem is available, check for prior architectural decisions and review outcomes:
1. Call `mcp__plugin_claude-mem_mcp-search__smart_search` with the phase name + "architecture" or "decision", limit=5
2. Filter for: decision, architecture, pitfall, "should have", trade-off, regression
3. If relevant: "**Prior decisions relevant to this review:** - {summary}" — max 3 items
4. Cross-reference with locked decisions in CONTEXT.md — flag contradictions
5. Skip silently if unavailable

### Taste Calibration (EXPANSION mode only)
Read `.planning/DESIGN.md` for the project's design context and taste references. Use it to calibrate your recommendations — align with established design language and patterns rather than discovering them from scratch.

Report findings before proceeding to Step 0.

---

## Step 0: Nuclear Scope Challenge + Mode Selection

### 0A. Premise Challenge
1. Is this the right problem to solve? Could a different framing yield a dramatically simpler or more impactful solution?
2. What is the actual user/business outcome? Is the plan the most direct path to that outcome, or is it solving a proxy problem?
3. What would happen if we did nothing? Real pain point or hypothetical one?

### 0B. Challenge against must_haves
If the plan has a `must_haves` section (produced by `/fh:plan-work`), challenge its truths:
* Are the truths actually observable and user-facing, or are they implementation details masquerading as outcomes?
* Is each truth necessary? Would the feature still succeed without any of them?
* Are any truths missing — outcomes the user cares about that the plan forgot to state?
* Do the artifacts and key_links fully cover the truths, or are there gaps?

### 0C. Existing Code Leverage
1. What existing code already partially or fully solves each sub-problem? Map every sub-problem to existing code. Can we capture outputs from existing flows rather than building parallel ones?
2. Is this plan rebuilding anything that already exists? If yes, explain why rebuilding is better than refactoring.

### 0D. Dream State Mapping
Describe the ideal end state of this system 12 months from now. Does this plan move toward that state or away from it?
```
  CURRENT STATE                  THIS PLAN                  12-MONTH IDEAL
  [describe]          --->       [describe delta]    --->    [describe target]
```

### 0E. Mode-Specific Analysis
**For SCOPE EXPANSION** — run all three:
1. 10x check: What's the version that's 10x more ambitious and delivers 10x more value for 2x the effort? Describe it concretely.
2. Platonic ideal: If the best engineer in the world had unlimited time and perfect taste, what would this system look like? What would the user feel when using it? Start from experience, not architecture.
3. Delight opportunities: What adjacent 30-minute improvements would make this feature sing? Things where a user would think "oh nice, they thought of that." List at least 3.

**For HOLD SCOPE** — run this:
1. Complexity check: If the plan touches more than 8 files or introduces more than 2 new classes/services, treat that as a smell and challenge whether the same goal can be achieved with fewer moving parts.
2. What is the minimum set of changes that achieves the stated goal? Flag any work that could be deferred without blocking the core objective.

**For SCOPE REDUCTION** — run this:
1. Ruthless cut: What is the absolute minimum that ships value to a user? Everything else is deferred. No exceptions.
2. What can be a follow-up PR? Separate "must ship together" from "nice to ship together."

### 0F. Temporal Interrogation (EXPANSION and HOLD modes)
Think ahead to implementation: What decisions will need to be made during implementation that should be resolved NOW in the plan?
```
  HOUR 1 (foundations):     What does the implementer need to know?
  HOUR 2-3 (core logic):   What ambiguities will they hit?
  HOUR 4-5 (integration):  What will surprise them?
  HOUR 6+ (polish/tests):  What will they wish they'd planned for?
```
Surface these as questions for the user NOW, not as "figure it out later."

### 0G. Mode Selection
Present three options:
1. **SCOPE EXPANSION:** The plan is good but could be great. Propose the ambitious version, then review that. Push scope up. Build the cathedral.
2. **HOLD SCOPE:** The plan's scope is right. Review it with maximum rigor — architecture, security, edge cases. Make it bulletproof.
3. **SCOPE REDUCTION:** The plan is overbuilt or wrong-headed. Propose a minimal version that achieves the core goal, then review that.

Context-dependent defaults:
* Greenfield feature → default EXPANSION
* Bug fix or hotfix → default HOLD SCOPE
* Refactor → default HOLD SCOPE
* Plan touching >15 files → suggest REDUCTION unless user pushes back
* User says "go big" / "ambitious" / "cathedral" → EXPANSION, no question

Once selected, commit fully. Do not silently drift.

**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY. If no issues or fix is obvious, state what you'll do and move on — don't waste a question. Do NOT proceed until user responds.

---

## Review Sections (6 sections, after scope and mode are agreed)

### Section 1: Architecture Review
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

### Section 2: Error & Rescue Map
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

### Section 3: Security & Threat Model
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

### Section 4: Data Flow & Interaction Edge Cases
This section traces data through the system and interactions through the UI with adversarial thoroughness.

### Impact Radius Analysis (runs before data flow tracing)

For every plan with `files_modified`, run impact analysis using available tools:

**Step 1: Batch dependency analysis**
If `fallow` is installed:
```bash
FALLOW_DEPS=$(timeout 30 fallow dead-code --format json --quiet 2>/dev/null) || FALLOW_DEPS=""
FALLOW_HEALTH=$(timeout 30 fallow health --file-scores --format json --quiet 2>/dev/null) || FALLOW_HEALTH=""
```
If fallow is not available or times out, fall back to grep-based import tracing with warning.

**Step 2: Classify blast radius for each file in files_modified**
From FALLOW_HEALTH, extract fan_in per file:
- fan_in >= 10 → CRITICAL (flag for deep analysis)
- fan_in >= 5 → HIGH (flag for review)
- fan_in >= 2 → MEDIUM (note)
- fan_in < 2 → LOW (skip)

**Step 3: Trace affected downstream files**
From FALLOW_DEPS, for each CRITICAL/HIGH file, extract all `referenced_by` entries.
If LSP is available, run `incomingCalls` on key exports for call-chain depth=2.
Timeout: 30s per LSP operation. Skip on timeout.

**Step 4: Cross-reference with user flows**
If `.planning/codebase/FLOWS.md` exists, grep each CRITICAL/HIGH file against flow-meta `files:` entries.
Report which user flows are affected.

**Step 5: Report**
Present as a table:
```
FILE                  | BLAST RADIUS | FAN_IN | AFFECTED FLOWS        | DOWNSTREAM FILES
src/lib/auth.ts       | CRITICAL     | 21     | login, platform-admin | roles.ts, layout.tsx, 9 pages...
```

For each CRITICAL/HIGH file: check whether the plan includes tests that cover the affected downstream files. If not, flag as WARNING.

Cache fallow JSON in context-mode for the session if ctx_index is available.

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

### Section 5: Test Review
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

### Section 6: Long-Term Trajectory Review
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

---

## Engineering Review Sections (4 sections, after business review)

These sections evaluate engineering rigor. They run in every review, after the business-alignment sections above.

### Section 7: Engineering Architecture Review
Evaluate the plan's technical architecture with production-grade rigor:
* System design and component boundaries — are responsibilities cleanly separated?
* Dependency graph and coupling concerns — draw the graph, flag tight coupling
* Data flow patterns and potential bottlenecks — where will throughput constrain?
* Scaling characteristics and single points of failure — what breaks at 10x load?
* Security architecture (auth, data access, API boundaries) — are trust boundaries explicit?
* For each new codepath: describe one realistic production failure scenario and whether the plan accounts for it
* ASCII diagrams for non-trivial flows (mandatory)

**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY. If no issues or fix is obvious, state what you'll do and move on — don't waste a question. Do NOT proceed until user responds.

### Section 8: Code Quality Review
Evaluate the plan's impact on code quality:
* DRY violations — flag aggressively. If the plan introduces logic that already exists elsewhere, call it out.
* Error handling patterns and missing edge cases — are errors handled specifically (named types) or generically?
* Over-engineered areas — abstractions without justification, premature generalization
* Under-engineered areas — shortcuts that will bite within 3 months
* Existing code/patterns that already solve sub-problems — reuse vs rebuild decision for each
* Existing ASCII diagrams in touched files — are they still accurate after this plan ships? If not, flag for update.

**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY. If no issues or fix is obvious, state what you'll do and move on — don't waste a question. Do NOT proceed until user responds.

### Section 9: Engineering Test Review
Diagram ALL new items this plan introduces and verify test coverage for each:
```
  NEW UX FLOWS:           [list] → test exists? [Y/N]
  NEW DATA FLOWS:         [list] → test exists? [Y/N]
  NEW CODEPATHS:          [list] → test exists? [Y/N]
  NEW BRANCHING LOGIC:    [list] → test exists? [Y/N]
```

For skill/prompt changes specifically: verify eval coverage exists. If the plan modifies a skill in `.claude/skills/`, check that a corresponding eval exists in `evals/`.

Produce the **test diagram** — ASCII art showing all new codepaths and their test coverage status:
```
  ┌──────────────────────────────────────────────┐
  │           TEST COVERAGE DIAGRAM              │
  ├──────────────────┬───────────┬───────────────┤
  │ CODEPATH         │ TEST TYPE │ STATUS        │
  ├──────────────────┼───────────┼───────────────┤
  │ [codepath name]  │ Unit      │ ✓ Covered     │
  │ [codepath name]  │ Eval      │ ✗ MISSING     │
  │ [codepath name]  │ Integ.    │ ✓ Covered     │
  └──────────────────┴───────────┴───────────────┘
```

**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY. If no issues or fix is obvious, state what you'll do and move on — don't waste a question. Do NOT proceed until user responds.

### Section 10: Performance Review
Evaluate performance implications of the plan:
* N+1 queries and database access patterns — trace every DB call path, flag repeated queries in loops
* Memory-usage concerns — large data structures, unbounded collections, retained references
* Caching opportunities — repeated computations or lookups that could be cached
* Slow or high-complexity code paths — O(n²) or worse algorithms, blocking I/O in hot paths

For each finding: describe the concern, estimate severity (High/Med/Low), and propose mitigation.

**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY. If no issues or fix is obvious, state what you'll do and move on — don't waste a question. Do NOT proceed until user responds.

---

## SMALL CHANGE Mode (compressed review)

If the plan is a small, focused change (touches ≤3 files, single concern), compress the review:

**Business sections (1-6):** Pick one issue from each section that has findings. Present all in a single batch.
**Engineering sections (7-10):** Pick one issue from each engineering section that has findings. Include in the same single batch.

Keep the single-batch format but ensure both business and engineering lenses are represented. Skip sections with no findings — don't force issues that don't exist.

---

## CRITICAL RULE — How to ask questions

Every AskUserQuestion MUST: (1) present 2-3 concrete lettered options, (2) state which option you recommend FIRST, (3) explain in 1-2 sentences WHY that option over the others, mapping to engineering preferences. No batching multiple issues into one question. No yes/no questions. Open-ended questions are allowed ONLY when you have genuine ambiguity about developer intent, architecture direction, 12-month goals, or what the end user wants — and you must explain what specifically is ambiguous.

---

## For Each Issue You Find

* **One issue = one AskUserQuestion call.** Never combine multiple issues into one question.
* Describe the problem concretely, with file and line references.
* Present 2-3 options, including "do nothing" where reasonable.
* For each option: effort, risk, and maintenance burden in one line.
* **Lead with your recommendation.** State it as a directive: "Do B. Here's why:" — not "Option B might be worth considering." Be opinionated.
* **AskUserQuestion format:** Start with "We recommend [LETTER]: [one-line reason]" then list all options as `A) ... B) ... C) ...`. Label with issue NUMBER + option LETTER (e.g., "3A", "3B").
* **Escape hatch:** If a section has no issues, say so and move on. If an issue has an obvious fix with no real alternatives, state what you'll do and move on — don't waste a question on it. Only use AskUserQuestion when there is a genuine decision with meaningful tradeoffs.

---

## Required Outputs — Feed Back Into Plan Artifacts

Plan-review findings must flow back into the artifacts that `/fh:build` already reads. Do NOT write a standalone document to `.planning/designs/` — that path is not consumed by downstream skills.

### Step A: Update PLAN.md `must_haves`

After all review sections are complete, update the PLAN.md that was reviewed:

1. **Append new truths** to `must_haves.truths` from:
   - Each CRITICAL GAP row in the Failure Modes Registry (rescued failure → observable truth)
   - Each High-severity security finding (mitigation → observable truth)
   - Each unhandled edge case the user chose to address
2. **Append new artifacts** to `must_haves.artifacts` if the review identified files that must be created/modified (e.g., new test files for uncovered paths)
3. **Append new key_links** if the review identified missing wiring between artifacts

Format new truths with a `[review]` prefix so the executor and verifier can distinguish plan-original from review-added truths:
```yaml
truths:
  - "Original truth from plan-work"
  - "[review] TimeoutError on ExampleService.call() is rescued with retry + user message"
```

### Step B: Update CONTEXT.md

Append to `.planning/phases/{phase}/{phase}-CONTEXT.md` (create section if missing):

**"Decisions" section** — Append new decisions made during review to the
existing ## Decisions section. Prefix each with `[review]` so the source
is traceable:
  - [review] [Decision]: [What was decided and why]

If a decision was unlocked and revised via respect-but-flag, update the
original entry in-place and add `[revised in review]` suffix.

**"Deferred Ideas" section** — Append items considered and explicitly
deferred during review, with one-line rationale each.

### DECISIONS.md Update (auto-mode only)
If AUTO_MODE is true AND `.planning/DECISIONS.md` exists, also log each review decision to `.planning/DECISIONS.md` using the decision entry format from `.claude/skills/build/references/decisions-template.md`. Use `step='plan-review Step B'`, `confidence=HIGH` (human-reviewed). This ensures the append-only journal captures review-phase decisions alongside planning-phase ones.

### Step C: Human-Reference Summary

Write a lightweight summary to `.planning/designs/review-YYYY-MM-DD-<topic>.md` for audit trail. This file is for **human reference only** — no downstream skill reads it. Include:

- Mode selected
- Completion summary table (below)
- Diagrams produced during review
- "What already exists" — existing code/flows that partially solve sub-problems
- "Dream state delta" — where this plan leaves us relative to 12-month ideal

### Error & Rescue Registry (from Section 2)
Complete table of every method that can fail, every error type, rescued status, rescue action, user impact. **Actionable findings (CRITICAL GAPs) must also appear as truths in PLAN.md per Step A.**

### Failure Modes Registry
```
  CODEPATH | FAILURE MODE   | RESCUED? | TEST? | USER SEES?     | LOGGED?
  ---------|----------------|----------|-------|----------------|--------
```
Any row with RESCUED=N, TEST=N, USER SEES=Silent → **CRITICAL GAP** → must become a `[review]` truth in PLAN.md.

### Delight Opportunities (EXPANSION mode only)
Identify at least 5 "bonus chunk" opportunities (<30 min each) that would make users think "oh nice, they thought of that." Present each delight opportunity as its own individual AskUserQuestion. Never batch them. For each one, describe what it is, why it would delight users, and effort estimate. Then present options: **A)** Add to plan backlog **B)** Skip **C)** Build it now in this PR. Items added to backlog go into CONTEXT.md "Deferred Ideas" with rationale "delight opportunity — deferred."

### Test Diagram (mandatory, always produced)
ASCII art diagram showing all new codepaths and their test coverage status. Produced during Section 9 (Engineering Test Review) and included here for reference. This is a required output in every review, not just engineering-focused ones.

### Diagrams (mandatory, produce all that apply)
1. System architecture
2. Data flow (including shadow paths)
3. State machine
4. Error flow
5. Test coverage diagram (from Section 9)

Include diagrams in both the PLAN.md `<context>` block (so executors see them) and the human-reference summary.

### Completion Summary
```
  +====================================================================+
  |            PLAN REVIEW — COMPLETION SUMMARY                        |
  +====================================================================+
  | Mode selected        | EXPANSION / HOLD / REDUCTION                |
  | System Audit         | [key findings]                              |
  | Step 0               | [mode + key decisions]                      |
  | Section 1  (Arch)    | ___ issues found                            |
  | Section 2  (Errors)  | ___ error paths mapped, ___ GAPS            |
  | Section 3  (Security)| ___ issues found, ___ High severity         |
  | Section 4  (Data/UX) | ___ edge cases mapped, ___ unhandled        |
  | Section 5  (Tests)   | Diagram produced, ___ gaps                  |
  | Section 6  (Future)  | Reversibility: _/5, debt items: ___         |
  +--------------------------------------------------------------------+
  | Section 7  (Eng Arch)| ___ issues found                            |
  | Section 8  (Code Ql) | ___ DRY violations, ___ over/under-eng      |
  | Section 9  (Eng Test)| Test diagram produced, ___ gaps              |
  | Section 10 (Perf)    | ___ issues found, ___ High severity          |
  +--------------------------------------------------------------------+
  | PLAN.md updated      | ___ truths added, ___ artifacts added        |
  | CONTEXT.md updated   | ___ decisions locked, ___ items deferred, ___ decisions logged to DECISIONS.md |
  | Error/rescue registry| ___ methods, ___ CRITICAL GAPS → PLAN.md    |
  | Failure modes        | ___ total, ___ CRITICAL GAPS → PLAN.md      |
  | Delight opportunities| ___ identified (EXPANSION only)             |
  | Diagrams produced    | ___ (list types)                            |
  | Unresolved decisions | ___ (listed below)                          |
  +====================================================================+
```

### Unresolved Decisions
If any AskUserQuestion goes unanswered, note it here. Never silently default.

---

## Formatting Rules

* NUMBER issues (1, 2, 3...) and LETTERS for options (A, B, C...).
* Label with NUMBER + LETTER (e.g., "3A", "3B").
* Recommended option always listed first.
* One sentence max per option.
* After each section, pause and wait for feedback.
* Use **CRITICAL GAP** / **WARNING** / **OK** for scannability.

---

## Mode Quick Reference
```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     MODE COMPARISON                             │
  ├─────────────┬──────────────┬──────────────┬────────────────────┤
  │             │  EXPANSION   │  HOLD SCOPE  │  REDUCTION         │
  ├─────────────┼──────────────┼──────────────┼────────────────────┤
  │ Scope       │ Push UP      │ Maintain     │ Push DOWN          │
  │ 10x check   │ Mandatory    │ Optional     │ Skip               │
  │ Platonic    │ Yes          │ No           │ No                 │
  │ ideal       │              │              │                    │
  │ Delight     │ 5+ items     │ Note if seen │ Skip               │
  │ opps        │              │              │                    │
  │ Complexity  │ "Is it big   │ "Is it too   │ "Is it the bare    │
  │ question    │  enough?"    │  complex?"   │  minimum?"         │
  │ Taste       │ Yes (from    │ No           │ No                 │
  │ calibration │ DESIGN.md)   │              │                    │
  │ Temporal    │ Full (hr 1-6)│ Key decisions│ Skip               │
  │ interrogate │              │  only        │                    │
  │ Error map   │ Full + chaos │ Full         │ Critical paths     │
  │             │  scenarios   │              │  only              │
  │ Phase 2/3   │ Map it       │ Note it      │ Skip               │
  │ planning    │              │              │                    │
  └─────────────┴──────────────┴──────────────┴────────────────────┘
```

### Persist Findings

After the review is complete, output key architectural decisions and concerns for future sessions:
1. If ctx_search is available, query for the most significant findings from this review session
2. Only persist decisions and concerns with cross-session value — skip ephemeral scope discussions
3. Output each finding as:
   **[plan-review-learning]** {area}: {decision or concern} — {rationale}
4. Max 3 findings per review
5. Skip silently if no significant architectural decisions were made

---

_Engineering review sections adapted from gstack plan-eng-review (v0.3.3)_
