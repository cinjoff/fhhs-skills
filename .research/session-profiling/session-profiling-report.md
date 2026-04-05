# Session Profiling Report: Phases 8-13 Auto Execution
**Date:** Mar 27, 2026 (03:42 - 11:36 UTC)
**Total sessions:** 32 | **Total tool calls:** 1,541

## Full Session Timeline

```
Time  | Dur  | Phase | Step             | Tools | ctx  mem  ag | Reads  Writes | Dupes | Size
──────┼──────┼───────┼──────────────────┼───────┼─────────────┼───────────────┼───────┼──────
03:42 |   2m | --    | (interactive)    |    26 |  0   0   1  |  3/3    W:0   |   0   | 132KB
                                          ── Phase 8: Channel-Agnostic Sales ──
03:52 |   7m | Ph08  | plan-work        |    57 |  0   0   1  | 11/13   W:4   |   2   | 430KB   STATE.md(2x) DECISIONS.md(2x)
03:57 |   5m | Ph08  | plan-review      |    29 |  3   0   0  |  5/8    W:4   |   3   | 648KB   08-01-PLAN(2x) 08-CONTEXT(2x) DECISIONS(2x)
03:57 |   3m | --    | (interactive)    |     0 |  0   0   0  |  0/0    W:0   |   0   |  10KB   [empty/error session]
03:58 |   1m | Ph08  | (interactive)    |     7 |  0   0   0  |  6/6    W:0   |   0   | 153KB
04:05 |   7m | Ph08  | plan-review #2   |    46 |  0   0   0  | 16/17   W:4   |   1   | 896KB   DECISIONS(2x)
04:15 |  17m | Ph08  | build            |    37 |  0   0   7  |  7/9    W:1   |   2   | 329KB   sales.ts(3x)
04:18 |  13m | Ph08  | build #2         |    50 |  0   0   7  |  9/11   W:2   |   2   | 472KB   royalty-config-form(2x) SUMMARY(2x)
04:19 |   4m | Ph08  | review           |    36 |  0   0   1  |  4/6    W:4   |   2   | 221KB   royalty-config-form(3x)
04:22 |   5m | Ph08  | review #2        |    38 |  0   0   1  |  5/7    W:2   |   2   | 250KB   page.tsx(3x)
                                          ── Phase 9: Invite-Only Auth ──
04:32 |  10m | Ph09  | plan-work        |    56 |  0   0   1  | 13/15   W:3   |   2   | 414KB   DECISIONS(2x) page.tsx(2x)
04:38 |   5m | Ph09  | plan-review      |    33 |  0   0   0  | 14/14   W:4   |   0   | 590KB   [clean!]
04:48 |  10m | Ph09  | build            |    36 |  0   0   7  |  8/8    W:1   |   0   | 310KB   [clean!]
04:53 |   5m | Ph09  | review           |    45 |  0   0   2  |  5/5    W:3   |   0   | 288KB   [clean!]
                                          ── Phase 10: Platform Hierarchy ──
05:02 |   9m | Ph10  | plan-work        |    65 |  0   0   1  | 12/13   W:3   |   1   | 481KB   DECISIONS(2x)
05:10 |   8m | Ph10  | plan-review      |    25 |  0   0   1  |  4/5    W:4   |   1   | 591KB   DECISIONS(2x)
05:27 |  17m | Ph10  | build            |    48 |  0   0   7  | 16/17   W:2   |   1   | 471KB   roles.ts(2x)
05:33 |   6m | Ph10  | review           |    29 |  0   0   1  |  5/5    W:3   |   0   | 254KB
                                          ── Phase 11: White-Label Branding ──
05:45 |  11m | Ph11  | plan-work        |    55 |  0   0   2  | 13/14   W:3   |   1   | 414KB   DECISIONS(2x)
05:51 |   6m | Ph11  | plan-review      |    25 |  0   0   0  | 13/15   W:4   |   2   | 527KB   DECISIONS(2x) env.ts(2x)
06:02 |  10m | Ph11  | build            |    45 |  0   0   5  | 12/13   W:3   |   1   | 378KB   app-sidebar(2x)
06:05 |   3m | Ph11  | review           |    30 |  0   0   1  |  4/7    W:2   |   3   | 244KB   branding-form(2x) actions(3x)
                                          ── Phase 12: Billing Profiles ──
06:24 |  19m | Ph12  | plan-work        |   100 |  0   0   5  | 15/18   W:8   |   3   | 1017KB  DECISIONS(3x) 12-01-PLAN(2x)
06:28 |   4m | Ph12  | plan-review      |    31 |  0   0   0  | 10/12   W:4   |   2   | 438KB   12-01-PLAN(2x) DECISIONS(2x)
06:36 |   7m | Ph12  | build            |    32 |  0   0   5  |  7/7    W:1   |   0   | 277KB   [clean!]
06:37 |   1m | Ph12  | review           |    13 |  0   0   0  |  7/7    W:0   |   0   | 183KB   [clean!]
                                          ── Phase 13: Pending Payments & Invoicing ──
06:45 |   8m | Ph12→13 | plan-work      |    46 |  0   0   2  | 10/11   W:3   |   1   | 538KB   DECISIONS(2x)
06:53 |   8m | Ph13  | plan-review      |    32 |  2   0   0  |  3/7    W:4   |   4   | 704KB   13-01-PLAN(2x) 13-CONTEXT(2x) DECISIONS(3x)
07:21 |  29m | Ph13  | build            |    66 |  0   0   5  | 23/28   W:3   |   5   | 759KB   email(3x) sidebar(2x) tests(3x)
07:28 |   6m | --    | review           |    44 |  6   0   2  |  6/11   W:6   |   5   | 409KB   generate(3x) page(2x) page(3x)
                                          ── Post-auto: Interactive Sessions ──
09:50 | 396m | --    | fh:auto          |   200 | 33   0   4  | 22/41   W:17  |  19   | 2700KB  MEMORY(2x) STATE(2x) ROADMAP(4x)
11:36 | 135m | --    | (interactive)    |   162 | 20  25   1  | 18/24   W:13  |   6   | 2354KB  layout(3x) roles(3x) auth(3x)
```

