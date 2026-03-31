# Auto Pipeline: Context Sharing Architecture

How claude-mem provides cross-step observation persistence across the plan-work, plan-review, build, and review pipeline.

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AUTO-ORCHESTRATOR (auto-orchestrator.cjs)                                 │
│                                                                             │
│  For each phase, spawns 4 sequential claude -p sessions with:              │
│    --plugin-dir <fhhs-skills>      (skills)                                │
│    --plugin-dir <claude-mem>       (persistent cross-session observations) │
│    env CLAUDE_SESSION_ID=phase-{N}-auto  (event tracking only)             │
│                                                                             │
│  claude-mem observations persist across sequential claude -p sessions      │
│  automatically via PostToolUse hook. Each step's tool calls (Read, Edit,   │
│  Write, Bash, Grep, Glob) are observed and available to subsequent steps   │
│  via search() or timeline(). No explicit pre-indexing needed.              │
│                                                                             │
│  All 4 steps share ONE claude-mem DB:   ~/.claude-mem/claude-mem.db        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Phase Lifecycle: 4 Steps with Persistent Observations

```
 claude-mem DB: ~/.claude-mem/claude-mem.db (global, append-only)
 All steps for all projects share this single DB — scoped by project name.
 CLAUDE_SESSION_ID (phase-{N}-auto) is for event tracking only.

═══════════════════════════════════════════════════════════════════════════════
 STEP 1: PLAN-WORK                                        ~10 min
═══════════════════════════════════════════════════════════════════════════════

 ┌─ Planning Steps ────────────────────────────────────────────────────────┐
 │                                                                         │
 │  Phase matching:  Read STATE.md, ROADMAP.md                             │
 │  Research:        smart_search("architecture patterns")                 │
 │  Brainstorm:      smart_search("design principles")                    │
 │  Gray areas:      smart_search("conventions for tsx")                   │
 │  Create plan:     Write PLAN.md, CONTEXT.md, DECISIONS.md               │
 │                                                                         │
 │  claude-mem PostToolUse hook: observes all file reads/writes            │
 │  automatically — no explicit indexing calls needed                      │
 └─────────────────────────────────────────────────────────────────────────┘

 Outputs: PLAN.md, CONTEXT.md, DECISIONS.md (observed by claude-mem)
                                    │
                ┌───────────────────┘
                │ Observations from plan-work are
                │ immediately available to plan-review
                ▼
═══════════════════════════════════════════════════════════════════════════════
 STEP 2: PLAN-REVIEW                                      ~6 min
═══════════════════════════════════════════════════════════════════════════════

 ┌─ Observation Reuse ────────────────────────────────────────────────────┐
 │                                                                         │
 │  All plan-work observations are already in claude-mem DB.               │
 │  No re-bootstrapping needed. smart_search hits all prior content.       │
 └─────────────────────────────────────────────────────────────────────────┘

 ┌─ Review Steps ──────────────────────────────────────────────────────────┐
 │                                                                         │
 │  System audit:     smart_search("locked decisions")                     │
 │  Research check:   smart_search("research pitfalls")                    │
 │  Taste calibration: smart_search("design context")                      │
 │  DECISIONS check:  smart_search("decisions for phase {N}")              │
 │                                                                         │
 │  Read PLAN.md only for editing (add [review] truths)                    │
 │  Read CONTEXT.md only for editing (append review decisions)             │
 │                                                                         │
 │  claude-mem: queries plan-work observations for prior context           │
 │              observes review changes automatically                       │
 └─────────────────────────────────────────────────────────────────────────┘

 Outputs: Updated PLAN.md, CONTEXT.md, DECISIONS.md, review summary
                                    │
                ┌───────────────────┘
                │ All observations carry forward
                ▼
═══════════════════════════════════════════════════════════════════════════════
 STEP 3: BUILD                                            ~15 min
═══════════════════════════════════════════════════════════════════════════════

 ┌─ Wave Execution ────────────────────────────────────────────────────────┐
 │                                                                         │
 │  WAVE 1 (parallel agents — same session, shared claude-mem)             │
 │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
 │  │  Agent: Task 1   │  │  Agent: Task 2   │  │  Agent: Task 3   │       │
 │  │                  │  │                  │  │                  │        │
 │  │  smart_search(   │  │  smart_search(   │  │  smart_search(   │       │
 │  │   "decisions for │  │   "conventions   │  │   "existing      │       │
 │  │    auth phase")  │  │    for tsx")     │  │    sidebar")     │       │
 │  │  → gets CONTEXT  │  │  → gets convent- │  │  → gets prior    │       │
 │  │    decisions     │  │    ions          │  │    observations  │       │
 │  │                  │  │                  │  │                  │        │
 │  │  Read: only      │  │  Read: only      │  │  Read: only      │       │
 │  │  files it EDITS  │  │  files it EDITS  │  │  files it EDITS  │       │
 │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
 │                                                                         │
 │  claude-mem: observes all agent work → visible to other agents          │
 └─────────────────────────────────────────────────────────────────────────┘

 ┌─ Between Waves ─────────────────────────────────────────────────────────┐
 │                                                                         │
 │  Wave 1 agent observations are already in claude-mem.                   │
 │  Wave 2 agents see Wave 1's work via smart_search.                      │
 │  No explicit re-indexing step needed.                                   │
 └─────────────────────────────────────────────────────────────────────────┘

 Outputs: All source files, tests, SUMMARY.md
                                    │
                ┌───────────────────┘
                │ All observations carry forward
                ▼
═══════════════════════════════════════════════════════════════════════════════
 STEP 4: REVIEW                                           ~4 min
═══════════════════════════════════════════════════════════════════════════════

 ┌─ Review with Full Phase Context ────────────────────────────────────────┐
 │                                                                         │
 │  smart_search("what was built") ← hits SUMMARY.md observations         │
 │  smart_search("plan requirements") ← hits PLAN.md observations         │
 │  smart_search("conventions") ← hits convention observations             │
 │                                                                         │
 │  Read: only changed files for review (git diff)                         │
 │                                                                         │
 │  claude-mem: queries build observations for context                     │
 │              sees what all build agents did                              │
 └─────────────────────────────────────────────────────────────────────────┘
```

