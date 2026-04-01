## Decisions

- No skill code changes: SKILL.md already implements all Phase 9 roadmap requirements (cross-project analysis, positive insights, clustering, dedup, auto-filing, dry-run, configurable windows, dashboard suggestion)
- 4 new evals (IDs 300-303): empty observations, gh auth failure, explicit --days flag, misroute guard — bringing total to 8
- Issue template stays at `.claude/skills/learnings/references/issue-template.md` — already within shipping boundary

- [review] Evals 312-315 append at end of evals.json (after ID 311), not mid-file after ID 146 — preserves sequential ID ordering which is structural. IDs 300-303 already occupied by progress/setup/map-codebase evals.

## Discretion Areas

- Eval assertion wording: executor may adjust assertion text for clarity as long as behavioral intent is preserved
- Eval tags: executor chooses appropriate tags from existing set (guard, edge-case, happy-path)

- [review] Project insights classify from existing working set using keyword matching — no additional claude-mem API calls (token efficiency)
- [review] Non-fhhs projects get plan-work offer (if GSD exists) or structured brief (if no GSD) — never GitHub issues
- [review] Eval negative checks use assertions with guard type, not negative_checks field (which doesn't exist in eval schema)

- [review] Plan 09-02 is a no-op: all 4 tasks (IS_FHHS_SKILLS detection, Project Insights section, build/auto nudges, project insights evals) already exist in the codebase. Execution should be verification-only — confirm existing artifacts satisfy must_haves truths, then write SUMMARY.md.
- [review] Eval coverage for learnings is comprehensive: 10+ evals covering prerequisites, happy path, dry-run, custom windows, edge cases, misrouting, project insights (non-fhhs), fhhs issue filing, workflow coaching, and CLAUDE.md maintenance.

## Deferred Ideas

- Automated scheduling of /fh:learnings via cron/hooks — separate feature, not in scope
- Cross-repo learnings aggregation — would need multi-repo claude-mem support
- Learnings-driven auto-fix pipeline (learnings → plan-work → **build**) — plan-work bridge now built, auto-build still deferred
- [Expansion opportunity] Automated weekly cron scheduling of /fh:learnings + cross-repo aggregation dashboard — would make learnings proactive rather than on-demand
