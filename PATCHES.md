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
| 1 | Added `.planning/debug/` session file creation | Aligns with /fh:fix COMPLEX path that seeds debug sessions |
| 2 | Added slug convention: `YYYY-MM-DD-{first-3-words-kebab}` | Matches /fh:fix debug file naming |

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
| 4 | Added LSP instructions (goToDefinition, findReferences, hover, documentSymbol) | Consistent with build subagents and refactor — LSP is faster and more precise than grep for tracing code flow |

Upstream reference: `upstream/feature-dev-55b58ec6/agents/code-explorer.md`

### code-architect (agent) — ADAPTED from feature-dev
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Removed YAML frontmatter (model, tools, color) | Not needed — agent config handled by Claude Code plugin system |
| 2 | Added LSP instructions (workspaceSymbol, findReferences, goToDefinition, documentSymbol) | Consistent with other agents — LSP enables precise pattern discovery and interface verification |

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

## startup-skill (forked from v1.0.0, ferdinandobons/startup-skill)

### startup-design
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Output paths: `{project-name}/00-intake/` → `.planning/startup/`, `01-discovery/` → `.planning/startup/discovery/`, etc. | GSD convention — all artifacts in .planning/ |
| 2 | Removed dynamic `{project-name}` derivation | Fixed output directory for integration with downstream skills |
| 3 | `PROGRESS.md` → `.planning/startup/PROGRESS.md` | Co-located with other startup artifacts |
| 4 | Added `--refresh` mode | Update existing artifacts without full re-run (REQ-37) |
| 5 | Added `user-invocable: true` to frontmatter | Plugin skill format requirement |
| 6 | Added territory boundaries and downstream integration sections | Prevent overlap with dev skills, document artifact flow |
| 7 | Expanded description with trigger phrases and explicit exclusions | Better skill routing accuracy |

### startup-competitors
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Output paths: `{project-name}/` → `.planning/startup/competitors/` | GSD convention |
| 2 | Artifact chain paths updated to `.planning/startup/` | Matches startup-design output location |
| 3 | Added `user-invocable: true` to frontmatter | Plugin skill format requirement |
| 4 | Added territory boundaries and downstream integration sections | Skill routing clarity |

### startup-positioning
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Output paths: `{project-name}/` → `.planning/startup/positioning/` | GSD convention |
| 2 | Artifact chain paths updated for both startup-design and startup-competitors | Matches adapted output locations |
| 3 | Added `user-invocable: true` to frontmatter | Plugin skill format requirement |
| 4 | Added territory boundaries and downstream integration sections | Skill routing clarity |

### startup-pitch
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Output paths: `{project-name}/` → `.planning/startup/pitch/` | GSD convention |
| 2 | Artifact chain paths updated for all three prior skills | Matches adapted output locations |
| 3 | Added `user-invocable: true` to frontmatter | Plugin skill format requirement |
| 4 | Added territory boundaries and downstream integration sections | Skill routing clarity |

### startup-advisor (NEW — not upstream)
Not a fork — entirely new skill. Uses curated decision frameworks in `references/frameworks/` and three-tier knowledge retrieval (frameworks → web search → project context).

## Vercel React Best Practices (forked from v1.0.0, 64bee5b7)

### nextjs-perf (skill)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added YAML frontmatter (`name: nextjs-perf`, `user-invokable: false`) | Plugin skill format requirement |
| 2 | Trimmed from 58 rules to ~35 most Next.js-relevant rules | Removed generic JS micro-optimizations (covered by general code quality skills) and low-impact advanced patterns |
| 3 | Removed individual rule files, consolidated into single SKILL.md | Self-contained within plugin shipping boundary (.claude/skills/) |
| 4 | Reorganized with inline code examples for highest-impact rules | Subagents read SKILL.md directly — examples must be inline, not in separate files |

Upstream reference: `upstream/vercel-react-best-practices-64bee5b7/`

## playwright-best-practices (forked from v1.0, b4b0fd3c)

### playwright-testing (skill)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Renamed skill `playwright-best-practices` → `playwright-testing` | Consistent naming with other forked skills |
| 2 | Set `user-invokable: false` | Not a standalone command — loaded conditionally by `/build` and `/fix` |
| 3 | Distilled upstream activity-based reference guide into decision-tree structure | Faster navigation for subagents; full references preserved in `references/` |
| 4 | Added inline Core Patterns section (locator priority, assertion patterns, POM summary) | Quick reference without reading separate files |
| 5 | Added Common Pitfalls table | Prevents most frequent Playwright anti-patterns |
| 6 | Added subagent context note (non-watch mode) | Watch mode hangs subagents |