## How claude-mem Replaces Explicit Indexing

Previous versions used context-mode's FTS5 database with explicit `ctx_index` and `ctx_batch_execute` calls to pre-index documents. claude-mem eliminates this overhead:

| Previous (context-mode) | Current (claude-mem) |
|--------------------------|----------------------|
| `ctx_index` to manually index each doc | PostToolUse hook auto-observes every Read/Write/Edit |
| `ctx_batch_execute` to run + index commands | Run commands via Bash; observations captured automatically |
| `ctx_search` for FTS5 queries | `smart_search` for semantic observation retrieval |
| Per-project SQLite DB (SHA256 hash) | Global claude-mem.db, scoped by project name |
| Manifest files for cache invalidation | Append-only; no invalidation needed |
| Background re-index agents | Not needed; observations are always fresh |

## Agent Prompt: Before vs After

```
BEFORE (per build agent):                AFTER (per build agent):
┌────────────────────────────────┐      ┌────────────────────────────────┐
│ {TASK_TEXT}       ~1.2 KB      │      │ {TASK_TEXT}       ~1.2 KB      │
│ {DESIGN_DECISIONS} ~1.5 KB     │      │ {DESIGN_DECISIONS}  0 KB       │
│ {CLAUDE_MD_SECTIONS} ~2 KB     │      │  (empty — use smart_search)    │
│ {DECISIONS_CONTEXT} ~1 KB      │      │ {CLAUDE_MD_SECTIONS} 0 KB      │
│ Template          ~2 KB        │      │  (empty — use smart_search)    │
│                                │      │ smart_search inst.  ~0.2 KB    │
│                                │      │ fallback inst.      ~0.2 KB    │
│                                │      │ Template            ~2.2 KB    │
├────────────────────────────────┤      ├────────────────────────────────┤
│ TOTAL: ~7.7 KB per agent       │      │ TOTAL: ~3.8 KB per agent       │
│ x 5 agents = 38.5 KB           │      │ x 5 agents = 19 KB             │
└────────────────────────────────┘      └────────────────────────────────┘

                                         50% prompt size reduction
                                         {CLAUDE_MD_SECTIONS} and
                                         {DESIGN_DECISIONS} are empty
                                         when claude-mem is available —
                                         agent fetches via smart_search
                                         Falls back to Read/inject
                                         when smart_search unavailable
```

