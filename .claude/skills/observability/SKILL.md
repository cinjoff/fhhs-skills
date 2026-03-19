---
name: observability
description: Query the local Sentry error store (.sentry-local/events.db) for runtime errors, stack traces, and breadcrumbs. Use when debugging, investigating errors, or checking runtime health.
user-invokable: true
---

Query the local Sentry error store for runtime context.

$ARGUMENTS

---

## Section 1: Query Local Error Store

### Prerequisites

Check if the local error store exists:

```bash
[ -f ".sentry-local/events.db" ] && echo "STORE_EXISTS" || echo "NO_STORE"
```

- If `NO_STORE`: report "No local error store found. The project may not have observability set up — run `/fh:new-project` to scaffold it, or set `SENTRY_LOCAL=true` and restart the dev server."
- If `STORE_EXISTS`: proceed with queries below.

### Query commands

Run queries via `node lib/sentry-local-query.mjs {command}`:

**Recent errors:**
```bash
node lib/sentry-local-query.mjs recent
```
Returns last 20 errors with timestamp, level, message, and exception summary.

**Recent errors within time window:**
```bash
node lib/sentry-local-query.mjs recent --minutes N
```
Returns errors from the last N minutes. Useful for checking errors during a specific operation.

**Full-text search:**
```bash
node lib/sentry-local-query.mjs search "keyword"
```
Searches across messages, exception text, and breadcrumbs. Use for finding errors related to a specific feature, endpoint, or error message.

**Error statistics:**
```bash
node lib/sentry-local-query.mjs stats
```
Returns error count by level, most common errors (grouped by message), and error rate trend over the last hour.

**Full error detail:**
```bash
node lib/sentry-local-query.mjs detail {event_id}
```
Returns the complete error event including breadcrumbs, request context, tags, and full stack trace. Use after finding an interesting error via `recent` or `search`.

### Notes

- Output is structured text optimized for agent consumption (not JSON).
- If `lib/sentry-local-query.mjs` doesn't exist but `.sentry-local/events.db` does, the project wasn't fully set up with `/fh:new-project`. Suggest running it to scaffold the query tool.
- The error store auto-prunes events older than 7 days.

---

## Section 2: Scaffolded Files Reference

These files are scaffolded by `/fh:new-project` (Step 5b). This section documents them for agents that need to understand or modify the observability setup.

### `lib/sentry-local.ts` (~150 lines)

SQLite-backed Sentry transport and initialization helpers.

**`createLocalSentryStore()`** — returns an `OfflineStore` backed by SQLite:
- Uses `better-sqlite3` with WAL mode + 5s `busy_timeout`
- Auto-creates `.sentry-local/events.db` and tables on first call
- `push(envelope)` — serialize envelope, parse out event fields (event_id, timestamp, level, message, exception, breadcrumbs, tags, request, contexts), INSERT into events table + store raw envelope
- `unshift(envelope)` — same as push (order doesn't matter for local store)
- `shift()` — return oldest envelope (for replay to real Sentry later)
- Auto-prune: DELETE events older than 7 days on every 100th write

**`initSentryServer()`** — wraps `Sentry.init()` for server:
- If `SENTRY_LOCAL=true`: use `makeOfflineTransport(makeNodeTransport)` with `createStore: createLocalSentryStore`, `shouldStore: () => true`
- If `SENTRY_DSN` is set (no `SENTRY_LOCAL`): standard Sentry.init with real DSN
- If neither: noop (don't init Sentry)
- DSN: use `SENTRY_DSN` env var, or a dummy `https://local@localhost/1` for local mode

**`initSentryClient()`** — wraps `Sentry.init()` for browser:
- If `NEXT_PUBLIC_SENTRY_LOCAL=true`: init with `tunnel: '/api/sentry-local'`
- If `NEXT_PUBLIC_SENTRY_DSN` is set: standard init with real DSN
- If neither: noop

**SQLite schema:**
```sql
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT UNIQUE,
  timestamp TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'error',
  type TEXT,
  message TEXT,
  transaction_name TEXT,
  release TEXT,
  environment TEXT,
  tags TEXT,
  breadcrumbs TEXT,
  exception TEXT,
  request TEXT,
  contexts TEXT,
  user_data TEXT,
  envelope BLOB,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_level ON events(level);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
```

### `lib/sentry-local-query.mjs` (~100 lines)

CLI query tool for agents to inspect the error store.

- Subcommands: `recent`, `search`, `stats`, `detail`
- Reads from `.sentry-local/events.db` via `better-sqlite3`
- Output: structured text optimized for LLM consumption (not JSON)
- Graceful error on missing db: "No .sentry-local/events.db found. Run your app with SENTRY_LOCAL=true to start capturing errors."

### `app/api/sentry-local/route.ts` (~40 lines)

Browser envelope receiver (tunnel endpoint).

- POST handler that receives Sentry envelope from browser tunnel
- Guards with `SENTRY_LOCAL !== 'true'` → return 404
- Imports `parseEnvelope` from `@sentry/core` + store from `lib/sentry-local`
- Parses envelope body, extracts events, stores in SQLite
- Returns 200 (Sentry SDK expects this)
- try/catch everything — never crashes the API route

### `instrumentation.ts` (~10 lines)

Next.js instrumentation hook.

- Calls `initSentryServer()` from `lib/sentry-local`
- Runs at server startup via Next.js `register()` function

### Client-side init

Added to `app/layout.tsx` or a provider component.

- Calls `initSentryClient()` from `lib/sentry-local`
- Wrapped in `useEffect` or top-level module init

### `.sentry-local/.gitignore`

Contains single line: `*` — excludes the SQLite database from git.

### Dependencies

Added to `package.json`:
- `@sentry/browser` `@sentry/node` `@sentry/core` `better-sqlite3`
- devDependency: `@types/better-sqlite3`

### Environment variables

| Variable | Side | Purpose |
|----------|------|---------|
| `SENTRY_LOCAL=true` | Server | Enables local SQLite store via offline transport |
| `NEXT_PUBLIC_SENTRY_LOCAL=true` | Client | Enables local store via tunnel endpoint |
| `SENTRY_DSN` | Server | Cloud Sentry DSN (used when `SENTRY_LOCAL` is not set) |
| `NEXT_PUBLIC_SENTRY_DSN` | Client | Cloud Sentry DSN (used when `NEXT_PUBLIC_SENTRY_LOCAL` is not set) |

All observability code gracefully degrades:
- `SENTRY_LOCAL` not set → everything noops
- `better-sqlite3` import fails → console.warn once, disable
- SQLite write fails → drop event, warn
- Swap to cloud Sentry = remove `SENTRY_LOCAL=true`, set real DSN
