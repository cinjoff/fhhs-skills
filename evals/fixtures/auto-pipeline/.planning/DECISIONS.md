# Decisions

## D-AUTO-001
**Step:** auto Step 3 (build)
**Phase:** Phase 1 (Setup)
**Decision:** Use SQLite over PostgreSQL for local development simplicity
**Alternatives:** PostgreSQL (heavier), MongoDB (schemaless)
**Rationale:** Reduces setup overhead for contributors; can migrate to Postgres for production
**Confidence:** HIGH
**Date:** 2026-03-24

## D-AUTO-002
**Step:** auto Step 3 (build)
**Phase:** Phase 1 (Setup)
**Decision:** Use Jest over Vitest for test runner
**Alternatives:** Vitest (faster HMR), Mocha (legacy)
**Rationale:** Jest is widely known; project is Node-only so no Vite dependency needed
**Confidence:** HIGH
**Date:** 2026-03-24

## D-AUTO-003
**Step:** auto Step 2 (plan-review)
**Phase:** Phase 2 (Core API)
**Decision:** Return 404 for missing task IDs rather than 400
**Alternatives:** 400 Bad Request (client error framing), 204 No Content
**Rationale:** Missing resource is a Not Found, not a Bad Request; REST convention
**Confidence:** MEDIUM
**Date:** 2026-03-25
