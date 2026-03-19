---
type: execute
wave: 1
depends_on: []
files_modified:
  - .claude/skills/observability/SKILL.md
  - .claude/skills/fix/SKILL.md
  - .claude/skills/build/SKILL.md
  - commands/new-project.md
autonomous: true

must_haves:
  truths:
    - "A new /fh:observability skill exists that teaches agents how to query the local Sentry error store via lib/sentry-local-query.mjs"
    - "The /fh:fix skill has a new Step 0 that queries .sentry-local/events.db for recent errors before triage"
    - "The /fh:build skill checks for new runtime errors after each wave completes"
    - "The /fh:new-project command scaffolds Sentry local observability files into user projects including lib/sentry-local.ts, lib/sentry-local-query.mjs, app/api/sentry-local/route.ts, instrumentation.ts, and client-side Sentry init"
    - "All observability code is gated behind SENTRY_LOCAL=true env var and gracefully degrades when not set or when better-sqlite3 is unavailable"
  artifacts:
    - path: ".claude/skills/observability/SKILL.md"
      provides: "Skill teaching agents to query local Sentry error store"
      contains: "sentry-local-query.mjs"
    - path: ".claude/skills/fix/SKILL.md"
      provides: "Updated fix skill with error context before triage"
      contains: "sentry-local"
    - path: ".claude/skills/build/SKILL.md"
      provides: "Updated build skill with after-wave error check"
      contains: "sentry-local"
    - path: "commands/new-project.md"
      provides: "Updated new-project with observability scaffold step"
      contains: "SENTRY_LOCAL"
  key_links:
    - from: ".claude/skills/fix/SKILL.md"
      to: ".claude/skills/observability/SKILL.md"
      via: "references observability skill for query patterns"
    - from: ".claude/skills/build/SKILL.md"
      to: ".claude/skills/observability/SKILL.md"
      via: "references observability skill for after-wave checks"
    - from: "commands/new-project.md"
      to: "user's lib/sentry-local.ts"
      via: "scaffolds file content during project setup"
---

<objective>
Add local Sentry-compatible observability to the fhhs-skills plugin. Create a new observability skill, integrate error awareness into /fix and /build, and update /new-project to scaffold all observability files into user projects automatically.
</objective>

<context>
@.claude/skills/fix/SKILL.md
@.claude/skills/build/SKILL.md
@commands/new-project.md
@.planning/designs/2026-03-19-local-observability.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: Create /fh:observability skill and scaffold templates</name>
  <files>
    .claude/skills/observability/SKILL.md
  </files>
  <action>
Create `.claude/skills/observability/SKILL.md` with:

**Frontmatter:** name: observability, description for querying local Sentry error store, user-invokable: true

**Body — two sections:**

### Section 1: Query Local Error Store
Instructions for agents to query the local error store. Include:
- Check if `.sentry-local/events.db` exists (if not, report "No local error store found" and stop)
- Run queries via `node lib/sentry-local-query.mjs {command}`:
  - `recent` — last 20 errors with timestamp, level, message, exception summary
  - `recent --minutes N` — errors from last N minutes
  - `search "keyword"` — full-text search across messages and exceptions
  - `stats` — error count by level, most common errors, error rate trend
  - `detail {event_id}` — full error with breadcrumbs, request context, tags
- Format output for agent consumption (structured, scannable)
- Note: if `lib/sentry-local-query.mjs` doesn't exist, the project wasn't set up with `/fh:new-project` — suggest running it

### Section 2: Scaffolded Files Reference
Document what `/fh:new-project` scaffolds for observability. This is reference for agents that need to understand or modify the observability setup:

