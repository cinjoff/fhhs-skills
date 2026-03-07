# Patches

Modifications applied to forked upstream skills. When updating upstream,
review each patch and reapply if still relevant.

## Superpowers (forked from v4.3.1, obra/superpowers)

### brainstorming
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Output path: `docs/plans/` → `.planning/designs/` | GSD convention — all planning artifacts live in .planning/ |
| 2 | Removed terminal state (invoke writing-plans) | /plan owns the flow after brainstorming — it continues to Step 3 |
| 3 | Removed design doc git commit | Composite handles commits to avoid double-commits |
| 4 | Removed writing-plans references throughout | Not used in composite workflow |
| 5 | Added deep codebase exploration with `code-explorer` agents | Inspired by feature-dev plugin — parallel explorer agents surface essential files before design |
| 6 | Added parallel `code-architect` agents for complex features | Inspired by feature-dev plugin — independent architect agents with different lenses (minimal/clean/pragmatic) |

### test-driven-development
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added GSD commit convention note: `test(phase-plan): ...` | Consistent with GSD commit format |

### systematic-debugging
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added `.planning/debug/` session file creation | Aligns with /fix COMPLEX path that seeds debug sessions |
| 2 | Added slug convention: `YYYY-MM-DD-{first-3-words-kebab}` | Matches /fix debug file naming |

### requesting-code-review
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Subagent type: `superpowers:code-reviewer` → internal reference | No external plugin dependency |

### code-reviewer (agent)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Restructured as review template with placeholders (`{WHAT_WAS_IMPLEMENTED}`, etc.) | Used by `skills/requesting-code-review/` for dispatching |
| 2 | Confidence threshold: 80 → 75 | Slightly more inclusive than feature-dev upstream (80) while still filtering noise |
| 3 | Added full output format with severity categories (Critical/Important/Minor) | Structured output for composite consumption |

Upstream reference: `upstream/feature-dev-55b58ec6/agents/code-reviewer.md`

### code-explorer (agent) — ADAPTED from feature-dev
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Removed YAML frontmatter (model, tools, color) | Not needed — agent config handled by Claude Code plugin system |
| 2 | Broadened scope from "feature" to "area" | Used for general codebase exploration, not just features |
| 3 | Added "Essential files" section to output format | Composites use this list to build deep context |

Upstream reference: `upstream/feature-dev-55b58ec6/agents/code-explorer.md`

### code-architect (agent) — ADAPTED from feature-dev
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Removed YAML frontmatter (model, tools, color) | Not needed — agent config handled by Claude Code plugin system |

Upstream reference: `upstream/feature-dev-55b58ec6/agents/code-architect.md`

### verification-before-completion
No changes.

### dispatching-parallel-agents
No changes.

### executing-plans
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added EnterPlanMode/ExitPlanMode prohibition warning | Prevents plan mode trapping in Claude Code |
| 2 | Added worktree check before creating new worktree (Step 0) | Avoid duplicate worktrees |

### subagent-driven-development
No changes.

### finishing-a-development-branch
No changes.

### using-superpowers
| # | Change | Rationale |
|---|--------|-----------|
| 1 | EnterPlanMode node: neutral → "DON'T" warning | Prevents plan mode trapping in Claude Code |

### writing-skills
No changes.

### writing-plans
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added EnterPlanMode/ExitPlanMode prohibition with HARD-GATE | Prevents plan mode trapping in Claude Code |
| 2 | Execution handoff: plain text → AskUserQuestion with structured options | Better UX in Claude Code |
| 3 | Subagent references: `superpowers:` prefix removed | Internal references only |

## Impeccable (forked from v1.2.0)

### teach-impeccable
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Output: `{{config_file}}` → `.planning/DESIGN.md` | GSD convention — design context lives in .planning/ |
| 2 | Added YAML frontmatter to output format | GSD file format consistency |

### critique
No changes. (Upstream v1.2.0 references now use `{{available_commands}}` and generic skill names — compatible with our setup.)

### animate
No changes. (Upstream v1.2.0 uses `{{ask_instruction}}` and generic skill references — compatible with our setup.)

### distill (was simplify)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Renamed `simplify` → `distill` | Matches upstream rename |

### polish
No changes.

### normalize
No changes.

### harden
No changes.

### frontend-design (skill)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Reference paths updated to internal `skills/frontend-design/reference/` | Self-contained plugin |

### adapt, bolder, quieter, extract, colorize, audit, clarify, onboard, optimize, delight
No changes. (Template variables adopted from upstream v1.2.0.)

## GSD (forked from v1.22.4)

### new-project (workflow)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Step 9 handoff: `/gsd:discuss-phase 1` → `/plan 1` | Composite `/plan` replaces raw GSD commands in user-facing output |
| 2 | Removed "Also available: /gsd:plan-phase" from interactive output | `/plan` handles both discussion and planning |

### Commands (workflows)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Removed `gsd:` prefix from all command names | Cleaner namespace under fhhs-skills |
| 2 | Commands that composites replace are not exposed | /plan replaces plan-phase, /build replaces execute-phase, etc. |

### Agents
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Agent definitions moved from ~/.claude/agents/ to skills/ | Self-contained plugin, no system-level files needed |

## claude-md-management (forked from v1.0.0)

### claude-md-improver (skill)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added Phase 1b: Project Context Detection (GSD/design system awareness) | Skill needs to know about `.planning/` to assess CLAUDE.md quality properly |
| 2 | Added "Planning integration" criterion to quality assessment | GSD projects should reference `.planning/` in CLAUDE.md |
| 3 | Added GSD-aware update guidelines (reference `.planning/`, don't duplicate) | Prevents CLAUDE.md from duplicating planning content that changes frequently |
| 4 | Added common issues #7-#9 (missing planning integration, stale phases, missing design) | GSD-specific issues the original skill wouldn't catch |

### quality-criteria (reference)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added "GSD Project Bonus Criteria" section (+10 bonus for planning integration) | Rewards proper `.planning/` integration, penalizes duplication |

### templates (reference)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added "Planning State (GSD projects)" recommended section | Template section for `.planning/` reference |
| 2 | Added "fhhs-skills Project (Recommended)" template | Opinionated template for projects bootstrapped with `/new-project` |
| 3 | Added "Reference, don't duplicate" key principle | Prevents CLAUDE.md bloat from copying `.planning/` content |

### update-guidelines (reference)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added "GSD Project Updates" section with DO/DON'T rules | Clear guidance on what belongs in CLAUDE.md vs `.planning/` |
| 2 | Added "After significant changes" guidance | When to update CLAUDE.md during ongoing development |
| 3 | Added rule: "Don't copy planning content" with examples | `.planning/` content changes too frequently to mirror |

### revise-claude-md (command)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added `audit` and `init` modes alongside session learnings | Single command for all CLAUDE.md operations |
| 2 | `init` mode uses `skills/claude-md-improver/references/templates.md` | `/new-project` Step 4 delegates to this for consistent CLAUDE.md generation |
| 3 | Added GSD project context detection in session learnings mode | Ensures updates respect `.planning/` structure |

Upstream reference: `upstream/claude-md-management-1.0.0/`