## Plugin Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          CLAUDE-MEM                                       │
│                                                                          │
│  Scope:     Global (persistent across ALL sessions and projects)          │
│  Storage:   ~/.claude-mem/claude-mem.db                                  │
│  Observed:  Every file read, write, decision, code change (PostToolUse)  │
│  Queried:   search, smart_search, timeline, get_observations             │
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

1. **Why a single global DB?** claude-mem uses `~/.claude-mem/claude-mem.db` with project-name scoping. All steps for the same project share observations automatically. No per-session DB isolation needed.

2. **Why not share across parallel build agents?** Build agents are subagents spawned via the Agent tool — they run within the SAME claude session, so they automatically share the parent's claude-mem context. No special configuration needed.

3. **Why fallbacks everywhere?** claude-mem may not be installed on all user systems. Every `smart_search` instruction includes "if unavailable, Read directly" so the pipeline works with or without the MCP plugin.

4. **Why no pre-indexing?** claude-mem's PostToolUse hook automatically observes every Read, Write, Edit, Bash, Grep, and Glob call. Documents become searchable the moment they are read. No explicit indexing step required.

5. **Why no post-wave re-indexing?** Wave 1 agent observations are immediately available in claude-mem. Wave 2 agents can query them via `smart_search` without any re-index step.

6. **CLAUDE_MEM_PROJECT env var** — claude-mem's `gp()` function derives a project name from the process working directory. In headless `claude -p` sessions spawned by the orchestrator, the cwd basename is often the Conductor workspace name (e.g., "cairo"), not the project name (e.g., "fhhs-skills"). The orchestrator calls `git rev-parse --show-toplevel` (with a 5s timeout, falls back to `path.basename`) before spawning any `claude -p` session, derives the project name from the top-level directory basename, and injects `CLAUDE_MEM_PROJECT=<name>` into the spawn environment.

## Measurement & Verification

### Reading PHASE_METRICS

Each `claude -p` session emits a log line on completion:

```
PHASE_METRICS: phase=07-auto-mode step=build elapsed=542000ms tokens_in=45000 tokens_out=12000 reads=3
```

Fields:
- `phase`: phase directory name
- `step`: pipeline step (plan-work | plan-review | build | review)
- `elapsed`: wall-clock time in ms
- `tokens_in/out`: total tokens from claude API usage
- `reads`: count of Read tool calls (lower = better with smart_search)

### Per-Phase Cost Aggregation

The orchestrator aggregates stepHistory into `phase_costs` in `.auto-state.json`:

```json
{
  "phase_costs": {
    "07-auto-mode": {
      "tokens_in": 120000,
      "tokens_out": 35000,
      "read_calls": 7,
      "cost_estimate": 1.85,
      "elapsed_ms": 1420000,
      "steps": 4
    }
  }
}
```

### Per-Phase Cost Table in Orchestrator Output

After each phase completes, the orchestrator emits a cost summary table to stdout:

```
Phase 3 complete — 3m 7s
  tokens_in:       42,150   tokens_out:    8,320
  read_calls:          7
```

After all phases complete, a milestone summary table is printed:

```
=== Milestone Cost Summary ===
Phase  Duration   Tokens In   Tokens Out   Read Calls
    3   3m 07s      42,150       8,320           7
    4   4m 22s      51,890      10,140           5
    5   2m 58s      38,710       7,680           6
TOTAL  10m 27s     132,750      26,140          18
```

**claude-mem usage:** To analyze cost trends across runs, use `smart_search` with the keyword `PHASE_METRICS` to retrieve past log lines, then compare `read_calls` ratios over time.
