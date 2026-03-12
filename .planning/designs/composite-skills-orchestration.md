# Composite Skills Orchestration Map

> How fhhs-skills composite commands orchestrate upstream skills without redefining them.

## Architecture Principle

```
 USER REQUEST
      │
      ▼
┌─────────────────────────────────┐
│   COMPOSITE SKILL (Orchestrator)│  ◄── Decides WHAT to do and WHEN
│   ~15% context budget           │      Does NOT do the work itself
│   Reads .planning/ state        │
└──────────┬──────────────────────┘
           │ dispatches
           ▼
┌─────────────────────────────────┐
│   UPSTREAM / FORKED SKILLS      │  ◄── Decides HOW to do each step
│   Fresh subagent context        │      Owns the domain expertise
│   Loaded on demand              │
└─────────────────────────────────┘
```

Composites are **routers and sequencers**. They decide execution order, gate conditions, and when to stop — but delegate all domain work to upstream skills that own their own behavior.

---

## Cross-Cutting Tools: LSP

LSP (Language Server Protocol) is not a skill — it's a **shared capability** used directly by composites and their subagents for precise code navigation. It appears at different stages across multiple workflows:

```
                        LSP: goToDefinition, findReferences, hover,
                             workspaceSymbol, documentSymbol, rename
                        ─────────────────────────────────────────────
                                          │
          ┌───────────────┬───────────────┼───────────────┬───────────────┐
          ▼               ▼               ▼               ▼               ▼
    /fh:build        /fh:fix        /fh:refactor    /fh:plan-work    /fh:extract
    ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │Subagents│    │Triage   │    │Scope +   │    │Orchestr. │    │Find      │
    │navigate │    │traces   │    │execute   │    │scouting  │    │design    │
    │code via │    │error to │    │with      │    │+ explorer│    │system +  │
    │implement│    │root via │    │rename +  │    │+ architect│    │update    │
    │-prompt  │    │refs +   │    │refs at   │    │subagents │    │refs      │
    │template │    │hover    │    │every step│    │          │    │          │
    └─────────┘    └─────────┘    └──────────┘    └──────────┘    └──────────┘
    goToDefn       findRefs       findRefs        workspaceSym    findRefs
    findRefs       hover          rename           findRefs       rename
    hover          goToDefn       documentSym      goToDefn       workspaceSym
    documentSym                                    documentSym

    /fh:review does NOT use LSP — it operates on diffs, not code navigation.
```

**Why this matters for the orchestrator model:** LSP is a tool the composites *instruct* their delegates to use — it's part of the "how" that lives in each step's instructions, not a skill being orchestrated. The build orchestrator doesn't use LSP itself; it tells its task subagents to use it via the implementer prompt template.

---

## Three Upstream Lineages

```
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│  SUPERPOWERS v4.3.1  │   │   IMPECCABLE v1.2.0  │   │   GSD v1.22.4        │
│                      │   │                      │   │                      │
│  brainstorming       │   │  critique             │   │  gsd-planner         │
│  test-driven-dev     │   │  polish               │   │  gsd-executor        │
│  systematic-debugging│   │  normalize            │   │  gsd-verifier        │
│  verification-before │   │  harden               │   │  gsd-plan-checker    │
│  simplify (3-agent)  │   │  animate              │   │  gsd-debugger        │
│  finishing-dev-branch│   │  audit                │   │  gsd-integration     │
│  dispatching-parallel│   │  distill              │   │                      │
│  requesting-review   │   │  adapt, bolder, etc.  │   │                      │
└──────────────────────┘   └──────────────────────┘   └──────────────────────┘

┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│  FEATURE-DEV 55b58ec │   │  VERCEL REACT BP     │   │  PLAYWRIGHT BP       │
│                      │   │  64bee5b7             │   │  b4b0fd3c            │
│  code-explorer       │   │                      │   │                      │
│  code-architect      │   │  nextjs-perf          │   │  playwright-testing  │
│  code-reviewer       │   │  (6 perf categories)  │   │  (37 reference files)│
└──────────────────────┘   └──────────────────────┘   └──────────────────────┘
```

