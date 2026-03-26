# fhhs-skills

Claude Code plugin composing upstream skills (Superpowers, Impeccable, GSD) into a complete development toolkit.

## Stack

- Markdown skills, JavaScript/Node.js tooling (bin/gsd-tools.cjs)
- Plugin ships `.claude/skills/` only — co-locate all runtime-read files there
- `plugin.json` must declare `"skills": "./.claude/skills/"` — Claude Code defaults to `skills/` at plugin root
- Eval suite: 210+ evals in `evals/` with mock project fixtures

## Architecture

- **User-facing skills:** `.claude/skills/{name}/SKILL.md` — invoked as `/fh:{name}`
- **Maintainer commands:** `.claude/commands/{name}.md` — repo-local only, NOT shipped with plugin installs (release, sync-upstream, audit-upstream)
- **Internal skills:** `skills/{name}/SKILL.md` — referenced by composites, not shipped
- **Agents:** `agents/{name}.md` — subagent personas for Task tool dispatch
- **References:** `references/` — shared templates and prompts
- **CONTEXT.md contract:** 3 canonical sections (Decisions, Discretion Areas, Deferred Ideas) — source: `bin/lib/commands.cjs`, contract block in `plan-work/SKILL.md`
- **GSD CLI:** `bin/gsd-tools.cjs` — state and config management
- **Upstream:** `upstream/` — verbatim snapshots, never edit

## Code Style

- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Skills use `/fh:` prefix in docs (e.g., `/fh:build`, not `/build`)
- Both `plugin.json` and `marketplace.json` must stay version-synced
- Old CONTEXT.md section names (`Design Decisions`, `Review Decisions`, `Locked Decisions`, `NOT in scope`) must NOT appear in shipped skills under `.claude/skills/`

## Key Constraints

- No postinstall hooks — setup is user-initiated via `/fh:setup`
- `references/`, `templates/`, repo-root dirs NOT shipped to plugin installs
- Frontmatter field is `user-invocable` (with a **c**), NOT `user-invokable` — misspelling silently defaults to `true`
- After skill renames: grep for old paths in all shipped files before committing
- `str.replace()` with dynamic content: always use function form to avoid `$&` corruption
- Every executed plan MUST have a SUMMARY.md — `gsd-tools verify phase-completeness` checks for these
- CONTEXT.md section names are load-bearing: renaming requires mirroring in plan-work, plan-review, build, implementer-prompt, and `bin/lib/commands.cjs`

## Testing

- Run evals: `python3 evals/run_all_evals.py`
- Every shipped skill needs at least 1 eval
- Upstream changes: re-run full eval suite to catch regressions

## Planning

- `.planning/PROJECT.md` — vision and scope
- `.planning/ROADMAP.md` — phased plan
- `.planning/STATE.md` — current position
- `.planning/REQUIREMENTS.md` — work items

# Compact Instructions

When compacting, preserve:
- Current phase and plan from .planning/STATE.md
- Locked decisions from active phase CONTEXT.md
- Files modified in this session
- Eval failures and their root causes
- Plugin shipping boundary constraints (.claude/skills/ only)
