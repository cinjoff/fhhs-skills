# Phase 13: Skill System Consolidation — CONTEXT

## Decisions

- [Merge branding + redesign]: Merge `ui-branding` and `ui-redesign` into a single `ui-branding` skill. Branding establishes DESIGN.md, redesign updates it — same skill, different entry points (first-run vs update). Reduces skill count and eliminates user confusion.
- [Remove todos]: Delete `todos` skill entirely. GSD state management + native Claude tasks cover this use case. No replacement needed.
- [Remove revise-claude-md]: Delete `revise-claude-md` as a standalone skill. Its CLAUDE.md update responsibility moves into `learnings` as an optional step — learnings already analyzes session patterns via claude-mem, making it the natural home. Per claude-mem-rules.md, CLAUDE.md should stay lean (conventions, gotchas only) — learnings will surface patterns from claude-mem and only persist the highest-signal items to CLAUDE.md.
- [Review becomes quality gatekeeper]: Review absorbs the quality sub-skills currently in build's Gate 2 (ui-critique, harden, adapt, normalize, simplify, polish). Review decides which to invoke based on its analysis findings. This makes build lighter (just execute + verify) and review smarter (quality + refinement in one pass).
- [Build trusts conventions]: Build no longer runs design gates. It trusts that plan-work established patterns and review will catch deviations. Build focuses on: execute tasks → verify tests/build/lint → commit → SUMMARY.
- [Move ui-test, ui-critique, vercel-react to review]: These are review-time concerns, not build-time. Review invokes them conditionally based on diff analysis (frontend ratio, performance patterns). Build only suggests `/fh:review` after completion.
- [Setup does not call simplify or secure]: Remove simplify and secure invocations from setup. Setup is onboarding — quality gates belong in the review/build pipeline, not first-run experience.
- [Consolidate Fallow to review + map-codebase]: Fallow only runs in `review` (ground truth for quality agents) and `map-codebase` (deterministic metrics). Remove from setup (just install), fix, refactor, plan-review. These skills work fine without Fallow's static analysis — review is where it adds highest value.
- [claude-mem as primary context system]: All skills follow claude-mem-rules.md patterns (progressive disclosure, on-demand queries, graceful degradation). Review uses claude-mem for recurring pattern detection and smart_explore for token-efficient code understanding.
- [Review quality dispatch is automatic]: Review evaluates findings and automatically dispatches relevant sub-skills (simplify, harden, adapt, normalize, ui-critique, polish) based on severity. No user confirmation needed — review is the gatekeeper. User can override via `--quick` to skip refinement.
- [Auto pipeline: quick per-build, full at end]: In auto mode, per-phase reviews use `--quick` (focused: quality + gaps + spec verification). A single full review with Quality Refinement runs after all phases complete — this is where sub-skill dispatch happens. This avoids running expensive quality refinement on every individual build while still catching everything before completion.
- [review] [Quality Refinement uses single subagent dispatch]: Review dispatches quality refinement via one subagent (not sequential inline calls) to stay under 15% context budget. Subagent receives findings + trigger table + claude-mem access.
- [review] [Fallow exception for build Gate 0]: Fallow consolidation is "review + map-codebase + build's Gate 0 (integration check)". Gate 0 uses fallow dead-code and health for structural blast radius analysis — this is integration checking, not quality review.
- [review] [Todos removal deferred]: Todos skill has infrastructure dependencies in 5 bin/ files, 2 agent files, and GSD templates. Removal requires separate plan to update GSD CLI.
- [Remove native task tracking]: Native TaskCreate/TaskUpdate/TaskGet/TaskList are pure noise — ~5K token overhead per plan+build cycle for status display only. claude-mem timeline already provides cross-session progress visibility via /fh:progress. Task* tools remain in SKIP_TOOLS defensively (other plugins may use them). CLAUDE_CODE_ENABLE_TASKS removed from setup/new-project/update configurations.

## Discretion Areas

- [Sub-skill dispatch thresholds]: Review decides when to invoke each sub-skill based on finding severity and category. Implementer decides exact thresholds (e.g., "invoke simplify if DRY violations >= 2", "invoke harden if unhandled error paths detected"). Must be deterministic and documented in review's SKILL.md.
- [Fallow reference cleanup scope]: When removing Fallow from fix/refactor/plan-review, implementer decides whether to remove the reference entirely or replace with a note "Fallow findings available via `/fh:review`". Context-dependent.
- [Learnings CLAUDE.md update format]: How learnings presents and writes CLAUDE.md updates — implementer decides the exact format, but must follow the lean principle from claude-mem-rules.md (conventions + gotchas only, no session-specific detail).

## Deferred Ideas

- [Optimize skill]: Currently non-invocable, referenced by few skills. Consider merging into review's performance check. Not in scope for this phase.
- [Polish skill]: May be redundant with ui-critique + normalize. Evaluate after review absorbs design gates.
- [Help skill ghost references]: /fh:plan, /fh:resume, /fh:verify aliases reference non-existent skills. Documentation cleanup deferred.
- [Startup skill name prefix fix]: 5 startup skills missing `fh:` prefix in name field. Separate fix.
- [Todos removal]: Deferred from Plan 01 — infrastructure dependencies in gsd-tools.cjs, lib/commands.cjs, lib/init.cjs, agent files, and GSD templates need separate plan.
- [Expansion opportunity]: Consolidate all non-invocable quality sub-skills (simplify, harden, adapt, normalize, polish, secure, optimize) into a single "quality-refine" meta-skill that review dispatches as one unit with findings-driven config.
