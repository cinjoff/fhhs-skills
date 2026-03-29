# Auto Pipeline: Context Sharing Architecture

How context-mode and claude-mem are wired across the plan-work → plan-review → build → review pipeline.

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AUTO-ORCHESTRATOR (auto-orchestrator.cjs)                                 │
│                                                                             │
│  For each phase, spawns 4 sequential claude -p sessions with:              │
│    --plugin-dir <fhhs-skills>      (skills)                                │
│    --plugin-dir <context-mode>     (FTS5 index — per-session SQLite)       │
│    --plugin-dir <claude-mem>       (persistent cross-session observations) │
│    env CLAUDE_SESSION_ID=phase-{N}-auto  (shared context-mode DB)          │
│                                                                             │
│  All 4 steps share ONE context-mode DB: ~/.claude/context-mode/sessions/   │
│  All 4 steps share ONE claude-mem DB:   ~/.claude-mem/claude-mem.db        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Phase Lifecycle: 4 Steps with Shared Context

```
═══════════════════════════════════════════════════════════════════════════════
 STEP 1: PLAN-WORK                                        ~10 min
═══════════════════════════════════════════════════════════════════════════════

 ┌─ Phase Context Bootstrap (Step -0.5) ──────────────────────────────────┐
 │                                                                         │
 │  ctx_batch_execute indexes 9 STABLE docs (one-time cost ~2s):          │
 │                                                                         │
 │    PROJECT.md ─────┐                                                    │
 │    ROADMAP.md ─────┤                                                    │
 │    REQUIREMENTS.md ┤                                                    │
 │    DESIGN.md ──────┤    ┌──────────────────────────┐                   │
 │    ARCHITECTURE.md ┼───→│  context-mode FTS5 DB    │                   │
 │    STRUCTURE.md ───┤    │  phase-{N}-auto.db       │                   │
 │    CONVENTIONS.md ─┤    │                          │                   │
 │    TESTING.md ─────┤    │  Persists across all     │                   │
 │    STACK.md ───────┘    │  4 steps via shared      │                   │
 │                         │  CLAUDE_SESSION_ID       │                   │
 │  + phase RESEARCH.md    └──────────────────────────┘                   │
 │  + .planning/research/*.md (project research)                          │
 │  + milestone research/v2/*.md                                           │
 └─────────────────────────────────────────────────────────────────────────┘

 ┌─ Planning Steps ────────────────────────────────────────────────────────┐
 │                                                                         │
 │  Phase matching:  Read STATE.md, ROADMAP.md                             │
 │  Research:        ctx_search("architecture patterns") ← from index     │
 │  Brainstorm:      ctx_search("design principles") ← from index         │
 │  Gray areas:      ctx_search("conventions for tsx") ← from index       │
 │  Create plan:     Write PLAN.md, CONTEXT.md, DECISIONS.md               │
 │                                                                         │
 │  claude-mem: observes all file reads/writes → stored globally           │
 └─────────────────────────────────────────────────────────────────────────┘

 Outputs: PLAN.md, CONTEXT.md, DECISIONS.md (+ indexed in context-mode)
                                    │
                ┌───────────────────┘
                │ Re-index mutable docs:
                │ DECISIONS.md, CONTEXT.md, PLAN.md
                ▼
═══════════════════════════════════════════════════════════════════════════════
 STEP 2: PLAN-REVIEW                                      ~6 min
═══════════════════════════════════════════════════════════════════════════════

 ┌─ Phase Context Check ───────────────────────────────────────────────────┐
 │                                                                         │
 │  ctx_search("project vision", "architecture patterns")                  │
 │    → Results found? Bootstrap from plan-work is active!                 │
 │    → No results?   Run bootstrap (same 9 docs)                          │
 │                                                                         │
 │  All stable docs already indexed from Step 1 — zero re-reads            │
 └─────────────────────────────────────────────────────────────────────────┘

 ┌─ Review Steps ──────────────────────────────────────────────────────────┐
 │                                                                         │
 │  System audit:     ctx_search("locked decisions") ← from index         │
 │  Research check:   ctx_search("research pitfalls") ← from index        │
 │  Taste calibration: ctx_search("design context") ← from index          │
 │  DECISIONS check:  ctx_search("decisions for phase {N}") ← from index  │
 │                                                                         │
 │  Read PLAN.md only for editing (add [review] truths)                    │
 │  Read CONTEXT.md only for editing (append review decisions)             │
 │                                                                         │
 │  claude-mem: queries plan-work observations for prior context           │
 │              observes review changes → stored globally                   │
 └─────────────────────────────────────────────────────────────────────────┘

 Outputs: Updated PLAN.md, CONTEXT.md, DECISIONS.md, review summary
                                    │
                ┌───────────────────┘
                │ Re-index: PLAN.md (updated by review),
                │ CONTEXT.md, DECISIONS.md
                ▼
═══════════════════════════════════════════════════════════════════════════════
 STEP 3: BUILD                                            ~15 min
═══════════════════════════════════════════════════════════════════════════════

 ┌─ Pre-Index Source Files ────────────────────────────────────────────────┐
 │                                                                         │
 │  Parse PLAN.md frontmatter → extract files_modified list                │
 │                                                                         │
 │  ctx_batch_execute indexes source files + mutable planning docs:        │
 │                                                                         │
 │    src/lib/roles.ts ────────┐                                           │
 │    src/lib/auth.ts ─────────┤     ┌──────────────────────────┐         │
 │    src/components/sidebar ──┤     │  context-mode FTS5 DB    │         │
 │    src/app/.../page.tsx ────┼────→│  (same phase-{N}-auto)   │         │
 │    PLAN.md ─────────────────┤     │                          │         │
 │    CONTEXT.md ──────────────┘     │  Now contains:           │         │
 │                                   │  - 9 stable planning docs│         │
 │  Stable docs already indexed      │  - phase research        │         │
 │  from Step 1 — NOT re-read        │  - source files          │         │
 │                                   │  - plan + decisions       │         │
 │                                   └──────────────────────────┘         │
 └─────────────────────────────────────────────────────────────────────────┘

 ┌─ Wave Execution ────────────────────────────────────────────────────────┐
 │                                                                         │
 │  WAVE 1 (parallel agents — same session, shared DB)                     │
 │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
 │  │  Agent: Task 1   │  │  Agent: Task 2   │  │  Agent: Task 3   │       │
 │  │                  │  │                  │  │                  │        │
 │  │  ctx_search(     │  │  ctx_search(     │  │  ctx_search(     │       │
 │  │   "decisions for │  │   "conventions   │  │   "existing      │       │
 │  │    auth phase")  │  │    for tsx")     │  │    sidebar")     │       │
 │  │  → gets CONTEXT  │  │  → gets CONVENT- │  │  → gets pre-     │       │
 │  │    decisions     │  │    IONS.md       │  │    indexed src   │       │
 │  │                  │  │                  │  │                  │        │
 │  │  Read: only      │  │  Read: only      │  │  Read: only      │       │
 │  │  files it EDITS  │  │  files it EDITS  │  │  files it EDITS  │       │
 │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
 │                                                                         │
 │  claude-mem: observes all agent work → visible to other agents          │
 └─────────────────────────────────────────────────────────────────────────┘

 ┌─ Post-Wave Re-Index ────────────────────────────────────────────────────┐
 │                                                                         │
 │  Parse agent reports → "Files Changed" list                             │
 │  ctx_batch_execute re-indexes modified files                            │
 │                                                                         │
 │  roles.ts (modified) ──→ roles-v1.ts (fresh in index)                   │
 │  auth.ts (modified) ───→ auth-v1.ts (fresh in index)                    │
 │                                                                         │
 │  Wave 2 agents see updated code via ctx_search                          │
 └─────────────────────────────────────────────────────────────────────────┘

 ┌─ WAVE 2 (if needed — depends on Wave 1) ────────────────────────────────┐
 │  Agents query ctx_search → gets Wave 1's fresh output                   │
 │  + all stable docs + all planning context                               │
 └─────────────────────────────────────────────────────────────────────────┘

 Outputs: All source files, tests, SUMMARY.md
                                    │
                ┌───────────────────┘
                │ Re-index: modified source files, SUMMARY.md
                ▼
═══════════════════════════════════════════════════════════════════════════════
 STEP 4: REVIEW                                           ~4 min
═══════════════════════════════════════════════════════════════════════════════

 ┌─ Review with Full Phase Context ────────────────────────────────────────┐
 │                                                                         │
 │  ctx_search("what was built") ← hits SUMMARY.md from build             │
 │  ctx_search("plan requirements") ← hits PLAN.md                        │
 │  ctx_search("conventions") ← hits CONVENTIONS.md from bootstrap         │
 │                                                                         │
 │  Read: only changed files for review (git diff)                         │
 │                                                                         │
 │  claude-mem: queries build observations for context                     │
 │              sees what all build agents did                              │
 └─────────────────────────────────────────────────────────────────────────┘


## Agent Prompt: Before vs After

```
BEFORE (per build agent):                AFTER (per build agent):
┌────────────────────────────┐          ┌────────────────────────────┐
│ {TASK_TEXT}       ~1.2 KB  │          │ {TASK_TEXT}       ~1.2 KB  │
│ {DESIGN_DECISIONS} ~1.5 KB │          │ {DESIGN_DECISIONS}  0 KB   │
│ {CLAUDE_MD_SECTIONS} ~2 KB │          │  (empty — pre-indexed)     │
│ {DECISIONS_CONTEXT} ~1 KB  │          │ {CLAUDE_MD_SECTIONS} 0 KB  │
│ Template          ~2 KB    │          │  (empty — pre-indexed)     │
│                            │          │ ctx_search inst.  ~0.2 KB  │
│                            │          │ fallback inst.    ~0.2 KB  │
│                            │          │ Template          ~2.2 KB  │
├────────────────────────────┤          ├────────────────────────────┤
│ TOTAL: ~7.7 KB per agent   │          │ TOTAL: ~3.8 KB per agent   │
│ × 5 agents = 38.5 KB       │          │ × 5 agents = 19 KB         │
└────────────────────────────┘          └────────────────────────────┘

                                         50% prompt size reduction
                                         {CLAUDE_MD_SECTIONS} and
                                         {DESIGN_DECISIONS} are empty
                                         when pre-indexing succeeded —
                                         agent fetches via ctx_search
                                         Falls back to Read/inject
                                         when ctx_search unavailable

