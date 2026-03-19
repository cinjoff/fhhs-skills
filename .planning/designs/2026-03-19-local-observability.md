# Local Observability Design

## Decisions Locked
1. Full Sentry SDK (`@sentry/browser` + `@sentry/node`) with `better-sqlite3` + SQLite storage
2. `SENTRY_LOCAL=true` env var controls all local observability (route, transport, init)
3. Next.js only for now — matches `/fh:new-project` defaults
4. Query helper script (`lib/sentry-local-query.mjs`) — skills invoke via Bash, avoids sqlite3 CLI dep
5. `.sentry-local/` at worktree root — dies with worktree, 7-day auto-prune
6. Browser errors flow via Sentry `tunnel` option → Next.js API route → SQLite
7. Server errors flow via `makeOfflineTransport` + custom `OfflineStore` → SQLite directly

## Architecture
```
Browser (@sentry/browser)         Server (@sentry/node)
  │ tunnel: '/api/sentry-local'     │ custom transport
  ▼                                 ▼
  Next.js API route ──────────► SQLite (.sentry-local/events.db)
  (parses envelope,               (direct write via
   stores in SQLite)               better-sqlite3)
```

## Integration Points
- `/fh:fix` Step 0: query recent errors before triage
- `/fh:build` after-wave: check for new errors during execution
- `/fh:new-project`: scaffold all observability files automatically
- `/fh:qa`: cross-reference error store in reports

## Files Scaffolded into User Projects
- `lib/sentry-local.ts` — transport + SQLite store + init helpers
- `lib/sentry-local-query.mjs` — CLI query tool (recent, search, stats)
- `app/api/sentry-local/route.ts` — browser envelope receiver
- `instrumentation.ts` — server-side Sentry.init
- Client-side Sentry.init in layout/provider
- `.sentry-local/.gitignore` — contains `*`

## Error Handling
- All observability code is wrapped in try/catch — never crashes the app
- `SENTRY_LOCAL` not set → everything noops
- `better-sqlite3` import fails → console.warn once, disable
- SQLite write fails → drop event, warn
- Swap to cloud Sentry = remove `SENTRY_LOCAL=true`, set real DSN
