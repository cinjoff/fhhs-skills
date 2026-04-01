# Phase 15: QA Absorption + Comparative Eval — Context

Split from Phase 14 during review-r2 to isolate sync risk from feature work.

## Decisions

Inherited from Phase 14 CONTEXT.md:
- [gstack QA absorption]: Full absorption into ui-test — fix loop, tier system, health scoring, WTF-likelihood self-regulation, test bootstrap, session artifacts. Adapt infrastructure to use .planning/ paths instead of .gstack/. No hard dependency on gstack binaries.
- [Comparative eval framework]: Side-by-side harness via prompt-injection (`claude -p`). Known limitation: no MCP tools in headless mode.
- [review] [ui-test eval coverage]: 4 new evals required alongside QA v2.0 features.
- [review] [Comparative harness mechanism]: Prompt-injection via `claude -p`. Measures raw prompt quality only.

## Discretion Areas

- gstack utility reimplementation — inline shell scripts in ui-test/bin/ or embed directly in SKILL.md
- Comparative eval task selection — 5-10 representative tasks covering build, plan-work, fix, review

## Deferred Ideas

- Full-environment comparative eval (with MCP tools, hooks, skill dispatch) — requires heavier infrastructure
