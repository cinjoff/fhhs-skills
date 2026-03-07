# fhhs-skills

A workflow plugin for [Claude Code](https://claude.com/claude-code) that brings together engineering discipline, design quality, and project tracking into one install.

38 commands. 17 internal skills. 15 specialized agents. No other plugins required.

## Install

```
/plugin marketplace add cinjoff/fhhs-skills
/plugin install fh@fhhs-skills
/reload-plugins
/setup
```

Run `/reload-plugins` after installing so the new commands are available in your current session.

Setup detects your platform (macOS, Linux, Windows) and walks you through installing dependencies: Node.js, GitHub CLI, TypeScript language server, and the TypeScript LSP plugin.

## Quick Start

```
/new-project    set up a project with structure and tracking
/plan           design a feature before building it
/build          execute the plan with parallel workers and quality gates
/verify         confirm everything works with real evidence
```

When you come back to an existing project:

```
/resume         restore context and pick up where you left off
/progress       see where you are and what's next
```

## Commands

### Build Pipeline

| Command | What it does |
|---------|-------------|
| `/new-project` | Set up a project with vision, tech stack, design language, and roadmap |
| `/plan` | Brainstorm, research, and produce an execution-ready plan |
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
| `/resume` | Restore context and route to the right next action |
| `/progress` | See where you are and what's next |

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

Phase management, milestone lifecycle, and test generation are handled automatically by `/plan`, `/build`, and `/verify`.

### Setup & Maintenance

| Command | What it does |
|---------|-------------|
| `/setup` | One-time setup after installing |
| `/settings` | Configure workflow preferences |
| `/health` | Check if your project files are in good shape |
| `/map-codebase` | Analyze your codebase structure |
| `/revise-claude-md` | Update CLAUDE.md with learnings from the session |
| `/update` | Check for updates and install the latest version |
| `/help` | Command reference and architecture guide |

## What's Under the Hood

Behind the composite commands, 17 internal skills and 15 specialized agents handle the heavy lifting. You don't invoke these directly -- the commands orchestrate them for you.

**Engineering discipline** (from [Superpowers](https://github.com/obra/superpowers)):
- Test-driven development, systematic debugging, verification-before-completion
- Code review (requesting and receiving), writing plans, executing plans
- Brainstorming, parallel agent dispatch, git worktree management

**Project orchestration** (from [GSD](https://github.com/gsd-build/get-shit-done)):
- 12 specialized agents for planning, execution, verification, debugging, research, and more
- Dispatched via composites as subagents with fresh context

**Design quality** (from [Impeccable](https://github.com/pbakaus/impeccable)):
- Frontend design with high visual quality
- All the design commands listed above (critique, polish, normalize, etc.)

**Feature development** (from [feature-dev](https://github.com/anthropics/claude-code-plugin-examples)):
- Frontend design skill for distinctive, production-grade interfaces

**CLAUDE.md management** (from [claude-md-management](https://github.com/anthropics/claude-code-plugin-examples)):
- Audit and improve CLAUDE.md files

**TypeScript LSP** (from [typescript-lsp](https://github.com/anthropics/claude-code-plugin-examples)):
- Go-to-definition, find-references, hover, and incoming-calls via the TypeScript language server
- Used by codebase mapping, systematic debugging, and plan execution for precise code navigation

All upstreams are forked and bundled. See [PATCHES.md](PATCHES.md) for modifications.

## Typical Workflows

**Building a feature:**
```
/plan  ->  /build  ->  /verify  ->  /verify-ui
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
/resume
```

## Updating

```
/update
```

## License

MIT
