# Technology Stack

**Analysis Date:** 2026-03-27

## Languages

**Primary:**
- JavaScript (CommonJS) — CLI tooling (`bin/gsd-tools.cjs`, `bin/lib/*.cjs`), hooks (`hooks/*.js`), auto-orchestrator (`.claude/skills/auto/auto-orchestrator.cjs`)
- Markdown — All skills, agents, commands, references, and templates

**Secondary:**
- Python 3 — Eval runner (`fhhs-skills-workspace/run_all_evals.py`), LLM grader (`fhhs-skills-workspace/llm_grader.py`), upstream test scripts
- Bash — Shell hooks (`.claude/hooks/post-push-release-check.sh`), setup platform detection, upstream test harnesses

## Runtime

**Environment:**
- Node.js (no version pinned; no `.nvmrc` or `.node-version` present)
- Python 3 (no `.python-version`; used only for eval tooling)

**Package Manager:**
- None at project root — no `package.json` at root level
- Template sub-project uses npm: `templates/project-tracker/package.json`
- pnpm is the preferred manager for new projects (per user preference)

**Lockfile:**
- `templates/project-tracker/package-lock.json` (npm, template sub-project only)
- No lockfile at root

## Frameworks

**Core:**
- Claude Code Plugin System v1.37.1 — Plugin declared in `.claude-plugin/plugin.json`, skills served from `.claude/skills/`
- GSD (Get Shit Done) workflow engine — Forked from `gsd-build/get-shit-done` v1.22.4, CLI at `bin/gsd-tools.cjs` (5,827 LOC across 12 modules)

**Testing:**
- Custom behavioral eval framework — `fhhs-skills-workspace/run_all_evals.py` spawns `claude -p` sessions, grades against JSON assertions in `evals/evals.json` (210+ evals)
- LLM-based grader — `fhhs-skills-workspace/llm_grader.py` uses `claude -p --model haiku` for semantic assertion grading

**Build/Dev:**
- No build step for the plugin itself — pure Markdown + CommonJS, no transpilation
- Template sub-project (`templates/project-tracker/`) uses esbuild + Tailwind CSS v4 for a standalone tracker UI

## Key Dependencies

**Critical (zero external npm dependencies at root):**
- Node.js built-in `fs`, `path`, `child_process`, `http`, `https`, `os` — All CLI tooling uses only Node.js stdlib
- No `node_modules/` at project root; the plugin is dependency-free

**Template Sub-Project (`templates/project-tracker/package.json`):**
- `esbuild` ^0.25.0 — JS bundler for tracker UI
- `preact` ^10.25.4 — Lightweight React alternative for tracker UI
- `tailwindcss` ^4 / `@tailwindcss/cli` ^4 — CSS framework for tracker UI

**Upstream Snapshots (vendored, not installed):**
- `upstream/superpowers-4.3.1/` — Superpowers skill library
- `upstream/impeccable-1.2.0/` — Design quality skills
- `upstream/gsd-1.22.4/` — GSD workflow templates
- `upstream/gstack-0.3.3/` — Engineering review skills
- `upstream/feature-dev-55b58ec6/` — Agent personas from claude-plugins-official
- `upstream/claude-md-management-1.0.0/` — CLAUDE.md management skill
- `upstream/vercel-react-best-practices-64bee5b7/` — Next.js perf skill
- `upstream/playwright-best-practices-b4b0fd3c/` — Playwright testing skill

## Configuration

**Plugin Manifest:**
- `.claude-plugin/plugin.json` — Plugin name `fh`, version, skills path `./.claude/skills/`
- `.claude-plugin/marketplace.json` — Marketplace listing, must stay version-synced with plugin.json

**GSD Config:**
- `.planning/config.json` — Per-project GSD settings (model profile, plan limits, feature flags)

**Claude Code Hooks:**
- `.claude/settings.json` — Hook definitions (PostToolUse → `post-push-release-check.sh`)

**Environment:**
- `BRAVE_API_KEY` — Optional, enables `websearch` command in `bin/lib/commands.cjs`
- `CLAUDE_CONFIG_DIR` — Optional override for `~/.claude` path (used by hooks)

**Build (template sub-project only):**
- `templates/project-tracker/package.json` — Scripts: `build`, `dev`

## Platform Requirements

**Development:**
- macOS, Linux, or Windows (WSL) — Cross-platform path handling via `toPosixPath()` in `bin/lib/core.cjs`
- Node.js (any recent LTS; no version constraint detected)
- Git (required for commit operations via `bin/lib/commands.cjs`)
- Claude Code CLI (`claude -p` used by eval runner and auto-orchestrator)

**Production (Plugin Installation):**
- Claude Code with plugin support — `claude plugin install fh@cinjoff/fhhs-skills`
- No server, no build step — plugin is pure Markdown + JS files served from `.claude/skills/`
- Optional: Homebrew, GitHub CLI (`gh`), Vercel CLI, TypeScript LSP — detected and installed by `/fh:setup`

## GSD CLI Architecture

The `bin/gsd-tools.cjs` CLI is the plugin's only runtime executable. It provides:

- **12 library modules** in `bin/lib/`: `core.cjs` (508 LOC), `state.cjs` (867), `phase.cjs` (901), `verify.cjs` (820), `init.cjs` (710), `commands.cjs` (548), `frontmatter.cjs` (299), `roadmap.cjs` (298), `milestone.cjs` (241), `changelog.cjs` (235), `template.cjs` (222), `config.cjs` (178)
- **Model profile resolution** — Maps agent types to Claude models (opus/sonnet/haiku) based on quality/balanced/budget profiles in `bin/lib/core.cjs`
- **Large output handling** — JSON > 50KB written to tmpfile, path returned with `@file:` prefix

## Hooks System

**Shipped hooks (`hooks/`):**
- `hooks/fhhs-check-update.js` — SessionStart: checks GitHub for newer plugin version (6hr throttle)
- `hooks/fhhs-context-monitor.js` — PostToolUse: reads context metrics, warns agent at 35%/25% remaining
- `hooks/fhhs-learnings.js` — PostToolUse: captures learnings
- `hooks/fhhs-statusline.js` — PostToolUse: statusline bridge

**Repo-local hooks (`.claude/hooks/`):**
- `.claude/hooks/post-push-release-check.sh` — PostToolUse (Bash): reminds about unreleased commits after `git push`

---

*Stack analysis: 2026-03-27*
