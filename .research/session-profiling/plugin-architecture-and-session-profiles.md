# Plugin Architecture & Session Profiles (Phases 8-13)

## Part 1: How context-mode and claude-mem Work

### context-mode (mksglu/context-mode)

**What it is:** A per-session SQLite-backed knowledge store that keeps large tool outputs OUT of the LLM context window.

**Storage:** `~/.claude/context-mode/sessions/{sessionId}.db` — one DB per session. Schema:
- `session_events` — indexed content chunks (type, category, priority, data, source_hook)
- `session_meta` — project dir, timestamps, event counts
- `session_resume` — snapshot for session continuation

**What gets indexed:**
- Output from `ctx_batch_execute` commands (shell output, file reads)
- Content explicitly indexed via `ctx_index`
- Fetched web pages via `ctx_fetch_and_index`
- Session events from hooks (CLAUDE.md content, project rules)

**When indexing happens:**
- **SessionStart**: Hooks inject CLAUDE.md/project rules as `session_knowledge` → indexed into FTS
- **On-demand**: Every `ctx_batch_execute` or `ctx_index` call indexes immediately
- **PreToolUse hook**: Intercepts Bash/Read calls that would produce >20 lines and suggests routing through context-mode instead

**Invalidation:** Per-session only. Each new session gets a fresh DB. `.cleanup` files mark sessions for garbage collection. No cross-session persistence — context-mode is ephemeral by design.

**How it helps the pipeline:** During plan-work and build, the skills reference "Context-Mode Acceleration" — using `ctx_search` to find existing patterns, architecture decisions, and prior code before doing raw Grep/Glob. This avoids flooding the agent's context with large file reads.

---

### claude-mem (thedotmack/claude-mem)

**What it is:** A persistent cross-session memory database. Observations survive across conversations.

**Storage:** SQLite database at `~/.claude/plugins/data/` (managed by MCP server). NOT per-session — accumulates over time.

**What gets indexed:**
- **Observations**: Automatically created by the MCP server's PostToolUse hooks. Each observation captures:
  - Files read/modified
  - Title, subtitle, narrative (LLM-generated summaries)
  - Facts (structured array of what happened)
  - Concepts (what-changed, how-it-works, decision, pattern, trade-off)
  - Discovery tokens (how many tokens were consumed)
  - Content hash (dedup)

**When indexing happens:**
- **Continuously**: After tool calls, the claude-mem worker observes changes and creates observation records
- **Session boundaries**: Session metadata tracked (session IDs, timestamps)
- **User prompts**: Also captured as observations for context

**Invalidation:** Never auto-invalidated. Observations are append-only. Search relevance is by recency + semantic match.

**How it helps the pipeline:**
- `smart_search` / `search` — find prior decisions, patterns, code changes
- `timeline` — reconstruct what happened across sessions
- `get_observations` — deep-dive specific events
- The `fhhs-learnings.js` hook is supposed to query timeline at session start to surface improvement items (currently broken — see Part 3)

---

### How They Interact in the fh:auto Pipeline

```
┌─────────────────────────────────────────────────────────┐
│  fh:auto orchestrator (auto-orchestrator.cjs)           │
│  Runs per-phase loop via claude -p subprocess sessions  │
└──────────┬──────────────────────────────────────────────┘
           │
           │  Per phase, 4 fresh sessions:
           │
           ▼
┌──────────────────────┐     ┌──────────────────────┐
│  1. plan-work        │     │  context-mode         │
│  ┌─ Phase matching   │     │  (per-session SQLite) │
│  ├─ Complexity       │◄───►│  - Indexes codebase   │
│  ├─ Research         │     │    reads into FTS      │
│  ├─ Brainstorm       │     │  - ctx_search for     │
│  ├─ Discuss impl.    │     │    pattern discovery   │
│  ├─ Derive must_haves│     │  - Prevents context   │
│  ├─ Create plan      │     │    overflow from large │
│  └─ Plan-check       │     │    file reads          │
└──────────┬───────────┘     └──────────────────────┘
           │
           ▼                  ┌──────────────────────┐
┌──────────────────────┐     │  claude-mem           │
│  2. plan-review      │     │  (persistent SQLite)  │
│  ┌─ Scope challenge  │◄───►│  - Records all file   │
│  ├─ Architecture     │     │    changes as obs      │
│  ├─ Error/rescue map │     │  - Captures decisions  │
│  ├─ Security review  │     │  - Tracks session IDs  │
│  ├─ Data flow edges  │     │  - Searchable across   │
│  ├─ Test review      │     │    all sessions        │
│  └─ Update artifacts │     │  - Feeds learnings     │
└──────────┬───────────┘     │    digest (if working) │
           │                  └──────────────────────┘
           ▼
┌──────────────────────┐     ┌──────────────────────┐
│  3. build            │     │  .planning/ files     │
│  ┌─ Find plan        │     │  (on-disk artifacts)  │
│  ├─ Analyze waves    │◄───►│  - PLAN.md            │
│  ├─ Execute (agents) │     │  - CONTEXT.md         │
│  ├─ Commit + verify  │     │  - DECISIONS.md       │
│  └─ Phase completion │     │  - RESEARCH.md        │
└──────────┬───────────┘     │  - SUMMARY.md         │
           │                  │  - STATE.md           │
           ▼                  └──────────────────────┘
┌──────────────────────┐
│  4. review --quick   │
│  Final code review   │
└──────────────────────┘
```

