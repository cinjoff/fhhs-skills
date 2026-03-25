---
type: roadmap
project: fhhs-skills
version: v1
created: "2026-03-25"
phases: 6
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
