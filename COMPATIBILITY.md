# Upstream Attribution

This plugin incorporates skills and commands forked from these upstream projects. The original source is preserved in `upstream/` for reference.

## Superpowers — v4.3.4 — [repo](https://github.com/pcvelz/superpowers)

Forked skills (now at `skills/`):

| Skill | Used by |
|-------|---------|
| `brainstorming` | `/plan` |
| `test-driven-development` | `/fix`, `/build` |
| `systematic-debugging` | `/fix` (MODERATE path) |
| `dispatching-parallel-agents` | `/build` |
| `verification-before-completion` | `/build`, `/fix`, `/refactor`, `/verify` |
| `requesting-code-review` | `/build`, `/refactor` |
| `finishing-a-development-branch` | `/build`, `/fix`, `/refactor` |

## Impeccable — v1.0.0 — [repo](https://github.com/pbakaus/impeccable)

Forked commands (now at `commands/`) and skills (now at `skills/`):

| Command/Skill | Used by |
|---------------|---------|
| `/critique` | `/build` design gates |
| `/polish` | `/build` design gates |
| `/normalize` | `/build` design gates (if design system exists) |
| `/harden` | Suggested by `/build` |
| `/animate` | Suggested by `/build` |
| `/teach-impeccable` | `/new-project` |
| `skills/frontend-design/` | `/build` (subagent directives), `/fix` (design check) |

## GSD (Get Shit Done) — v1.22.4 — [repo](https://github.com/gsd-build/get-shit-done)

GSD commands and agents are forked into `commands/` and `skills/` respectively. GSD tools (`gsd-tools.cjs`) are installed per-project at `.claude/get-shit-done/`.

## Modifications

See [PATCHES.md](PATCHES.md) for all modifications applied to forked upstream code.
