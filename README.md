# fhhs-skills

A workflow plugin for [Claude Code](https://claude.com/claude-code) that combines engineering discipline, design quality, and project tracking in one install.

## Install

**From Claude Code (interactive session):**

```
/plugin marketplace add cinjoff/fhhs-skills
/plugin install fh@fhhs-skills
/reload-plugins
/fh:setup
```

**From terminal (Conductor or headless):**

If you're running inside Conductor or another environment where `/plugin` commands aren't available, run these in your terminal instead:

```bash
claude plugin marketplace add cinjoff/fhhs-skills
claude plugin install fh@fhhs-skills
```

Then start a Claude Code session and run `/fh:setup`.

`/fh:setup` detects your platform (macOS, Linux, Windows) and walks you through installing dependencies: Node.js, GitHub CLI, TypeScript language server, TypeScript LSP plugin, and shadcn/ui skills for component-aware agents.

## Quick Start

```
/fh:new-project    set up a project with structure and tracking
/fh:plan-work      design a feature before building it
/fh:plan-review    challenge the plan before committing to build
/fh:build          execute the plan with parallel workers and quality gates
/fh:review         code quality, security, verification, and branch promotion
```

When you come back to an existing project:

```
/fh:progress    restore context, check cross-session memory, and route to next action
improve 2       address an improvement item surfaced at session start
```

## Autonomous Execution

Hand off an entire project and walk away. `/fh:auto` runs plan-work, plan-review, build, and review for every phase — no human intervention required.

```
/fh:auto                         run all incomplete phases
/fh:auto --phase 3               run only phase 3
/fh:auto --budget 10             stop if estimated cost exceeds $10
/fh:auto --resume                pick up where a crashed run left off
/fh:auto --dry-run               preview what would execute
/fh:auto --check-corrections     propagate corrected decisions to affected files
```

Or start from scratch:

```
/fh:new-project --auto "A SaaS platform for pet grooming appointments"
```

This derives vision, tech stack, and requirements from the description, creates a scope-expansion roadmap, then hands off to `/fh:auto` to build every phase.

**How it works:** Each step (plan-work, plan-review, build, review) runs as a separate `claude -p` session with fresh context. State is persisted to `.planning/.auto-state.json` between steps so crashes can resume. Every autonomous decision is logged to `.planning/DECISIONS.md` with confidence levels — LOW confidence decisions are flagged with `NEEDS REVIEW` for human audit.

**Supervision:** Sessions that run longer than 10 minutes get a warning; at 45 minutes they're killed with a logged decision. Failed steps retry once, then skip with an audit trail. The `--budget` flag sets a cost ceiling based on estimated token usage.

## Native Task Tracking

`/fh:plan-work` and `/fh:build` integrate with Claude Code's native task list for live progress visibility:

```
/fh:plan-work creates tasks:       /fh:build creates tasks from plan:
  [~] Phase matching                 [~] Task 1: Add auth middleware
  [ ] Research                          ├─ [~] Write failing test
  [ ] Brainstorm                        ├─ [ ] Implement handler
  [ ] Discuss implementation            ├─ [ ] Run verification
  [ ] Derive must_haves              [ ] Task 2: Write tests
  [ ] Create plan                    [ ] Commit + verify
  [ ] Plan-check                     [ ] Phase completion check
```

Subagents create their own sub-tasks for granular progress. If task tools are unavailable, workflows degrade gracefully to GSD-only tracking.

**Conductor users:** Each workspace gets its own task list via `CLAUDE_CODE_TASK_LIST_ID` in `conductor.json`, so parallel workspaces don't pollute each other's tracking.

## Typical Workflows

**Building a feature:**
```
/fh:plan-work  ->  /fh:plan-review  ->  /fh:build  ->  /fh:review
```

**Fixing a bug:**
```
/fh:fix
```

**Refactoring:**
```
/fh:refactor  ->  /fh:simplify
```

**Autonomous (hands-off):**
```
/fh:new-project --auto "description"   or   /fh:auto
```

**Starting a new session:**
```
/fh:progress
```

## Commands

<details>
<summary><strong>Build Pipeline</strong></summary>

| Command | What it does |
|---------|-------------|
| `/fh:new-project` | Set up a project with vision, tech stack, design language, domain research, and roadmap. Default stack uses the [fh-starter-project](https://github.com/cinjoff/fh-starter-project) template with Better Auth, Resend email, optional organizations, and shadcn/ui |
| `/fh:plan-work` | Brainstorm, research, and produce an execution-ready plan |
| `/fh:plan-review` | Stress-test a plan — business + engineering alignment, research verification, respect-but-flag for locked decisions |
| `/fh:build` | Execute a plan with parallel subagents, TDD, and verification |
| `/fh:ui-test` | Visual verification and QA testing with agent-browser backend |
| `/fh:review` | Code quality, spec verification, goal verification, and branch promotion |
| `/fh:auto` | Autonomous multi-phase execution — plans, reviews, builds, and reviews each phase without human intervention |

</details>

<details>
<summary><strong>Engineering</strong></summary>

| Command | What it does |
|---------|-------------|
| `/fh:fix` | Auto-triage and fix bugs with systematic debugging |
| `/fh:refactor` | Restructure code safely, tests green at every step |
| `/fh:simplify` | Review code for reuse, quality, and efficiency |
| `/fh:research` | Investigate a topic before planning |

</details>

<details>
<summary><strong>Design Quality</strong></summary>

| Command | What it does |
|---------|-------------|
| `/fh:ui-critique` | Evaluate visual hierarchy, information architecture, and design quality |
| `/fh:ui-animate` | Purposeful motion and micro-interactions |
| `/fh:ui-test` | Visual verification and QA testing |
| `/fh:ui-redesign` | Change art direction and design context |
| `/fh:polish` | Fix alignment, spacing, consistency, and detail issues |
| `/fh:normalize` | Match your design system and ensure consistency |
| `/fh:harden` | Error handling, i18n, text overflow, edge cases |
| `/fh:audit` | Full accessibility, performance, theming, and responsive audit |
| `/fh:secure` | OWASP Top 10 security vulnerability scan |
| `/fh:observability` | Query local Sentry error store for runtime errors |
| `/fh:ui-branding` | One-time setup for your project's design language |

Additional design skills (also auto-invoked by `/fh:build` and other pipelines): `/fh:adapt`, `/fh:bolder`, `/fh:quieter`, `/fh:distill`, `/fh:clarify`, `/fh:colorize`, `/fh:delight`, `/fh:extract`, `/fh:onboard`, `/fh:optimize`.

</details>

<details>
<summary><strong>Navigation & Tasks</strong></summary>

| Command | What it does |
|---------|-------------|
| `/fh:progress` | Restore context (git + claude-mem), check status, route to next action. Also handles `improve N` for acting on learnings |
| `/fh:tracker` | Launch the visual project dashboard (real-time web UI at localhost:3847) |
| `/fh:todos` | Manage project todos — add new or review pending |

Phase management, milestone lifecycle, and test generation are handled automatically by `/fh:plan-work`, `/fh:build`, and `/fh:review`.

</details>

<details>
<summary><strong>Setup & Maintenance</strong></summary>

| Command | What it does |
|---------|-------------|
| `/fh:setup` | One-time setup after installing |
| `/fh:settings` | Configure workflow preferences |
| `/fh:health` | Check if your project files are in good shape |
| `/fh:map-codebase` | Analyze your codebase structure |
| `/fh:revise-claude-md` | Update CLAUDE.md with learnings from the session |
| `/fh:update` | Check for updates and install the latest version |
| `/fh:help` | Command reference and architecture guide |

</details>

## `/new-project` — What Gets Set Up

The default stack is **Next.js + TypeScript + Tailwind + shadcn/ui + Supabase + Better Auth + Vercel**.

With `--auto`, the entire setup is hands-off: vision, stack, and roadmap are derived from a project description, then `/fh:auto` takes over to build every phase.

During setup, `/fh:new-project` handles:

- **Brand-aware design system** — extracts colors, fonts, and style from your brand references and generates a custom shadcn preset
- **Better Auth** — generates `BETTER_AUTH_SECRET`, configures auth env vars
- **Resend email** — installs the Resend CLI, walks you through signup, and creates a project-scoped sending key for email verification and password resets
- **Organizations** — opt-in for multi-tenant support (teams, roles, invitations)
- **Supabase** — creates project, configures API keys, sets up `DATABASE_URL` with pooler
- **Vercel** — links project, syncs env vars, enables auto-deploys
- **shadcn/ui skills** — installs agent skills globally so Claude Code understands your components
- **Observability** — scaffolds local Sentry error tracking (SQLite-backed)
- **Conductor** — detects workspaces, creates `conductor.json` with `.env.local` symlinks

Everything is optional — skip what you don't need and add it later.

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
| [gstack](https://github.com/garrytan/gstack) | Production safety — plan review (business + engineering), QA, anti-drift |
| [feature-dev](https://github.com/anthropics/claude-code-plugin-examples) | Code intelligence — exploration, architecture, review |
| [Next.js Best Practices](https://github.com/anthropics/claude-code-plugin-examples) | React/Next.js performance optimization (Vercel Engineering) |
| [Playwright Best Practices](https://github.com/anthropics/claude-code-plugin-examples) | End-to-end testing patterns |

All upstreams are forked and bundled. TypeScript Language Server provides code navigation (go-to-definition, find-references, rename) across all code-working commands. See [PATCHES.md](PATCHES.md) for modifications.

### Continuous Improvement

Every `/fh:build` captures observations from [claude-mem](https://github.com/thedotmack/claude-mem) and distills them into a learnings digest (`~/.claude/cache/learnings-digest.json`). On your next session, the digest is surfaced automatically — no skill invocation needed:

```
★ [high] Tests for $& patterns in str.replace
● [med]  Plan-work skips research on medium tasks
○ [low]  Context usage spikes during build phases
3 pending improvements (1 addressed recently)
Say "improve <number>" to address any item, or continue with your task.
```

Say `improve 1` and a background agent addresses it — light items get a direct fix, medium items go through plan→build, heavy items get plan→review→build. The digest tracks what's been addressed and escalates recurring issues.

During `/fh:plan-work`, past learnings relevant to your current task are queried from claude-mem and injected into the research context, so past mistakes inform future designs.

### Optional: Fallow Static Analysis

If [Fallow](https://docs.fallow.tools/) is installed (`npm install -g fallow`), `/fh:simplify` and `/fh:review` automatically use it for deterministic dead-code detection, circular dependency analysis, code duplication, and complexity metrics. Fallow findings are injected into agent prompts as ground truth alongside the diff.

When Fallow is not installed, all skills behave identically to before — no errors, no degraded output.

---

## `/build` — The Full Pipeline

Executes plans through waves of parallel subagents with quality gates between them.

```
 PLAN.md (from /plan-work)
      |
      v
+- FIND + ANALYZE PLAN -----------------------------------------+
|  Read plan frontmatter                                         |
|  Extract waves, dependencies, must-haves                       |
|  Create native tasks from plan (TaskCreate per task + deps)    |
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
      |  Each task = fresh subagent with LSP + task ID
      |  Subagents create sub-tasks for live progress
      |
      |  Conditional skills per task:
      |  +---------------------------------------------+
      |  |  TDD                  (if tests needed)     |
      |  |  Playwright           (if E2E needed)       |
      |  |  Next.js perf         (if Next.js project)  |
      |  |  Design quality       (if frontend code)    |
      |  +---------------------------------------------+
      |
      v  (repeat for each wave)
      |
+- COMMIT + VERIFY + SUMMARY -----------------------------------+
|  Single commit for all waves                                   |
|  Run test suite, build, lint — fresh evidence before claims    |
|  Generate SUMMARY.md                                           |
+----------------------------+----------------------------------+
                             |
+- PHASE COMPLETION (if all plans done) ------------------------+
|                                                               |
|  Goal verification: must_haves truth table                    |
|  Artifact + key-link verification                             |
|                                                               |
|  Design quality gates (if visual work > 30%):                 |
|  Round 1: critique + harden → Round 2: polish + adapt         |
|  Round 3: normalize (if design system defined)                |
|                                                               |
|  Final verification + VERIFICATION.md                          |
|                                                               |
+----------------------------+----------------------------------+
                             |
                             v
                        /review  (or /ui-test for frontend)
```

## `/review` — Pre-Promotion Gate

Shared terminal step for `/build`, `/fix`, and `/refactor`.

```
+- REVIEW ------------------------------------------------------+
|                                                               |
|  1. SCOPE + RUNTIME ERROR CHECK                               |
|  +---------------------------------------------------+       |
|  |  Diff range + file list                            |       |
|  |  Query sentry local store (last 2hrs)              |       |
|  |  Cross-reference errors against diff by basename   |       |
|  +---------------------------------------------------+       |
|                                                               |
|  1.7 STATIC ANALYSIS (if fallow installed)                    |
|  +---------------------------------------------------+       |
|  |  fallow check → dead code, circular deps           |       |
|  |  fallow dupes → code duplication                   |       |
|  |  fallow health → complexity metrics                |       |
|  |  Post-filter to diff files, cap 200 lines          |       |
|  |  Inject as ground truth into review agents          |       |
|  +---------------------------------------------------+       |
|                                                               |
|  1.8 SPEC VERIFICATION (GSD projects only)                    |
|  +---------------------------------------------------+       |
|  |  Missing requirements, stubs, unwired code         |       |
|  |  TypeScript strictness (any, as casts, switches)   |       |
|  |  Wrong behavior (logic errors, type mismatches)    |       |
|  |  Result: BLOCKING / WARN / PASS                    |       |
|  +---------------------------------------------------+       |
|                                                               |
|  2. CODE QUALITY + GAP ANALYSIS (2 parallel agents)           |
|  +---------------------------------------------------+       |
|  |  Agent 1: code review + architecture + production  |       |
|  |           safety (+ Next.js perf if relevant)      |       |
|  |  Agent 2: gap analysis — untested paths,           |       |
|  |           unhandled errors, incomplete features     |       |
|  |  Severity: Critical > Important > Minor > Nit      |       |
|  +---------------------------------------------------+       |
|                                                               |
|  3. GOAL VERIFICATION (GSD projects only)                     |
|  +---------------------------------------------------+       |
|  |  must_haves truth table: PASS / FAIL / PARTIAL     |       |
|  |  Artifact + key-link verification                  |       |
|  +---------------------------------------------------+       |
|                                                               |
|  4. EVIDENCE                                                  |
|  +---------------------------------------------------+       |
|  |  Run tests, build, lint — capture exit codes       |       |
|  +---------------------------------------------------+       |
|                                                               |
|  5. GATE DECISION                                             |
|  +---------------------------------------------------+       |
|  |  BLOCK: critical issues or verification failures   |       |
|  |  WARN:  runtime errors in changed files            |       |
|  |  PASS:  otherwise → promote branch                 |       |
|  +---------------------------------------------------+       |
|                                                               |
|  For security scanning, use /fh:secure (OWASP Top 10)         |
+---------------------------------------------------------------+
```

## `/fix` — Bug Triage + TDD

```
 BUG REPORT
      |
      v
+- RUNTIME ERROR CHECK ----------------------------------------+
|  Query sentry local store for matching errors (last 60min)   |
|  Stack traces + breadcrumbs become starting evidence         |
+----------------------------+---------------------------------+
                             |
+- TRIAGE (via LSP) ---------+---------------------------------+
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
+- VERIFICATION GATE --------+--------------------------------+
|  Run tests fresh — evidence before completion claims          |
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

Native task tracking shows progress through each step in real-time.

```
 USER REQUEST + ROADMAP.md
      |
      v
+- TASK INIT ---------------------------------------------------+
|  Create native tasks for all planning steps (TaskCreate × 7)  |
|  Steps may be skipped (marked completed with skipped metadata) |
+----------------------------+----------------------------------+
                             |
+- PHASE MATCH -------------------------------------------------+
|  Map request to roadmap phase                                  |
+----------------------------+----------------------------------+
                             |
+- COMPLEXITY ASSESSMENT ----+----------------------------------+
|  Gauge scope and risk to calibrate research + review depth     |
+----------------------------+----------------------------------+
                             |
+- RESEARCH (conditional) ---+----------------------------------+
|                                                                |
|  Complex: spawn gsd-phase-researcher agent                     |
|  Medium: inline research subagent                              |
|  Simple: skip                                                  |
|  Output: XX-RESEARCH.md with confidence tags (HIGH/MEDIUM/LOW)|
|  Confidence gate: LOW findings → suggest deeper research       |
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
|  Lock decisions in CONTEXT.md (Decisions / Discretion Areas /  |
|  Deferred Ideas) — 3 canonical sections                        |
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
|  TDD coverage validation: WARN if <30% tasks mention tests    |
|  Playwright E2E advisory: WARN if frontend project lacks E2E  |
|                                                                |
|  Output: PLAN.md with waves, dependencies, must-haves          |
|                                                                |
+----------------------------+----------------------------------+
                             |
+- PLAN-CHECK + HANDOFF ----+----------------------------------+
|                                                                |
|  Verify plan structure, task spec quality                      |
|  Default: run /plan-review before proceeding to /build         |
|                                                                |
+----------------------------+----------------------------------+
                             |
                             v
                     /plan-review (default) → /build
```

## Updating

```
/fh:update           update the plugin itself
```

## License

MIT
