# fhhs-skills

A workflow plugin for [Claude Code](https://claude.com/claude-code) that brings together engineering discipline, design quality, and project tracking into one install.

38 commands. 17 internal skills. 15 specialized agents. No other plugins required.

## Install

```
/plugin marketplace add cinjoff/fhhs-skills
/plugin install fh@fhhs-skills
/reload-plugins
/fh:setup
```

Run `/reload-plugins` after installing so the new commands are available in your current session.

Setup (`/fh:setup`) detects your platform (macOS, Linux, Windows) and walks you through installing dependencies: Node.js, GitHub CLI, TypeScript language server, and the TypeScript LSP plugin.

## Quick Start

```
/fh:new-project    set up a project with structure and tracking
/plan-work         design a feature before building it
/build             execute the plan with parallel workers and quality gates
/verify            confirm everything works with real evidence
```

When you come back to an existing project:

```
/resume-work    restore context and pick up where you left off
/progress       see where you are and what's next
```

## Commands

### Build Pipeline

| Command | What it does |
|---------|-------------|
| `/fh:new-project` | Set up a project with vision, tech stack, design language, and roadmap |
| `/plan-work` | Brainstorm, research, and produce an execution-ready plan |
| `/build` | Execute a plan with parallel subagents, TDD, design gates, and verification |
| `/verify` | Goal-backward verification with truth tables and fresh evidence |
| `/verify-ui` | Visual verification with browser screenshots |

### Engineering

| Command | What it does |
|---------|-------------|
| `/fix` | Auto-triage and fix bugs with systematic debugging |
| `/refactor` | Restructure code safely, tests green at every step |
| `/simplify` | Review code for reuse, quality, and efficiency |
| `/research` | Investigate a topic before planning |

### Navigation

| Command | What it does |
|---------|-------------|
| `/resume-work` | Restore context and route to the right next action |
| `/progress` | See where you are and what's next |
| `/fh:tracker` | Launch the visual project dashboard (real-time web UI at localhost:3847) |

### Design Quality

| Command | What it does |
|---------|-------------|
| `/critique` | Evaluate visual hierarchy, information architecture, and design quality |
| `/polish` | Fix alignment, spacing, consistency, and detail issues |
| `/normalize` | Match your design system and ensure consistency |
| `/harden` | Error handling, i18n, text overflow, edge cases |
| `/animate` | Purposeful motion and micro-interactions |
| `/audit` | Full accessibility, performance, theming, and responsive audit |
| `/teach-impeccable` | One-time setup for your project's design language |

<details>
<summary>More design commands</summary>

| Command | What it does |
|---------|-------------|
| `/adapt` | Make designs work across screen sizes and platforms |
| `/bolder` | Amplify safe designs to be more visually interesting |
| `/quieter` | Tone down overly aggressive designs |
| `/distill` | Strip away unnecessary complexity |
| `/clarify` | Improve confusing labels, errors, and microcopy |
| `/colorize` | Add strategic color to monochromatic interfaces |
| `/delight` | Add personality and moments of joy |
| `/extract` | Pull reusable components into your design system |
| `/onboard` | Design first-time user experiences and empty states |
| `/optimize` | Improve loading speed, rendering, and bundle size |

</details>

### Task Management

| Command | What it does |
|---------|-------------|
| `/quick` | Do a small task with tracking guarantees |
| `/add-todo` | Capture an idea or task for later |
| `/check-todos` | See pending todos and pick one |

Phase management, milestone lifecycle, and test generation are handled automatically by `/plan-work`, `/build`, and `/verify`.

### Setup & Maintenance

| Command | What it does |
|---------|-------------|
| `/fh:setup` | One-time setup after installing |
| `/fh:settings` | Configure workflow preferences |
| `/fh:health` | Check if your project files are in good shape |
| `/map-codebase` | Analyze your codebase structure |
| `/fh:revise-claude-md` | Update CLAUDE.md with learnings from the session |
| `/fh:update` | Check for updates and install the latest version |
| `/fh:help` | Command reference and architecture guide |

## How It Works

The commands you run are **orchestrators**. They don't do the work themselves -- they decide what to invoke, in what order, and with what gates between steps. The actual work is handled by 17 internal skills and 15 specialized agents from six upstream sources.

```
 YOUR COMMAND
      |
      v
+----------------------------------+
|   COMPOSITE (Orchestrator)       |  <-- Decides WHAT to do and WHEN
|   Reads project state            |      Does NOT do the work itself
|   ~15% context budget            |
+----------------------------------+
           | dispatches
           v
+----------------------------------+
|   UPSTREAM SKILLS + AGENTS       |  <-- Decides HOW to do each step
|   Fresh subagent context         |      Owns the domain expertise
|   Loaded on demand               |
+----------------------------------+
```

### Upstream Sources

| Source | What it provides | Skills / Agents |
|--------|-----------------|-----------------|
| [Superpowers](https://github.com/obra/superpowers) | Engineering discipline | brainstorming, TDD, systematic-debugging, verification, simplify, finishing-dev-branch, parallel dispatch |
| [Impeccable](https://github.com/pbakaus/impeccable) | Design quality | critique, polish, normalize, harden, animate, audit, frontend-design |
| [GSD](https://github.com/gsd-build/get-shit-done) | Project orchestration | planner, executor, verifier, plan-checker, debugger, integration-checker |
| [feature-dev](https://github.com/anthropics/claude-code-plugin-examples) | Code intelligence | code-explorer, code-architect, code-reviewer |
| [Vercel React BP](https://github.com/anthropics/claude-code-plugin-examples) | Performance | nextjs-perf (6 optimization categories) |
| [Playwright BP](https://github.com/anthropics/claude-code-plugin-examples) | E2E testing | playwright-testing (37 reference files) |

All upstreams are forked and bundled. See [PATCHES.md](PATCHES.md) for modifications.

### LSP Across Workflows

LSP (TypeScript Language Server) is a shared capability used across multiple workflows for precise code navigation -- faster and more accurate than grep for tracing code.

```
                   LSP: goToDefinition, findReferences, hover,
                        workspaceSymbol, documentSymbol, rename
                   ------------------------------------------------
                                        |
        +---------------+---------------+---------------+---------------+
        v               v               v               v               v
  /build           /fix           /refactor      /plan-work       /extract
  +---------+    +---------+    +----------+    +----------+    +----------+
  |Subagents|    |Triage   |    |Scope +   |    |Orchestr. |    |Find      |
  |navigate |    |traces   |    |execute   |    |scouting  |    |design    |
  |code via |    |error to |    |with      |    |+ explorer|    |system +  |
  |implement|    |root via |    |rename +  |    |+ architect|    |update    |
  |-prompt  |    |refs +   |    |refs at   |    |subagents |    |refs      |
  |template |    |hover    |    |every step|    |          |    |          |
  +---------+    +---------+    +----------+    +----------+    +----------+

  /review does NOT use LSP -- it operates on diffs, not code navigation.
```

---

## `/build` -- The Full Pipeline

The most complex orchestrator. Executes plans through waves of parallel subagents with quality gates between them.

```
 PLAN.md (from /plan-work)
      |
      v
+- LOAD & PARSE -----------------------------------------------------+
|  Read PLAN.md frontmatter                                          |
|  Extract waves, dependencies, must_haves                           |
+----------------------------+---------------------------------------+
                             |
      +----------------------+---------------------+
      v                      v                     v
+-----------+    +--------------+    +--------------+
|  WAVE 1   |    |   WAVE 2     |    |   WAVE N     |
|  Task A   |    |   Task C     |    |   Task E     |
|  Task B   |    |   Task D     |    |              |
+-----+-----+    +------+-------+    +------+-------+
      |                  |                   |
      |  Each task = fresh subagent with implementer-prompt.md
      |
      |  ALL SUBAGENTS USE:
      |  +---------------------------------------------+
      |  |  LSP: goToDefinition, findReferences,       |
      |  |       hover, documentSymbol                 |
      |  +---------------------------------------------+
      |
      |  CONDITIONALLY ACTIVATE:
      |  +---------------------------------------------+
      |  |  /fh:test-driven-development  (if tdd)      | <-- Superpowers
      |  |  /fh:playwright-testing       (if e2e)      | <-- Playwright BP
      |  |  /fh:nextjs-perf             (if Next.js)   | <-- Vercel BP
      |  |  /fh:frontend-design         (if .tsx)      | <-- Impeccable
      |  +---------------------------------------------+
      |
      v
+- SPEC GATE --------------------------------------------------------+
|  code-reviewer subagent (spec-gate-prompt.md)       Feature-Dev    |
|  Checks: missing reqs, stubs, unwired code, TS strictness         |
|  Result: PASS -> next wave  |  BLOCKING -> fixes required         |
+----------------------------+---------------------------------------+
                             |
                             v  (repeat for each wave)
                             |
+- DESIGN GATES (if frontend) ---------------------------------------+
|                                                                     |
|  Sequential pipeline -- each gate refines previous output:          |
|                                                                     |
|  +-----------+   +-----------+   +------------+                     |
|  |/fh:critique|-->|/fh:polish |-->|/fh:normalize|    Impeccable     |
|  | UX quality |   | Visual    |   | Design     |                    |
|  | review     |   | refine    |   | system fit |                    |
|  +-----------+   +-----------+   +------------+                     |
|                                                                     |
|  Optional add-ons:                                                  |
|  +-----------+   +-----------+                                      |
|  |/fh:harden |   |/fh:animate|                                      |
|  | Edge cases|   | Motion    |                                      |
|  +-----------+   +-----------+                                      |
+----------------------------+---------------------------------------+
                             |
+- SIMPLIFY -----------------+---------------------------------------+
|                                                                     |
|  /fh:simplify dispatches 3 PARALLEL agents on diff: Superpowers    |
|                                                                     |
|  +-------------+  +-------------+  +-------------+                  |
|  | REUSE agent |  |QUALITY agent|  | EFFICIENCY  |                  |
|  | Duplication |  | Naming, DRY |  | agent       |                  |
|  | extraction  |  | complexity  |  | Performance |                  |
|  +-------------+  +-------------+  +-------------+                  |
+----------------------------+---------------------------------------+
                             |
                             v
                     /fh:review (see below)
```

## `/review` -- Pre-Promotion Gate

Shared terminal step for `/build`, `/fix`, and `/refactor`.

```
+- /fh:review -------------------------------------------------------+
|                                                                     |
|  STEP 1: CODE QUALITY                               Feature-Dev    |
|  +------------------------------------------------+                |
|  |  code-reviewer subagent (review-prompt.md)      |                |
|  |  + /fh:nextjs-perf criteria (if Next.js)        | <-- Vercel BP |
|  |  Severity: Critical > Important > Minor > Nit   |                |
|  +------------------------------------------------+                |
|                                                                     |
|  STEP 2: SECURITY SCAN                                              |
|  +------------------------------------------------+                |
|  |  /fh:secure -> 4 PARALLEL agents:              |                |
|  |  +----------+ +--------+ +------+ +--------+   |                |
|  |  | Injection| | Auth + | | Data | | Access |   |                |
|  |  | + XSS    | |Session | |Expose| | Ctrl   |   | <-- OWASP     |
|  |  +----------+ +--------+ +------+ +--------+   |                |
|  |  Gate: BLOCK (CRITICAL) / WARN (HIGH) / PASS   |                |
|  +------------------------------------------------+                |
|                                                                     |
|  STEP 3: EVIDENCE                                    Superpowers    |
|  +------------------------------------------------+                |
|  |  /fh:verification-before-completion             |                |
|  |  Runs: test suite, build, lint                  |                |
|  |  Captures exit codes as proof                   |                |
|  +------------------------------------------------+                |
|                                                                     |
|  STEP 4: TYPESCRIPT STRICTNESS                       (built-in)     |
|  +------------------------------------------------+                |
|  |  Grep diff for: `any`, `as` casts,             |                |
|  |  non-exhaustive switches                        |                |
|  +------------------------------------------------+                |
|                                                                     |
|  STEP 5: GATE DECISION                                              |
|  +------------------------------------------------+                |
|  |  BLOCK if: Critical security/code issues,      |                |
|  |            verification failures, `any` usage   |                |
|  |  WARN  if: HIGH security findings               |                |
|  |  PASS  otherwise                                |                |
|  +------------------------------------------------+                |
|                                                                     |
|  STEP 6: PROMOTE (if PASS)                           Superpowers    |
|  +------------------------------------------------+                |
|  |  /fh:finishing-a-development-branch             |                |
|  |  Options: Create PR / Merge / Keep / Discard    |                |
|  +------------------------------------------------+                |
+---------------------------------------------------------------------+
```

## `/fix` -- Bug Triage + TDD

```
 BUG REPORT
      |
      v
+- TRIAGE (via LSP) -------------------------------------------------+
|                                                                     |
|  LSP: goToDefinition, findReferences, hover                        |
|  Classify severity:                                                 |
|                                                                     |
|  SIMPLE   -------------------------------------------> Step 2 (TDD)|
|  MODERATE --> /fh:systematic-debugging -------------> Step 2       |
|  PARALLEL --> N x gsd-debugger subagents -----------> Step 2       |
|  COMPLEX  --> Persistent .planning/debug/ session --> Step 2       |
|                                                                     |
+----------------------------+---------------------------------------+
                             |
+- TDD FIX ------------------+---------------------------------------+
|                                                                     |
|  /fh:test-driven-development                        Superpowers    |
|  RED -> write failing test proving the bug                          |
|  GREEN -> minimal fix to pass                                       |
|  REFACTOR -> clean up                                               |
|                                                                     |
|  (if Playwright project) + /fh:playwright-testing   Playwright BP  |
|                                                                     |
+----------------------------+---------------------------------------+
                             |
+- DESIGN CHECK -------------+---------------------------------------+
|  (frontend only)                                                    |
|  Read .planning/DESIGN.md -> check /fh:frontend-design  Impeccable |
+----------------------------+---------------------------------------+
                             |
                             v
                     MODERATE+: /fh:simplify -> /fh:review
                     SIMPLE:    /fh:review directly
```

## `/refactor` -- Behavior-Preserving Restructuring

```
 REFACTORING TARGET
      |
      v
+- SCOPE (via LSP) --------------------------------------------------+
|  findReferences, incomingCalls, outgoingCalls, documentSymbol       |
|  Map the full blast radius before touching anything                 |
+----------------------------+---------------------------------------+
                             |
+- BASELINE -----------------+---------------------------------------+
|  Run existing tests -> record green state                           |
|  If coverage insufficient -> write characterization tests           |
+----------------------------+---------------------------------------+
                             |
+- ATOMIC STEPS -------------+---------------------------------------+
|                                                                     |
|  For each atomic change:                                            |
|  1. LSP findReferences before modifying                             |
|  2. Prefer LSP rename over manual find-replace                      |
|  3. Apply change + commit                                           |
|  4. Run FULL test suite                                             |
|                                                                     |
|  +===============================================+                  |
|  |  IRON LAW: Tests NEVER go red.                |                  |
|  |  Violation = IMMEDIATE revert + rethink.      |                  |
|  +===============================================+                  |
|                                                                     |
+----------------------------+---------------------------------------+
                             |
                             v
                     /fh:simplify -> /fh:review
```

## `/plan-work` -- Research, Design, Plan

```
 USER REQUEST + ROADMAP.md
      |
      v
+- PHASE MATCH ---------------------------------------------------+
|  Map request to ROADMAP.md phase                           GSD   |
+----------------------------+------------------------------------+
                             |
+- RESEARCH (conditional) ---+------------------------------------+
|                                                                  |
|  /fh:research (Task subagent)                                   |
|  Uses: Firecrawl (web) or Context7 (docs)                       |
|  Output: RESEARCH.md with confidence tags (HIGH/MEDIUM/LOW)     |
|                                                                  |
+----------------------------+------------------------------------+
                             |
+- BRAINSTORM ---------------+------------------------------------+
|                                                                  |
|  /fh:brainstorming                               Superpowers    |
|  Dispatches: code-explorer + code-architect      Feature-Dev    |
|  +------------------------------------------------+             |
|  |  code-explorer uses LSP to trace code flow:    |             |
|  |  goToDefinition, findReferences, hover         |             |
|  |  code-architect uses LSP to discover patterns: |             |
|  |  workspaceSymbol, findReferences, documentSym  |             |
|  +------------------------------------------------+             |
|  Reads: .planning/DESIGN.md                      Impeccable    |
|  Output: .planning/designs/YYYY-MM-DD-<topic>.md                |
|                                                                  |
+----------------------------+------------------------------------+
                             |
+- DISCUSS ------------------+------------------------------------+
|                                                                  |
|  Orchestrator uses LSP directly:                                |
|  workspaceSymbol for reusable assets, findReferences for usage  |
|  Identify 3-4 gray areas -> ask user                            |
|  Lock decisions in CONTEXT.md                                   |
|                                                                  |
+----------------------------+------------------------------------+
                             |
+- DERIVE & WRITE -----------+------------------------------------+
|                                                                  |
|  Extract from design decisions:                                 |
|  - Truths (user-observable outcomes)                            |
|  - Artifacts (files + content markers)                          |
|  - Key links (how artifacts connect)                            |
|                                                                  |
|  Write: .planning/phases/XX-name/XX-NN-PLAN.md           GSD   |
|                                                                  |
+-----------------------------------------------------------------+
```

## `/quick` -- Lightweight Task Runner

```
 SMALL TASK (+ optional flags)
      |
      +-- --discuss : adds gray-area discussion step
      +-- --full   : adds plan-checker + verifier
      |
      v
+- PLAN ----------------------------------------------------------+
|  gsd-planner subagent                                    GSD    |
|                                                                  |
|  (if --full) gsd-plan-checker -> max 2 revision loops    GSD    |
+----------------------------+------------------------------------+
                             |
+- EXECUTE ------------------+------------------------------------+
|  gsd-executor subagent                                   GSD    |
|                                                                  |
|  (if --full) gsd-verifier                                GSD    |
+----------------------------+------------------------------------+
                             |
                             v
                     Update STATE.md + final commit
```

## `/verify` -- Goal-Backward Truth Tables

```
 INPUT: phase number | branch name | current position
      |
      v
+- TRUTH TABLE ---------------------------------------------------+
|  Load PLAN.md must_haves -> build truth table            GSD    |
|  For each truth: gather fresh evidence from codebase            |
+----------------------------+------------------------------------+
                             |
+- EVIDENCE -----------------+------------------------------------+
|  /fh:verification-before-completion              Superpowers    |
|  Run: tests, build, lint -> capture exit codes as proof         |
+----------------------------+------------------------------------+
                             |
+- ANTI-PATTERNS ------------+------------------------------------+
|  Check for: orphaned artifacts, missing tests,                  |
|  uncommitted changes, stale imports                             |
+----------------------------+------------------------------------+
                             |
                             v
                     PASS: all truths verified
                     FAIL: auto-generate gap-closure PLAN.md
```

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

The composite is the **conductor** -- it doesn't play any instrument, but it determines the tempo, dynamics, and when each section enters.

## Typical Workflows

**Building a feature:**
```
/plan-work  ->  /build  ->  /verify  ->  /verify-ui
```

**Fixing a bug:**
```
/fix
```

**Refactoring:**
```
/refactor  ->  /simplify
```

**Starting a new session:**
```
/resume-work
```

## Updating

```
/fh:update
```

## License

MIT