---

## `/fh:build` — The Full Pipeline

The most complex orchestrator. Executes plans through waves of parallel subagents with quality gates between them.

```
 PLAN.md (from /fh:plan-work)
      │
      ▼
┌─ STEP 1-2: LOAD & PARSE ──────────────────────────────────────────────────┐
│  Read PLAN.md frontmatter → extract waves, dependencies, must_haves       │
│  Load ≤2 .planning/ files at a time (context budget)                      │
└────────────────────────────┬───────────────────────────────────────────────┘
                             │
      ┌──────────────────────┼──────────────────────┐
      ▼                      ▼                      ▼
┌───────────┐    ┌───────────────┐    ┌───────────────┐
│  WAVE 1   │    │   WAVE 2      │    │   WAVE N      │
│  Task A ──┤    │   Task C ─────┤    │   Task E ─────┤
│  Task B ──┤    │   Task D ─────┤    │               │
└─────┬─────┘    └───────┬───────┘    └───────┬───────┘
      │                  │                    │
      │  Each task = fresh general-purpose subagent
      │  loaded with implementer-prompt.md template
      │
      │  ALL SUBAGENTS USE:
      │  ┌──────────────────────────────────────────┐
      │  │  LSP: goToDefinition, findReferences,    │  ◄── Built-in tool
      │  │       hover, documentSymbol              │      (via implementer
      │  │  "Faster and more precise than grep"     │       prompt template)
      │  └──────────────────────────────────────────┘
      │
      │  SUBAGENT CONDITIONALLY ACTIVATES:
      │  ┌──────────────────────────────────────────┐
      │  │  /fh:test-driven-development  (if tdd)   │  ◄── Superpowers
      │  │  /fh:playwright-testing       (if e2e)   │  ◄── Playwright BP
      │  │  /fh:nextjs-perf             (if Next.js)│  ◄── Vercel BP
      │  │  /fh:frontend-design         (if .tsx)   │  ◄── Impeccable
      │  └──────────────────────────────────────────┘
      │
      ▼
┌─ STEP 3b: SPEC GATE ──────────────────────────────────────────────────────┐
│  code-reviewer subagent (spec-gate-prompt.md)                    Feature- │
│  Checks: missing reqs, stubs, unwired code, TS strictness         Dev    │
│  Result: PASS → next wave  |  BLOCKING → fixes required                  │
└────────────────────────────┬───────────────────────────────────────────────┘
                             │
                             ▼  (repeat for each wave)
                             │
┌─ STEP 4: DESIGN GATES (if frontend) ──────────────────────────────────────┐
│                                                                           │
│  Sequential pipeline — each gate refines previous output:                 │
│                                                                           │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐                        │
│  │ /fh:critique│──▶│ /fh:polish │──▶│/fh:normalize│          Impeccable  │
│  │ UX quality │   │ Visual     │   │ Design     │                        │
│  │ review     │   │ refinement │   │ system fit │                        │
│  └────────────┘   └────────────┘   └────────────┘                        │
│                                                                           │
│  Optional add-ons (user-configured):                                      │
│  ┌────────────┐   ┌────────────┐                                          │
│  │ /fh:harden │   │ /fh:animate│                                          │
│  │ Edge cases │   │ Motion     │                                          │
│  └────────────┘   └────────────┘                                          │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
┌─ STEP 8: SIMPLIFY ────────┴───────────────────────────────────────────────┐
│                                                                           │
│  /fh:simplify dispatches 3 PARALLEL agents on git diff:     Superpowers  │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    │
│  │ REUSE agent  │  │ QUALITY agent│  │EFFICIENCY    │                    │
│  │ Duplication  │  │ Naming, DRY  │  │agent         │                    │
│  │ extraction   │  │ complexity   │  │ Performance  │                    │
│  └──────────────┘  └──────────────┘  └──────────────┘                    │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
                             ▼
                     /fh:review (see below)
```

