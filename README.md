# fhhs-skills

An all-in-one workflow toolkit for [Claude Code](https://claude.com/claude-code) and [pi.dev](https://pi.dev) — 33 skills and 31 specialized agents covering planning, spec-driven development, building, reviewing, debugging, design quality, security, web research, startup validation, and autonomous execution. One install, no other plugins required.

## What You Get

**Plan before you build.** `/fh:plan-work` researches your problem using FPF-lite (hypothesis diversity with epistemic tagging), brainstorms conservative and ambitious approaches, generates a SPEC.md for complex plans (architecture, data flow, failure modes via the spec-architect agent), locks decisions, and outputs an execution-ready plan. `/fh:plan-review` stress-tests it against business alignment, engineering rigor, and blast radius before a single line of code is written.

**Build with quality gates.** `/fh:build` turns plans into code using parallel subagents — each task runs in fresh context with TDD, LSP navigation, SPEC.md awareness, and framework-specific best practices. Task state persists for crash resume. Phase completion triggers integration checks, goal verification, and architecture refresh. Complex builds get a post-build reflection pass — an adversarial critic that catches biases, grades against spec, and surfaces friction before review.

**Review that actually catches things.** `/fh:review` runs static analysis, spec verification, goal verification against must-haves, and conditional quality refinement — dispatching design agents (polish, harden, normalize, security) based on what the diff actually touches. Recurring patterns across sessions are surfaced and escalated.

**Research anything.** `/fh:research` routes queries through content-type-specific patterns — documentation sites, GitHub repos, news articles, research papers, YouTube transcripts — using Firecrawl for clean markdown extraction. Dispatches subagents for multi-source synthesis.

**Fix bugs systematically.** `/fh:fix` triages by complexity, writes a failing test first, then patches. Complex bugs get parallel debugger subagents or persistent debug sessions.

**Run autonomously.** `/fh:auto` chains plan -> review -> build -> review for every phase without intervention. Decisions are logged with confidence levels. Crashes resume from state. Cross-phase reflection findings feed into subsequent planning to avoid repeating mistakes.

**Cross-session memory.** Skills persist findings between sessions — root causes, architectural decisions, vulnerability patterns. claude-mem is the primary context access layer: skills query by intent before reading files, and large outputs are indexed instead of flooding the context window.

**Validate startup ideas.** Five dedicated skills cover market research, competitive analysis, positioning, pitch scripts, and strategic advising — all feeding into the build pipeline when you're ready to code.

## Install

### Claude Code

```bash
claude plugin marketplace add cinjoff/fhhs-skills
claude plugin install fh@fhhs-skills
```

Then run `/fh:setup` in a Claude Code session. It detects your platform and walks you through dependencies.

### pi.dev

```bash
pi install /path/to/fhhs-skills
# or: pi install git:https://github.com/cinjoff/fhhs-skills
```

The repository now ships pi-compatible adapters under `.pi/skills/` (declared in `package.json` via the `pi.skills` manifest). In pi, use `/skill:<name>` commands, for example:

```text
/skill:fh-setup
/skill:fh-plan-work
/skill:fh-build
```

Full command mapping: [`.pi/README.md`](.pi/README.md).

### OpenAI Codex

Codex supports Agent Skills format (`SKILL.md`). This repository ships Codex adapters under `.codex/skills/`.

Use the adapters in-repo (or keep `.codex/` and `.claude/` together in your own distribution). The adapters read canonical skill instructions from `.claude/skills/`.

In Codex, invoke by skill name (for example `fh-setup`, `fh-plan-work`, `fh-build`).

Full command mapping: [`.codex/README.md`](.codex/README.md).

### Maintainers: adapter sync

`.claude/skills/` is the single source of truth. `.pi/skills/` and `.codex/skills/` are generated adapters.

```bash
npm run sync:adapters
npm run check:adapters
```

## Quick Start

### New Project

```text
/fh:new-project          scaffold a project with vision, stack, design language, and roadmap
/fh:plan-work            design the first feature
/fh:build                execute the plan
/fh:review               verify and promote
```

(Claude command surface shown above. pi.dev and Codex equivalents are listed in `.pi/README.md` and `.codex/README.md`.)

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

Additional design agents dispatched by pipelines: `adapt`, `bolder`, `clarify`, `colorize`, `delight`, `distill`, `extract`, `harden`, `normalize`, `onboard`, `optimize`, `polish`, `quieter`. Each follows a shared 7-step protocol (gather context, load design principles, assess, plan, implement, verify).

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

Each skill is an orchestrator — it reads project state, dispatches specialized subagents in fresh context, applies quality gates between steps, and updates state when done. 32 specialized agent personas handle the subagent work across planning, execution, design, debugging, research, reflection, and verification.

### Architecture

```
 ┌──────────────────────────────────────────────────────────────────┐
 │                      USER-FACING SKILLS (28)                     │
 │  plan-work  build  review  fix  refactor  auto  research  ...   │
 └──────────┬────────────┬──────────────┬──────────────────────────┘
            │            │              │
   ┌────────▼────────┐   │    ┌─────────▼─────────┐
   │  Shared Protocols│   │    │ Per-Skill Refs     │
   │  (.claude/skills/│   │    │ (./references/*.md) │
   │   shared/*.md)   │   │    └───────────────────┘
   └─────────────────┘   │
                          │  dispatch via subagent_type
            ┌─────────────┼─────────────────────┐
            ▼             ▼                     ▼
 ┌──────────────┐ ┌──────────────┐   ┌──────────────────┐
 │  GSD Agents  │ │  Superpowers │   │  Phase 24 Agents │
 │  (upstream)  │ │  (upstream)  │   │  (new)           │
 ├──────────────┤ ├──────────────┤   ├──────────────────┤
 │ researcher   │ │ code-reviewer│   │ spec-architect   │
 │ roadmapper   │ │ code-explorer│   │ reflector        │
 │ debugger     │ │ code-architect│  │ 16 design agents │
 │ verifier     │ ├──────────────┤   │  (adapt, polish, │
 │ plan-checker │ │  Impeccable  │   │   harden, etc.)  │
 │ integration  │ │  (upstream)  │   └──────────────────┘
 │ auditor      │ ├──────────────┤
 │ mapper       │ │ Design agent │
 │ synthesizer  │ │ protocol +   │
 └──────────────┘ │ 7-step flow  │
                  └──────────────┘
```

### Three-Layer Context Model

Skills access project knowledge through a structured 3-layer model with lost-in-the-middle ordering — current task first, background knowledge in the middle, stable identity last:

```
 Layer 3 — Session State (read first, changes every session)
 ┌─────────────────────────────────────────────────┐
 │  STATE.md  CONTEXT.md  SPEC.md  PLAN.md         │
 └─────────────────────────────────────────────────┘

 Layer 2 — Codebase Knowledge (middle, semi-stable)
 ┌─────────────────────────────────────────────────┐
 │  STACK.md  ARCHITECTURE.md  CONVENTIONS.md      │
 │  STRUCTURE.md  TESTING.md  INTEGRATIONS.md      │
 └─────────────────────────────────────────────────┘

 Layer 1 — Project Identity (read last, rarely changes)
 ┌─────────────────────────────────────────────────┐
 │  PROJECT.md  REQUIREMENTS.md  ROADMAP.md        │
 │  DESIGN.md                                      │
 └─────────────────────────────────────────────────┘
```

All skills resolve artifacts through one canonical chain: claude-mem query -> STATE.md -> phase directory -> fallback search. No ad-hoc file-finding logic.

### Pipeline: Plan -> Spec -> Build -> Reflect -> Review

```
 /plan-work
  │
  ├─ Research (FPF-lite: hypothesis diversity, epistemic tags)
  │   └─ Firecrawl (content-type routing: docs, GitHub, news, papers, YouTube)
  │
  ├─ Brainstorm (conservative + ambitious approaches)
  │
  ├─ SPEC.md (per-plan, complexity-gated)
  │   ├─ Simple: skip
  │   ├─ Medium: inline
  │   └─ Complex: dispatch spec-architect agent
  │       └─ Produces: Architecture, Data Flow, Failure Modes
  │
  └─ PLAN.md (execution-ready, with locked decisions in CONTEXT.md)

 /build
  │
  ├─ WAVE 1 (parallel tasks) ──▶ WAVE 2 ──▶ ... ──▶ WAVE N
  │       Each task = fresh subagent with TDD + LSP + SPEC.md context
  │       Task state persisted for crash resume
  │
  ├─ Post-Wave Quality Gates
  │
  ├─ Phase Completion Gates
  │   ├─ Gate 0: Integration check
  │   ├─ Gate 1: Goal verification (must_haves truth table)
  │   └─ Gate 2: Final verification + architecture refresh
  │
  └─ Post-Build Reflection (complex plans only)
      └─ Reflector agent: bias checks, spec self-grading,
         friction analysis, recurring patterns
         Findings persist to cross-session memory

 /review
  │
  ├─ Static analysis + spec verification
  ├─ Code quality agent + gap analysis agent
  ├─ Goal verification
  ├─ Quality refinement (conditional: polish, harden, normalize, secure)
  └─ BLOCK / WARN / PASS
```

### Autonomous Execution

Each `/fh:auto` step runs as a separate `claude -p` session with fresh context. State persists to `.planning/.auto-state.json` so crashes can resume. Decisions are logged with confidence levels — LOW confidence gets flagged for human audit. Cross-phase reflection findings feed into subsequent planning prompts to avoid repeating mistakes.

### Shared Protocol Layer

Skills stay lean by referencing shared protocols instead of inlining instructions:

| Protocol | Purpose |
|----------|---------|
| `artifact-resolution.md` | Canonical chain for finding PLAN.md, SPEC.md, CONTEXT.md |
| `context-api-contract.md` | 3-layer model with read/write matrix |
| `claude-mem-rules.md` | 7 patterns for cross-session memory access |
| `design-agent-protocol.md` | 7-step mandatory pattern for all design agents |
| `firecrawl-guide.md` | Content-type-specific research (docs, GitHub, news, papers, YouTube) |
| `epistemic-tags.md` | Confidence tagging: `[conjecture]`, `[reasoned]`, `[tested]` |
| `tool-availability.md` | Graceful degradation guards for optional tools |

## Built On

Skills are composed from seven open-source projects, synced from upstream with patches reapplied:

| Source | Contribution | Agents |
|--------|-------------|--------|
| [Superpowers](https://github.com/obra/superpowers) | TDD, verification, debugging, brainstorming | code-reviewer, code-explorer, code-architect |
| [Impeccable](https://github.com/pbakaus/impeccable) | Design critique, polish, normalize, harden, animate | 16 design agents via 7-step protocol |
| [GSD](https://github.com/gsd-build/get-shit-done) | Planning, execution, verification, integration | researcher, roadmapper, debugger, verifier, plan-checker, integration-checker, auditor, mapper, synthesizer |
| [gstack](https://github.com/garrytan/gstack) | Plan review, QA (absorbed into ui-test), production safety | — |
| [feature-dev](https://github.com/anthropics/claude-code-plugin-examples) | Code exploration, architecture, review | — |
| [Next.js Best Practices](https://github.com/anthropics/claude-code-plugin-examples) | React/Next.js performance (Vercel Engineering) | — |
| [Playwright Best Practices](https://github.com/anthropics/claude-code-plugin-examples) | E2E testing patterns | — |

Additionally, two agents were created for this plugin: **spec-architect** (SPEC.md architecture sections) and **reflector** (post-build adversarial critique with bias detection).

All upstreams are forked and bundled. See [PATCHES.md](PATCHES.md) for modifications.

## Optional Integrations

| Tool | What it adds | Used by |
|------|-------------|---------|
| [claude-mem](https://github.com/thedotmack/claude-mem) | Persistent cross-session memory — learnings, patterns, decisions | All skills (primary context layer) |
| [Firecrawl](https://www.firecrawl.dev/) | Web research with content-type routing (docs, GitHub, news, papers, YouTube) | research, plan-work, auto, startup-advisor, new-project |
| [Context7](https://context7.com/) | Library documentation lookup | research, plan-work |
| [Codemap](https://github.com/nicobailon/codemap-mcp) | Macro architecture views | map-codebase, review, build, fix, refactor |
| [ast-grep](https://ast-grep.github.io/) | Structural code search and replace | review, build, fix, refactor |
| TypeScript LSP | Code navigation — go-to-definition, find-references, rename | build, fix, refactor |

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
