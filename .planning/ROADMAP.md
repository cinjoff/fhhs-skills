---
type: roadmap
project: fhhs-skills
version: v1
created: "2026-03-25"
phases: 8
---

# Roadmap

## Phase 1: Skill Quality & Eval Coverage
**Goal:** Every shipped skill works correctly and has eval coverage proving it.
**Status:** Mostly complete (130+ evals, all skills covered)

- All composite skills orchestrate correctly (build, plan-work, fix, refactor, review, simplify)
- All design skills produce quality output (23 design commands)
- Eval suite covers happy paths, edge cases, misrouting, failure recovery, state corruption
- Fixture-backed evals validate against real project structures

## Phase 2: Upstream Sync & Patch Stability
**Goal:** Upstream updates can be incorporated without breaking patched skills.
**Status:** Complete

- Upstream sync workflow documented and repeatable
- PATCHES.md and COMPATIBILITY.md stay accurate after syncs
- Eval suite catches regressions introduced by upstream changes
- `/fh:sync-upstream` skill guides the process
- Pre-sync validation (Step 0.5) checks forked paths, snapshots, PATCHES.md
- Git checkpoint (Step 3.5) with --include-untracked before modifications
- Post-sync regression detection (Step 4.5) with targeted eval runs
- Registry has explicit eval_commands per upstream
- Eval runner supports --commands filter for targeted runs
- 6 sync-upstream evals covering validation and regression flows

## Phase 3: Upstream Capability Audit & Integration Planning
**Goal:** All upstream capabilities are cataloged, quality-assessed, and gaps identified with integration recommendations.
**Status:** Complete

- UPSTREAM-INDEX.md documents all 8 upstream sources with skill-level detail
- Every upstream skill has quality rating (A-D) and integration status
- Gap Registry identifies unused high-value capabilities with recommended approaches (G1-G11)
- /fh:audit-upstream skill maintains the index after upstream syncs
- SDLC coverage matrix shows where gaps exist across the development lifecycle
- 8 per-source upstream catalog files in `.planning/upstream/`
- 13 audit-upstream evals (IDs 181-193)

## Phase 3.5: Pipeline Depth & Intelligence
**Goal:** Plan-work and new-project pipelines intelligently assess task complexity and suggest appropriate depth — deeper research, decision-locking, and engineering review when warranted.
**Status:** Planning

- `/fh:plan-work` evaluates complexity and suggests deep research for unfamiliar domains
- Decision-locking (CONTEXT.md locked/discretion/deferred) prevents cross-session drift
- Engineering review mode complements existing CEO-style plan-review
- `/fh:build` wires verification-before-completion into final steps
- Upstream gap registry items G1-G5 addressed

## Phase 4: User Experience & Onboarding
**Goal:** Non-technical users can install and use the plugin without assistance.

- `/fh:setup` handles all platform-specific tooling installation
- Documentation is clear, non-verbose, and action-oriented
- Error messages always suggest next steps
- `/fh:progress` and `/fh:tracker` provide clear status at any point

## Phase 5: Advanced Integrations
**Goal:** Skills leverage external tooling for deterministic analysis where available.

- Fallow CLI integration for static analysis (unused exports, circular deps, complexity)
- TypeScript LSP integration for type-aware code analysis
- Graceful degradation when external tools aren't available

## Phase 6: Ecosystem & Distribution
**Goal:** Plugin is discoverable, installable, and maintainable at scale.

- Marketplace listing is accurate and compelling
- Release process is automated (version bump, changelog, tag, GitHub release)
- Plugin update mechanism works reliably (`/fh:update`)
- Community feedback loop established

## Phase 7: Autonomous Execution & Harness Engineering
**Goal:** Users can invoke `/fh:auto` with a project description and walk away — the system produces a working codebase with multi-milestone roadmap, executed phases, and a DECISIONS.md audit trail, without human intervention.

- DECISIONS.md as append-only autonomous decision journal with confidence flagging and correction cascade
- `/fh:new-project --auto` with deep research, scope-expansion roadmap, elaborate multi-milestone output
- Autonomous loop: plan-work → plan-review (HOLD SCOPE) → build → review per phase
- Headless orchestrator using `claude -p` for process-isolated agent sessions with crash recovery
- Stuck detection, timeout supervision, and cost tracking
- Decision correction cascade: human corrects a decision, system identifies downstream impact

## Phase 9: Learning Persistence & Feedback Loop
**Goal:** Workflow issues and skill improvement opportunities are automatically extracted from claude-mem observations and filed as GitHub issues.

- `/fh:learnings` analyzes cross-project observations from claude-mem
- Surfaces positive insights and productive patterns alongside problems
- Clusters similar issues and deduplicates against existing GitHub issues
- Auto-files structured issues with problem/evidence/suggestion format
- Supports --dry-run and configurable time windows
- Suggests claude-mem dashboard for deeper exploration
