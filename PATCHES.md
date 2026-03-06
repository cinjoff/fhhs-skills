# Patches

Modifications applied to forked upstream skills. When updating upstream,
review each patch and reapply if still relevant.

## Superpowers (forked from v4.3.5)

### brainstorming
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Output path: `docs/plans/` → `.planning/designs/` | GSD convention — all planning artifacts live in .planning/ |
| 2 | Removed terminal state (invoke writing-plans) | /plan owns the flow after brainstorming — it continues to Step 3 |
| 3 | Removed design doc git commit | Composite handles commits to avoid double-commits |
| 4 | Removed writing-plans references throughout | Not used in composite workflow |

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
| 1 | Subagent type: `superpowers-extended-cc:code-reviewer` → internal reference | No external plugin dependency |

### verification-before-completion
No changes.

### dispatching-parallel-agents
No changes. (Upstream additions from v4.3.5 merged cleanly.)

### executing-plans
No changes. (Upstream additions from v4.3.5 merged cleanly.)

### subagent-driven-development
No changes. (Upstream additions from v4.3.5 merged cleanly.)

### finishing-a-development-branch
No changes.

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

### Commands (workflows)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Removed `gsd:` prefix from all command names | Cleaner namespace under fhhs-skills |
| 2 | Commands that composites replace are not exposed | /plan replaces plan-phase, /build replaces execute-phase, etc. |

### Agents
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Agent definitions moved from ~/.claude/agents/ to skills/ | Self-contained plugin, no system-level files needed |