## By Step Type (Averages)

| Step         | Sessions | Avg Tools | ctx | mem | Agents | Avg Reads | Dupe Reads | Avg Writes | Avg Dur |
|-------------|----------|-----------|-----|-----|--------|-----------|------------|------------|---------|
| plan-work    | 6        | 63        | 0   | 0   | 2      | 14        | 10 total   | 4          | 11m     |
| plan-review  | 7        | 32        | 1   | 0   | 0      | 11        | 13 total   | 4          | 6m      |
| build        | 7        | 45        | 0   | 0   | 6      | 13        | 11 total   | 2          | 15m     |
| review       | 7        | 34        | 1   | 0   | 1      | 7         | 12 total   | 3          | 4m      |
| (interactive)| 4        | 48        | 4   | 6   | 1      | 8         | 6 total    | 3          | 35m     |
| fh:auto      | 1        | 200       | 33  | 0   | 4      | 41        | 19 total   | 17         | 396m    |

## Most Duplicated Files (Within Sessions)

These files were re-read multiple times within the same session — wasted context tokens:

| File | Sessions with dupes | Total extra reads |
|------|-------------------|------------------|
| `.planning/DECISIONS.md` | **13** sessions | ~15 extra reads |
| `.planning/phases/*/PLAN.md` | 5 sessions | ~7 extra reads |
| `src/lib/roles.ts` | 3 sessions | ~4 extra reads |
| `src/lib/auth.ts` | 3 sessions | ~4 extra reads |
| `src/app/(protected)/layout.tsx` | 3 sessions | ~4 extra reads |
| `src/components/app-sidebar.tsx` | 2 sessions | ~2 extra reads |
| `royalty-config-form.tsx` | 2 sessions | ~3 extra reads |

## Key Findings

### 1. context-mode is barely used in auto sessions
- **27 of 32 sessions had ZERO context-mode usage** (84%)
- The 5 sessions that used it were: 2 plan-reviews (3 and 2 calls), 1 review (6 calls), the fh:auto orchestrator (33 calls), and the interactive session (20 calls)
- **plan-work and build never use context-mode** despite the SKILL.md mentioning "Context-Mode Acceleration"
- This means every `claude -p` subprocess does raw Read/Grep/Glob, flooding its context window

### 2. claude-mem is never used in auto sessions
- **31 of 32 sessions had ZERO claude-mem usage** (97%)
- Only the interactive session (your current conversation) used it (25 calls)
- `claude -p` sessions don't seem to activate the claude-mem MCP server, or the agents don't know to query it

### 3. DECISIONS.md is the #1 context waste
- Read 2-3x within 13 of 32 sessions
- Every plan-work reads it, then plan-review reads it again, then build reads it again — and sometimes the same session reads it twice
- This file grows with every phase (38 decisions by Phase 13) — increasingly expensive

### 4. Phase 9 was the most context-efficient
- All 4 sessions had 0 duplicate reads
- Clean plan-work → plan-review → build → review with no re-reads

### 5. Phase 8 was the least efficient
- 9 sessions (2 plan-reviews, 2 builds, 2 reviews) — the orchestrator restarted steps
- Multiple duplicate reads of the same plan/context files

### 6. Build sessions use Agent tool heavily (5-7 agents per build)
- This is the wave-based parallelization from fh:build
- But agents don't benefit from context-mode — each agent starts fresh and reads files independently

### 7. Phase 13 (largest) had the most dupes
- Build session: 23 unique reads, 28 total (5 dupes) — email.ts(3x), tests(3x)
- Plan-review: DECISIONS.md read 3x in one session

## Recommendations

1. **Make plan-work/build use context-mode**: The "Context-Mode Acceleration" sections in SKILL.md are dead code — `claude -p` sessions either don't have context-mode available or the skills don't actually invoke it
2. **Cache DECISIONS.md across phases**: Since it's read in every session, consider having the orchestrator inject relevant decisions into each `claude -p` prompt instead of the agent re-reading the full file
3. **Investigate MCP availability in `claude -p`**: The reason context-mode and claude-mem show 0 usage in auto sessions may be that MCP plugins aren't loaded for `claude -p` subprocess sessions
4. **Pre-index key files**: Have the orchestrator run `ctx_batch_execute` at session start to index STATE.md, ROADMAP.md, DECISIONS.md, and CONTEXT.md once
5. **Deduplicate DECISIONS.md reads**: Plan-review especially reads it 2-3x — first in PRE-REVIEW AUDIT, then during scope challenge, then when updating. A single read at the start would suffice
