# Upstream Registry

Source of truth for all upstream dependencies. Used by `/fh:sync-upstream` to check
versions, diff changes, and guide patch reapplication.

## Legend

| Field | Meaning |
|-------|---------|
| `name` | Argument name passed to `/fh:sync-upstream` |
| `repo` | GitHub `owner/repo` |
| `snapshot_pattern` | Directory name pattern in `upstream/` (current version embedded) |
| `version_source` | How to detect latest: `release` (gh releases/latest), `tag` (gh tags), `commit` (gh commits on default branch) |
| `monorepo_path` | Subdirectory within the repo to extract (blank = whole repo) |
| `compare_paths` | Which subdirectories to diff between old and new snapshots |
| `forked_to` | Our skill/agent/command paths forked from this upstream. Path prefixes: `skills/` = internal skills (root), `.claude/skills/` = shipped skills, `agents/` = `agents/` (root), `commands/` = `commands/` (root, shipped), `.claude/commands/` = `.claude/commands/` (maintainer-local) |
| `eval_commands` | Eval command names (from `run_all_evals.py` COMMAND_MAP) to run when this upstream is updated |

## Registry

### superpowers

| Field | Value |
|-------|-------|
| repo | `obra/superpowers` |
| snapshot_pattern | `superpowers-{version}` |
| version_source | `release` |
| monorepo_path | |
| compare_paths | `skills/`, `agents/` |
| forked_to | `skills/brainstorming`, `skills/test-driven-development`, `skills/systematic-debugging`, `skills/dispatching-parallel-agents`, `skills/verification-before-completion`, `skills/requesting-code-review`, `skills/receiving-code-review`, `skills/finishing-a-development-branch`, `skills/using-superpowers`, `skills/using-git-worktrees`, `skills/writing-skills`, `skills/simplify`, `skills/executing-plans`, `skills/subagent-driven-development`, `skills/writing-plans` |
| eval_commands | `build`, `plan-work`, `fix`, `refactor`, `review`, `simplify`, `quick` |

### impeccable

| Field | Value |
|-------|-------|
| repo | `pbakaus/impeccable` |
| snapshot_pattern | `impeccable-{version}` |
| version_source | `release` |
| monorepo_path | |
| compare_paths | `source/skills/` |
| forked_to | `skills/frontend-design`, `.claude/skills/ui-critique`, `.claude/skills/polish`, `.claude/skills/normalize`, `.claude/skills/harden`, `.claude/skills/ui-animate`, `.claude/skills/ui-redesign`, `.claude/skills/distill`, `.claude/skills/adapt`, `.claude/skills/bolder`, `.claude/skills/quieter`, `.claude/skills/extract`, `.claude/skills/colorize`, `.claude/skills/audit`, `.claude/skills/clarify`, `.claude/skills/onboard`, `.claude/skills/optimize`, `.claude/skills/delight` |
| eval_commands | `polish`, `normalize`, `harden`, `adapt`, `ui-animate`, `ui-critique`, `ui-redesign`, `distill`, `bolder`, `quieter`, `extract`, `colorize`, `audit`, `clarify`, `onboard`, `optimize`, `delight` |

### gsd

| Field | Value |
|-------|-------|
| repo | `gsd-build/get-shit-done` |
| snapshot_pattern | `gsd-{version}` |
| version_source | `release` |
| monorepo_path | |
| compare_paths | `workflows/`, `agents/`, `references/`, `templates/` |
| forked_to | `.claude/skills/build`, `.claude/skills/fix`, `.claude/skills/plan-work`, `.claude/skills/progress`, `.claude/skills/quick`, `.claude/skills/review`, `.claude/skills/map-codebase`, `.claude/skills/todos`, `.claude/skills/tracker`, `agents/gsd-executor`, `agents/gsd-planner`, `agents/gsd-verifier`, `agents/gsd-roadmapper`, `agents/gsd-debugger`, `agents/gsd-codebase-mapper`, `agents/gsd-integration-checker`, `agents/gsd-nyquist-auditor`, `agents/gsd-phase-researcher`, `agents/gsd-plan-checker`, `agents/gsd-project-researcher`, `agents/gsd-research-synthesizer`, `commands/new-project`, `.claude/commands/discuss-phase`, `.claude/commands/add-phase`, `.claude/commands/remove-phase`, `.claude/commands/insert-phase`, `.claude/commands/validate-phase`, `.claude/commands/list-phase-assumptions`, `.claude/commands/complete-milestone`, `.claude/commands/new-milestone`, `.claude/commands/audit-milestone`, `.claude/commands/plan-milestone-gaps`, `.claude/commands/pause-work`, `.claude/commands/set-profile`, `.claude/commands/add-tests`, `.claude/commands/cleanup`, `.claude/commands/release`, `.claude/commands/update-gsd` |
| eval_commands | `build`, `fix`, `plan-work`, `progress`, `quick`, `review`, `map-codebase`, `todos`, `tracker` |

### gstack

| Field | Value |
|-------|-------|
| repo | `garrytan/gstack` |
| snapshot_pattern | `gstack-{version}` |
| version_source | `release` |
| monorepo_path | |
| compare_paths | `plan-ceo-review/`, `plan-eng-review/`, `review/`, `qa/`, `ship/` |
| forked_to | `.claude/skills/plan-review`, `.claude/skills/ui-test`, `.claude/skills/review` (checklist absorbed), `.claude/skills/plan-work` (eng-review absorbed), `.claude/commands/release` (ship absorbed) |
| eval_commands | `plan-review`, `ui-test`, `review` |

### feature-dev

| Field | Value |
|-------|-------|
| repo | `anthropics/claude-code-plugins` |
| snapshot_pattern | `feature-dev-{version}` |
| version_source | `commit` |
| monorepo_path | `plugins/feature-dev` |
| compare_paths | `agents/`, `commands/` |
| forked_to | `agents/code-explorer`, `agents/code-architect`, `agents/code-reviewer` |
| eval_commands | `review` |

### vercel-react

| Field | Value |
|-------|-------|
| repo | `vercel-labs/agent-skills` |
| snapshot_pattern | `vercel-react-best-practices-{version}` |
| version_source | `commit` |
| monorepo_path | |
| compare_paths | `.` |
| forked_to | `skills/nextjs-perf` |
| eval_commands | `nextjs-perf` |

### playwright

| Field | Value |
|-------|-------|
| repo | `currents-dev/playwright-best-practices-skill` |
| snapshot_pattern | `playwright-best-practices-{version}` |
| version_source | `commit` |
| monorepo_path | |
| compare_paths | `.` |
| forked_to | `skills/playwright-testing` |
| eval_commands | `playwright-testing` |

### claude-md

| Field | Value |
|-------|-------|
| repo | `anthropics/claude-code-plugins` |
| snapshot_pattern | `claude-md-management-{version}` |
| version_source | `commit` |
| monorepo_path | `plugins/claude-md-management` |
| compare_paths | `skills/`, `commands/` |
| forked_to | `skills/claude-md-improver`, `.claude/skills/revise-claude-md` |
| eval_commands | `revise-claude-md` |
