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

## Step 0: Tool Readiness

claude-mem tools are **deferred** — they must be fetched before they can be called. Do this first, before any other work.

```
ToolSearch("+mcp-search", max_results: 10)
```

Also verify ast-grep CLI is available:
```bash
command -v sg &>/dev/null || command -v ast-grep &>/dev/null || echo "WARN: ast-grep not found"
```

**If ToolSearch returns empty for claude-mem:** Fall back to Read-based approach for this session.

---

> **Dependency check:** Verify `.planning/PROJECT.md` exists (required — if missing, tell user: "No project found.\n\n→ Run `/fh:new-project` — set up project tracking before reviewing plans"). If no plan exists in the current phase, tell user: "No plan to review.\n\n→ Run `/fh:plan-work` — create a plan first".

> Forked from gstack plan-ceo-review (v0.3.3)

# Plan Review

The user wants reviewed: $ARGUMENTS

You are the **review orchestrator**. Follow every step below — each one exists because skipping it caused real failures in past sessions. This skill is interactive — preserve context for the back-and-forth with the user.

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

## Past Learnings Check (Pattern A)

Run at the start of this review. Derive project name from `.planning/PROJECT.md` name field (fall back to basename of cwd). Call `mcp__plugin_claude-mem_mcp-search__search` with query=2-3 keywords from the plan's domain, project=<project-name>, limit=10. Scan for relevant IDs — prioritize types: gotcha, decision, trade-off. For the top 2-3 IDs, call `mcp__plugin_claude-mem_mcp-search__get_observations` with ids=[ID1, ID2, ID3]. Present as: "**Prior context:** - {observation}" — max 3 items. Feed into review as input context. Max 3 items. Skip silently if no relevant results.

---

## Plan + Context Loading

Resolve the plan to review per @.claude/skills/shared/artifact-resolution.md — use the resolution chain to find PLAN.md and CONTEXT.md before proceeding.

---

## Codebase Freshness Check

See @.claude/skills/shared/freshness-check.md

### Architecture Artifacts Check
Check for `.planning/codebase/FLOWS.md`, `.planning/codebase/ERD.md`, `.planning/codebase/ARCHITECTURE.md`, and `.planning/codebase/STRUCTURE.md`.
If FLOWS.md/ERD.md are missing, warn: "No FLOWS.md/ERD.md found. Run `/fh:map-codebase` to generate architecture artifacts for impact analysis."
If ARCHITECTURE.md or STRUCTURE.md are present, note their existence for use in Section 4 Impact Radius Analysis — ARCHITECTURE.md documents system layers and boundaries, STRUCTURE.md documents the directory layout and module organization.

---

## PRE-REVIEW SYSTEM AUDIT (before Step 0)

Run system audit per @references/system-audit.md

---

## Step 0: Nuclear Scope Challenge + Mode Selection

Run scope challenge per @references/scope-challenge.md

---

## Step 2: Parallel Review Dispatch

Dispatch 2 agents in parallel via the Agent tool. Each receives the plan, CONTEXT.md, mode selection, and system audit findings.

### Agent 1: Business Review (Sections 1-6)

```
Agent({
  subagent_type: "fh:code-reviewer",
  prompt: "<business review prompt>"
})
```

**Business review prompt includes:**
- PLAN.md content (full)
- CONTEXT.md locked decisions
- Mode: {EXPANSION|HOLD|REDUCTION}
- System audit findings from PRE-REVIEW SYSTEM AUDIT
- Review criteria from @references/review-sections.md
- Review sections to cover:
  1. Scope & Requirements Alignment
  2. User Stories & Acceptance Criteria
  3. UX & Design Consistency
  4. Risk Assessment & Mitigation
  5. Dependencies & Integration Points
  6. Correctness & Completeness

**Tool instructions:**
```
Use claude-mem smart tools for codebase context:
- smart_search({query}) — find code patterns across codebase
- smart_outline({path}) — see file structure without full read
- smart_unfold({path, symbol}) — extract specific functions
- search({query, project}) + get_observations({ids}) — find prior decisions

Use ast-grep for structural code analysis:
- sg --pattern '<pattern>' --lang typescript src/
```

**Output format:** Each finding: Section number, Severity (CRITICAL/WARNING/OK), Description, Recommendation, Evidence (file:line or code snippet).

### Agent 2: Engineering Review (Sections 7-10)

```
Agent({
  subagent_type: "fh:code-reviewer",
  prompt: "<engineering review prompt>"
})
```

**Engineering review prompt includes:**
- PLAN.md content (full)
- CONTEXT.md locked decisions
- Engineering review criteria from @references/engineering-review.md
- Architecture artifacts (FLOWS.md, ERD.md if exist)
- Review sections to cover:
  7. Architecture & Code Quality
  8. Testing Strategy & Coverage
  9. Performance & Scalability
  10. Security & Error Handling

**Same tool instructions block as Agent 1.**

**Output format:** Same as Agent 1.

### Agent Failure Handling

- Timeout: 5 minutes per agent. If one times out, proceed with the other agent's findings only.
- If one agent fails entirely: log WARNING "Business/Engineering review incomplete — {agent} failed: {error}". Continue with other agent's findings.
- If both fail: fall back to inline review (run sections manually) as degraded mode.

---

## Step 3: Merge & Gate

After both agents complete (or one completes + other failed/timed out):

1. Collect findings from both agents (or single agent if one failed)
2. Deduplicate (same issue found by both → keep higher severity)
3. Classify: CRITICAL GAP / WARNING / OK per section
4. If mode is EXPANSION: identify delight opportunities from Agent 1 findings
5. Present merged findings to user via AskUserQuestion (one per CRITICAL, batched for WARNING)
6. Update PLAN.md: add new must_haves.truths with [review] prefix
7. Update CONTEXT.md: append review decisions

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

### Persist Findings (Pattern D)

After the review is complete, run Pattern D from @.claude/skills/shared/claude-mem-rules.md to persist significant findings for cross-session recall:
1. Skip if findings are trivial (scope adjustments, no real architectural patterns)
2. Only persist decisions and concerns with cross-session value
3. Output each finding as:
   **[plan-review-learning]** {area}: {decision or concern} — {rationale}
4. Max 3 findings per review
5. Skip silently if no significant architectural decisions were made

---

### Cross-Session Output

**[plan-review-output]** Phase {N} Plan {NN}: Mode={mode}. New truths: {count}. Decisions added: {count}. Gate: {PASS/WARN/BLOCK}. Critical findings: {summary}.

---

_Engineering review sections adapted from gstack plan-eng-review (v0.3.3)_
