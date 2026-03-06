# fhhs-skills

Composite workflow skills for Claude Code that unify three frameworks into a single interface:

- **GSD** (Get Shit Done) — project structure, state tracking, milestones, roadmaps
- **Superpowers** — engineering discipline: TDD, code review, verification, fresh subagents
- **Impeccable** — design quality: critique, polish, normalize, frontend anti-patterns

## Prerequisites

Install these plugins first:

```bash
/install-plugin superpowers-extended-cc from pcvelz/superpowers
/install-plugin impeccable from pbakaus/impeccable
```

GSD must be installed separately per its own instructions.

## Commands

| Command | Description |
|---------|-------------|
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
New project:  /new-project -> /plan -> /build -> /verify
Feature:      /plan -> /build -> /verify -> /verify-ui
Bug fix:      /fix
Refactoring:  /refactor
Resuming:     /resume -> (routes to next action)
```

## How It Works

Each composite skill coordinates the three frameworks without reimplementing them. `/build` dispatches fresh subagents per task (clean context), auto-detects frontend files for Impeccable design gates, and tracks state through GSD. `/plan` matches your request against existing phases in the roadmap before creating plans.

The composites replace the need to remember which GSD command, Superpowers skill, or Impeccable tool to use — just use the composite and it orchestrates the right ones.
