# Phase 2: Core API — Context

## Decisions

**D-02-01 (Locked):** Task status enum is: `pending`, `in_progress`, `done` — not open string.
This prevents invalid status values and simplifies filtering logic.

## Discretion Areas
- Pagination for GET /tasks: implement limit/offset if list grows beyond 100 items
- Error message verbosity: keep terse for now, expand in Phase 3

## Deferred Ideas
- Bulk task operations (create/delete multiple) — deferred post-auth
- WebSocket push for task updates — out of scope for v0.1
