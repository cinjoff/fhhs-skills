# Phase Journey Diagrams: Auto Execution Profiling

## How to Read These Diagrams

Each phase shows 4 steps (plan-work → plan-review → build → review), each a separate `claude -p` session with fresh context. The diagrams show:
- **Tool flow**: Compressed sequence of tool calls (Read, Edit, Agent, Bash, etc.)
- **Files read**: With `⚠` for within-session duplicates, `[also in N steps]` for cross-session re-reads
- **ctx/mem**: context-mode and claude-mem usage (spoiler: almost always 0)

---

## Phase 9: Invite-Only Auth (The Cleanest Phase)

**30 min total | 4 sessions | 170 tool calls | 0 duplicate reads within sessions**

```
╔══════════════════════════════════════════════════════════════════════════╗
║  PHASE 9: INVITE-ONLY AUTH — The Gold Standard                        ║
║  04:32 → 04:53 UTC | 30 min | 170 tools | 0 intra-session dupes      ║
╚══════════════════════════════════════════════════════════════════════════╝

 ┌─────────────────────────────────────────────────────────────────────┐
 │  STEP 1: PLAN-WORK                    10m | 56 tools | 414KB      │
 │  ctx: 0 | mem: 0 | agents: 1                                      │
 │                                                                     │
 │  Flow: Read×3 → Glob → Read×3 → Skill → Task×19 → Bash → Task    │
 │        Agent → Task×3 → Read×2 → Edit → Bash×3 → Glob → Read     │
 │        Write → Edit → Read → Bash → Write → Task×5 → Read → Bash  │
 │                                                                     │
 │  ╭─ Reads ──────────────────────────────────────────────────────╮  │
 │  │ .planning/STATE.md                    ← also read by build   │  │
 │  │ .planning/ROADMAP.md                                         │  │
 │  │ .planning/DECISIONS.md                ← also read by P-R, B  │  │
 │  │ src/lib/roles.ts                      ← also read by ALL     │  │
 │  │ src/app/(protected)/layout.tsx        ← also read by P-R, R  │  │
 │  │ src/components/app-sidebar.tsx        ← also read by P-R     │  │
 │  │ src/app/(auth)/login/login-form.tsx   ← also read by P-R     │  │
 │  │ src/app/(protected)/settings/team/actions.ts  ← also by P-R  │  │
 │  │ + 5 more unique reads                                        │  │
 │  ╰──────────────────────────────────────────────────────────────╯  │
 │                                                                     │
 │  Writes: 09-CONTEXT.md, DECISIONS.md, 09-01-PLAN.md               │
 └─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │  STEP 2: PLAN-REVIEW                  5m | 33 tools | 590KB       │
 │  ctx: 0 | mem: 0 | agents: 0                                      │
 │                                                                     │
 │  Flow: Skill → Bash×3 → Read×5 → Bash → Grep×2 → Read×5 →        │
 │        Bash×2 → Read×4 → Edit×4 → Write → Bash → Read → Write     │
 │                                                                     │
 │  ╭─ Reads (14 unique, 0 dupes!) ────────────────────────────────╮  │
 │  │ 09-01-PLAN.md                         ← also read by B, R   │  │
 │  │ roles.ts, layout.tsx, sidebar.tsx      ← RE-READS from P-W  │  │
 │  │ login-form.tsx, team/actions.ts        ← RE-READS from P-W  │  │
 │  │ 09-CONTEXT.md                         ← also read by build  │  │
 │  │ DECISIONS.md                          ← RE-READ from P-W    │  │
 │  ╰──────────────────────────────────────────────────────────────╯  │
 │                                                                     │
 │  Writes: 09-01-PLAN.md (edits), 09-CONTEXT.md, DECISIONS.md,      │
 │          09-REVIEW.md                                               │
 └─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │  STEP 3: BUILD                         10m | 36 tools | 310KB     │
 │  ctx: 0 | mem: 0 | agents: 7                                      │
 │                                                                     │
 │  Flow: Skill → Read×6 → Agent → Read → Bash → Agent×3 →           │
 │        Grep×2 → Bash → Grep → Agent → Bash×11 → Read → Write →    │
 │        Bash×2 → Agent×2 → Bash                                     │
 │                                                                     │
 │  ╭─ Reads (8 unique, 0 dupes!) ─────────────────────────────────╮  │
 │  │ 09-01-PLAN.md                         ← RE-READ from P-R    │  │
 │  │ 09-CONTEXT.md                         ← RE-READ from P-R    │  │
 │  │ STATE.md                              ← RE-READ from P-W    │  │
 │  │ DECISIONS.md                          ← RE-READ from P-W,R  │  │
 │  │ roles.ts                              ← RE-READ from P-W,R  │  │
 │  │ implementer-prompt.md, summary-template.md  (skill refs)     │  │
 │  ╰──────────────────────────────────────────────────────────────╯  │
 │                                                                     │
 │  7 Agents spawned (parallel wave execution):                        │
 │    Task 1: Roles — isViewer + requireFullAccess                     │
 │    Task 2: Login form — invite-only signup                          │
 │    Task 3: Sidebar + layout — viewer nav                            │
 │    Task 4: Route guards + team viewer                               │
 │    Task 5: Unit + E2E tests                                         │
 │    + Phase completion verification                                   │
 │    + GSD state update                                                │
 │                                                                     │
 │  Writes: 09-01-SUMMARY.md                                          │
 └─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │  STEP 4: REVIEW                        5m | 45 tools | 288KB      │
 │  ctx: 0 | mem: 0 | agents: 2                                      │
 │                                                                     │
 │  Flow: Skill → Read×2 → Bash×2 → Read → Grep → Agent →            │
 │        Read×2 → Edit×3 → Bash×3 → Grep×3 → Read → Bash →          │
 │        Edit → Bash×7 → Grep×2 → Agent → Bash × Read → Grep ×      │
 │        Bash → Edit → Write → Bash → Read → Write                   │
 │                                                                     │
 │  ╭─ Reads (5 unique, 0 dupes!) ─────────────────────────────────╮  │
 │  │ roles.ts                              ← 4th time across phase│  │
 │  │ waiting-for-invite/page.tsx                                  │  │
 │  │ CLAUDE.md                                                    │  │
 │  ╰──────────────────────────────────────────────────────────────╯  │
 │                                                                     │
 │  Agents: Code quality review, Spec verification                     │
 │  Writes: roles.ts, waiting-for-invite.tsx, CLAUDE.md (fixes)       │
 └─────────────────────────────────────────────────────────────────────┘

 ┌─── CROSS-SESSION FILE REDUNDANCY ──────────────────────────────────┐
 │                                                                     │
 │  File                    │ P-W │ P-R │ Build │ Review │ Total      │
 │  ────────────────────────┼─────┼─────┼───────┼────────┼──────      │
 │  roles.ts                │  1  │  1  │   1   │   1    │  4 reads   │
 │  DECISIONS.md            │  2  │  1  │   1   │   -    │  4 reads   │
 │  layout.tsx              │  1  │  1  │   -   │   1    │  3 reads   │
 │  09-01-PLAN.md           │  -  │  1  │   1   │   1    │  3 reads   │
 │  STATE.md                │  1  │  -  │   1   │   -    │  2 reads   │
 │  app-sidebar.tsx         │  1  │  1  │   -   │   -    │  2 reads   │
 │  login-form.tsx          │  1  │  1  │   -   │   -    │  2 reads   │
 │  09-CONTEXT.md           │  -  │  1  │   1   │   -    │  2 reads   │
 │                                                                     │
 │  🔴 roles.ts read 4 times across 4 sessions — never cached         │
 │  🔴 DECISIONS.md read 4 times (2x in plan-work alone)              │
 │  ✅ 0 intra-session dupes — each session reads efficiently         │
 └─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 13: Pending Payments & Invoicing (The Heaviest Phase)

**45 min total | 3 sessions | 144 tool calls | 14 intra-session duplicate reads**

```
╔══════════════════════════════════════════════════════════════════════════╗
║  PHASE 13: PENDING PAYMENTS & INVOICING — The Beast                   ║
║  06:45 → 07:28 UTC | 45 min | 144 tools | 14 intra-session dupes     ║
╚══════════════════════════════════════════════════════════════════════════╝

 ┌─────────────────────────────────────────────────────────────────────┐
 │  STEP 1: PLAN-WORK                    8m | 46 tools | 538KB       │
 │  ctx: 0 | mem: 0 | agents: 2                                      │
 │                                                                     │
 │  Flow: Read×2 → Bash → Read → Skill → Read → Bash → TSearch →     │
 │        Task×12 → Agent → Task×2 → Read×3 → Glob×2 → Read×2 →      │
 │        Write → Edit → Task×4 → Agent → Write → Bash → Task×2      │
 │                                                                     │
 │  ╭─ Reads (10 unique, 1 dupe) ──────────────────────────────────╮  │
 │  │ DECISIONS.md              ⚠ 2x within session                │  │
 │  │ STATE.md                                                     │  │
 │  │ ROADMAP.md                                                   │  │
 │  │ billing.ts, email.ts, branding.ts, sales.ts  (codebase scan) │  │
 │  │ app-sidebar.tsx, next.config.ts, package.json                │  │
 │  ╰──────────────────────────────────────────────────────────────╯  │
 │                                                                     │
 │  Writes: 13-CONTEXT.md, DECISIONS.md (DEC-059→066), 13-01-PLAN.md │
 └─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │  STEP 2: PLAN-REVIEW                  8m | 32 tools | 704KB       │
 │  ctx: 2 ← first ctx usage! | mem: 0 | agents: 0                   │
 │                                                                     │
 │  Flow: Skill → TSearch → CTX_SEARCH → Bash×2 → Read×3 → Grep →    │
 │        Read × Bash → Read × Grep → Read → Edit×2 → Read →          │
 │        CTX_SEARCH → Edit × Write × Bash → Read → Write             │
 │                                                                     │
 │  ╭─ Reads (3 unique, 4 dupes!) ─────────────────────────────────╮  │
 │  │ 13-01-PLAN.md             ⚠ 2x  ← also read by build       │  │
 │  │ 13-CONTEXT.md             ⚠ 2x  ← also read by build       │  │
 │  │ DECISIONS.md              ⚠ 3x  ← WORST: read 3x in 1 sess │  │
 │  ╰──────────────────────────────────────────────────────────────╯  │
 │                                                                     │
 │  📊 context-mode used 2x (ctx_search) — searched for existing      │
 │     decisions and patterns before reading files. But STILL read     │
 │     DECISIONS.md 3 times!                                           │
 │                                                                     │
 │  Writes: 13-01-PLAN.md, 13-CONTEXT.md, DECISIONS.md, 13-REVIEW.md │
 └─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │  STEP 3: BUILD                         29m | 66 tools | 759KB     │
 │  ctx: 0 | mem: 0 | agents: 5          ← LONGEST BUILD             │
 │                                                                     │
 │  Flow: Skill → Read×8 → Agent → Read×2 → Bash → Agent×2 →         │
 │        Read×4 → Bash×3 → Read → Bash → Read×2 → Grep → Bash →     │
 │        Read×3 → Agent → Read×5 → Edit×2 → Bash×5 → Read →         │
 │        Agent → Bash×2 → Edit → Read → Bash×7 → Agent → Bash       │
 │                                                                     │
 │  ╭─ Reads (23 unique, 5 dupes!) ────────────────────────────────╮  │
 │  │ email.ts                  ⚠ 3x  ← modified then re-read     │  │
 │  │ app-sidebar.tsx           ⚠ 2x                               │  │
 │  │ invoices.test.ts          ⚠ 3x  ← test iteration loop       │  │
 │  │ 13-01-PLAN.md             ← RE-READ from plan-review        │  │
 │  │ 13-CONTEXT.md             ← RE-READ from plan-review        │  │
 │  │ billing.ts, email.ts, branding.ts  ← RE-READS from P-W      │  │
 │  │ + 15 new files (migration, UI, tests, PDF)                   │  │
 │  ╰──────────────────────────────────────────────────────────────╯  │
 │                                                                     │
 │  5 Agents spawned (wave execution):                                 │
 │    Task 1: Migration + invoice generation core                      │
 │    Task 3: Payments page + mark-as-paid dialog                      │
 │    Task 4: Invoice list + detail + PDF route                        │
 │    Task 5: Sidebar navigation updates                               │
 │    Task 6: Extended unit tests + E2E tests                          │
 │                                                                     │
 │  Writes: email.ts(4), invoices.test.ts(2), 13-01-SUMMARY.md        │
 └─────────────────────────────────────────────────────────────────────┘

 ┌─── CROSS-SESSION FILE REDUNDANCY ──────────────────────────────────┐
 │                                                                     │
 │  File                    │ P-W │ P-R │ Build │ Total               │
 │  ────────────────────────┼─────┼─────┼───────┼──────               │
 │  DECISIONS.md            │  2  │  3  │   -   │  5 reads  🔴🔴     │
 │  13-01-PLAN.md           │  -  │  2  │   1   │  3 reads            │
 │  13-CONTEXT.md           │  -  │  2  │   1   │  3 reads            │
 │                                                                     │
 │  🔴 DECISIONS.md: 5 reads across 2 sessions, 3x in plan-review    │
 │     alone. By Phase 13 this file has 66 decisions = ~8KB.          │
 │     Each read wastes context tokens on 50+ irrelevant decisions.   │
 │                                                                     │
 │  📊 email.ts read 3x in build — classic "edit-read-edit" loop     │
 │     where the agent modifies, re-reads to verify, modifies again.  │
 │     This is expected behavior, not waste.                           │
 │                                                                     │
 │  📊 invoices.test.ts 3x — test iteration (write, run, fix, run).  │
 │     Also expected.                                                  │
 └─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 8: Channel-Agnostic Sales (The Messiest Phase)

