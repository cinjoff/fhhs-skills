---
id: todo-003
status: in-progress
priority: high
tags: [bug]
created: 2026-03-11
---

# Fix data-table regression test

`src/__tests__/data-table.test.tsx` fails because it passes a `columns` prop but the DataTable component was refactored to use `fields`. The test needs to be updated to match the current component interface.

## Affected Files
- `src/__tests__/data-table.test.tsx`
- `src/components/data-table.tsx`