**Key insight:** context-mode and claude-mem operate independently:
- **context-mode** = ephemeral, per-session, saves context tokens
- **claude-mem** = persistent, cross-session, builds project memory
- **Neither caches the codebase or .planning/ docs** — they index what gets read during each session
- The `.planning/` directory IS the cache — it's the on-disk artifact that persists between sessions

---

## Part 2: Session Profiles for Phases 8-13

### Phase 8: Channel-Agnostic Sales (4:45 AM - 5:17 AM) ~32 min

| Step | Time | Key Activity | claude-mem Obs |
|------|------|-------------|----------------|
| **plan-work** | 4:45 | Phase matching, read STATE.md/ROADMAP.md | #996 |
| | 4:47 | Codebase research (sales.ts, sync.ts, schema) | #997 |
| | 4:49 | 8 architectural decisions (DEC-028→DEC-035) | #1000 |
| | 4:52 | Plan created: 6 tasks, 15 files | #1001 |
| | 4:55-4:58 | Plan-check: added missing files, expanded Task 3 | #1002,#1004,#1006,#1008 |
| **plan-review** | 5:01-5:05 | Added test files, architecture diagrams, error docs | #1011,#1013,#1020 |
| **build** | ~5:05-5:09 | Executed 6 tasks, 142 tests passing | #1029 |
| **review** | 5:17 | Code review completed | #1030 |

**Profile:** Heavy planning (13 min), heavy review (17 min of plan refinement), fast execution (~4 min). 15 observations recorded. Decisions: 8 new (DEC-028→DEC-035).

---

### Phase 9: Invite-Only Auth (5:17 AM - 5:42 AM) ~25 min

| Step | Time | Key Activity | claude-mem Obs |
|------|------|-------------|----------------|
| **plan-work** | 5:17-5:31 | Research, brainstorm, decisions, plan creation | #1041,#1042 |
| **plan-review** | ~5:31 | Strategy finalized, 9 decisions promoted | #1041 |
| **build** | ~5:35-5:42 | Auth configuration, protected layout, tests | (inferred) |

**Profile:** Compact session. Auth is well-understood domain — less research needed. Context doc captures strategy with 9 decisions.

---

### Phase 10: Platform Hierarchy (5:42 AM - 6:20 AM) ~38 min

| Step | Time | Key Activity | claude-mem Obs |
|------|------|-------------|----------------|
| **plan-work** | 5:42-6:02 | Deterministic platform UUID, multi-org design | #1049 |
| **plan-review** | 6:08-6:09 | Component clarifications, test expansion, 4 decisions formalized | #1055,#1056,#1057,#1058 |
| **build** | ~6:09-6:20 | 6 tasks: migration, platform routes, org switcher, aggregation, tests | (inferred) |

**Profile:** Most architecturally complex phase. 20 min planning due to multi-org implications. Plan review added architecture diagrams and expanded test coverage. 10250 discovery tokens on plan creation alone.

---

### Phase 11: White-Label Branding (6:20 AM - 7:00 AM) ~40 min

