# fhhs-skills

A workflow plugin for [Claude Code](https://claude.com/claude-code) that combines engineering discipline, design quality, and project tracking in one install.

## Install

```
/plugin marketplace add cinjoff/fhhs-skills
/plugin install fh@fhhs-skills
/reload-plugins
/fh:setup
```

Run `/reload-plugins` after installing so the new commands are available in your current session.

`/fh:setup` detects your platform (macOS, Linux, Windows) and walks you through installing dependencies: Node.js, GitHub CLI, TypeScript language server, and the TypeScript LSP plugin.

## Quick Start

```
/fh:new-project    set up a project with structure and tracking
/plan-work         design a feature before building it
/plan-review       challenge the plan before committing to build
/build             execute the plan with parallel workers and quality gates
/review            code quality, security, verification, and branch promotion
```

When you come back to an existing project:

```
/resume-work    restore context and pick up where you left off
/progress       see where you are and what's next
```

## Typical Workflows

**Building a feature:**
```
/plan-work  ->  /plan-review  ->  /build  ->  /review
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

## Commands

<details>
<summary><strong>Build Pipeline</strong></summary>

| Command | What it does |
|---------|-------------|
| `/fh:new-project` | Set up a project with vision, tech stack, design language, and roadmap |
| `/plan-work` | Brainstorm, research, and produce an execution-ready plan |
| `/plan-review` | Founder-level plan challenge — rethink scope, find the 10-star product |
| `/build` | Execute a plan with parallel subagents, TDD, design gates, and verification |
| `/qa` | Systematic QA testing with agent-browser backend |
| `/review` | Code quality, security scan, verification, and branch promotion |

</details>

<details>
<summary><strong>Engineering</strong></summary>

| Command | What it does |
|---------|-------------|
| `/fix` | Auto-triage and fix bugs with systematic debugging |
| `/refactor` | Restructure code safely, tests green at every step |
| `/simplify` | Review code for reuse, quality, and efficiency |
| `/research` | Investigate a topic before planning |

</details>

<details>
<summary><strong>Design Quality</strong></summary>

| Command | What it does |
|---------|-------------|
| `/critique` | Evaluate visual hierarchy, information architecture, and design quality |
| `/polish` | Fix alignment, spacing, consistency, and detail issues |
| `/normalize` | Match your design system and ensure consistency |
| `/harden` | Error handling, i18n, text overflow, edge cases |
| `/animate` | Purposeful motion and micro-interactions |
| `/audit` | Full accessibility, performance, theming, and responsive audit |
| `/teach-impeccable` | One-time setup for your project's design language |
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

<details>
<summary><strong>Navigation & Tasks</strong></summary>

| Command | What it does |
|---------|-------------|
| `/resume-work` | Restore context and route to the right next action |
| `/progress` | See where you are and what's next |
| `/fh:tracker` | Launch the visual project dashboard (real-time web UI at localhost:3847) |
| `/quick` | Do a small task with tracking guarantees |
| `/add-todo` | Capture an idea or task for later |
| `/check-todos` | See pending todos and pick one |

Phase management, milestone lifecycle, and test generation are handled automatically by `/plan-work`, `/build`, and `/review`.

</details>

<details>
<summary><strong>Setup & Maintenance</strong></summary>

| Command | What it does |
|---------|-------------|
| `/fh:setup` | One-time setup after installing |
| `/fh:settings` | Configure workflow preferences |
| `/fh:health` | Check if your project files are in good shape |
| `/map-codebase` | Analyze your codebase structure |
| `/fh:revise-claude-md` | Update CLAUDE.md with learnings from the session |
| `/fh:update` | Check for updates and install the latest version |
| `/fh:help` | Command reference and architecture guide |

</details>

## How It Works

Each command is an orchestrator. It reads project state, decides which skills and agents to invoke, applies quality gates between steps, and updates state when done. The orchestrator never writes application code — it dispatches specialized subagents that each run in a fresh context.

```
 YOUR COMMAND
      |
      v
+----------------------------------+
|   ORCHESTRATOR                   |  Decides WHAT to do and WHEN
|   Reads project state            |  Does NOT do the work itself
+----------------------------------+
           | dispatches
           v
+----------------------------------+
|   SKILLS + AGENTS                |  Decides HOW to do each step
|   Fresh subagent per task        |  Owns the domain expertise
|   LSP for code navigation        |
+----------------------------------+
```

The underlying skills and agents come from seven open-source projects:

| Source | What it provides |
|--------|-----------------|
| [Superpowers](https://github.com/obra/superpowers) | Engineering discipline — TDD, verification, debugging, brainstorming |
| [Impeccable](https://github.com/pbakaus/impeccable) | Design quality — critique, polish, normalize, harden, animate, audit |
| [GSD](https://github.com/gsd-build/get-shit-done) | Project orchestration — planning, execution, verification, integration |
| [gstack](https://github.com/garrytan/gstack) | Production safety — plan review, QA, anti-drift, context pressure |
| [feature-dev](https://github.com/anthropics/claude-code-plugin-examples) | Code intelligence — exploration, architecture, review |
| [Next.js Best Practices](https://github.com/anthropics/claude-code-plugin-examples) | React/Next.js performance optimization (Vercel Engineering) |
| [Playwright Best Practices](https://github.com/anthropics/claude-code-plugin-examples) | End-to-end testing patterns |

All upstreams are forked and bundled. TypeScript Language Server provides code navigation (go-to-definition, find-references, rename) across all code-working commands. See [PATCHES.md](PATCHES.md) for modifications.

---

## `/build` — The Full Pipeline

Executes plans through waves of parallel subagents with quality gates between them.

```
 PLAN.md (from /plan-work)
      |
      v
+- PARSE -------------------------------------------------------+
|  Read plan frontmatter                                         |
|  Extract waves, dependencies, must-haves                       |
+----------------------------+----------------------------------+
                             |
      +----------------------+---------------------+
      v                      v                     v
+-----------+    +--------------+    +--------------+
|  WAVE 1   |    |   WAVE 2     |    |   WAVE N     |
|  Task A   |    |   Task C     |    |   Task E     |
|  Task B   |    |   Task D     |    |              |
+-----+-----+    +------+-------+    +------+-------+
      |                  |                   |
      |  Each task = fresh subagent with LSP
      |
      |  Conditional skills per task:
      |  +---------------------------------------------+
      |  |  TDD                  (if tests needed)     |
      |  |  Playwright           (if E2E needed)       |
      |  |  Next.js perf         (if Next.js project)  |
      |  |  Design quality       (if frontend code)    |
      |  +---------------------------------------------+
      |
      v
+- SPEC GATE ---------------------------------------------------+
|  Code review: missing reqs, stubs, unwired code, TS strict    |
|  Result: PASS → next wave  |  BLOCKING → fixes required       |
+----------------------------+----------------------------------+
                             |
                             v  (repeat for each wave)
                             |
+- DESIGN GATES (if frontend) ---------------------------------+
|                                                               |
|  Sequential — each gate refines previous output:              |
|                                                               |
|  +-----------+   +-----------+   +------------+               |
|  | Critique  |-->|  Polish   |-->| Normalize  |               |
|  | UX quality|   | Visual    |   | Design     |               |
|  | review    |   | refine    |   | system fit |               |
|  +-----------+   +-----------+   +------------+               |
|                                                               |
|  Optional:                                                    |
|  +-----------+   +-----------+                                |
|  |  Harden   |   |  Animate  |                                |
|  | Edge cases|   |  Motion   |                                |
|  +-----------+   +-----------+                                |
+----------------------------+----------------------------------+
                             |
+- SIMPLIFY -----------------+----------------------------------+
|                                                               |
|  3 parallel agents review the diff:                           |
|                                                               |
|  +-------------+  +-------------+  +-------------+            |
|  |    REUSE    |  |   QUALITY   |  | EFFICIENCY  |            |
|  | Duplication |  | Naming, DRY |  | Performance |            |
|  | extraction  |  | complexity  |  |             |            |
|  +-------------+  +-------------+  +-------------+            |
+----------------------------+----------------------------------+
                             |
+- PRODUCTION SAFETY --------+----------------------------------+
|                                                               |
|  Production safety checklist (gstack-derived):                |
|  - Data migration risks                                       |
|  - Breaking API changes                                       |
|  - Feature flag coverage                                      |
|  - Rollback plan                                              |
|                                                               |
+----------------------------+----------------------------------+
                             |
                             v
                        /review  (or /qa for frontend)
```

## `/review` — Pre-Promotion Gate

Shared terminal step for `/build`, `/fix`, and `/refactor`.

```
+- REVIEW ------------------------------------------------------+
|                                                               |
|  1. CODE QUALITY                                              |
|  +---------------------------------------------------+       |
|  |  Code review (+ Next.js perf criteria if relevant) |       |
|  |  Severity: Critical > Important > Minor > Nit      |       |
|  +---------------------------------------------------+       |
|                                                               |
|  2. SECURITY SCAN                                             |
|  +---------------------------------------------------+       |
|  |  4 parallel agents — OWASP Top 10:                 |       |
|  |  +----------+ +--------+ +------+ +--------+      |       |
|  |  | Injection| | Auth + | | Data | | Access |      |       |
|  |  | + XSS    | |Session | |Expose| | Ctrl   |      |       |
|  |  +----------+ +--------+ +------+ +--------+      |       |
|  |  Gate: BLOCK (critical) / WARN (high) / PASS      |       |
|  +---------------------------------------------------+       |
|                                                               |
|  3. EVIDENCE                                                  |
|  +---------------------------------------------------+       |
|  |  Run tests, build, lint — capture exit codes       |       |
|  +---------------------------------------------------+       |
|                                                               |
|  4. TYPESCRIPT STRICTNESS                                     |
|  +---------------------------------------------------+       |
|  |  Grep diff for: `any`, `as` casts,                |       |
|  |  non-exhaustive switches                           |       |
|  +---------------------------------------------------+       |
|                                                               |
|  5. GATE DECISION                                             |
|  +---------------------------------------------------+       |
|  |  BLOCK: critical issues or verification failures   |       |
|  |  WARN:  high security findings                     |       |
|  |  PASS:  otherwise → promote branch                 |       |
|  +---------------------------------------------------+       |
+---------------------------------------------------------------+
```

## `/fix` — Bug Triage + TDD

```
 BUG REPORT
      |
      v
+- TRIAGE (via LSP) -------------------------------------------+
|                                                               |
|  Trace the bug through code with go-to-definition,           |
|  find-references, hover. Classify severity:                   |
|                                                               |
|  SIMPLE   ---------------------------------> TDD fix          |
|  MODERATE --> systematic debugging --------> TDD fix          |
|  PARALLEL --> N debugger subagents --------> TDD fix          |
|  COMPLEX  --> persistent debug session ----> TDD fix          |
|                                                               |
+----------------------------+---------------------------------+
                             |
+- TDD FIX ------------------+---------------------------------+
|                                                               |
|  RED    → write failing test proving the bug                  |
|  GREEN  → minimal fix to pass                                 |
|  REFACTOR → clean up                                          |
|                                                               |
|  + Playwright if E2E project                                  |
+----------------------------+---------------------------------+
                             |
+- DESIGN CHECK (frontend) -+----------------------------------+
|  Verify against project design language                       |
+----------------------------+---------------------------------+
                             |
                             v
                     MODERATE+: /simplify → /review
                     SIMPLE:    /review directly
```

## `/refactor` — Behavior-Preserving Restructuring

```
 REFACTORING TARGET
      |
      v
+- SCOPE (via LSP) --------------------------------------------+
|  find-references, incoming/outgoing calls, document symbols   |
|  Map the full blast radius before touching anything           |
+----------------------------+---------------------------------+
                             |
+- BASELINE -----------------+---------------------------------+
|  Run existing tests → record green state                      |
|  If coverage insufficient → write characterization tests      |
+----------------------------+---------------------------------+
                             |
+- ATOMIC STEPS -------------+---------------------------------+
|                                                               |
|  For each change:                                             |
|  1. find-references before modifying                          |
|  2. Prefer LSP rename over manual find-replace                |
|  3. Apply change + commit                                     |
|  4. Run full test suite                                       |
|                                                               |
|  +===============================================+            |
|  |  IRON LAW: Tests NEVER go red.                |            |
|  |  Violation = IMMEDIATE revert + rethink.      |            |
|  +===============================================+            |
|                                                               |
+----------------------------+---------------------------------+
                             |
                             v
                     /simplify → /review
```

## `/plan-work` — Research, Design, Plan

```
 USER REQUEST + ROADMAP.md
      |
      v
+- PHASE MATCH -------------------------------------------------+
|  Map request to roadmap phase                                  |
+----------------------------+----------------------------------+
                             |
+- RESEARCH (conditional) ---+----------------------------------+
|                                                                |
|  Web search or library docs lookup                             |
|  Output: RESEARCH.md with confidence tags (HIGH/MEDIUM/LOW)   |
|                                                                |
+----------------------------+----------------------------------+
                             |
+- BRAINSTORM ---------------+----------------------------------+
|                                                                |
|  Explorer + architect agents trace code via LSP                |
|  Reads project design language                                 |
|  Output: design document with options                          |
|                                                                |
+----------------------------+----------------------------------+
                             |
+- DISCUSS ------------------+----------------------------------+
|                                                                |
|  Identify 3–4 gray areas → ask user                            |
|  Lock decisions in CONTEXT.md                                  |
|                                                                |
+----------------------------+----------------------------------+
                             |
+- WRITE PLAN ---------------+----------------------------------+
|                                                                |
|  Extract from design decisions:                                |
|  - Truths (user-observable outcomes)                           |
|  - Artifacts (files + content markers)                         |
|  - Key links (how artifacts connect)                           |
|                                                                |
|  Output: PLAN.md with waves, dependencies, must-haves          |
|                                                                |
+----------------------------+----------------------------------+
                             |
                             v
                     /plan-review → /build
```

## `/quick` — Lightweight Task Runner

```
 SMALL TASK (+ optional flags)
      |
      +-- --discuss : adds gray-area discussion step
      +-- --full   : adds plan review + verification
      |
      v
+- PLAN --------------------------------------------------------+
|  Generate a plan for the task                                  |
|  (if --full) review plan → max 2 revision loops                |
+----------------------------+----------------------------------+
                             |
+- EXECUTE ------------------+----------------------------------+
|  Execute plan in a fresh subagent                              |
|  (if --full) verify results against plan                       |
+----------------------------+----------------------------------+
                             |
                             v
                     Update state + final commit
```

## Updating

```
/fh:update
```

## License

MIT