Pre-indexed content (Step 3 manifest):
  - 9 stable planning docs (PROJECT, ROADMAP, etc.)
  - Source files from files_modified frontmatter
  - Per-task files from <files> elements
  - Test files discovered by convention matching
    (auth.test.ts, page.test.tsx, e2e/*.spec.ts)
  - Test-spec skeletons from Step 2.5 (if run)
  - All deduplicated before indexing
```

## Plugin Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         CONTEXT-MODE                                     │
│                                                                          │
│  Scope:     Per-session (but shared across phase steps via session ID)   │
│  Storage:   ~/.claude/context-mode/sessions/phase-{N}-auto.db           │
│  Indexed:   .planning/ docs, source files, plan artifacts                │
│  Queried:   ctx_search (FTS5 full-text search)                           │
│  Lifecycle: Created at plan-work, grows through build, discarded after   │
│                                                                          │
│  ┌─ plan-work ─┐  ┌─ plan-review ─┐  ┌─ build ────┐  ┌─ review ──┐    │
│  │ Bootstrap:   │  │ Verify index: │  │ Add source: │  │ Query all: │   │
│  │ 9 stable docs│→ │ found → reuse │→ │ files_mod.  │→ │ SUMMARY    │   │
│  │ + research   │  │ empty → boot  │  │ + re-index  │  │ + plan     │   │
│  └──────────────┘  └──────────────┘  │ post-wave   │  └────────────┘   │
│                                       └─────────────┘                    │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                          CLAUDE-MEM                                       │
│                                                                          │
│  Scope:     Global (persistent across ALL sessions and projects)          │
│  Storage:   ~/.claude-mem/claude-mem.db (145 MB, 1233+ observations)     │
│  Indexed:   Every file read, write, decision, code change                 │
│  Queried:   smart_search, timeline, get_observations                     │
│  Lifecycle: Append-only, never invalidated                                │
│                                                                          │
│  ┌─ plan-work ─┐  ┌─ plan-review ─┐  ┌─ build ────┐  ┌─ review ──┐    │
│  │ Observes:    │  │ Queries:      │  │ Observes:   │  │ Queries:   │   │
│  │ decisions,   │  │ plan-work's   │  │ all agent   │  │ build      │   │
│  │ file reads,  │→ │ observations  │→ │ work, file  │→ │ outcomes,  │   │
│  │ plan creation│  │ for context   │  │ changes     │  │ decisions  │   │
│  └──────────────┘  └──────────────┘  └─────────────┘  └────────────┘   │
│                                                                          │
│  Also queried at SessionStart by fhhs-learnings.js hook                  │
│  for cross-session learnings and improvement suggestions                 │
└──────────────────────────────────────────────────────────────────────────┘
```

## Key Technical Decisions

1. **Why shared CLAUDE_SESSION_ID?** context-mode creates one SQLite DB per session ID.
   By forcing `phase-{N}-auto` across all 4 steps, the index built in plan-work persists
   through build and review. Without this, each step starts with an empty index.

2. **Why not share across parallel build agents?** Build agents are subagents spawned
   via the Agent tool — they run within the SAME claude session, so they automatically
   share the parent's context-mode DB. No special configuration needed.

3. **Why fallbacks everywhere?** context-mode and claude-mem may not be installed on
   all user systems. Every ctx_search instruction includes "if unavailable, Read directly"
   so the pipeline works with or without MCP plugins.

4. **Why pre-index source files in build?** Build agents previously Read every file
   from scratch. Pre-indexing means agents use ctx_search for understanding existing
   patterns and only Read files they're about to Edit.

5. **Why post-wave re-index?** Agents in Wave 1 modify files that Wave 2 agents may
   need. Re-indexing between waves ensures ctx_search returns fresh content.

6. **Why index project-level research?** Project research from /fh:new-project
   (FEATURES.md, PITFALLS.md, STACK.md, ARCHITECTURE.md, SUMMARY.md) is valuable
   context for all phase planning — not just the roadmap creation that originally
   consumed it. Indexing it once makes it searchable across all pipeline steps.

7. **CLAUDE_MEM_PROJECT env var** — claude-mem's `gp()` function derives a project name
   from the process working directory. In headless `claude -p` sessions spawned by the
   orchestrator, the cwd basename is often the Conductor workspace name (e.g., "cairo"),
   not the project name (e.g., "fhhs-skills"). This caused 79% misattribution of
   observations to the wrong project pool.

   Fix: the orchestrator calls `git rev-parse --show-toplevel` (with a 5s timeout, falls
   back to `path.basename`) before spawning any `claude -p` session, derives the project
   name from the top-level directory basename, and injects `CLAUDE_MEM_PROJECT=<name>`
   into the spawn environment. The unified patch (replacing the old worktree-only patch)
   adds an env var check as the first tier in `gp()` — before worktree detection and
   before basename — so it works correctly in all workspace layouts.

   Measurement: per-session metrics stored in `.auto-state.json` stepHistory enable
   before/after comparison of misattribution rate across pipeline runs.

8. **Performance Baseline** — observed metrics from Phase 14 execution:

   | Metric | Observed | Target (post-fix) |
   |--------|----------|-------------------|
   | Total duration | 24 min | < 15 min |
   | Agent sessions | 9 | 6 (batched review) |
   | Read tool calls | 41 | < 10 (ctx_search first) |
   | Redundant reads (same file) | page.tsx ×10 | 0 |

   After fixes: build agents use `ctx_search` for all context reads; `Read` tool reserved
   for files being actively edited. Pre-indexed manifest includes source files,
   per-task files from `<files>` elements, and test files discovered by convention
   matching. Metrics tracked per-session in stepHistory enable before/after comparison.
## Measurement & Verification

### phase_costs in .auto-state.json

The orchestrator records per-phase cost data in `.auto-state.json` under the `phase_costs` key:

```json
{
  "phase_costs": {
    "3": {
      "tokens_in": 42150,
      "tokens_out": 8320,
      "read_calls": 7,
      "ctx_search_hits": 31,
      "duration_ms": 187400,
      "steps": ["plan", "plan-review", "build", "review"]
    },
    "4": { ... }
  }
}
```

Fields per phase entry:
- `tokens_in` / `tokens_out` — cumulative input and output tokens across all 4 steps
- `read_calls` — number of Read tool calls (lower is better; ctx_search should substitute)
- `ctx_search_hits` — number of successful ctx_search lookups from the shared index
- `duration_ms` — wall-clock time from phase start to state update
- `steps` — which pipeline steps completed (useful for partial runs and --resume)

**Survival across --resume:** `phase_costs` is restored from the saved `.auto-state.json` on resume. Phases already in `built` state retain their recorded costs; only newly executed phases append new entries.

### Per-Phase Cost Table in Orchestrator Output

After each phase completes, the orchestrator emits a cost summary table to stdout:

```
Phase 3 complete — 3m 7s
  tokens_in:       42,150   tokens_out:    8,320
  read_calls:          7    ctx_hits:         31
  ctx efficiency:  82%  (31 hits / 38 total lookups)
```

Context efficiency = ctx_search_hits / (read_calls + ctx_search_hits). Values above 70% indicate healthy pre-indexing behavior. Values below 50% suggest the shared context-mode DB is not being populated or queried correctly.

After all phases complete, a milestone summary table is printed:

```
=== Milestone Cost Summary ===
Phase  Duration   Tokens In   Tokens Out   Read Calls   ctx Hits
    3   3m 07s      42,150       8,320           7          31
    4   4m 22s      51,890      10,140           5          44
    5   2m 58s      38,710       7,680           6          29
TOTAL  10m 27s     132,750      26,140          18         104
```

### PHASE_METRICS Log Line Format

At the end of each phase, the orchestrator writes a structured log line to stdout prefixed with `PHASE_METRICS:`. This is designed for parsing by claude-mem cross-session analysis:

```
PHASE_METRICS: phase=3 tokens_in=42150 tokens_out=8320 read_calls=7 ctx_hits=31 duration_ms=187400 project=my-project date=2026-03-29T18:42:00Z
```

All fields are space-separated key=value pairs. No quotes, no commas. Fields:
- `phase` — phase number (integer)
- `tokens_in` / `tokens_out` — cumulative for the phase
- `read_calls` — Read tool invocations across all 4 steps
- `ctx_hits` — successful ctx_search lookups
- `duration_ms` — wall-clock phase duration
- `project` — project name (from CLAUDE_MEM_PROJECT env var, or git top-level basename)
- `date` — ISO 8601 timestamp at phase completion

**claude-mem usage:** To analyze cost trends across runs, use `smart_search` with the keyword `PHASE_METRICS` to retrieve past log lines, then compare `read_calls` and `ctx_hits` ratios over time.
