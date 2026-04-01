# Phase 14: Upstream Sync Cycle — Context

## Decisions

- [Patch drift strategy]: Re-implement missing features to make code match PATCHES.md, not the other way around. Patches are the spec; code that drifted is the bug. (alternatives: remove inaccurate patches from PATCHES.md, accept code as truth)
- [Comparative eval framework]: Side-by-side harness — same prompt runs against fhhs skill AND equivalent raw upstream skill, comparing token usage, wall time, and LLM-graded quality. Most rigorous option. (alternatives: benchmark suite with curated tasks only, differential eval against existing evals)
- [gstack QA absorption]: Full absorption into ui-test — fix loop, tier system, health scoring, WTF-likelihood self-regulation, test bootstrap, session artifacts. Adapt infrastructure to use .planning/ paths instead of .gstack/. No hard dependency on gstack binaries — reimplement needed utilities inline or in ui-test/bin/. (alternatives: minimal fix loop only, medium without bootstrap)
- [GSD new agents]: Defer 5 new agents (ui-auditor, ui-checker, ui-researcher, assumptions-analyzer, advisor-researcher) to follow-up phase. Focus on updating existing 11 forked agents. (alternatives: fork all new agents now)
- [Superpowers visual companion]: Skip. Conflicts with existing agent-browser integration in ui-test. Can revisit if brainstorming needs browser-based mockups. (alternatives: absorb visual companion)
- [GSD new workflows]: Skip 28 new workflows (do, ship, debug, session-report, etc.). Most overlap with existing composites (/fh:auto, /fh:fix, /fh:release). (alternatives: fork selected workflows)
- [gstack infrastructure]: Adapt gstack paths to fhhs conventions — .gstack/ → .planning/qa-reports/, gstack binaries → inline shell in ui-test. No external dependency on gstack plugin. (alternatives: depend on gstack being installed)
- [Sync scope]: GSD and Superpowers are priority. gstack cherry-pick for QA only. Impeccable, vercel-react, playwright deferred to separate phase.
- [Eval baseline]: Capture full eval suite baseline BEFORE any code changes. All subsequent plans measure regression against this baseline.
- [review] [Snapshot rollback safety]: Old snapshots (superpowers-4.3.1, gsd-1.22.4) kept until Plan 04 full eval passes. Deletion deferred from Plans 02-03 to Plan 04 final task.
- [review] [Patch fidelity spot-checks]: After each sync plan's merges, read 2-3 high-impact files and verify patch MEANING is preserved (not just grep markers). Catches semantic drift that evals miss.
- [review] [Comparative harness mechanism]: Prompt-injection via `claude -p` — inject SKILL.md as system prompt. Known limitation: no MCP tools in headless mode, measures raw prompt quality only.
- [review] [Patch conflict resolution]: Apply in PATCHES.md order (top to bottom). Later patch takes priority on overlap. Unresolvable conflicts STOP execution.
- [review] [ui-test eval coverage]: 4 new evals required alongside QA v2.0 features (fix-loop, tier-quick, wtf-likelihood, health-scoring). Matches eval-alongside-feature rule. MOVED to Phase 15.
- [review-r2] [Phase split]: Plans 05-06 (gstack QA + comparative eval) moved to Phase 15 to isolate sync risk from feature work. Phase 14 = pure sync (4 plans), Phase 15 = QA absorption + eval framework (2 plans).
- [review-r2] [Reimplementation timing]: Fallow Step 0½ and config.json plan limits implemented during Plan 04 GSD skill sync (not pre-implemented in Plan 01) to avoid double-touching files.
- [review-r2] [PATCHES.md consolidation]: Documentation updates consolidated to Plan 04 Task 4 instead of spread across Plans 01-04.
- [review] [Plan 04 file path fix]: `commands/new-project.md` corrected to `.claude/skills/new-project/SKILL.md` — the former doesn't exist
- [review] [Upstream path flexibility]: `upstream/gsd-1.30.0/workflows/` references changed to `upstream/gsd-1.30.0/` with instructions to check skills/ or workflows/ — GSD layout may differ between versions
- [review] [Semantic patch verification]: Grep markers alone are insufficient — spot-checks must verify patch meaning and structural placement, not just keyword presence

## Discretion Areas

- Patch reapplication order within each plan — executor decides based on file dependencies and complexity
- Exact line-level placement of reapplied patches — match meaning and intent, not line numbers (upstream restructured)
- gstack utility reimplementation — inline shell scripts in ui-test/bin/ or embed directly in SKILL.md, executor's choice based on complexity
- Comparative eval task selection — 5-10 representative tasks covering build, plan-work, fix, review; executor picks tasks that maximize coverage of upstream differences

## Deferred Ideas

- Impeccable 1.6.0 sync — 3 new skills (arrange, typeset, overdrive), clean additive, low risk
- Vercel-react and playwright snapshot updates — structural reorganization only, no new capabilities
- GSD new agent adoption — 5 agents for UI auditing and assumption analysis
- Superpowers visual companion — browser-based mockups during brainstorming
- GSD user profiling system — dev-preferences.md, profile-user workflow
- GSD team/workstream coordination — multi-person workflows, irrelevant for single-developer plugin
- [review] [Expansion opportunity]: Automated continuous sync CI that detects upstream releases, diffs patches, and creates draft PRs with pre-applied patches and eval results — deferred, would be the 12-month ideal
- [review] Full-environment comparative eval (with MCP tools, hooks, skill dispatch) — deferred, requires heavier infrastructure (docker or separate plugin installs)
- [review] [Expansion opportunity]: Automated 3-way merge tooling that diffs patches against upstream deltas and produces pre-merged candidates with conflict markers — deferred, would accelerate future syncs
