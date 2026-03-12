---
id: todo-002
status: pending
priority: medium
tags: [refactor]
created: 2026-03-11
---

# Extract shared fetch wrapper from API routes

The client-side API functions in `src/lib/api.ts` duplicate the same fetch + error handling pattern. Extract a shared `apiFetch()` wrapper that handles:
- Setting Content-Type headers
- Parsing JSON responses
- Throwing typed errors

## Affected Files
- `src/lib/api.ts`