---

## `/fh:review` — Pre-Promotion Gate

Shared terminal step for `/fh:build`, `/fh:fix`, and `/fh:refactor`.

```
┌─ /fh:review ──────────────────────────────────────────────────────────────┐
│                                                                           │
│  STEP 1: CODE QUALITY                                     Feature-Dev    │
│  ┌──────────────────────────────────────────────┐                        │
│  │  code-reviewer subagent (review-prompt.md)   │                        │
│  │  + /fh:nextjs-perf criteria (if Next.js)     │  ◄── Vercel BP        │
│  │  Severity: Critical > Important > Minor > Nit│                        │
│  └──────────────────────────────────┬───────────┘                        │
│                                     │                                     │
│  STEP 2: SECURITY SCAN             │                                     │
│  ┌──────────────────────────────────┴───────────┐                        │
│  │  /fh:secure  →  4 PARALLEL agents:           │                        │
│  │  ┌──────────┐ ┌──────────┐ ┌──────┐ ┌──────┐│                        │
│  │  │Injection │ │Auth +    │ │Data  │ │Access││                        │
│  │  │+ XSS     │ │Session   │ │Expose│ │Ctrl  ││  ◄── OWASP checklist  │
│  │  └──────────┘ └──────────┘ └──────┘ └──────┘│                        │
│  │  Gate: BLOCK (CRITICAL) / WARN (HIGH) / PASS │                        │
│  └──────────────────────────────────┬───────────┘                        │
│                                     │                                     │
│  STEP 3: EVIDENCE                   │                     Superpowers    │
│  ┌──────────────────────────────────┴───────────┐                        │
│  │  /fh:verification-before-completion          │                        │
│  │  Runs: test suite, build, lint               │                        │
│  │  Captures exit codes as proof                │                        │
│  └──────────────────────────────────┬───────────┘                        │
│                                     │                                     │
│  STEP 4: TYPESCRIPT STRICTNESS      │                     (built-in)    │
│  ┌──────────────────────────────────┴───────────┐                        │
│  │  Grep diff for: `any`, `as` casts,          │                        │
│  │  non-exhaustive switches                     │                        │
│  └──────────────────────────────────┬───────────┘                        │
│                                     │                                     │
│  STEP 5: GATE DECISION             ▼                                     │
│  ┌──────────────────────────────────────────────┐                        │
│  │  BLOCK if: Critical security/code issues,    │                        │
│  │            verification failures, `any` usage│                        │
│  │  WARN  if: HIGH security findings            │                        │
│  │  PASS  otherwise                             │                        │
│  └──────────────────────────────────┬───────────┘                        │
│                                     │                                     │
│  STEP 7: PROMOTE (if PASS)         │                     Superpowers    │
│  ┌──────────────────────────────────┴───────────┐                        │
│  │  /fh:finishing-a-development-branch          │                        │
│  │  Options: Create PR / Merge / Keep / Discard │                        │
│  └──────────────────────────────────────────────┘                        │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## `/fh:fix` — Bug Triage + TDD

```
 BUG REPORT
      │
      ▼
┌─ STEP 1: TRIAGE (via LSP) ────────────────────────────────────────────────┐
│                                                                           │
│  Use LSP: goToDefinition, findReferences, hover                          │
│  Classify severity:                                                       │
│                                                                           │
│  SIMPLE ──────────────────────────────────────────▶ Step 2 (TDD)         │
│  MODERATE ─▶ /fh:systematic-debugging ───────────▶ Step 2    Superpowers │
│  PARALLEL ─▶ N × gsd-debugger subagents ─────────▶ Step 2    GSD        │
│  COMPLEX ──▶ Persistent .planning/debug/ session ▶ Step 2    GSD        │
│                                                                           │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
┌─ STEP 2: TDD FIX ─────────┴──────────────────────────────────────────────┐
│                                                                           │
│  /fh:test-driven-development                              Superpowers    │
│  RED → write failing test proving the bug                                │
│  GREEN → minimal fix to pass                                             │
│  REFACTOR → clean up                                                     │
│                                                                           │
│  (if Playwright project) + /fh:playwright-testing          Playwright BP │
│                                                                           │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
┌─ STEP 3: DESIGN CHECK ────┴──────────────────────────────────────────────┐
│  (frontend only)                                                          │
│  Read .planning/DESIGN.md → check against /fh:frontend-design            │
│  anti-patterns                                             Impeccable    │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
                             ▼
                     MODERATE+: /fh:simplify → /fh:review
                     SIMPLE:    /fh:review directly
