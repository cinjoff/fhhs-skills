# fhhs-skills

Composite workflow skills for Claude Code that unify three frameworks into a single interface:

- **GSD** (Get Shit Done) — project structure, state tracking, milestones, roadmaps
- **Superpowers** — engineering discipline: TDD, code review, verification, fresh subagents
- **Impeccable** — design quality: critique, polish, normalize, frontend anti-patterns

## Getting Started

After installing this plugin, run:

```
/setup
```

This checks for and installs the required dependencies (Superpowers, Impeccable). GSD is installed per-project when you run `/new-project`.

See [COMPATIBILITY.md](COMPATIBILITY.md) for upstream skill contracts and versions.

## Commands

| Command | Description |
|---------|-------------|
| `/setup` | Install all dependencies (run once after installing this plugin) |
| `/new-project` | Bootstrap a tracked project with design framework and GSD structure |
| `/plan` | Phase-aware planning with research-first detection and implementation discussion |
| `/build` | Execute plans with fresh subagents, auto-detected design gates for frontend |
| `/fix` | Auto-triage bug fixes with debug session seeding and spec review |
| `/refactor` | Safe code restructuring with behavior preservation |
| `/verify` | Dual verification with gap-closure plan generation |
| `/research` | Investigate topics with GSD-compatible output |
| `/resume` | Context restoration and routing to next action |
| `/verify-ui` | Visual verification (provided by Impeccable) |
| `/skills-guide` | Print the full composite skills reference |

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

Each composite skill coordinates the three frameworks without reimplementing them. `/build` dispatches fresh subagents per task (clean context), auto-detects frontend files for Impeccable design gates, and tracks state through GSD. `/plan` matches your request against existing phases in the roadmap before creating plans.

The composites replace the need to remember which GSD command, Superpowers skill, or Impeccable tool to use — just use the composite and it orchestrates the right ones.

## Upstream Repos

- **GSD**: https://github.com/gsd-build/get-shit-done
- **Superpowers**: https://github.com/pcvelz/superpowers
- **Impeccable**: https://github.com/pbakaus/impeccable