**~55 min | 8 sessions (!) | 310 tool calls | Orchestrator retried steps**

```
╔══════════════════════════════════════════════════════════════════════════╗
║  PHASE 8: CHANNEL-AGNOSTIC SALES — The Retry Phase                   ║
║  03:52 → 04:22 UTC | ~55 min | 8 sessions | 310 tools                ║
║  ⚠ Orchestrator ran 2 plan-reviews, 2 builds, 2 reviews              ║
╚══════════════════════════════════════════════════════════════════════════╝

 ┌─ PLAN-WORK ─ 7m ─ 57 tools ────────────────────────────────────────┐
 │  Reads: 11/13 | DECISIONS.md(2x) STATE.md(2x)                      │
 │  Writes: 08-CONTEXT.md, DECISIONS.md, STATE.md, 08-01-PLAN.md      │
 └─────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
 ┌─ PLAN-REVIEW #1 ─ 5m ─ 29 tools ── ctx:3 ──────────────────────────┐
 │  Reads: 5/8 | 08-01-PLAN.md(2x) 08-CONTEXT.md(2x) DECISIONS(2x)   │
 │  3 ctx_search calls — but STILL double-read the same files!         │
 └─────────────────────────────────────────────────────────────────────┘
                    │
                    ▼  ⚠ Something went wrong — orchestrator retried
 ┌─ (interactive) ─ 1m ─ 7 tools ─────────────────────────────────────┐
 │  Reads: 6 files (investigation session)                             │
 └─────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
 ┌─ PLAN-REVIEW #2 ─ 7m ─ 46 tools ───────────────────────────────────┐
 │  Reads: 16/17 — ALMOST EVERYTHING re-read from scratch!            │
 │  DECISIONS.md(2x) again                                             │
 │  ⚠ This session reads 16 files because it has no memory of #1      │
 └─────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
 ┌─ BUILD #1 ─ 17m ─ 37 tools ── 7 agents ────────────────────────────┐
 │  Reads: 7/9 | sales.ts(3x) — edit-read-edit loop                   │
 └─────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
 ┌─ BUILD #2 ─ 13m ─ 50 tools ── 7 agents ────────────────────────────┐
 │  Reads: 9/11 | royalty-config-form(2x) SUMMARY(2x)                 │
 │  ⚠ Second build session — likely phase completion verification      │
 └─────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
 ┌─ REVIEW #1 ─ 4m ─ 36 tools ────────────────────────────────────────┐
 │  Reads: 4/6 | royalty-config-form(3x)                               │
 └─────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
 ┌─ REVIEW #2 ─ 5m ─ 38 tools ────────────────────────────────────────┐
 │  Reads: 5/7 | page.tsx(3x)                                         │
 └─────────────────────────────────────────────────────────────────────┘

 ┌─── WASTE ANALYSIS ─────────────────────────────────────────────────┐
 │                                                                     │
 │  DECISIONS.md: read 7x across 4 sessions (2x + 2x + 2x + 1x)     │
 │  08-01-PLAN.md: read 6x across 5 sessions                          │
 │  08-CONTEXT.md: read 6x across 5 sessions                          │
 │  sales.ts: read 5x across 3 sessions                               │
 │                                                                     │
 │  The retry doubled the plan-review cost: 29 + 46 = 75 tools        │
 │  vs the expected single session of ~32 tools.                       │
 │  Plan-review #2 re-read ALL 16 files from scratch with zero         │
 │  memory of what #1 had already reviewed.                            │
 └─────────────────────────────────────────────────────────────────────┘
```

