# Phase 1: Setup — Context

## Decisions

**D-01-01:** Use npm workspaces over yarn/pnpm — keeping tooling familiar for Node-focused contributors.
**D-01-02:** Store SQLite DB file at `.data/taskflow.db` (gitignored) — avoids polluting project root.

## Discretion Areas
- CI matrix: test on Node 20 only (can add 18/22 later)
- Makefile targets can be expanded without re-planning

## Deferred Ideas
- Docker compose setup — deferred to Phase 3 when auth adds complexity
