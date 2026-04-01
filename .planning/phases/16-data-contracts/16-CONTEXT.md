## Decisions

- [Schema format]: Use markdown-embedded JSON Schema in `references/schemas/*.md` — readable by both humans and LLMs, no tooling dependency. Each schema file documents the contract with field names, types, required/optional, who writes, who reads.
- [Single writer for auto-state]: Eliminate `saveAutoState()` — fold resume fields into `buildAutoStatus()` so `.auto-state.json` has one writer. The two-writer race condition is the root cause of tracker bugs.
- [Central path constants]: Create `bin/lib/paths.cjs` exporting all `.planning/` path patterns as functions. High-impact consumers (init.cjs, verify.cjs, auto-orchestrator.cjs) import from it. Low-impact files updated incrementally.
- [Directory structure reference]: `references/schemas/planning-structure.md` is THE canonical directory tree. Every file name pattern, what creates it, what reads it — one grep-able source of truth.
- [Validation approach]: Lightweight `validateSchema(obj, schemaName)` function in `bin/lib/schemas.cjs` that warns on violations but never blocks execution. Fail-open, not fail-closed.
- [Registry name normalization]: Always derive `name` from `conductorWorkspace` when conductor path pattern matches. Fix in both `autoRegisterProject` and `/api/register` endpoint.

## Discretion Areas

- [Schema granularity]: Executor decides whether to split `planning-files.schema.md` into separate files per artifact type or keep as one combined reference.
- [Path migration scope]: For Plan 03, executor decides which of the 50+ inline-path files to update (must include the top 4 offenders; rest is discretionary).
- [Eval count]: Executor decides how many evals to add for schema compliance (minimum 3).

- [review] [Validation return shape]: Return `{ warnings: string[] }` not `{ valid: boolean, warnings: string[] }` — fail-open design means valid is always true, making the boolean misleading. Callers check `warnings.length === 0` instead.
- [review] [No speculative validators in Plan 04]: validateRegistryEntry and validatePlanFrontmatter removed from Plan 04 scope — no callers, no wiring, no evals. Add when a consumer exists.
- [review] [Plan 04 evals are phase integration tests]: The 3 schema compliance evals verify outputs from Plans 01-03 in addition to Plan 04's own work. This is correct — Plan 04 is the final wave and acts as the phase-level quality gate.

## Deferred Ideas

- [JSON Schema tooling]: Actual JSON Schema validation with `ajv` or similar — overkill for markdown skills. Revisit if CJS tooling grows.
- [Auto-migration]: Automatically migrating old .auto-state.json files to new schema — not needed, state files are ephemeral.
- [GraphQL-style contract testing]: Contract tests between producer/consumer pairs — too heavy for current scale.
- [validateRegistryEntry / validatePlanFrontmatter]: Deferred from Plan 04 — no callers exist yet. Add when a consumer needs them.
- [Expansion opportunity]: A full contract-testing framework with producer/consumer pair validation, auto-generated TypeScript types from schema definitions, and CI-enforced schema compliance checks.
