---
description: "Display the fhhs-skills command reference and architecture guide. Use when the user says 'help', 'what commands', 'show commands', 'how do composites work', 'skills guide', or needs an overview of available commands and how they fit together."
---

Output ONLY the reference content below. Do NOT add project-specific analysis, git status, next-step suggestions, or any commentary.

<reference>
# fhhs-skills Command Reference

## Build Pipeline

| Command | What it does |
|---------|-------------|
| `/fh:new-project` | Set up a project with vision, tech stack, design language, and roadmap |
| `/fh:plan-work` | Brainstorm, research, and produce an execution-ready plan |
| `/fh:build` | Execute a plan with parallel subagents, TDD, design gates, and verification |
| `/fh:review` | Code review — quality, security, goal verification, and gap analysis |

## Engineering

| Command | What it does |
|---------|-------------|
| `/fh:fix` | Find and fix bugs with test-driven discipline |
| `/fh:refactor` | Restructure code safely, tests green at every step |
| `/fh:simplify` | Review code for reuse, quality, and efficiency |
| `/fh:research` | Investigate a topic before planning |

## Navigation

| Command | What it does |
|---------|-------------|
| `/fh:progress` | Check progress, restore context, and route to next action |
| `/fh:resume-work` | Redirects to /fh:progress |

## Design Quality

| Command | What it does |
|---------|-------------|
| `/fh:ui-critique` | Evaluate visual hierarchy, information architecture, and design quality |
| `/fh:ui-test` | Take screenshots and check if the UI looks right |
| `/fh:ui-animate` | Purposeful motion and micro-interactions |
| `/fh:ui-redesign` | Set up or change your project's design language |
| `/fh:polish` | Fix alignment, spacing, consistency, and detail issues |
| `/fh:normalize` | Match your design system and ensure consistency |
| `/fh:harden` | Error handling, i18n, text overflow, edge cases |
| `/fh:audit` | Full accessibility, performance, theming, and responsive audit |
| `/fh:adapt` | Make designs work across screen sizes and platforms |
| `/fh:bolder` | Amplify safe designs to be more visually interesting |
| `/fh:quieter` | Tone down overly aggressive designs |
| `/fh:distill` | Strip away unnecessary complexity |
| `/fh:clarify` | Improve confusing labels, errors, and microcopy |
| `/fh:colorize` | Add strategic color to monochromatic interfaces |
| `/fh:delight` | Add personality and moments of joy |
| `/fh:extract` | Pull reusable components into your design system |
| `/fh:onboard` | Design first-time user experiences and empty states |
| `/fh:optimize` | Improve loading speed, rendering, and bundle size |

## Task Management

| Command | What it does |
|---------|-------------|
| `/fh:todos` | Manage project todos — add new or review pending |

Phase management, milestone lifecycle, and test generation are handled automatically by `/fh:plan-work`, `/fh:build`, and `/fh:review`.

## Setup & Maintenance

| Command | What it does |
|---------|-------------|
| `/fh:setup` | One-time setup after installing |
| `/fh:settings` | Configure workflow preferences |
| `/fh:health` | Check if your project files are in good shape |
| `/fh:map-codebase` | Analyze your codebase structure |
| `/fh:revise-claude-md` | Update CLAUDE.md with learnings from the session |
| `/fh:update` | Check for updates and install the latest version |

## Common Workflows

```
First time:   /fh:setup → /fh:new-project → /fh:plan-work → /fh:build → /fh:review
Feature:      /fh:plan-work → /fh:build → /fh:review → /fh:ui-test
Bug fix:      /fh:fix
Refactoring:  /fh:refactor (includes /fh:simplify automatically)
Code cleanup: /fh:simplify (standalone, on any recent changes)
Resuming:     /fh:progress → (checks progress, routes to next action)
CLAUDE.md:    /fh:revise-claude-md (after sessions or /fh:revise-claude-md audit)
```

## Files & Structure

```
.planning/
├── PROJECT.md            # Project vision
├── ROADMAP.md            # Current phase breakdown
├── STATE.md              # Project memory & context
├── DESIGN.md             # Design language (from /fh:ui-redesign)
├── config.json           # Workflow mode & gates
├── todos/                # Captured ideas and tasks
├── debug/                # Active debug sessions
├── milestones/           # Archived milestone data
├── codebase/             # Codebase analysis (from /fh:map-codebase)
└── phases/               # Phase plans, summaries, and verifications
```

## Architecture

**GSD is the state machine.** It owns project structure: phases, milestones, requirements, roadmaps, STATE.md. Always required — run `/fh:new-project` first.

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

**TypeScript LSP** (installed via `/fh:setup`) provides precise code navigation used across composites: `workspaceSymbol` and `documentSymbol` for architecture analysis, `findReferences` for blast radius mapping, `goToDefinition` and call hierarchy for data flow tracing, `hover` for type information.
</reference>
