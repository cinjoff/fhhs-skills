# fhhs-skills

A workflow plugin for [Claude Code](https://claude.com/claude-code) that combines engineering discipline, design quality, and project tracking in one install.

## Why

Most AI coding tools forget everything between sessions. They repeat mistakes, re-research decisions, and can't tell you what they learned last time. This plugin fixes that.

- **Learns from itself.** Every bug fix, code review, security scan, and research session persists its key findings. Next time, the same skill recalls what it discovered before — root causes, architectural decisions, vulnerability patterns, optimization wins.
- **Manages its own context.** Large outputs (scan results, agent reports, build logs) are indexed in a session-scoped database instead of flooding the context window. Skills query the index for what they need, keeping the window clean for reasoning.
- **Runs autonomously.** Hand off an entire project with `/fh:auto` — the system plans, reviews, builds, and verifies each phase without intervention. Every autonomous decision is logged with confidence levels for human audit.
- **Ships quality gates, not just code.** Plans get stress-tested before building. Builds get spec-verified before promoting. Bugs get TDD'd. Refactors keep tests green at every step.

### The Memory Lifecycle

Two optional MCP plugins power cross-session learning and context efficiency:

```
  SESSION START              DURING                    SESSION END

  claude-mem ──READ──▶  context-mode  ──WRITE──▶  claude-mem
  smart_search          ctx_batch_execute            [*-learning]
  (recall past)         ctx_search                   [*-finding]
                        (index + distill)            (persist new)
```

**[context-mode](https://github.com/mksglu/context-mode)** indexes large outputs into a searchable FTS5 database scoped to the session. Skills use `ctx_search` to extract relevant findings without loading raw data into context.

**[claude-mem](https://github.com/thedotmack/claude-mem)** provides persistent cross-session memory. Skills read past learnings at the start (via `smart_search`) and output structured findings at the end (via semantic markers like `[fix-learning]`, `[security-finding]`) that claude-mem's hooks automatically capture.

Both are optional — every skill includes "skip silently if unavailable" guards. The pipeline works identically without them, just without the indexing optimization and cross-session memory.

## Install

```
/plugin marketplace add cinjoff/fhhs-skills
/plugin install fh@fhhs-skills
/reload-plugins
/fh:setup
```

From terminal (Conductor or headless):
```bash
claude plugin marketplace add cinjoff/fhhs-skills
claude plugin install fh@fhhs-skills
```

Then start a Claude Code session and run `/fh:setup`. It detects your platform and walks you through installing dependencies.

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
/fh:new-project --auto "desc"    derive vision, stack, roadmap, then build everything
```

Each step runs as a separate `claude -p` session with fresh context. The orchestrator loads context-mode and claude-mem into each session and shares a context-mode FTS5 database across all 4 steps via a deterministic `CLAUDE_SESSION_ID`. Plan-work indexes your project docs once; plan-review, build, and review all reuse that index.

State persists to `.planning/.auto-state.json` between steps so crashes can resume. Decisions are logged to `.planning/DECISIONS.md` with confidence levels — LOW confidence decisions get flagged for human audit. Sessions exceeding 45 minutes are killed with a logged decision. Failed steps retry once, then skip with an audit trail.

## Commands

<details>
<summary><strong>Build Pipeline</strong></summary>

| Command | What it does |
|---------|-------------|
| `/fh:new-project` | Set up a project with vision, tech stack, design language, domain research, and roadmap |
| `/fh:plan-work` | Brainstorm, research, and produce an execution-ready plan |
| `/fh:plan-review` | Stress-test a plan — business + engineering alignment |
| `/fh:build` | Execute a plan with parallel subagents, TDD, and verification |
| `/fh:review` | Code quality, spec verification, goal verification, and branch promotion |
| `/fh:auto` | Autonomous multi-phase execution without human intervention |

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

Additional design skills (also auto-invoked by pipelines): `/fh:adapt`, `/fh:bolder`, `/fh:quieter`, `/fh:distill`, `/fh:clarify`, `/fh:colorize`, `/fh:delight`, `/fh:extract`, `/fh:onboard`, `/fh:optimize`.

</details>

<details>
<summary><strong>Navigation & Tasks</strong></summary>

| Command | What it does |
|---------|-------------|
| `/fh:progress` | Restore context, check status, route to next action |
| `/fh:tracker` | Launch the visual project dashboard (localhost:3847) |
| `/fh:todos` | Manage project todos — add new or review pending |

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

## How It Works

Each command is an orchestrator. It reads project state, dispatches specialized subagents that each run in fresh context, applies quality gates between steps, and updates state when done.

The underlying skills come from seven open-source projects:

| Source | What it provides |
|--------|-----------------|
| [Superpowers](https://github.com/obra/superpowers) | Engineering discipline — TDD, verification, debugging, brainstorming |
| [Impeccable](https://github.com/pbakaus/impeccable) | Design quality — critique, polish, normalize, harden, animate, audit |
| [GSD](https://github.com/gsd-build/get-shit-done) | Project orchestration — planning, execution, verification, integration |
| [gstack](https://github.com/garrytan/gstack) | Production safety — plan review (business + engineering), QA, anti-drift |
| [feature-dev](https://github.com/anthropics/claude-code-plugin-examples) | Code intelligence — exploration, architecture, review |
| [Next.js Best Practices](https://github.com/anthropics/claude-code-plugin-examples) | React/Next.js performance optimization (Vercel Engineering) |
| [Playwright Best Practices](https://github.com/anthropics/claude-code-plugin-examples) | End-to-end testing patterns |

All upstreams are forked and bundled. See [PATCHES.md](PATCHES.md) for modifications.

### Optional Integrations

| Tool | What it adds |
|------|-------------|
| [context-mode](https://github.com/mksglu/context-mode) | Session-scoped FTS5 indexing — large outputs stay out of context window |
| [claude-mem](https://github.com/thedotmack/claude-mem) | Cross-session persistent memory — learnings, patterns, decisions |
| [Fallow](https://docs.fallow.tools/) | Deterministic static analysis — dead code, circular deps, duplication |
| TypeScript LSP | Code navigation — go-to-definition, find-references, rename |

All optional — skills degrade gracefully without them.

<details>
<summary><strong>Plugin Integration Map</strong></summary>

Skills that read and write to cross-session memory:

| Skill | Reads (Past Learnings) | Indexes (context-mode) | Writes (Persist Findings) |
|-------|----------------------|---------------------|------------------------|
| plan-work | task keywords | planning docs | — (via build) |
| build | phase name | source files + plans | learnings digest |
| fix | bug area keywords | decisions/design | `[fix-learning]` |
| review | diff scope | agent reports | `[review-learning]` |
| plan-review | phase + architecture | planning state | `[plan-review-learning]` |
| refactor | module/pattern | target module | `[refactor-learning]` |
| audit | project/module | scan results | `[audit-finding]` |
| optimize | component/page | metrics | `[optimize-learning]` |
| secure | framework/stack | agent findings | `[security-finding]` |
| research | topic keywords | web/doc sources | `[research-finding]` |

Skills without plugins work identically — all integrations include "skip silently if unavailable" guards.

</details>

<details>
<summary><strong>Pipeline Diagrams</strong></summary>

### `/build` Pipeline

```
 PLAN.md (from /plan-work)
      |
  FIND + ANALYZE ──▶ WAVE 1 (parallel) ──▶ WAVE 2 ──▶ ... ──▶ WAVE N
      |                   |                                        |
      |              Each task = fresh subagent with LSP           |
      |              + TDD / Playwright / Next.js perf as needed   |
      |                                                            |
  COMMIT + VERIFY ◀────────────────────────────────────────────────┘
      |
  PHASE COMPLETION (if all plans done)
      |  Goal verification: must_haves truth table
      |  Design quality gates (if visual work > 30%)
      |  Final verification + VERIFICATION.md
      v
  /review (or /ui-test for frontend)
```

### `/review` Pipeline

```
  SCOPE + RUNTIME ERRORS ──▶ STATIC ANALYSIS (Fallow) ──▶ SPEC VERIFICATION
      |
  2 PARALLEL AGENTS: Code Quality + Gap Analysis
      |
  GOAL VERIFICATION (must_haves truth table)
      |
  EVIDENCE (tests, build, lint — fresh runs)
      |
  GATE: BLOCK / WARN / PASS ──▶ Promote branch
```

### `/fix` Pipeline

```
  BUG REPORT ──▶ RUNTIME ERROR CHECK ──▶ LSP TRIAGE
      |
  SIMPLE ───────────────────────────────▶ TDD fix
  MODERATE ──▶ systematic debugging ───▶ TDD fix
  PARALLEL ──▶ N debugger subagents ───▶ TDD fix
  COMPLEX ───▶ persistent debug session ▶ TDD fix
      |
  DESIGN CHECK (frontend) ──▶ VERIFICATION GATE ──▶ /review
```

### `/plan-work` Pipeline

```
  USER REQUEST ──▶ PHASE MATCH ──▶ COMPLEXITY ASSESSMENT
      |
  RESEARCH (conditional: complex/medium/skip)
      |
  BRAINSTORM ──▶ DISCUSS (lock decisions in CONTEXT.md)
      |
  WRITE PLAN (truths, artifacts, key links, waves)
      |
  PLAN-CHECK ──▶ /plan-review (default) ──▶ /build
```

</details>

## `/new-project` — What Gets Set Up

The default stack is **Next.js + TypeScript + Tailwind + shadcn/ui + Supabase + Better Auth + Vercel**. With `--auto`, the entire setup is hands-off.

<details>
<summary>Setup details</summary>

- **Brand-aware design system** — extracts colors, fonts, and style from your brand references
- **Better Auth** — generates secret, configures auth env vars
- **Resend email** — walks you through signup, creates a sending key
- **Organizations** — opt-in multi-tenant support (teams, roles, invitations)
- **Supabase** — creates project, configures API keys and `DATABASE_URL`
- **Vercel** — links project, syncs env vars, enables auto-deploys
- **shadcn/ui skills** — installs agent skills for component-aware workflows
- **Observability** — scaffolds local Sentry error tracking (SQLite-backed)
- **Conductor** — detects workspaces, creates `conductor.json` with `.env.local` symlinks

Everything is optional — skip what you don't need.

</details>

## Updating

```
/fh:update
```

## License

MIT
