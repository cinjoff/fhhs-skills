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

## How It Works

Each command is an orchestrator. It reads project state, decides which skills and agents to invoke, applies quality gates between steps, and updates state when done. The orchestrator does not write application code itself — it dispatches specialized subagents that each run in a fresh context with domain expertise.

The underlying skills and agents come from six open-source projects:

| Source | What it provides |
|--------|-----------------|
| [Superpowers](https://github.com/obra/superpowers) | Engineering discipline — TDD, verification, debugging, brainstorming |
| [Impeccable](https://github.com/pbakaus/impeccable) | Design quality — critique, polish, normalize, harden, animate, audit |
| [GSD](https://github.com/gsd-build/get-shit-done) | Project orchestration — planning, execution, verification, integration |
| [feature-dev](https://github.com/anthropics/claude-code-plugin-examples) | Code intelligence — exploration, architecture, review |
| [Next.js Best Practices](https://github.com/anthropics/claude-code-plugin-examples) | React/Next.js performance optimization (Vercel Engineering) |
| [Playwright Best Practices](https://github.com/anthropics/claude-code-plugin-examples) | End-to-end testing patterns |

All upstreams are forked and bundled. TypeScript Language Server provides code navigation (go-to-definition, find-references, rename) across all code-working commands. See [PATCHES.md](PATCHES.md) for modifications.

## Updating

```
/fh:update
```

## License

MIT
