# Compatibility

Upstream skill versions these composites were developed and tested against.

## Superpowers (superpowers-extended-cc) — v4.3.4 — [repo](https://github.com/pcvelz/superpowers)

| Skill | What composites expect |
|-------|----------------------|
| `brainstorming` | Explores requirements and design through questioning. Returns approved design. Used by `/plan`. |
| `test-driven-development` | RED-GREEN-REFACTOR cycle. Expects failing test first, minimal impl, cleanup. Used by `/fix`, `/build`. |
| `systematic-debugging` | Hypothesis-driven debugging with evidence gathering. Used by `/fix` (MODERATE path). |
| `dispatching-parallel-agents` | Prompt quality guidance for parallel subagent dispatch. Used by `/build`. |
| `verification-before-completion` | Fresh test/build runs, exit code checking, no claims without proof. Used by `/build`, `/fix`, `/refactor`, `/verify`. |
| `requesting-code-review` | Two-stage review dispatch (spec compliance + code quality). Used by `/build`, `/refactor`. |
| `finishing-a-development-branch` | Merge/PR/keep/discard options with worktree cleanup. Used by `/build`, `/fix`, `/refactor`. |
| `using-git-worktrees` | Isolated branch creation. Used by `/plan` (optional). |
| `subagent-driven-development` | Two-stage review pattern reference. Used by `/build` Step 4. |

## Impeccable — v1.0.0 — [repo](https://github.com/pbakaus/impeccable)

| Skill | What composites expect |
|-------|----------------------|
| `frontend-design` | Anti-pattern reference and design guidance. Used by `/build` (subagent directives), `/fix` (design check). |
| `critique` | Evaluates design quality with severity ratings (Critical/High/Medium/Low). Used by `/build` design gates. |
| `polish` | Final alignment, spacing, consistency pass. Used by `/build` design gates. |
| `normalize` | Ensures consistency with design system tokens. Used by `/build` design gates (only if design system exists). |
| `harden` | Error handling, i18n, edge cases. Suggested (not auto-run) by `/build`. |
| `animate` | Motion and micro-interactions. Suggested (not auto-run) by `/build`. |
| `teach-impeccable` | One-time design context setup producing DESIGN.md. Used by `/new-project`. |

## GSD (get-shit-done) — [repo](https://github.com/gsd-build/get-shit-done)

GSD is not a plugin — it's installed per-project at `.claude/get-shit-done/`. The composites use `gsd-tools.cjs` for:

| Function | Used by |
|----------|---------|
| `state advance-plan`, `update-progress`, `record-metric`, `add-decision`, `record-session` | `/build` |
| `roadmap update-plan-progress` | `/build` |
| `verify phase-completeness`, `artifacts`, `key-links`, `plan-structure` | `/build`, `/verify` |
| `frontmatter validate` | `/plan` |
| `template fill summary`, `template fill verification` | `/build`, `/verify` |
| `phase complete` | `/build` |
| `commit` | `/build` |
| `init new-project` | `/new-project` |

## Updating

When an upstream dependency releases a new version:

1. Check its changelog for renamed/removed skills
2. Diff the skills listed above against the new version
3. If a skill's contract changed (different inputs, different behavior), update the composite that references it
4. Update the version number in this file
