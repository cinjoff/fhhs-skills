# fhhs-skills

All-in-one workflow plugin for Claude Code — engineering discipline (TDD, verification, code review), design quality (critique, polish, normalize), and project tracking (phases, milestones, roadmaps) in a single install.

## Installation

In Claude Code, run:

```
# Register marketplace
/plugin marketplace add cinjoff/fhhs-skills

# Install plugin
/plugin install fhhs-skills@fhhs-skills-marketplace
```

Then start a new conversation and run:

```
/setup
```

This gives you an overview of what's available. Then run `/new-project` to bootstrap a tracked project, or `/skills-guide` for a full command reference.

> **Note:** fhhs-skills is fully self-contained. You do **not** need to install Superpowers, Impeccable, or GSD separately — they are all built in.

## Commands

### Composite Commands

| Command | Description |
|---------|-------------|
| `/setup` | Welcome and orientation (run once after installing) |
| `/new-project` | Bootstrap a tracked project with design framework and GSD structure |
| `/plan` | Phase-aware planning with research-first detection and implementation discussion |
| `/build` | Execute plans with fresh subagents, auto-detected design gates for frontend |
| `/fix` | Auto-triage bug fixes with debug session seeding and spec review |
| `/refactor` | Safe code restructuring with behavior preservation |
| `/verify` | Dual verification with gap-closure plan generation |
| `/research` | Investigate topics with GSD-compatible output |
| `/resume` | Context restoration and routing to next action |
| `/verify-ui` | Visual verification with Playwright screenshots and design critique |
| `/skills-guide` | Print the full composite skills reference |

### Design Quality Commands

| Command | Description |
|---------|-------------|
| `/critique` | Evaluate design quality with severity ratings |
| `/polish` | Final alignment, spacing, consistency pass |
| `/normalize` | Ensure consistency with design system tokens |
| `/harden` | Error handling, i18n, edge cases |
| `/animate` | Motion and micro-interactions |
| `/teach-impeccable` | One-time design context setup producing DESIGN.md |
| `/audit` | Comprehensive accessibility and performance audit |
| `/bolder` | Amplify visual impact of safe designs |
| `/quieter` | Tone down aggressive designs |
| `/simplify` | Strip to essence |
| `/clarify` | Improve UX copy and microcopy |
| `/colorize` | Add strategic color |
| `/delight` | Add moments of joy and personality |
| `/adapt` | Responsive/cross-platform adaptation |
| `/extract` | Extract reusable components into design system |
| `/onboard` | Design onboarding flows and empty states |
| `/optimize` | Interface performance optimization |

### Project Management Commands

| Command | Description |
|---------|-------------|
| `/add-phase` | Add phase to roadmap |
| `/remove-phase` | Remove phase from roadmap |
| `/insert-phase` | Insert urgent work between phases |
| `/progress` | Check project progress and route to next action |
| `/quick` | Quick task with project tracking guarantees |
| `/debug` | Multi-session debugging with persistent state |
| `/complete-milestone` | Archive milestone and prepare for next |
| `/audit-milestone` | Verify milestone completion before archiving |
| `/new-milestone` | Start a new milestone cycle |
| `/health` | Diagnose and repair .planning/ directory |
| `/update-upstream` | Check for upstream updates (Superpowers, Impeccable, GSD) |

<details>
<summary>More project commands</summary>

| Command | Description |
|---------|-------------|
| `/add-todo` | Capture task from conversation |
| `/check-todos` | List pending todos |
| `/add-tests` | Generate tests for completed phase |
| `/cleanup` | Archive phase directories from completed milestones |
| `/discuss-phase` | Gather context through conversation before planning |
| `/map-codebase` | Analyze codebase with parallel mapper agents |
| `/pause-work` | Create context handoff when pausing mid-phase |
| `/settings` | Configure workflow toggles |
| `/set-profile` | Switch model profile |
| `/validate-phase` | Audit validation gaps for completed phase |
| `/plan-milestone-gaps` | Create phases to close gaps found by milestone audit |
| `/list-phase-assumptions` | Surface assumptions before planning |
| `/update-gsd` | Update GSD CLI to latest version |
| `/help` | Show available commands |

</details>

## Typical Workflows

```
First time:   /setup -> /new-project -> /plan -> /build -> /verify
New project:  /new-project -> /plan -> /build -> /verify
Feature:      /plan -> /build -> /verify -> /verify-ui
Bug fix:      /fix
Refactoring:  /refactor
Resuming:     /resume -> (routes to next action)
```

## How It Works

Each composite command coordinates built-in engineering skills and design quality tools. `/build` dispatches fresh subagents per task (clean context), auto-detects frontend files for design gates, and tracks state through GSD. `/plan` matches your request against existing phases in the roadmap before creating plans.

Everything is self-contained — no external plugins to install or manage.

## Based On

This plugin incorporates and builds upon:

- **GSD** (Get Shit Done) v1.22.4 — https://github.com/gsd-build/get-shit-done
- **Superpowers** v4.3.4 — https://github.com/pcvelz/superpowers
- **Impeccable** v1.0.0 — https://github.com/pbakaus/impeccable

See [PATCHES.md](PATCHES.md) for all modifications from upstream.