```

---

## `/fh:refactor` — Behavior-Preserving Restructuring

```
 REFACTORING TARGET
      │
      ▼
┌─ STEP 1: SCOPE (via LSP) ─────────────────────────────────────────────────┐
│  findReferences, incomingCalls, outgoingCalls, documentSymbol              │
│  Map the full blast radius before touching anything                       │
└────────────────────────────┬───────────────────────────────────────────────┘
                             │
┌─ STEP 2: BASELINE ─────────┴──────────────────────────────────────────────┐
│  Run existing tests → record green state                                  │
│  If coverage insufficient → write characterization tests                  │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
┌─ STEP 3-4: ATOMIC STEPS ──┴──────────────────────────────────────────────┐
│                                                                           │
│  For each atomic change:                                                  │
│  1. LSP findReferences before modifying                                  │
│  2. Prefer LSP rename over manual find-replace                           │
│  3. Apply change + commit                                                │
│  4. Run FULL test suite                                                  │
│                                                                           │
│  ╔══════════════════════════════════════════════╗                         │
│  ║  IRON LAW: Tests NEVER go red.              ║                         │
│  ║  Violation = IMMEDIATE revert + rethink.    ║                         │
│  ╚══════════════════════════════════════════════╝                         │
│                                                                           │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
                             ▼
                     /fh:simplify → /fh:review
```

---

## `/fh:plan-work` — Research → Design → Plan

```
 USER REQUEST + ROADMAP.md
      │
      ▼
┌─ STEP 0: PHASE MATCH ─────────────────────────────────────────────────────┐
│  Map request to ROADMAP.md phase                                GSD      │
└────────────────────────────┬───────────────────────────────────────────────┘
                             │
┌─ STEP 1: RESEARCH ─────────┴──(conditional)───────────────────────────────┐
│                                                                           │
│  /fh:research (Task subagent)                                            │
│  Uses: Firecrawl (web) or Context7 (docs)                                │
│  Output: RESEARCH.md with confidence tags (HIGH/MEDIUM/LOW)              │
│                                                                           │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
┌─ STEP 2: BRAINSTORM ──────┴──────────────────────────────────────────────┐
│                                                                           │
│  /fh:brainstorming                                        Superpowers    │
│  Dispatches: code-explorer + code-architect agents        Feature-Dev    │
│  ┌──────────────────────────────────────────────────┐                    │
│  │  code-explorer uses LSP to trace code flow:      │                    │
│  │  goToDefinition, findReferences, hover           │                    │
│  │  code-architect uses LSP to discover patterns:   │                    │
│  │  workspaceSymbol, findReferences, documentSymbol │                    │
│  └──────────────────────────────────────────────────┘                    │
│  Reads: .planning/DESIGN.md                               Impeccable    │
│  Output: .planning/designs/YYYY-MM-DD-<topic>.md                         │
│                                                                           │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
┌─ STEP 3: DISCUSS ──────────┴──────────────────────────────────────────────┐
│                                                                           │
│  Orchestrator uses LSP directly:                                         │
│  workspaceSymbol to find reusable assets, findReferences for patterns    │
│  Identify 3-4 gray areas → ask user (AskUserQuestion)                    │
│  Lock decisions in CONTEXT.md                                            │
│                                                                           │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
┌─ STEP 4-5: DERIVE & WRITE ┴──────────────────────────────────────────────┐
│                                                                           │
│  Extract from design decisions:                                          │
│  • Truths (user-observable outcomes)                                     │
│  • Artifacts (files + content markers)                                   │
│  • Key links (how artifacts connect)                                     │
│                                                                           │
│  Write: .planning/phases/XX-name/XX-NN-PLAN.md                    GSD   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## `/fh:quick` — Lightweight Task Runner

