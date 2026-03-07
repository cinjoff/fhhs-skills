---
description: "Display the fhhs-skills command reference and architecture guide. Use when the user says 'help', 'what commands', 'show commands', 'how do composites work', 'skills guide', or needs an overview of available commands and how they fit together."
---

Output ONLY the reference content below. Do NOT add project-specific analysis, git status, next-step suggestions, or any commentary.

<reference>
# fhhs-skills Command Reference

## Build Pipeline

| Command | What it does |
|---------|-------------|
| `/new-project` | Set up a project with vision, tech stack, design language, and roadmap |
| `/plan` | Brainstorm, research, and produce an execution-ready plan. Handles phase creation and placement automatically |
| `/build` | Execute a plan with parallel subagents, TDD, design gates, and verification. Handles milestone completion automatically |
| `/verify` | Goal-backward verification with truth tables and fresh evidence |
| `/verify-ui` | Visual verification with browser screenshots |

## Engineering

| Command | What it does |
|---------|-------------|
| `/fix` | Auto-triage and fix bugs with systematic debugging |
| `/refactor` | Restructure code safely, tests green at every step |
| `/simplify` | Review code for reuse, quality, and efficiency |
| `/research` | Investigate a topic before planning |

## Navigation

| Command | What it does |
|---------|-------------|
| `/resume` | Restore context and route to the right next action |
| `/progress` | See where you are and what's next |

## Design Quality

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

## Task Management

| Command | What it does |
|---------|-------------|
| `/quick` | Do a small task with tracking guarantees |
| `/add-todo` | Capture an idea or task for later |
| `/check-todos` | See pending todos and pick one |

Phase management, milestone lifecycle, and test generation are handled automatically by `/plan`, `/build`, and `/verify`.

## Setup & Maintenance

| Command | What it does |
|---------|-------------|
| `/setup` | One-time setup after installing |
| `/settings` | Configure workflow preferences |
| `/health` | Check if your project files are in good shape |
| `/map-codebase` | Analyze your codebase structure |
| `/revise-claude-md` | Update CLAUDE.md with learnings from the session |
| `/update` | Check for updates and install the latest version |

## Common Workflows

```
First time:   /setup → /new-project → /plan → /build → /verify
Feature:      /plan → /build → /verify → /verify-ui
Bug fix:      /fix
Refactoring:  /refactor (includes /simplify automatically)
Code cleanup: /simplify (standalone, on any recent changes)
Resuming:     /resume → (routes to next action)
CLAUDE.md:    /revise-claude-md (after sessions or /revise-claude-md audit)
```

## Files & Structure

```
.planning/
├── PROJECT.md            # Project vision
├── ROADMAP.md            # Current phase breakdown
├── STATE.md              # Project memory & context
├── DESIGN.md             # Design language (from /teach-impeccable)
├── config.json           # Workflow mode & gates
├── todos/                # Captured ideas and tasks
├── debug/                # Active debug sessions
├── milestones/           # Archived milestone data
├── codebase/             # Codebase analysis (from /map-codebase)
└── phases/               # Phase plans, summaries, and verifications
```

## Architecture

**GSD is the state machine.** It owns project structure: phases, milestones, requirements, roadmaps, STATE.md. Always required — run `/new-project` first.

**Composites are the interface.** They wire engineering disciplines, design quality tools, and GSD together so you never think about which skill to invoke. Subagents do the heavy work — composites stay under 15% context.

**Self-contained.** All engineering disciplines, design quality tools, GSD project tracking, and TypeScript LSP integration are built into this plugin.

## Non-Negotiable Disciplines

Every composite that executes code enforces these via built-in skills:

1. **TDD** — no production code without a failing test first
2. **Per-wave spec gates** — adversarial spec verification after each wave
3. **Quality review** — code quality, security, architecture review
4. **Simplify** — code reuse, efficiency, and hygiene
5. **Verification-before-completion** — no claims without fresh evidence
6. **Fresh subagents** — structured prompts with self-review and analysis paralysis guard
7. **YAGNI** — no features, abstractions, or error handling beyond what's specified

## Code Intelligence

**TypeScript LSP** (installed via `/setup`) provides precise code navigation used across composites: `workspaceSymbol` and `documentSymbol` for architecture analysis, `findReferences` for blast radius mapping, `goToDefinition` and call hierarchy for data flow tracing, `hover` for type information.
</reference>