---

## Comparison: All Phases Side-by-Side

```
Phase  │ Sessions │ Tools │ Dur  │ Intra-dupes │ Cross-session re-reads │ ctx │ mem
───────┼──────────┼───────┼──────┼─────────────┼────────────────────────┼─────┼────
  8    │    8     │  310  │ 55m  │     12      │  DECISIONS(7x)         │  3  │  0
  9    │    4     │  170  │ 30m  │      0      │  roles.ts(4x)          │  0  │  0
 10    │    4     │  167  │ 40m  │      3      │  DECISIONS(5x)         │  0  │  0
 11    │    4     │  155  │ 30m  │      4      │  DECISIONS(5x)         │  0  │  0
 12    │    5     │  222  │ 39m  │      5      │  DECISIONS(7x)         │  0  │  0
 13    │    3     │  144  │ 45m  │      9      │  DECISIONS(5x)         │  2  │  0
───────┼──────────┼───────┼──────┼─────────────┼────────────────────────┼─────┼────
TOTAL  │   28     │ 1168  │ 239m │     33      │  DECISIONS ~34 reads   │  5  │  0
```

## The DECISIONS.md Problem (Visualized)

```
Phase 8:  ████████████████████████████ 28 decisions (read 7x)
Phase 9:  ██████████████████████████████████████ 38 decisions (read 4x)
Phase 10: ██████████████████████████████████████████████ 46 decisions (read 5x)
Phase 11: ████████████████████████████████████████████████████ 52 decisions (read 5x)
Phase 12: █████████████████████████████████████████████████████████ 58 decisions (read 7x)
Phase 13: ██████████████████████████████████████████████████████████████████ 66 decisions (read 5x)

Each read consumes ALL decisions, but each phase only needs its own ~8 decisions.
By Phase 13: reading 66 decisions to find 8 relevant ones = 88% waste.
```