Upstream reference: `upstream/playwright-best-practices-b4b0fd3c/`

## Impeccable (forked from v1.2.0)

### ui-branding (was teach-impeccable)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Output: `{{config_file}}` → `.planning/DESIGN.md` | GSD convention — design context lives in .planning/ |
| 2 | Added YAML frontmatter to output format | GSD file format consistency |
| 3 | Forked into `.claude/skills/ui-branding/` (was only in upstream snapshot) | Shipping boundary — upstream snapshots aren't shipped with plugin install |
| 4 | Renamed `teach-impeccable` → `ui-branding` | Clearer name; `fh:` prefix added per plugin naming convention |

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

## gstack (forked from v0.3.3)

### plan-review (from plan-ceo-review)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Renamed `plan-ceo-review` → `plan-review` | Cleaner name; "CEO" framing replaced with "founder-level challenge" in description |
| 2 | Removed gstack-upgrade check preamble | No gstack binary dependency in fhhs-skills |
| 3 | Output: actionable findings feed back into PLAN.md (`must_haves.truths` with `[review]` prefix) and CONTEXT.md (review decisions + deferred scope); lightweight human-reference summary to `.planning/designs/review-*.md` | Closes the feedback loop — `/build` already reads PLAN.md + CONTEXT.md, so review findings are now prescriptive, not advisory-only |
| 4 | Taste calibration reads `.planning/DESIGN.md` instead of discovering patterns | Leverages existing design context from `/fh:ui-branding` |
| 5 | Reduced from 10 review sections to 6 (Architecture, Error/Rescue, Security, Data Flow, Tests, Long-Term Trajectory) | Observability, Deployment, Performance, Code Quality covered by `/fh:review`, `/fh:build`, and other skills |
| 6 | Added "Challenge against must_haves" step (0B) | Plans from `/fh:plan-work` include must_haves — review should challenge their truths |
| 7 | Added workflow position note: run between `/fh:plan-work` and `/fh:build` | Integrates into existing plan-work flow |
| 8 | Added ERM extension note in Section 2 | If `/fh:plan-work` already produced a lightweight ERM, extend it rather than starting from scratch |
| 9 | Removed Rails-specific examples (ActiveRecord, Faraday, rescue StandardError) | Framework-agnostic — uses generic error type names |
| 10 | Removed Greptile references | Not used in fhhs-skills |
| 11 | Removed TODOS.md updates section from required outputs | Deferred work tracked via `/fh:add-todo` instead |
| 12 | Removed Observability/Deploy/Performance mode additions from mode quick reference | Sections removed — keeps reference table aligned with actual sections |
| 13 | `allowed-tools`: uses `mcp__conductor__AskUserQuestion` | fhhs convention for MCP tool references |
| 14 | Added lean orchestrator pattern (stay under 20% context) | Interactive skill needs headroom for back-and-forth |

### qa (from qa)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Replaced all `$B` browse commands with `agent-browser` CLI equivalents | agent-browser (Vercel) is the browser backend for fhhs — no compiled Bun binary needed |
| 2 | Command mapping: `$B snapshot -i` -> `agent-browser snapshot -i`, `$B goto` -> `agent-browser open`, `$B screenshot` -> `agent-browser screenshot`, `$B console` -> `agent-browser console`, `$B click` -> `agent-browser click`, `$B text` -> `agent-browser get text` | Direct CLI translation for agent-browser |
| 3 | Added agent-browser features: `set device` (responsive), `set media dark` (dark mode), `network requests --filter` (API verification), `record start/stop` (video evidence) | Capabilities agent-browser provides that gstack browse lacked |
| 4 | Added `--session qa-{branch}` for browser session isolation | Prevents session bleeding between QA runs on different branches |
| 5 | Added auth state save/load workflow (`state save`/`state load`) | Replaces gstack's cookie-import from real browsers — agent-browser manages sessions differently |
| 6 | Output path: `.gstack/qa-reports/` -> `.planning/qa-reports/` | GSD convention — all planning artifacts live in .planning/ |
| 7 | Report template: added `Browser backend` and `Session` metadata fields, added `diff-aware` mode option | Reflects agent-browser backend and session isolation |
| 8 | Added `allowed-tools` frontmatter: `Bash(agent-browser:*)`, Read, Write, Grep, Glob, AskUserQuestion | Plugin skill format — scoped Bash to agent-browser commands |
| 9 | Added dark mode testing step in per-page exploration checklist | agent-browser's `set media dark` enables this natively |
| 10 | Added network/API verification step in exploration checklist | agent-browser's `network requests --filter` enables API health checks |
| 11 | Added `.planning/DESIGN.md` reference for design evaluation | Integration with /fh:ui-branding design context |
| 12 | Removed gstack binary setup, update check preamble, Bun build instructions | Not applicable — agent-browser is installed via npm globally |
| 13 | Removed cookie-import from real browsers | agent-browser handles sessions via state save/load, not browser cookie import |
| 14 | Removed `$B links` command (no direct equivalent) | Use `snapshot -i` to discover navigation elements instead |
| 15 | Removed `$B viewport` command, replaced with `agent-browser set device` | Device presets are more ergonomic than raw viewport dimensions |
| 16 | Moved per-page exploration checklist to dedicated `references/exploration-checklist.md` | Expanded with dark mode, network, and auth boundary checks — too large for inline |
| 17 | Report template forked to `references/report-template.md` (was `templates/`) | Consistent with plugin shipping boundary — all runtime files in skills/{skill}/ |
| 18 | Issue taxonomy forked to `references/issue-taxonomy.md` | Verbatim fork, co-located in references/ for runtime access |

