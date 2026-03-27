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
│ {DESIGN_DECISIONS} ~1.5 KB │          │ ctx_search inst.  ~0.2 KB │
│ {CLAUDE_MD_SECTIONS} ~2 KB │          │ fallback inst.    ~0.2 KB │
│ {DECISIONS_CONTEXT} ~1 KB  │          │                            │
│ Template          ~2 KB    │          │ Template          ~2.2 KB │
├────────────────────────────┤          ├────────────────────────────┤
│ TOTAL: ~7.7 KB per agent   │          │ TOTAL: ~3.8 KB per agent   │
│ × 5 agents = 38.5 KB       │          │ × 5 agents = 19 KB         │
└────────────────────────────┘          └────────────────────────────┘

                                         50% prompt size reduction
                                         Context fetched on-demand
                                         from shared FTS5 index
                                         Researcher agents now use
                                         ctx_search + smart_search
                                         for pre-existing context
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
