---
description: "Display the fhhs-skills command reference. Use when the user says 'help', 'what commands', 'show commands', or needs a quick overview of available commands."
---

Output ONLY the reference content below. Do NOT add project-specific analysis, git status, next-step suggestions, or any commentary.

<reference>
# fhhs-skills Command Reference

## Core Workflow

| Command | What it does |
|---------|-------------|
| `/new-project` | Set up a project with vision, tech stack, design language, and roadmap |
| `/plan` | Brainstorm, research, and produce an execution-ready plan. Handles phase creation and placement automatically |
| `/build` | Execute a plan with parallel subagents, TDD, design gates, and verification. Handles milestone completion automatically |
| `/fix` | Auto-triage and fix bugs with systematic debugging |
| `/refactor` | Restructure code safely, tests green at every step |
| `/simplify` | Review code for reuse, quality, and efficiency |
| `/verify` | Goal-backward verification with truth tables and fresh evidence |
| `/verify-ui` | Visual verification with browser screenshots |
| `/research` | Investigate a topic before planning |
| `/resume` | Restore context and route to the right next action |

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

## Project Tracking

| Command | What it does |
|---------|-------------|
| `/progress` | See where you are and what's next |
| `/quick` | Do a small task with tracking guarantees |
| `/health` | Check if your project files are in good shape |
| `/add-todo` | Capture an idea or task for later |
| `/check-todos` | See pending todos and pick one |
| `/map-codebase` | Analyze your codebase structure |
| `/settings` | Configure workflow preferences |

Phase management, milestone lifecycle, and test generation are handled automatically by `/plan`, `/build`, and `/verify`.

## Utilities

| Command | What it does |
|---------|-------------|
| `/revise-claude-md` | Update CLAUDE.md with learnings from the session |
| `/update` | Check for updates and install the latest version |
| `/skills-guide` | Detailed guide to how composites work |
| `/setup` | One-time setup after installing |

## Common Workflows

**Starting a new project:**
```
/new-project -> /plan -> /build -> /verify
```

**Building a feature:**
```
/plan -> /build -> /verify -> /verify-ui
```

**Resuming work after a break:**
```
/resume
```

**Capturing ideas during work:**
```
/add-todo                    capture from conversation context
/add-todo Fix modal z-index  capture with explicit description
/check-todos                 review and work on todos
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
</reference>