### Cross-cutting pattern integration
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added anti-drift rule to `/fh:fix` Step 1 (Triage) | Prevents strategy escalation mid-fix — once SIMPLE/MODERATE/PARALLEL/COMPLEX is chosen, commit fully. Adjacent issues go to `.planning/todos/` |
| 2 | Added QA delegation prompt to `/fh:verify-ui` Step 1 | On feature branches, suggests `/fh:qa` for diff-aware testing instead of manual visual verification |
| 3 | Added video recording for critical bugs in `/fh:verify-ui` Step 2 | Uses `agent-browser record start/stop` to capture reproducible evidence for critical visual bugs |

### review enhancements (from review/checklist.md)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Extracted checklist into `skills/review/references/production-safety-checklist.md` (was inline in gstack `review/checklist.md`) | Subagent in Step 2 reads it as a separate reference file — cleaner separation |
| 2 | Removed Rails-specific examples (`sanitize_sql_array`, `ActiveRecord`, `.includes()`, `rescue RecordNotUnique`, `.html_safe`, `raw()`, `SecureRandom`, `index_by`, `bin/test-lane`) | Framework-agnostic — uses generic equivalents (parameterized queries, ORM safe interpolation, `.trim()`, `URI.parse`) |
| 3 | Added explicit suppressions section with 9 rules (eval tuning, harmless no-ops, redundancy-for-readability, etc.) | Reduces false positives from overzealous review — gstack original had these but less comprehensively |
| 4 | Removed Greptile triage integration (`greptile-triage.md`) | Greptile not used in fhhs-skills |
| 5 | Removed `/ship` gate classification section | Review gating handled by `/fh:review` Step 8, not the checklist itself |
| 6 | Integrated checklist into `/fh:review` Step 2 Agent 1 dispatch (two-pass safety review) | Checklist is now a subagent reference, not a standalone review flow |
| 7 | Added "Note: The production safety checklist has an explicit suppressions section — the subagent must honor it" | Ensures subagent reads and respects suppressions |

### plan-work enhancements (from plan-eng-review)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Absorbed eng-review's diagram requirements into Step 3 as "mandatory ASCII diagram" per gray area | gstack required diagrams in a separate review skill; fhhs integrates them into the planning step itself |
| 2 | Added lightweight Error/Rescue Map (ERM) table in Step 3 per discussed gray area | Adapted from plan-eng-review's failure mode analysis — produces ERM during planning, not as a post-hoc review finding |
| 3 | Added Failure Modes Registry table in Step 3 (CODEPATH / FAILURE MODE / RESCUED? / TEST? / USER SEES? / LOGGED?) | Adapted from plan-eng-review Section 1 "realistic production failure scenario" — rows with all N's = critical gap |
| 4 | Added "Scope commitment rule" in Step 3: once gray areas are selected, commit fully — no lobbying for different areas | Adapted from plan-eng-review's "CRITICAL: If I do not select SCOPE REDUCTION, respect that decision fully" |
| 5 | Added must_haves.truths integration with Failure Modes Registry — rescued failure modes become truths | Links failure analysis to verification — each rescued failure mode must be testable |
| 6 | Removed plan-eng-review's 4-section interactive review flow (Architecture / Code Quality / Tests / Performance) | `/fh:plan-review` handles the interactive review; `/fh:plan-work` focuses on producing the plan |
| 7 | Removed TODOS.md updates section | Deferred work tracked via `/fh:add-todo` instead |
| 8 | Removed gstack update check preamble | No gstack binary dependency |
| 9 | Added priority hierarchy note: Step 3 (diagrams + failure modes) is second priority after Step 0 | Ensures diagrams/ERMs survive context pressure |

