# fhhs-skills

An all-in-one workflow plugin for [Claude Code](https://claude.com/claude-code) — 49 skills covering planning, building, reviewing, debugging, design quality, security, startup validation, and autonomous execution. One install, no other plugins required.

## What You Get

**Plan before you build.** `/fh:plan-work` researches your problem, brainstorms approaches, locks decisions, and outputs an execution-ready plan. `/fh:plan-review` stress-tests it against business alignment, engineering rigor, and blast radius before a single line of code is written.

**Build with quality gates.** `/fh:build` turns plans into code using parallel subagents — each task runs in fresh context with TDD, LSP navigation, and framework-specific best practices. Phase completion triggers integration checks, goal verification, security review, and architecture artifact refresh.

**Review that actually catches things.** `/fh:review` runs static analysis, spec verification, goal verification against must-haves, and conditional quality refinement — dispatching sub-skills (polish, harden, normalize, security) based on what the diff actually touches. Recurring patterns across sessions are surfaced and escalated.

**Fix bugs systematically.** `/fh:fix` triages by complexity, writes a failing test first, then patches. Complex bugs get parallel debugger subagents or persistent debug sessions.

**Run autonomously.** `/fh:auto` chains plan → review → build → review for every phase without intervention. Decisions are logged with confidence levels. Crashes resume from state. Failed steps retry once, then skip with an audit trail.

**Cross-session memory.** Skills persist findings between sessions — root causes, architectural decisions, vulnerability patterns. Next time, the same skill recalls what it discovered before. Large outputs are indexed in a session-scoped database instead of flooding the context window.

**Validate startup ideas.** Five dedicated skills cover market research, competitive analysis, positioning, pitch scripts, and strategic advising — all feeding into the build pipeline when you're ready to code.

## Install

```
claude plugin marketplace add cinjoff/fhhs-skills
claude plugin install fh@fhhs-skills
```

Then run `/fh:setup` in a Claude Code session. It detects your platform and walks you through dependencies.

## Quick Start

### New Project

```
/fh:new-project          scaffold a project with vision, stack, design language, and roadmap
/fh:plan-work            design the first feature
/fh:build                execute the plan
/fh:review               verify and promote
```

### Returning to a Project

```
/fh:progress             restore context from cross-session memory, route to next action
```

### Hands-Off Mode

```
/fh:auto                          run all incomplete phases
/fh:auto --phase 3                run only phase 3
/fh:auto --resume                 pick up where a crashed run left off
/fh:new-project --auto "desc"     derive everything and build it all
```

## Skills Reference

### Build Pipeline

| Skill | Purpose |
|-------|---------|
| `/fh:new-project` | Project scaffolding — vision, stack, design language, domain research, roadmap |
| `/fh:plan-work` | Research, brainstorm, lock decisions, produce execution-ready plan |
| `/fh:plan-review` | Stress-test a plan before committing — business + engineering + impact |
| `/fh:build` | Execute plans with parallel subagents, TDD, quality gates, verification |
| `/fh:review` | Static analysis, spec verification, quality refinement, branch promotion |
| `/fh:auto` | Autonomous multi-phase execution with state persistence and audit trail |

### Engineering

| Skill | Purpose |
|-------|---------|
| `/fh:fix` | Triage → failing test → patch → verify |
| `/fh:refactor` | Restructure code safely, tests green at every step |
| `/fh:simplify` | Review changed code for reuse, quality, and efficiency |
| `/fh:research` | Investigate a topic — web search, docs, structured writeup |
| `/fh:map-codebase` | Analyze and document codebase structure |

### Design & UI

| Skill | Purpose |
|-------|---------|
| `/fh:ui-critique` | Visual hierarchy, information architecture, design quality feedback |
| `/fh:ui-animate` | Motion and micro-interactions |
| `/fh:ui-test` | Screenshot verification and functional QA |
| `/fh:ui-branding` | One-time design language setup |
| `/fh:audit` | Accessibility, performance, theming, responsive audit |
| `/fh:secure` | OWASP Top 10 security scan |

Additional design skills invoked by pipelines or directly: `adapt`, `bolder`, `clarify`, `colorize`, `delight`, `distill`, `extract`, `harden`, `normalize`, `onboard`, `optimize`, `polish`, `quieter`.

### Startup Validation

| Skill | Purpose |
|-------|---------|
| `/fh:startup-design` | Validate an idea — market research, strategy, brand, product, financials |
| `/fh:startup-competitors` | Battle cards, pricing landscape, feature matrix |
| `/fh:startup-positioning` | April Dunford framework, Moore statement, category analysis |
| `/fh:startup-pitch` | Pitch scripts in 5 formats with optional investor roleplay |
| `/fh:startup-advisor` | Strategic advice backed by curated decision frameworks |

Startup artifacts in `.planning/startup/` feed directly into `/fh:new-project` and `/fh:auto`.

### Project Navigation

| Skill | Purpose |
|-------|---------|
| `/fh:progress` | Restore context, check status, route to next action |
| `/fh:todos` | Track and manage project todos |
| `/fh:learnings` | Surface improvement insights from cross-session memory |
| `/fh:observability` | Query local Sentry error store |

### Setup & Maintenance

| Skill | Purpose |
|-------|---------|
| `/fh:setup` | One-time platform setup |
| `/fh:update` | Update plugin + close setup gaps from new versions |
| `/fh:health` | Validate project file integrity |
| `/fh:settings` | Configure workflow preferences |
| `/fh:help` | Command reference and architecture guide |

## How It Works

Each skill is an orchestrator — it reads project state, dispatches specialized subagents in fresh context, applies quality gates between steps, and updates state when done. 15 specialized agent personas handle the subagent work (planning, execution, debugging, verification, etc.).

### Pipeline: Build

```
PLAN.md ──▶ WAVE 1 (parallel tasks) ──▶ WAVE 2 ──▶ ... ──▶ WAVE N
                 Each task = fresh subagent with TDD + LSP
                                                          │
COMMIT + VERIFY ◀─────────────────────────────────────────┘
     │
PHASE COMPLETION
     ├── Gate 0: Integration check (Fallow blast-radius)
     ├── Gate 1: Goal verification (must_haves truth table)
     └── Gate 3: Final verification + architecture refresh
     │
     ▼
  /review
```

### Pipeline: Review

```
SCOPE ──▶ STATIC ANALYSIS ──▶ SPEC VERIFICATION
  │
  ├── Code Quality Agent
  ├── Gap Analysis Agent
  │
GOAL VERIFICATION ──▶ QUALITY REFINEMENT (conditional sub-skills)
  │
EVIDENCE (tests, build, lint) ──▶ BLOCK / WARN / PASS
```

### Autonomous Execution

Each `/fh:auto` step runs as a separate `claude -p` session with fresh context. State persists to `.planning/.auto-state.json` so crashes can resume. Decisions are logged with confidence levels — LOW confidence gets flagged for human audit.

## Built On

The underlying skills are composed from seven open-source projects:

| Source | Contribution |
|--------|-------------|
| [Superpowers](https://github.com/obra/superpowers) | TDD, verification, debugging, brainstorming |
| [Impeccable](https://github.com/pbakaus/impeccable) | Design critique, polish, normalize, harden, animate |
| [GSD](https://github.com/gsd-build/get-shit-done) | Planning, execution, verification, integration |
| [gstack](https://github.com/garrytan/gstack) | Plan review, QA, production safety |
| [feature-dev](https://github.com/anthropics/claude-code-plugin-examples) | Code exploration, architecture, review |
| [Next.js Best Practices](https://github.com/anthropics/claude-code-plugin-examples) | React/Next.js performance (Vercel Engineering) |
| [Playwright Best Practices](https://github.com/anthropics/claude-code-plugin-examples) | E2E testing patterns |

All upstreams are forked and bundled. See [PATCHES.md](PATCHES.md) for modifications.

## Optional Integrations

| Tool | What it adds |
|------|-------------|
| [claude-mem](https://github.com/thedotmack/claude-mem) | Persistent cross-session memory — learnings, patterns, decisions |
| [Fallow](https://docs.fallow.tools/) | Deterministic static analysis — dead code, circular deps, duplication |
| TypeScript LSP | Code navigation — go-to-definition, find-references, rename |

All optional. Every skill includes graceful degradation — the pipeline works identically without them.

## `/fh:new-project` — Default Stack

**Next.js + TypeScript + Tailwind + shadcn/ui + Supabase + Better Auth + Vercel.** With `--auto`, the entire setup is hands-off.

Includes: brand-aware design system, Better Auth with email/organizations, Supabase (local or cloud), Vercel deployment, local Sentry observability, and Conductor workspace detection. Everything is optional — skip what you don't need.

## Updating

```
/fh:update
```

Automatically closes setup gaps from new versions — tools, plugins, env vars, hooks, and config. No need to re-run `/fh:setup`.

## License

MIT
