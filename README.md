# fhhs-skills

Composite workflow skills for Claude Code — a self-contained plugin providing unified project workflows with engineering discipline, design quality, and project tracking.

## Getting Started

Install the plugin, then run:

```
/setup
```

This gives you an overview of what's available. Then run `/new-project` to bootstrap a tracked project, or `/skills-guide` for a full command reference.

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