### release enhancements (from ship)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added Step 0 pre-ship validation gate (branch check, merge main, test suite, quick review) | Adapted from gstack /ship Steps 1-3.5 — validates before any version work |
| 2 | Added `/fh:review --quick` as pre-ship gate in Step 0d | gstack used inline checklist review; fhhs delegates to the existing review skill |
| 3 | Added bisectable commits option in Step 5 (infra → models → controllers → tests → VERSION) | Adapted from gstack /ship Step 6 commit ordering and splitting rules |
| 4 | Added auto-detect test runner table (npm/bun/cargo/pytest/make) | gstack hardcoded `bin/test-lane` + `npm run test`; fhhs is framework-agnostic |
| 5 | Removed gstack-specific steps: eval suites (Step 3.25), Greptile triage (Step 3.75), 4-digit VERSION format | Not applicable — fhhs uses semver, no Greptile, no eval infrastructure |
| 6 | Removed fully-automated non-interactive philosophy | `/release` is interactive (user confirms version bump, changelog, bisect choice) — safer for a plugin used across many projects |
| 7 | Added dual-file version bump requirement (plugin.json + marketplace.json) | fhhs-specific: both files must agree or `/fh:update` breaks |
| 8 | Added GitHub Release creation step with install/update instructions | gstack /ship created a PR; fhhs /release creates a tagged GitHub Release |
| 9 | Removed gstack update check preamble | No gstack binary dependency |

## gsd-tools.cjs (fhhs-original)

| # | Change | Rationale |
|---|--------|-----------|
| 1 | Lazy require() — lib modules loaded per-command, not eagerly at startup | Reduces per-invocation overhead; only fs, path, and core.cjs are eager. Saves ~10-20ms per call across 15-50 invocations per session |

## GSD (forked from v1.22.4)

### resume-work → progress (merge)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Merged `resume-work` skill into `progress` | Eliminated redundancy — both skills served overlapping purposes (context restore + status routing). `progress` now handles the combined workflow. |

### new-project (workflow)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Step 9 handoff: `/gsd:discuss-phase 1` → `/plan 1` | Composite `/plan` replaces raw GSD commands in user-facing output |
| 2 | Removed "Also available: /gsd:plan-phase" from interactive output | `/plan` handles both discussion and planning |

### Commands (workflows)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Removed `gsd:` prefix from all command names | Cleaner namespace under fhhs-skills |
| 2 | Commands that composites replace are not exposed | /fh:plan-work replaces plan-phase, /fh:build replaces execute-phase, etc. |

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
| 2 | `init` mode reads co-located `templates.md` (was `skills/claude-md-improver/references/templates.md`) | Shipping boundary fix — references/ at repo root aren't shipped with plugin install |
| 3 | Added GSD project context detection in session learnings mode | Ensures updates respect `.planning/` structure |

Upstream reference: `upstream/claude-md-management-1.0.0/`

## Build Pipeline Optimization (build-pipeline-optimization branch)

Cross-cutting changes from the build pipeline optimization effort, affecting
multiple skills and agents.

