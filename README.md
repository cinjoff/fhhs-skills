# fhhs-skills

A workflow plugin for Claude Code that helps you plan, build, and ship software with built-in quality checks at every step.

It brings together engineering practices (test-first development, code review, verification), design quality tools (critique, polish, accessibility), and project tracking (phases, milestones, roadmaps) into one install.

## Getting Started

### Install the plugin

In Claude Code:

```
/plugin marketplace add cinjoff/fhhs-skills
/plugin install fh@fhhs-skills
```

### Run setup

```
/fh:setup
```

Setup detects your platform (macOS, Linux, or Windows) and checks for required tools. On macOS/Linux it walks you through installing Homebrew, Node.js, GitHub CLI, and Vercel CLI. On Windows it provides the equivalent installer links. It then auto-installs the TypeScript language server, the TypeScript LSP Claude plugin, and sets up the bundled GSD CLI.

### Start your first project

```
/fh:new-project
```

This walks you through setting up your project vision, tech stack, design language, and roadmap. Then:

```
/fh:plan       — design your first feature
/fh:build      — execute the plan
/fh:verify     — confirm everything works
```

### Resuming work

When you start a new session on an existing project:

```
/fh:resume
```

It reads your project state, shows where you left off, and suggests what to do next.

## What You Get

**Core workflow** — the commands you'll use most:

| Command | What it does |
|---------|-------------|
| `/fh:new-project` | Set up a new project with structure and tracking |
| `/fh:plan` | Think through a feature before building it |
| `/fh:build` | Execute a plan with parallel workers and quality gates |
| `/fh:fix` | Find and fix bugs systematically |
| `/fh:refactor` | Restructure code safely without breaking anything |
| `/fh:verify` | Check that what you built actually works |
| `/fh:resume` | Pick up where you left off in a new session |
| `/fh:research` | Investigate a topic before planning |

**Design tools** — for making interfaces look and feel right:

| Command | What it does |
|---------|-------------|
| `/fh:critique` | Get honest feedback on your UI design |
| `/fh:polish` | Fix spacing, alignment, and consistency |
| `/fh:normalize` | Make sure everything follows your design system |
| `/fh:harden` | Handle errors, edge cases, and internationalization |
| `/fh:animate` | Add purposeful motion and micro-interactions |
| `/fh:verify-ui` | Take screenshots and compare against your design |

**Project management** — for tracking progress across phases:

| Command | What it does |
|---------|-------------|
| `/fh:progress` | See where you are and what's next |
| `/fh:add-phase` | Add a new phase to your roadmap |
| `/fh:quick` | Do a small task with tracking guarantees |
| `/fh:complete-milestone` | Wrap up a milestone and archive it |
| `/fh:health` | Check if your project files are in good shape |

<details>
<summary>All project commands</summary>

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
| `/fh:help` | Show available commands |
| `/fh:update-upstream` | Check for updates to underlying frameworks |

</details>

<details>
<summary>All design commands</summary>

| Command | What it does |
|---------|-------------|
| `/fh:teach-impeccable` | One-time setup for your project's design language |
| `/fh:audit` | Full accessibility and performance audit |
| `/fh:bolder` | Make a safe design more visually interesting |
| `/fh:quieter` | Tone down an overly aggressive design |
| `/fh:distill` | Strip away unnecessary complexity |
| `/fh:clarify` | Improve confusing labels and error messages |
| `/fh:colorize` | Add strategic color to monochromatic interfaces |
| `/fh:delight` | Add personality and moments of joy |
| `/fh:adapt` | Make designs work across screen sizes |
| `/fh:extract` | Pull reusable components into your design system |
| `/fh:onboard` | Design first-time user experiences |
| `/fh:optimize` | Improve loading speed and rendering performance |

</details>

## How It Works

When you run `/fh:build`, here's what happens behind the scenes:

1. **Workers execute tasks in parallel** — each gets a structured prompt with clear expectations, a self-review checklist, and guardrails to stay focused
2. **After each wave, a reviewer checks the work** — a specialized agent reads the actual code and compares it to the spec, catching issues before the next wave builds on them
3. **Design quality gates run automatically** on frontend work — critique, polish, and normalize passes keep your UI consistent
4. **A final quality review** checks code quality, security, and cross-task consistency
5. **Verification requires proof** — no "it should work," only "here's the test output showing it works"

The other commands follow similar patterns: systematic investigation for `/fh:fix`, safe atomic steps for `/fh:refactor`, research-then-design for `/fh:plan`.

## Typical Workflows

**Building a feature:**
```
/fh:plan  ->  /fh:build  ->  /fh:verify  ->  /fh:verify-ui
```

**Fixing a bug:**
```
/fh:fix
```

**Refactoring code:**
```
/fh:refactor
```

**Starting a new session:**
```
/fh:resume  ->  (routes you to the right next step)
```

## Based On

This plugin builds on three open-source projects:

- **[GSD](https://github.com/gsd-build/get-shit-done)** v1.22.4 — project state management
- **[Superpowers](https://github.com/obra/superpowers)** v4.3.1 — engineering discipline skills
- **[Impeccable](https://github.com/pbakaus/impeccable)** v1.2.0 — design quality tools

All three are forked and bundled into this plugin. See [PATCHES.md](PATCHES.md) for modifications from upstream.
