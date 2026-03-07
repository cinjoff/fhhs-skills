# fhhs-skills

A workflow plugin for [Claude Code](https://claude.com/claude-code) that brings together engineering discipline, design quality, and project tracking into one install.

55 commands. 29 internal skills. No other plugins required.

## Install

```
/plugin marketplace add cinjoff/fhhs-skills
/plugin install fh@fhhs-skills
/fh:setup
```

Setup detects your platform (macOS, Linux, Windows) and walks you through installing dependencies: Node.js, GitHub CLI, TypeScript language server, and the TypeScript LSP plugin.

## Quick Start

```
/fh:new-project    set up a project with structure and tracking
/fh:plan           design a feature before building it
/fh:build          execute the plan with parallel workers and quality gates
/fh:verify         confirm everything works with real evidence
```

When you come back to an existing project:

```
/fh:resume
```

## Commands

### Core Workflow

| Command | What it does |
|---------|-------------|
| `/fh:new-project` | Set up a project with vision, tech stack, design language, and roadmap |
| `/fh:plan` | Brainstorm, research, and produce an execution-ready plan |
| `/fh:build` | Execute a plan with parallel subagents, TDD, design gates, and verification |
| `/fh:fix` | Auto-triage and fix bugs with systematic debugging |
| `/fh:refactor` | Restructure code safely, tests green at every step |
| `/fh:simplify` | Review code for reuse, quality, and efficiency |
| `/fh:verify` | Goal-backward verification with truth tables and fresh evidence |
| `/fh:verify-ui` | Visual verification with browser screenshots |
| `/fh:research` | Investigate a topic before planning |
| `/fh:resume` | Restore context and route to the right next action |

### Design Quality

| Command | What it does |
|---------|-------------|
| `/fh:critique` | Evaluate visual hierarchy, information architecture, and design quality |
| `/fh:polish` | Fix alignment, spacing, consistency, and detail issues |
| `/fh:normalize` | Match your design system and ensure consistency |
| `/fh:harden` | Error handling, i18n, text overflow, edge cases |
| `/fh:animate` | Purposeful motion and micro-interactions |
| `/fh:audit` | Full accessibility, performance, theming, and responsive audit |
| `/fh:teach-impeccable` | One-time setup for your project's design language |

<details>
<summary>More design commands</summary>

| Command | What it does |
|---------|-------------|
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

</details>

### Project Management

| Command | What it does |
|---------|-------------|
| `/fh:progress` | See where you are and what's next |
| `/fh:add-phase` | Add a new phase to your roadmap |
| `/fh:quick` | Do a small task with tracking guarantees |
| `/fh:complete-milestone` | Wrap up a milestone and archive it |
| `/fh:health` | Check if your project files are in good shape |

<details>
<summary>More project commands</summary>

| Command | What it does |
|---------|-------------|
| `/fh:remove-phase` | Remove a phase from the roadmap |
| `/fh:insert-phase` | Insert urgent work between existing phases |
| `/fh:add-todo` | Capture an idea or task |
| `/fh:check-todos` | See pending todos and pick one |
| `/fh:add-tests` | Generate tests for completed work |
| `/fh:cleanup` | Archive old phase directories |
| `/fh:discuss-phase` | Talk through a phase before planning |
| `/fh:map-codebase` | Analyze your codebase structure |
| `/fh:pause-work` | Save context when stopping mid-task |
| `/fh:settings` | Configure workflow preferences |
| `/fh:set-profile` | Switch between quality/balanced/budget modes |
| `/fh:validate-phase` | Audit test coverage for a phase |
| `/fh:plan-milestone-gaps` | Find and plan missing work |
| `/fh:list-phase-assumptions` | Surface assumptions before planning |
| `/fh:audit-milestone` | Verify milestone completion |
| `/fh:new-milestone` | Start a new milestone cycle |

</details>

### Utilities

| Command | What it does |
|---------|-------------|
| `/fh:revise-claude-md` | Update CLAUDE.md with learnings from the session |
| `/fh:update` | Check for updates and install the latest version |
| `/fh:skills-guide` | Show all commands and how they fit together |
| `/fh:help` | Quick reference |

## What's Under the Hood

Behind the composite commands, 29 specialized skills handle the heavy lifting. You don't invoke these directly -- the commands orchestrate them for you.

**Engineering discipline** (from [Superpowers](https://github.com/obra/superpowers)):
- Test-driven development, systematic debugging, verification-before-completion
- Code review (requesting and receiving), writing plans, executing plans
- Brainstorming, parallel agent dispatch, git worktree management

**Project orchestration** (from [GSD](https://github.com/gsd-build/get-shit-done)):
- Phase planning, execution, and verification
- Codebase mapping, research, roadmapping
- Integration checking, test coverage auditing

**Design quality** (from [Impeccable](https://github.com/pbakaus/impeccable)):
- Frontend design with high visual quality
- All the design commands listed above (critique, polish, normalize, etc.)

**CLAUDE.md management** (from [claude-md-management](https://github.com/anthropics/claude-code-plugin-examples)):
- Audit and improve CLAUDE.md files

All upstreams are forked and bundled. See [PATCHES.md](PATCHES.md) for modifications.

## Typical Workflows

**Building a feature:**
```
/fh:plan  ->  /fh:build  ->  /fh:verify  ->  /fh:verify-ui
```

**Fixing a bug:**
```
/fh:fix
```

**Refactoring:**
```
/fh:refactor  ->  /fh:simplify
```

**Starting a new session:**
```
/fh:resume
```

## Updating

```
/fh:update
```

## License

MIT