**`lib/sentry-local.ts`** (~150 lines) — contains:
- `createLocalSentryStore()` — returns `OfflineStore` backed by SQLite
  - Uses `better-sqlite3` with WAL mode + 5s busy_timeout
  - Auto-creates `.sentry-local/events.db` and tables on first call
  - `push(envelope)` — serialize envelope, parse out event fields (event_id, timestamp, level, message, exception, breadcrumbs, tags, request, contexts), INSERT into events table + store raw envelope
  - `unshift(envelope)` — same as push (order doesn't matter for local store)
  - `shift()` — return oldest envelope (for replay to real Sentry later)
  - Auto-prune: DELETE events older than 7 days on every 100th write
- `initSentryServer()` — wraps `Sentry.init()` for server:
  - If `SENTRY_LOCAL=true`: use `makeOfflineTransport(makeNodeTransport)` with `createStore: createLocalSentryStore`, `shouldStore: () => true`
  - If `SENTRY_DSN` is set (no `SENTRY_LOCAL`): standard Sentry.init with real DSN
  - If neither: noop (don't init Sentry)
  - DSN: use `SENTRY_DSN` env var, or a dummy `https://local@localhost/1` for local mode
- `initSentryClient()` — wraps `Sentry.init()` for browser:
  - If `NEXT_PUBLIC_SENTRY_LOCAL=true`: init with `tunnel: '/api/sentry-local'`
  - If `NEXT_PUBLIC_SENTRY_DSN` is set: standard init with real DSN
  - If neither: noop
- SQLite schema:
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

**`lib/sentry-local-query.mjs`** (~100 lines) — CLI query tool:
- Subcommands: `recent`, `search`, `stats`, `detail`
- Reads from `.sentry-local/events.db` via `better-sqlite3`
- Output: structured text optimized for LLM consumption (not JSON)
- Graceful error on missing db: "No .sentry-local/events.db found. Run your app with SENTRY_LOCAL=true to start capturing errors."

**`app/api/sentry-local/route.ts`** (~40 lines):
- POST handler that receives Sentry envelope from browser tunnel
- Guards with `SENTRY_LOCAL !== 'true'` → return 404
- Imports `parseEnvelope` from `@sentry/core` + store from `lib/sentry-local`
- Parses envelope body, extracts events, stores in SQLite
- Returns 200 (Sentry SDK expects this)
- try/catch everything — never crash the API route

**`instrumentation.ts`** (~10 lines):
- Next.js instrumentation hook
- Calls `initSentryServer()` from `lib/sentry-local`

**Client-side init** — added to `app/layout.tsx` or a provider:
- Calls `initSentryClient()` from `lib/sentry-local`
- Wrapped in `useEffect` or top-level module init

**`.sentry-local/.gitignore`**: contains single line `*`

**Dependencies added to package.json:**
- `@sentry/browser` `@sentry/node` `@sentry/core` `better-sqlite3`
- devDependency: `@types/better-sqlite3`

**Environment variables:**
- `SENTRY_LOCAL=true` — enables local store (server-side)
- `NEXT_PUBLIC_SENTRY_LOCAL=true` — enables local store (client-side, must be NEXT_PUBLIC_ prefixed)
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` — for cloud Sentry (overrides local when SENTRY_LOCAL is not set)
  </action>
  <verify>
    - `.claude/skills/observability/SKILL.md` exists with correct frontmatter
    - Skill documents all query subcommands (recent, search, stats, detail)
    - Skill documents all scaffolded files with enough detail for agents to understand and modify them
    - Skill documents environment variable behavior (SENTRY_LOCAL, SENTRY_DSN, NEXT_PUBLIC_ variants)
  </verify>
  <done>The observability skill exists, is user-invokable, and contains complete reference documentation for both querying the error store and understanding the scaffolded observability files</done>
</task>

<task type="auto">
  <name>Task 2: Integrate observability into /fix, /build, and /new-project</name>
  <files>
    .claude/skills/fix/SKILL.md
    .claude/skills/build/SKILL.md
    commands/new-project.md
  </files>
  <action>
### 2a: Update `/fh:fix` — add Step 0 before triage

Insert a new **Step 0: Check Runtime Errors** before the existing Step 1.

Content:
```markdown
## Step 0: Check Runtime Errors

Before triaging from code alone, check if the local error store has runtime context.

1. Check if `.sentry-local/events.db` exists:
```bash
[ -f ".sentry-local/events.db" ] && echo "STORE_EXISTS" || echo "NO_STORE"
```

2. If `STORE_EXISTS`, query recent errors:
```bash
node lib/sentry-local-query.mjs recent --minutes 60
```

3. Use the results to inform triage:
   - If errors match the reported bug → use the stack trace, breadcrumbs, and request context as starting evidence
   - If errors show a pattern (same error repeating) → note the frequency
   - If no recent errors → proceed to Step 1 with code-only analysis

4. If `NO_STORE`: skip this step silently. The project may not have observability set up.

This step should consume <2% context. Don't deep-dive the errors yet — just surface them as input to triage.
```

Renumber nothing — keep existing steps as Step 1, 2, 3, 4. This is Step 0 (pre-triage).

### 2b: Update `/fh:build` — add after-wave error check

In Step 3 ("Execute Waves"), after the "After each wave completes" section and before the spec gate (Step 3b), add an error store check:

```markdown
### After-wave error check

If `.sentry-local/events.db` exists, check for errors that appeared during wave execution:

```bash
node lib/sentry-local-query.mjs recent --minutes 5
```

If new errors appeared:
- **Runtime errors during build** — these may indicate the just-built code has issues
- Surface the errors to the orchestrator: "⚠ N new runtime errors detected during Wave X execution"
- Include in the wave report alongside spot-check results
- These errors inform the spec gate — if the code runs but produces errors, that's a spec concern

If the query script or db doesn't exist, skip silently.
```

### 2c: Update `/fh:new-project` — add observability scaffold step

Add a new **Step 5b: Observability Setup** after Step 5 (Requirements + Roadmap) and before Step 6 (Infrastructure Setup).

Content:
```markdown
## Step 5b: Observability Setup

Scaffold local Sentry-compatible error tracking. This captures browser and server errors to a local SQLite store that agents can query during debugging.

### Dependencies

Add to the project's package.json (these will be installed in Phase 1 when npm install runs):

Note in `.planning/REQUIREMENTS.md` that Phase 1 scaffolding must include:
```
npm install @sentry/browser @sentry/node @sentry/core better-sqlite3
npm install -D @types/better-sqlite3
```

### Scaffold files

Create the following files using the templates documented in the `/fh:observability` skill (Section 2: Scaffolded Files Reference). Read that skill for the complete file contents.

1. **`lib/sentry-local.ts`** — SQLite-backed Sentry transport + init helpers
2. **`lib/sentry-local-query.mjs`** — CLI query tool for agents
3. **`app/api/sentry-local/route.ts`** — browser envelope receiver (tunnel endpoint)
4. **`instrumentation.ts`** — Next.js server-side Sentry init
5. **`.sentry-local/.gitignore`** — contains `*` (exclude db from git)

### Environment setup

Add to `.env.local` (or create it):
```
SENTRY_LOCAL=true
NEXT_PUBLIC_SENTRY_LOCAL=true
```

### Client-side init

Note in the Phase 1 plan that `app/layout.tsx` needs to call `initSentryClient()` from `lib/sentry-local`. This happens during scaffolding, not here — we just create the library files.

### Conductor integration

If `conductor.json` is being created (Step 7), add `SENTRY_LOCAL` and `NEXT_PUBLIC_SENTRY_LOCAL` to the env block:
```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_TASKS": "true",
    "SENTRY_LOCAL": "true",
    "NEXT_PUBLIC_SENTRY_LOCAL": "true"
  }
}
```

This ensures every Conductor workspace (including git worktrees) has local observability enabled. The `.sentry-local/` directory lives in the worktree root, so each workspace gets its own error store that is cleaned up when the worktree is deleted.
```

Also update the Step 8 handoff output to include:
```
- lib/sentry-local.ts       — local error tracking (Sentry SDK → SQLite)
- lib/sentry-local-query.mjs — error query CLI for agents
- .sentry-local/             — error store (gitignored, per-worktree)
```

And mention: "Error tracking is active in dev by default. Run `node lib/sentry-local-query.mjs recent` to see captured errors, or let `/fh:fix` query them automatically."
  </action>
  <verify>
    - `/fh:fix` has Step 0 before Step 1 with error store query
    - `/fh:build` has after-wave error check between wave completion and spec gate
    - `/fh:new-project` has Step 5b that scaffolds all observability files
    - `/fh:new-project` Step 7 (Conductor) includes SENTRY_LOCAL env vars
    - `/fh:new-project` Step 8 (Handoff) lists observability files
    - All new sections degrade gracefully when store/script doesn't exist
  </verify>
  <done>The /fix skill queries runtime errors before triage, /build checks for errors after each wave, and /new-project automatically scaffolds the complete observability stack into every new project</done>
</task>
</tasks>

<verification>
```bash
# Verify all files exist
[ -f ".claude/skills/observability/SKILL.md" ] && echo "OK: observability skill" || echo "MISSING"
grep -l "sentry-local" .claude/skills/fix/SKILL.md && echo "OK: fix updated" || echo "MISSING"
grep -l "sentry-local" .claude/skills/build/SKILL.md && echo "OK: build updated" || echo "MISSING"
grep -l "SENTRY_LOCAL" commands/new-project.md && echo "OK: new-project updated" || echo "MISSING"

# Verify skill frontmatter
head -5 .claude/skills/observability/SKILL.md

# Verify graceful degradation language
grep -c "skip\|silently\|NO_STORE\|doesn't exist" .claude/skills/fix/SKILL.md
grep -c "skip\|silently\|doesn't exist" .claude/skills/build/SKILL.md
```
</verification>

<success_criteria>
- A new /fh:observability skill exists that teaches agents how to query the local Sentry error store via lib/sentry-local-query.mjs
- The /fh:fix skill has a new Step 0 that queries .sentry-local/events.db for recent errors before triage
- The /fh:build skill checks for new runtime errors after each wave completes
- The /fh:new-project command scaffolds Sentry local observability files into user projects including lib/sentry-local.ts, lib/sentry-local-query.mjs, app/api/sentry-local/route.ts, instrumentation.ts, and client-side Sentry init
- All observability code is gated behind SENTRY_LOCAL=true env var and gracefully degrades when not set or when better-sqlite3 is unavailable
</success_criteria>

<output>.planning/SUMMARY.md</output>
