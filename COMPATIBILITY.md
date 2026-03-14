# Upstream Attribution

This plugin incorporates skills and commands forked from these upstream projects. The original source is preserved in `upstream/` for reference.

## Superpowers — v4.3.1 — [repo](https://github.com/obra/superpowers)

Forked skills (now at `skills/`):

| Skill | Used by |
|-------|---------|
| `brainstorming` | `/plan` |
| `test-driven-development` | `/fix`, `/build` |
| `systematic-debugging` | `/fix` (MODERATE path) |
| `dispatching-parallel-agents` | `/build` |
| `verification-before-completion` | `/review` (Step 3), `/verify` |
| `requesting-code-review` | `/review` (Step 1) |
| `finishing-a-development-branch` | `/review` (Step 7) |
| `using-superpowers` | Always loaded (skill discovery) |
| `using-git-worktrees` | `/plan` (worktree setup) |
| `writing-skills` | `/skill-creator` |
| `simplify` | `/build`, `/refactor`, `/fix` (MODERATE+), standalone `/simplify` |

## feature-dev — 55b58ec6 — [repo](https://github.com/anthropics/claude-code-plugins) (claude-plugins-official)

Adapted (not forked verbatim) into agents:

| Upstream file | Adapted to | Changes |
|---------------|-----------|---------|
| `agents/code-explorer.md` | `agents/code-explorer.md` | Removed YAML frontmatter (model/tools/color), broadened scope from "feature" to "area", added "Essential files" output section |
| `agents/code-architect.md` | `agents/code-architect.md` | Removed YAML frontmatter, minor text adjustments |
| `agents/code-reviewer.md` | `agents/code-reviewer.md` | Restructured as review template with placeholders, threshold 80 → 75, added full output format with severity categories |

Upstream snapshot preserved at `upstream/feature-dev-55b58ec6/` for diff tracking.

## Vercel React Best Practices — v1.0.0 (64bee5b7) — [repo](https://github.com/vercel-labs/agent-skills)

Forked skill:

| Skill | Used by |
|-------|---------|
| `skills/nextjs-perf/` | `/build` (subagent implementer prompt), `/review` (Step 1 quality review criteria) |

Upstream snapshot preserved at `upstream/vercel-react-best-practices-64bee5b7/`.

## playwright-best-practices — v1.0 (b4b0fd3c) — [repo](https://github.com/currents-dev/playwright-best-practices-skill)

Forked skill:

| Skill | Used by |
|-------|---------|
| `playwright-testing` | `/build` (subagent conditional), `/fix` (TDD step for frontend bugs) |

Upstream snapshot preserved at `upstream/playwright-best-practices-b4b0fd3c/`.

## Impeccable — v1.2.0 — [repo](https://github.com/pbakaus/impeccable)

Forked commands (now at `commands/`) and skills (now at `skills/`):

| Command/Skill | Used by |
|---------------|---------|
| `/critique` | `/build` design gates |
| `/polish` | `/build` design gates |
| `/normalize` | `/build` design gates (if design system exists) |
| `/harden` | Suggested by `/build` |
| `/animate` | Suggested by `/build` |
| `/teach-impeccable` | `/new-project` |
| `/distill` | Standalone (was `simplify` upstream, renamed) |
| `/adapt`, `/bolder`, `/quieter`, `/extract`, `/colorize`, `/audit`, `/clarify`, `/onboard`, `/optimize`, `/delight` | Standalone design commands |
| `skills/frontend-design/` | `/build` (subagent directives), `/fix` (design check) |

## claude-md-management — v1.0.0 — [repo](https://github.com/anthropics/claude-code-plugins) (claude-plugins-official)

Forked skill and command:

| Skill/Command | Used by |
|---------------|---------|
| `skills/claude-md-improver/` | `/revise-claude-md audit`, `/new-project` (Step 4 via init mode) |
| `/revise-claude-md` | Standalone, suggested by `/build` at phase/milestone completion |

Upstream snapshot preserved at `upstream/claude-md-management-1.0.0/`.

## gstack — v0.3.3 — [repo](https://github.com/garrytan/gstack)

Forked skills:

| Skill | Used by | Status |
|-------|---------|--------|
| plan-ceo-review | /fh:plan-review (new) | Forked |
| plan-eng-review | /fh:plan-work (enhance) | Absorbed |
| review/checklist.md | /fh:review (enhance) | Absorbed |
| ship | /release (enhance) | Absorbed |
| qa | /fh:qa (new) | Forked |
| browse | SKIP (using agent-browser) | — |
| retro | SKIP (user decision) | — |
| setup-browser-cookies | Absorbed into /fh:qa | Absorbed |
| gstack-upgrade | SKIP (plugin marketplace) | — |

Upstream snapshot: `upstream/gstack-0.3.3/`

## GSD (Get Shit Done) — v1.22.4 — [repo](https://github.com/gsd-build/get-shit-done)

GSD commands and agents are forked into `commands/` and `skills/` respectively. GSD CLI (`gsd-tools.cjs`) is bundled in `bin/` and symlinked to `$HOME/.claude/get-shit-done/bin/` during `/setup`.

## External Dependencies

All managed by `/setup` — it detects the platform and installs what's missing.

| Dependency | Required | macOS/Linux | Windows |
|------------|----------|-------------|---------|
| Homebrew | No (convenience) | Auto-offered by `/setup` | N/A |
| Node.js + npm | Yes | `brew install node` | https://nodejs.org or `winget install OpenJS.NodeJS.LTS` |
| GitHub CLI (`gh`) | Recommended | `brew install gh` | `winget install GitHub.cli` |
| Vercel CLI | Recommended | `brew install vercel-cli` | `npm install -g vercel` |
| Git | Yes | `brew install git` | `winget install Git.Git` |
| `typescript-language-server` | Recommended | `npm install -g typescript-language-server typescript` | Same |
| `typescript-lsp` Claude plugin | Recommended | `/plugin install typescript-lsp@claude-plugins-official` | Same |

TypeScript LSP provides precise code navigation used by codebase mapping, debugging, refactoring, and build subagents. The plugin works without it but loses LSP-powered features.

## Modifications

See [PATCHES.md](PATCHES.md) for all modifications applied to forked upstream code.