| Step | Time | Key Activity | claude-mem Obs |
|------|------|-------------|----------------|
| **plan-work** | 6:41 | Deep research (Supabase Storage, CSS vars, metadata) | #1065 |
| | 6:43 | Context doc: 6 decisions, discretion areas, deferred ideas | #1067 |
| **plan-review** | 6:51 | 4 new decisions formalized, context updated | #1069,#1070 |
| **build** | ~6:51-7:00 | Branding settings page, logo upload, CSS overrides | (inferred) |

**Profile:** Research-heavy phase (unfamiliar Supabase Storage patterns). Research agent spawned. 7 deferred ideas explicitly documented to prevent scope creep.

---

### Phase 12: Billing Profiles (7:00 AM - 7:20 AM) ~20 min

| Step | Time | Key Activity | claude-mem Obs |
|------|------|-------------|----------------|
| **plan-work** | 7:11 | 450-line plan, 5 tasks, TDD approach with 14 unit tests | #1074 |
| | 7:12 | Plan validation (gsd-tools verify) | #1075 |
| **build** | ~7:12-7:20 | Migration, forms, sidebar nav, tests | (inferred) |

**Profile:** Fast and efficient. Familiar patterns (forms, migrations, CRUD). No deep research needed. Automated plan validation via gsd-tools.

---

### Phase 13: Pending Payments & Invoicing (7:20 AM - 8:21 AM) ~61 min

| Step | Time | Key Activity | claude-mem Obs |
|------|------|-------------|----------------|
| **plan-work** | 7:42 | Context doc: 16 decision refs, 6 discretion areas, 7 deferred ideas | #1100,#1101 |
| **build** | ~7:42-8:20 | 15 new files, 4 modified, DB transactions, PDF generation | #1142 |
| | 8:21 | Summary: 35 min execution, 25 unit tests, 4 E2E specs | #1142 |

**Profile:** Largest phase — most files (15 new), most dependencies (Phase 8 + Phase 12). Longest build time. Introduces new tech (@react-pdf/renderer). JSONB snapshots for immutability. Closes the v2 milestone.

---

## Part 3: Aggregate Stats

| Metric | Value |
|--------|-------|
| **Total duration (Phases 8-13)** | ~3.5 hours (4:45 AM → 8:21 AM) |
| **Sessions spawned** | ~24 (4 per phase × 6 phases) |
| **claude-mem observations** | ~60 across all phases |
| **Decisions logged** | DEC-028 → DEC-066 (38 decisions) |
| **Total files created/modified** | ~65+ |
| **Total tests** | 142+ unit, 10+ E2E specs |
| **Average phase time** | ~35 min |
| **Fastest phase** | Phase 12 (20 min, familiar patterns) |
| **Slowest phase** | Phase 13 (61 min, new tech + most files) |
| **Most research-heavy** | Phase 11 (Supabase Storage research agent) |
| **Most architecturally complex** | Phase 10 (multi-org, platform hierarchy) |

### Per-Phase Breakdown

| Phase | Plan | Review | Build | Review | Total |
|-------|------|--------|-------|--------|-------|
| 8 | ~10 min | ~7 min | ~4 min | ~8 min | ~32 min |
| 9 | ~14 min | ~4 min | ~7 min | — | ~25 min |
| 10 | ~20 min | ~7 min | ~11 min | — | ~38 min |
| 11 | ~23 min | ~8 min | ~9 min | — | ~40 min |
| 12 | ~12 min | — | ~8 min | — | ~20 min |
| 13 | ~22 min | — | ~35 min | ~4 min | ~61 min |

### What Worked
- **Autonomous decisions**: 38 decisions made without human intervention
- **Plan validation**: gsd-tools automated structure checks
- **Research scaling**: Deep research for unfamiliar domains (Phase 11), skipped for familiar patterns (Phase 12)
- **Context docs**: Locked decisions prevent downstream drift across sessions

### What Didn't Work (The Broken Loop)
- **Learnings digest**: Never bootstrapped (`~/.claude/cache/learnings-digest.json` missing)
- **Session retros**: Never fired (SessionEnd requires `/clear` matcher, `claude -p` just exits)
- **Cross-session learning**: Each `claude -p` session starts cold — no learnings from prior phase sessions
- **context-mode DBs**: Created but never queried cross-session (by design — ephemeral)
