# Auto Pipeline: Context Sharing Architecture

How context-mode and claude-mem are wired across the plan-work → plan-review → build → review pipeline.

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AUTO-ORCHESTRATOR (auto-orchestrator.cjs)                                 │
│                                                                             │
│  For each phase, spawns 4 sequential claude -p sessions with:              │
│    --plugin-dir <fhhs-skills>      (skills)                                │
│    --plugin-dir <context-mode>     (FTS5 index — per-project SQLite)       │
│    --plugin-dir <claude-mem>       (persistent cross-session observations) │
│    env CLAUDE_SESSION_ID=phase-{N}-auto  (event tracking only)             │
│                                                                             │
│  DB isolation is per-project-directory, NOT per-session:                    │
│    SHA256(projectDir)[:16] → ~/.claude/context-mode/sessions/{hash}.db     │
│  All phases and steps for the same project share ONE context-mode DB.      │
│  All 4 steps share ONE claude-mem DB:   ~/.claude-mem/claude-mem.db        │
│                                                                             │
│  Context bootstrapping is delegated to skills — the orchestrator does NOT  │
│  pre-index docs. plan-work Step -0.5 bootstraps, subsequent steps reuse.   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Phase Lifecycle: 4 Steps with Shared Per-Project DB

```
 DB identity: SHA256(projectDir)[:16] → {hash}.db
 All steps for a project share this single DB — no per-session isolation.
 CLAUDE_SESSION_ID (phase-{N}-auto) is for event tracking only.

═══════════════════════════════════════════════════════════════════════════════
 STEP 1: PLAN-WORK                                        ~10 min
═══════════════════════════════════════════════════════════════════════════════

 ┌─ Phase Context Bootstrap (Step -0.5, skill-driven) ────────────────────┐
 │                                                                         │
 │  plan-work skill bootstraps context into the per-project DB:            │
 │                                                                         │
 │    PROJECT.md ─────┐                                                    │
 │    ROADMAP.md ─────┤                                                    │
 │    REQUIREMENTS.md ┤                                                    │
 │    DESIGN.md ──────┤    ┌──────────────────────────┐                   │
 │    ARCHITECTURE.md ┼───→│  context-mode FTS5 DB    │                   │
 │    STRUCTURE.md ───┤    │  {hash}.db               │                   │
 │    CONVENTIONS.md ─┤    │                          │                   │
 │    TESTING.md ─────┤    │  Persists across all     │                   │
 │    STACK.md ───────┘    │  steps via per-project   │                   │
 │                         │  SHA256 hash             │                   │
 │  + phase RESEARCH.md    └──────────────────────────┘                   │
 │  + .planning/research/*.md (project research)                          │
 │  + milestone research/v2/*.md                                           │
 │                                                                         │
 │  NOTE: orchestrator does NOT pre-index — bootstrapping is delegated    │
 │  entirely to the plan-work skill's Step -0.5.                           │
 └─────────────────────────────────────────────────────────────────────────┘

 ┌─ Step 9.5: Source Pre-Index ────────────────────────────────────────────┐
 │                                                                         │
 │  plan-work indexes source files mentioned in the plan into the DB,     │
 │  so subsequent steps (plan-review, build) can ctx_search them.          │
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

 ┌─ Context Reuse ─────────────────────────────────────────────────────────┐
 │                                                                         │
 │  Same per-project DB — all plan-work indexes are already available.     │
 │  No re-bootstrapping needed. ctx_search hits all prior content.         │
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

 ┌─ Probe + Index Source Files ────────────────────────────────────────────┐
 │                                                                         │
 │  Parse PLAN.md frontmatter → extract files_modified list                │
 │                                                                         │
 │  build probes the per-project DB and indexes source files:              │
 │                                                                         │
 │    src/lib/roles.ts ────────┐                                           │
 │    src/lib/auth.ts ─────────┤     ┌──────────────────────────┐         │
 │    src/components/sidebar ──┤     │  context-mode FTS5 DB    │         │
 │    src/app/.../page.tsx ────┼────→│  (same {hash}.db)        │         │
 │    PLAN.md ─────────────────┤     │                          │         │
 │    CONTEXT.md ──────────────┘     │  Now contains:           │         │
 │                                   │  - stable planning docs  │         │
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
│  Scope:     Per-project-directory (SHA256(cwd)[:16] → shared DB)         │
│  Storage:   ~/.claude/context-mode/sessions/{hash}.db                   │
│  Indexed:   .planning/ docs, source files, plan artifacts                │
│  Queried:   ctx_search (FTS5 full-text search)                           │
│  Lifecycle: Bootstrapped by plan-work Step -0.5, grows through build     │
│                                                                          │
│  ┌─ plan-work ─┐  ┌─ plan-review ─┐  ┌─ build ────┐  ┌─ review ──┐    │
│  │ Step -0.5:   │  │ Reuses DB:   │  │ Probes+adds:│  │ Query all: │   │
│  │ bootstrap    │→ │ all plan-work │→ │ source files│→ │ SUMMARY    │   │
│  │ 9 stable docs│  │ content avail │  │ + re-index  │  │ + plan     │   │
│  │ Step 9.5:    │  └──────────────┘  │ post-wave   │  └────────────┘   │
│  │ index source │                     └─────────────┘                    │
│  └──────────────┘                                                        │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                          CLAUDE-MEM                                       │
│                                                                          │
│  Scope:     Global (persistent across ALL sessions and projects)          │
│  Storage:   ~/.claude-mem/claude-mem.db (145 MB, 1233+ observations)     │
│  Indexed:   Every file read, write, decision, code change                 │
│  Queried:   search, timeline, get_observations                     │
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

1. **Why per-project-directory DB?** context-mode derives the DB filename from
   `SHA256(projectDir)[:16]`. All steps for the same project directory share one DB
   automatically. `CLAUDE_SESSION_ID=phase-{N}-auto` is still set but only for event
   tracking — it does not control DB isolation.

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
