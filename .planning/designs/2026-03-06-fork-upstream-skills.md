# Design: Fork Upstream Skills Into fhhs-skills

**Date:** 2026-03-06
**Status:** Approved

## Goal

Make fhhs-skills a single self-contained plugin that replaces Superpowers, Impeccable, and GSD system-level installs. Users install one plugin and get everything.

## Architecture

### Directory Structure

```
fhhs-skills/
├── commands/                          # User-facing commands
│   ├── build.md                       # composite
│   ├── plan.md                        # composite
│   ├── fix.md                         # composite
│   ├── refactor.md                    # composite
│   ├── verify.md                      # composite
│   ├── resume.md                      # composite
│   ├── new-project.md                 # composite
│   ├── research.md                    # composite
│   ├── verify-ui.md                   # composite
│   ├── setup.md                       # simplified (no dep checks)
│   ├── skills-guide.md                # composite
│   ├── critique.md                    # forked Impeccable
│   ├── polish.md                      # forked Impeccable
│   ├── normalize.md                   # forked Impeccable
│   ├── harden.md                      # forked Impeccable
│   ├── animate.md                     # forked Impeccable
│   ├── teach-impeccable.md            # forked Impeccable
│   ├── add-phase.md                   # forked GSD
│   ├── remove-phase.md                # forked GSD
│   ├── insert-phase.md                # forked GSD
│   ├── add-todo.md                    # forked GSD
│   ├── check-todos.md                 # forked GSD
│   ├── complete-milestone.md          # forked GSD
│   ├── audit-milestone.md             # forked GSD
│   ├── new-milestone.md               # forked GSD
│   ├── progress.md                    # forked GSD
│   ├── debug.md                       # forked GSD
│   ├── quick.md                       # forked GSD
│   ├── health.md                      # forked GSD
│   ├── cleanup.md                     # forked GSD
│   ├── pause-work.md                  # forked GSD
│   └── update-upstream.md             # NEW
│
├── skills/                            # Internal (composites invoke)
│   ├── brainstorming/SKILL.md         # forked Superpowers
│   ├── test-driven-development/SKILL.md
│   ├── systematic-debugging/SKILL.md
│   ├── dispatching-parallel-agents/SKILL.md
│   ├── verification-before-completion/SKILL.md
│   ├── requesting-code-review/SKILL.md
│   ├── finishing-a-development-branch/SKILL.md
│   ├── frontend-design/               # forked Impeccable
│   │   ├── SKILL.md
│   │   └── reference/
│   ├── gsd-executor/SKILL.md          # forked GSD agents
│   ├── gsd-planner/SKILL.md
│   ├── gsd-verifier/SKILL.md
│   ├── gsd-debugger/SKILL.md
│   ├── gsd-plan-checker/SKILL.md
│   ├── gsd-codebase-mapper/SKILL.md
│   └── ...
│
├── references/                        # Shared
│   ├── dependency-check.md            # simplified
│   ├── summary-template.md
│   └── gsd-state-updates.md
│
├── upstream/                          # Clean snapshots (never edit)
│   ├── superpowers-4.3.4/
│   ├── impeccable-1.0.0/
│   └── gsd-x.y.z/
│
├── PATCHES.md
├── COMPATIBILITY.md
├── evals/evals.json
└── README.md
```

### Key Design Decisions

1. **Single install** — fhhs-skills replaces Superpowers, Impeccable, and GSD system-level. Users install one plugin.

2. **Upstream snapshots for diffing** — `upstream/` holds verbatim copies of the version forked from. Never edited. Used as diff baseline when upstream updates.

3. **PATCHES.md tracks all modifications** — Every change from upstream is documented with rationale. Enables reapplication after updates.

4. **User-facing vs internal split:**
   - Commands: composites + Impeccable design tools + GSD structural commands
   - Skills: Superpowers disciplines + GSD agents (invoked by composites, not users)

5. **GSD CLI stays external** — `gsd-tools.cjs` is cloned from GSD repo per-project by `/new-project`. Not bundled.

6. **No prefix on GSD commands** — `/add-phase` not `/gsd:add-phase`.

### Skill Adaptations

#### Superpowers (Heavy: 2, Medium: 1, Light: 3, None: 3)

| Skill | Change | Severity |
|-------|--------|----------|
| brainstorming | Output → `.planning/designs/`. Remove writing-plans terminal state. Remove self-commit. | Heavy |
| test-driven-development | Commit format → `test(phase-plan): ...` | Light |
| systematic-debugging | Add `.planning/debug/` session file creation | Medium |
| verification-before-completion | No changes | None |
| dispatching-parallel-agents | No changes | None |
| requesting-code-review | Internal path refs | Light |
| finishing-a-development-branch | No changes | None |
| frontend-design | Internal reference paths | Light |

#### Impeccable (Heavy: 1, Light: 2, None: 3)

| Skill | Change | Severity |
|-------|--------|----------|
| teach-impeccable | Output → `.planning/DESIGN.md` with YAML frontmatter. Remove template vars. | Heavy |
| critique | Internal frontend-design ref | Light |
| animate | Internal frontend-design ref | Light |
| polish | No changes | None |
| normalize | No changes | None |
| harden | No changes | None |

#### GSD

GSD commands and agents forked as-is, with `gsd:` prefix removed from commands. Agents become internal skills.

### Update Workflow

`/update-upstream [superpowers|impeccable|gsd] [version]`:

1. Download new upstream version
2. Diff `upstream/{name}-{old}/` vs new
3. Cross-reference against PATCHES.md
4. Present report: changed files, conflicts, unaffected patches
5. Manual review and merge
6. Replace `upstream/` snapshot
7. Update PATCHES.md
8. Run evals

### Composite Changes Required

All `superpowers:*` and `impeccable:*` references in composites change to internal paths. `dependency-check.md` simplifies to just checking `.planning/PROJECT.md`. `/setup` simplifies to a welcome + suggest `/new-project`.

### Existing Bugs Fixed During Fork

1. teach-impeccable output path (CLAUDE.md → .planning/DESIGN.md)
2. brainstorming flow (writing-plans terminal state removed)
3. /new-project GSD circular dependency (check skill availability, not project files)
4. Impeccable detection (commands not skills — moot after fork)
5. Decimal step numbers in /fix and /verify
6. /research standalone contradiction
7. /verify-ui script reference
8. /skills-guide skill count