## Context-Mode & Claude-Mem Usage (Visualized)

```
                    context-mode         claude-mem
                    ────────────         ──────────
Plan-work:          ░░░░░░░░░░ 0%       ░░░░░░░░░░ 0%
Plan-review:        ▓░░░░░░░░░ 3%       ░░░░░░░░░░ 0%
Build:              ░░░░░░░░░░ 0%       ░░░░░░░░░░ 0%
Review:             ▓░░░░░░░░░ 3%       ░░░░░░░░░░ 0%
Auto orchestrator:  ▓▓▓▓░░░░░░ 17%     ░░░░░░░░░░ 0%
Interactive:        ▓▓▓▓▓░░░░░ 13%     ▓▓▓▓▓░░░░░ 15%

The plugins that are supposed to save context are essentially dormant
in the automated pipeline. Only interactive sessions use them.
```

## Ideal vs Actual: What a Phase SHOULD Look Like

```
IDEAL (with working plugins):
┌─────────┐    ┌─────────────┐    ┌───────┐    ┌────────┐
│Plan-Work │───→│ Plan-Review │───→│ Build │───→│ Review │
│          │    │             │    │       │    │        │
│ ctx_batch│    │ ctx_search  │    │ Agents│    │ctx_srch│
│ indexes: │    │ queries:    │    │ share │    │ quick  │
│ STATE    │    │ "decisions" │    │ index │    │ check  │
│ ROADMAP  │    │ "patterns"  │    │       │    │        │
│ DECISIONS│    │ "context"   │    │       │    │        │
│ codebase │    │             │    │       │    │        │
│          │    │ 0 re-reads  │    │ 0 re- │    │        │
│ mem:query│    │ of files    │    │ reads │    │        │
│ prior    │    │ already     │    │       │    │        │
│ decisions│    │ indexed     │    │       │    │        │
└─────────┘    └─────────────┘    └───────┘    └────────┘

ACTUAL (what happened):
┌─────────┐    ┌─────────────┐    ┌───────┐    ┌────────┐
│Plan-Work │───→│ Plan-Review │───→│ Build │───→│ Review │
│          │    │             │    │       │    │        │
│ Read×13  │    │ Read×14     │    │Read×13│    │ Read×7 │
│ (raw)    │    │ (raw)       │    │(raw)  │    │ (raw)  │
│          │    │             │    │       │    │        │
│ ctx: 0   │    │ ctx: 0      │    │ ctx:0 │    │ ctx: 0 │
│ mem: 0   │    │ mem: 0      │    │ mem:0 │    │ mem: 0 │
│          │    │             │    │       │    │        │
│ DECISIONS│    │ DECISIONS   │    │ DECI- │    │        │
│ read in  │    │ read again  │    │ SIONS │    │        │
│ full     │    │ in full     │    │ again │    │        │
└─────────┘    └─────────────┘    └───────┘    └────────┘
  Each session starts with ZERO knowledge of what prior sessions read.
  No indexed cache. No cross-session memory. Full re-read every time.
```