### build (`/fh:build`)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Pipeline reduced from 9 steps to 7 steps — removed separate spec gate step, separate design gates step, and self-check step | Spec gate moved to `/fh:review` Step 1.8; design gates integrated into phase completion (Step 6); self-check was redundant with verification |
| 2 | Added `model: "sonnet"` for subagent dispatch | Explicit model pinning for task subagents — consistent performance at lower cost |
| 3 | Single commit after all waves complete (no per-task commits) | Reduces commit noise; orchestrator makes one cohesive commit per plan |
| 4 | Added `{DECISIONS_CONTEXT}` placeholder for auto-mode decision injection | Auto-mode injects last 10 DECISIONS.md entries for the phase so subagents respect prior decisions |
| 5 | Added Step 0.5: Codebase Freshness Check (`.planning/codebase/.last-mapped`) | Advisory warning when codebase mapping is stale — suggests `/fh:map-codebase` |
| 6 | Plan limits read from `.planning/config.json` instead of hardcoded | Per-project tuning of task count, file count, word limit, and context target |
| 7 | `implementer-prompt.md` compacted (132→69 lines), removed SKILL_INDEX | Smaller prompt = more subagent context for actual work; skill discovery is self-serve |
| 8 | `checkpoint-protocol.md` deleted, `decisions-template.md` added | Checkpoint logic inlined into SKILL.md; decisions template needed for auto-mode logging |
| 9 | `spec-gate-prompt.md` added decision consistency check section | Auto-mode: structurally verifies decisions' Affects fields match modified files |
| 10 | DIFF_EXCLUDE pattern added to all git diffs | Excludes `.planning/`, lock files, `.next/`, source maps — reduces noise in diffs |

### review (`/fh:review`)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Security scan (4 parallel OWASP sub-scanners) removed from default pipeline | Moved to dedicated `/fh:secure` skill — keeps review focused on quality + gaps |
| 2 | TypeScript Strictness Check removed as separate step | TS strictness checks integrated into spec-gate-prompt and code-quality agent |
| 3 | Added Step 1.8: Spec Verification for GSD projects | Uses `code-reviewer` + `spec-gate-prompt.md` to catch spec deviations, stubs, unwired code |
| 4 | Full mode: 3 agents → 2 agents (Quality + Gap, no Security) | Security agent removed — `/fh:secure` handles it on demand or via pre-PR hook |
| 5 | DIFF_EXCLUDE pattern added to all git diffs | Excludes `.planning/`, lock files, `.next/`, source maps |
| 6 | `spec-gate-prompt.md` added to review references | Reused from build — same prompt drives review Step 1.8 spec verification |
| 7 | Added Step 1.7: Static Analysis (Fallow integration) | Deterministic findings from Fallow augment review agents when available |
| 8 | Added Context-Mode Acceleration for must_haves verification | Uses `ctx_search` for faster plan lookups when context-mode plugin is installed |

### simplify (`/fh:simplify` and `skills/simplify/PROMPT.md`)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Changed from 3 parallel agents to 1 sequential agent with 3 review lenses | Reduces context fragmentation — single agent sees full diff across all lenses |
| 2 | Added `disable-model-invocation: true` to `/fh:simplify` frontmatter | Prevents auto-detection from triggering standalone invocation |
| 3 | DIFF_EXCLUDE pattern added to git diff in PROMPT.md | Consistent with cross-cutting DIFF_EXCLUDE pattern |

### quick (`/fh:quick`) — DELETED
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Entire skill removed | Quick tasks now handled by simplified plan-work flow (Step 0.5 complexity assessment routes simple tasks through abbreviated path) |

### auto (`/fh:auto`) — NEW
| # | Change | Rationale |
|---|--------|-----------|
| 1 | New autonomous execution skill | Runs plan-work → plan-review → build → review for each phase without human intervention |
| 2 | Uses `claude -p` for process-isolated sessions | Fresh context per step — no context exhaustion across multi-phase runs |
| 3 | State persisted to `.planning/.auto-state.json` | Crash recovery via `--resume` flag |
| 4 | Decisions logged to `.planning/DECISIONS.md` with confidence levels | Append-only decision journal for traceability and human review |
| 5 | `--budget` flag for cost tracking | Passed to orchestrator as cost ceiling in dollars |
| 6 | `--check-corrections` mode for decision correction cascade | Processes `CORRECTED` entries in DECISIONS.md, auto-fixes mechanical corrections |
| 7 | Stuck detection (10min warning, 45min kill) | Prevents runaway sessions from consuming budget |

### plan-work (`/fh:plan-work`)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added Step 0.6: Codebase Freshness Check | Advisory warning when codebase mapping is stale |
| 2 | Added ctx_search acceleration (indexed codebase lookup) | Faster and more compact than reading full `.planning/` files when context-mode is installed |
| 3 | Added AUTO_MODE branch in Step 3 (auto-decides gray areas) | Autonomous execution path — auto-decides gray areas using heuristics from decisions-template.md |
| 4 | Plan limits from `.planning/config.json` instead of hardcoded defaults | Per-project tuning; defaults: 4-6 tasks, 8-15 files, 2500 words, 60% context |
| 5 | Added crash reconciliation in AUTO_MODE Step 3 | Detects prior plan-work decisions in DECISIONS.md when CONTEXT.md is incomplete, reuses them instead of re-deciding |

