# Contributing to fhhs-skills

Welcome! fhhs-skills is a Claude Code plugin that composes upstream skills into a complete development toolkit. See the [README](README.md) for what the plugin does and how to install it.

## Development Setup

1. Clone the repo
2. Install [Claude Code](https://claude.ai/code)
3. Run `claude plugin install .` to install from local source
4. Run `/fh:setup` to configure prerequisites

## Project Structure

- `.claude/skills/` — shipped skills (user-facing, invoked as `/fh:{name}`)
- `.claude/commands/` — maintainer commands (not shipped with plugin installs)
- `upstream/` — verbatim upstream snapshots (never edit directly)
- `evals/` — eval suite (210+ evals with mock project fixtures)
- `bin/` — GSD CLI tooling (`gsd-tools.cjs`)
- `.planning/` — project state (STATE.md, ROADMAP.md, REQUIREMENTS.md)

## Making Changes

- Follow conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Skills use `/fh:` prefix in all documentation references
- Runtime-read files must live inside `.claude/skills/{name}/` — the shipping boundary excludes `references/`, `templates/`, and other repo-root directories; files outside `.claude/skills/` will fail with "File does not exist" at runtime
- Run evals after changes: `python3 fhhs-skills-workspace/run_all_evals.py --tier smoke`
- Both `plugin.json` and `marketplace.json` must stay version-synced

## Adding a New Skill

1. Create `.claude/skills/{name}/SKILL.md`
2. Add frontmatter with `name`, `description`, and `user-invocable` (note: with a **c**, not `user-invokable`)
3. Co-locate any runtime-read files inside `.claude/skills/{name}/`
4. Add at least 1 eval in `evals/`
5. Update README.md command tables

## Reporting Issues

Use GitHub issue templates for bug reports and feature requests.

## Release Process

Maintainer-only. See `.claude/commands/release.md`.
