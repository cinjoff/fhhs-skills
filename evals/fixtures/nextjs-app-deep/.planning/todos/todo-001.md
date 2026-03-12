---
id: todo-001
status: pending
priority: high
tags: [security]
created: 2026-03-10
---

# Add rate limiting to auth endpoints

The login and refresh endpoints have no rate limiting. A brute-force attack could enumerate valid credentials. Add rate limiting middleware using an in-memory store or Supabase edge function rate limiting.

## Affected Files
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/refresh/route.ts`