### plan-review (`/fh:plan-review`)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added DECISIONS.md Cross-Check step in PRE-REVIEW | Flags BLOCKING if DECISIONS.md entries conflict with CONTEXT.md locked decisions |
| 2 | Added decision logging to DECISIONS.md (auto-mode only) | Review decisions logged with `step='plan-review Step B'`, `confidence=HIGH` |
| 3 | Added Codebase Freshness Check | Advisory warning when codebase mapping is stale |
| 4 | Added Context-Mode Acceleration for CONTEXT.md/DECISIONS.md/RESEARCH.md reads | Uses `ctx_search` for faster lookups when context-mode plugin is installed |

### fix (`/fh:fix`)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added Step 0½: Fallow static analysis integration | Deterministic findings (unused exports, complexity metrics) augment triage |
| 2 | Added DECISIONS.md Correction logging in Step 4 | If root cause relates to an active decision, logs `[CORRECTED]` entry to DECISIONS.md |
| 3 | Added Codebase Freshness Check | Advisory warning when codebase mapping is stale |
| 4 | Added Context-Mode Acceleration in Step 3 | Uses `ctx_search` for faster DECISIONS.md and DESIGN.md lookups |

### setup (`/fh:setup`)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added Step 6b: context-mode plugin install | Auto-installs mksglu/context-mode companion plugin for session continuity and ctx_search |
| 2 | Added Step 8: Fallow static analysis install | Detects package manager, installs Fallow globally for deterministic code analysis |
| 3 | Added pre-PR security hook configuration section | Documents how to configure PreToolUse hook to run `/fh:secure` before `gh pr create` |
| 4 | Conductor setup: `cp` → `ln -sf` for `.env.local` and `.vercel/` | Symlinks keep all worktrees in sync bidirectionally for gitignored files |

### new-project (`/fh:new-project`)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added `--auto` flag for fully autonomous project creation | Derives all vision/stack answers from project description, logs decisions to DECISIONS.md |
| 2 | Added Step 2a: package manager detection from lockfile | Uses pnpm/yarn/bun/npm based on lockfile presence; defaults to pnpm for new projects |
| 3 | Added Step 3b: shadcn skills auto-install | Installs shadcn/ui skills globally when using default stack |
| 4 | Added Better Auth + Resend email integration options | Auth and email integration offered during stack confirmation |
| 5 | Added organization support (opt-in multi-tenant) | `wants_organizations` flag for teams/roles support when auth is selected |
| 6 | Conductor setup: `cp` → `ln -sf` for env files in conductor.json templates | Symlinks for gitignored files across all framework templates (Next.js, Rails, Django, Phoenix, Vite) |

### verification-before-completion (internal skill)
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Condensed from 105→35 lines | Removed verbose examples; kept the gate function and common failures table |

### code-reviewer (agent)
| # | Change | Rationale |
|---|--------|-----------|
| 4 | Added DIFF_EXCLUDE pattern to git diff commands | Excludes `.planning/`, lock files, `.next/`, source maps from review diffs |

### gsd-planner (agent)
| # | Change | Rationale |
|---|--------|-----------|
| 2 | Plan limits read from `.planning/config.json` instead of hardcoded | Per-project tuning consistent with plan-work changes |

### Cross-cutting: `disable-model-invocation: true`
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added `disable-model-invocation: true` to 21 skills (16 Impeccable design skills + 5 utility skills) | Prevents Claude from auto-detecting and invoking these skills based on conversation content; they should only run when explicitly invoked or dispatched by a composite |

Affected skills (16 Impeccable): adapt, audit, bolder, clarify, colorize, delight, distill, extract, harden, normalize, onboard, optimize, polish, quieter, simplify, secure.
Affected skills (5 utility): setup, help, settings, tracker, update.

### Cross-cutting: DIFF_EXCLUDE pattern
| # | Change | Rationale |
|---|--------|-----------|
| 1 | Added `DIFF_EXCLUDE="-- ':!.planning/' ':!*.lock' ':!pnpm-lock.yaml' ':!package-lock.json' ':!yarn.lock' ':!.next/' ':!*.map'"` across all git diff commands | Planning files, lockfiles, build output, and source maps waste tokens in diffs — excluded globally |

Affected skills: build, review, simplify, fix. Affected agents: code-reviewer. Affected references: spec-gate-prompt.md, implementer-prompt.md (via PROMPT.md).
