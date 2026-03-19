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
| `forked_to` | Our skill/agent/command paths forked from this upstream |

## Registry

### superpowers

| Field | Value |
|-------|-------|
| repo | `obra/superpowers` |
| snapshot_pattern | `superpowers-{version}` |
| version_source | `release` |
| monorepo_path | |
| compare_paths | `skills/`, `agents/` |
| forked_to | `skills/brainstorming`, `skills/test-driven-development`, `skills/systematic-debugging`, `skills/dispatching-parallel-agents`, `skills/verification-before-completion`, `skills/requesting-code-review`, `skills/finishing-a-development-branch`, `skills/using-superpowers`, `skills/using-git-worktrees`, `skills/writing-skills`, `skills/simplify`, `skills/executing-plans`, `skills/subagent-driven-development`, `skills/writing-plans` |

### impeccable

| Field | Value |
|-------|-------|
| repo | `pbakaus/impeccable` |
| snapshot_pattern | `impeccable-{version}` |
| version_source | `release` |
| monorepo_path | |
| compare_paths | `source/skills/` |
| forked_to | `skills/frontend-design`, `commands/critique`, `commands/polish`, `commands/normalize`, `commands/harden`, `commands/animate`, `commands/teach-impeccable`, `commands/distill`, `commands/adapt`, `commands/bolder`, `commands/quieter`, `commands/extract`, `commands/colorize`, `commands/audit`, `commands/clarify`, `commands/onboard`, `commands/optimize`, `commands/delight` |

### gsd

| Field | Value |
|-------|-------|
| repo | `gsd-build/get-shit-done` |
| snapshot_pattern | `gsd-{version}` |
| version_source | `release` |
| monorepo_path | |
| compare_paths | `workflows/`, `agents/`, `references/`, `templates/` |
| forked_to | `skills/build`, `skills/fix`, `skills/plan-work`, `skills/progress`, `skills/quick`, `skills/review`, `skills/verify`, `skills/resume-work`, `skills/map-codebase`, `skills/add-todo`, `skills/check-todos`, `skills/tracker`, `skills/gsd-executor` (agent), `skills/gsd-planner` (agent), `skills/gsd-verifier` (agent), `skills/gsd-roadmapper` (agent), `skills/gsd-debugger` (agent), `skills/gsd-codebase-mapper` (agent), `skills/gsd-integration-checker` (agent), `skills/gsd-nyquist-auditor` (agent), `skills/gsd-phase-researcher` (agent), `skills/gsd-plan-checker` (agent), `skills/gsd-project-researcher` (agent), `skills/gsd-research-synthesizer` (agent), `commands/new-project`, `commands/discuss-phase`, `commands/add-phase`, `commands/remove-phase`, `commands/insert-phase`, `commands/validate-phase`, `commands/list-phase-assumptions`, `commands/complete-milestone`, `commands/new-milestone`, `commands/audit-milestone`, `commands/plan-milestone-gaps`, `commands/pause-work`, `commands/set-profile`, `commands/add-tests`, `commands/cleanup`, `commands/release`, `commands/update-gsd` |

### gstack

| Field | Value |
|-------|-------|
| repo | `garrytan/gstack` |
| snapshot_pattern | `gstack-{version}` |
| version_source | `release` |
| monorepo_path | |
| compare_paths | `plan-ceo-review/`, `plan-eng-review/`, `review/`, `qa/`, `ship/` |
| forked_to | `skills/plan-review`, `skills/qa`, `skills/review` (checklist absorbed), `skills/plan-work` (eng-review absorbed), `commands/release` (ship absorbed) |

### feature-dev

| Field | Value |
|-------|-------|
| repo | `anthropics/claude-code-plugins` |
| snapshot_pattern | `feature-dev-{version}` |
| version_source | `commit` |
| monorepo_path | `plugins/feature-dev` |
| compare_paths | `agents/`, `commands/` |
| forked_to | `agents/code-explorer`, `agents/code-architect`, `agents/code-reviewer` |

### vercel-react

| Field | Value |
|-------|-------|
| repo | `vercel-labs/agent-skills` |
| snapshot_pattern | `vercel-react-best-practices-{version}` |
| version_source | `commit` |
| monorepo_path | |
| compare_paths | `.` |
| forked_to | `skills/nextjs-perf` |

### playwright

| Field | Value |
|-------|-------|
| repo | `currents-dev/playwright-best-practices-skill` |
| snapshot_pattern | `playwright-best-practices-{version}` |
| version_source | `commit` |
| monorepo_path | |
| compare_paths | `.` |
| forked_to | `skills/playwright-testing` |

### claude-md

| Field | Value |
|-------|-------|
| repo | `anthropics/claude-code-plugins` |
| snapshot_pattern | `claude-md-management-{version}` |
| version_source | `commit` |
| monorepo_path | `plugins/claude-md-management` |
| compare_paths | `skills/`, `commands/` |
| forked_to | `skills/claude-md-improver`, `commands/revise-claude-md` |