```
 SMALL TASK (+ optional flags)
      │
      ├── --discuss : adds gray-area discussion step
      ├── --full   : adds plan-checker + verifier
      │
      ▼
┌─ STEP 5: PLAN ────────────────────────────────────────────────────────────┐
│  gsd-planner subagent                                           GSD      │
│                                                                           │
│  (if --full) STEP 5.5: gsd-plan-checker  →  max 2 revision loops  GSD   │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
┌─ STEP 6: EXECUTE ──────────┴──────────────────────────────────────────────┐
│  gsd-executor subagent                                          GSD      │
│                                                                           │
│  (if --full) STEP 6.5: gsd-verifier                             GSD     │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
                             ▼
                     Update STATE.md + final commit
```

---

## `/fh:verify` — Goal-Backward Truth Tables

```
 INPUT: phase number | branch name | current position
      │
      ▼
┌─ STEP 2: TRUTH TABLE ─────────────────────────────────────────────────────┐
│  Load PLAN.md must_haves → build truth table                     GSD     │
│  For each truth: gather fresh evidence from codebase                     │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
┌─ STEP 3: EVIDENCE ─────────┴──────────────────────────────────────────────┐
│  /fh:verification-before-completion                       Superpowers    │
│  Run: tests, build, lint → capture exit codes as proof                   │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
┌─ STEP 4: ANTI-PATTERNS ───┴──────────────────────────────────────────────┐
│  Check for: orphaned artifacts, missing tests,                           │
│  uncommitted changes, stale imports                                      │
└────────────────────────────┬──────────────────────────────────────────────┘
                             │
                             ▼
                     PASS: all truths verified
                     FAIL: auto-generate gap-closure PLAN.md
```

---

## Skill Origin Legend

| Origin | Skills | Role in Composites |
|--------|--------|--------------------|
| **Superpowers** | brainstorming, TDD, systematic-debugging, verification-before-completion, simplify, finishing-dev-branch, dispatching-parallel | Core engineering discipline — how to write, test, debug, verify, and ship code |
| **Impeccable** | critique, polish, normalize, harden, animate, audit, frontend-design | Design quality — visual refinement, accessibility, design system compliance |
| **GSD** | planner, executor, verifier, plan-checker, debugger, integration-checker | Project tracking — planning, execution, verification, state management |
| **Feature-Dev** | code-explorer, code-architect, code-reviewer | Code intelligence — exploration, architecture analysis, review expertise |
| **Vercel BP** | nextjs-perf | Performance — React/Next.js specific optimization patterns |
| **Playwright BP** | playwright-testing | Testing — E2E test patterns, locators, Page Object Model, CI setup |

---

## The Orchestrator Pattern

What composites **do**:
- Read project state (`.planning/`)
- Classify the situation (triage, phase matching, flag parsing)
- Decide which skills to invoke and in what order
- Apply gates between steps (spec gate, design gate, security gate)
- Aggregate results and make pass/fail decisions
- Update project state when done

What composites **don't do**:
- Write application code (delegated to task subagents)
- Define how to write tests (delegated to TDD/Playwright skills)
- Define what "good code" looks like (delegated to review/simplify skills)
- Define security rules (delegated to secure + OWASP checklist)
- Define design quality (delegated to Impeccable skills)
- Define project structure (delegated to GSD skills)

The composite is the **conductor** — it doesn't play any instrument, but it determines the tempo, dynamics, and when each section enters.
