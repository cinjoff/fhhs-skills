---
type: review-summary
date: 2026-03-29
plan: 05-04 (post-execution review) → 05-05 (new plan)
mode: SCOPE EXPANSION
---

# Plan Review: Serena Integration Expansion

## Mode: SCOPE EXPANSION

User challenged three assumptions from the deep research:
1. Serena's file tools dismissed as redundant → partially right (symbol tools ARE superior, but `search_for_pattern` is still text-based regex)
2. map-codebase assumed superior to Serena onboarding → user correct to challenge this, Serena's symbol-aware exploration is genuinely richer
3. Serena memories dismissed vs claude-mem → needs research spike before deciding (no-memories is all-or-nothing, no bridge API exists)

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Serena as PRIMARY when installed | Aligns with Serena maintainers' recommendation; genuine new capabilities (rename, symbol editing, 40+ lang) |
| 2 | New plan 05-05 needed | 05-04 already shipped with conservative approach; expansion requires new scope |
| 3 | Memory architecture → research spike | 4 viable options, each with real tradeoffs; measure before committing |
| 4 | Shared Serena usage notes file | DRY: timeout/fallback/stale patterns referenced by all skills, not duplicated |
| 5 | map-codebase uses Serena symbols | Transforms architecture mapping from grep-based guessing to symbol graph navigation |

## Architecture Diagram

```
USER invokes skill (fix, refactor, extract, map-codebase, etc.)
    │
    ▼
SKILL checks: Is Serena MCP connected?
    │                              │
    YES (primary path)             NO (fallback path)
    │                              │
    ▼                              ▼
Serena symbol tools                Built-in LSP + Grep/Glob
├─ find_symbol                     ├─ goToDefinition
├─ find_referencing_symbols        ├─ findReferences
├─ get_symbols_overview            ├─ documentSymbol
├─ rename_symbol (unique)          └─ (no rename capability)
├─ replace_symbol_body (unique)
└─ insert_after/before (unique)
    │                              │
    ▼                              ▼
Shared Serena Usage Notes          Standard flow
├─ 30s timeout → fallback to LSP
├─ Partial rename → verify sites
└─ Stale state → restart LS + retry
```

## Error/Rescue Registry

| Method | Failure | Rescued? | Rescue Action | User Sees |
|--------|---------|----------|---------------|-----------|
| find_symbol | Serena not connected | Y | Fall back to LSP goToDefinition | Transparent |
| find_symbol | LS timeout | Y (via notes) | 30s timeout → LSP fallback | Transparent |
| rename_symbol | Partial rename | Y (via notes) | Verify all reference sites post-rename | Warning if incomplete |
| replace_symbol_body | Stale cache | Y (via notes) | restart_language_server + retry once | Transparent |
| Any Serena tool | LS not ready (first use) | Y | Fall back to LSP | Transparent |

## Test Coverage Gaps

| Codepath | Test Type | Status |
|----------|-----------|--------|
| fix: Serena primary | Eval | NEEDS UPDATE (currently "enhanced alternative") |
| refactor: Serena primary | Eval | NEEDS UPDATE |
| extract: Serena primary | Eval | NEEDS UPDATE |
| map-codebase: Serena symbols | Eval | NEW NEEDED |
| setup: optimal config | Eval | NEEDS UPDATE |
| Shared usage notes exist | Eval | NEW NEEDED |
| Memory spike results | Eval | DEFERRED to spike |

## Dream State Delta

```
CURRENT (05-04 shipped)              → 05-05 TARGET                    → 12-MONTH IDEAL
Serena = thin text overlay             Serena = primary code nav         Serena = semantic backbone
  in 3 skills                            in 5+ skills                      for ALL code-touching skills
                                         + map-codebase integration
map-codebase = grep-only               + Serena symbol exploration       + full symbol graph mapping
claude-mem = only memory               Memory spike decides              Unified memory bridge
Setup = basic install docs             + project.yml + ENABLE_TOOL_SEARCH  + auto-detection
```

## Completion Summary

```
+====================================================================+
|            PLAN REVIEW — COMPLETION SUMMARY                        |
+====================================================================+
| Mode selected        | SCOPE EXPANSION                             |
| System Audit         | 05-04 already executed, needs 05-05          |
| Step 0               | Serena as primary, new plan warranted        |
| Section 1  (Arch)    | 1 issue: integration too shallow             |
| Section 2  (Errors)  | 3 GAPS → shared usage notes pattern          |
| Section 3  (Security)| 0 issues (local MCP, no new attack surface)  |
| Section 4  (Data/UX) | 2 edge cases (LS startup, project activation)|
| Section 5  (Tests)   | 7 gaps (4 updates + 3 new)                   |
| Section 6  (Future)  | Reversibility: 4/5, debt items: 0            |
+--------------------------------------------------------------------+
| CONTEXT.md updated   | 6 review decisions, 1 deferred promoted       |
| Error/rescue registry| 5 methods mapped, 0 CRITICAL GAPS remaining  |
| Diagrams produced    | 2 (architecture, dream state delta)           |
| Unresolved decisions | 1 (memory architecture → research spike)     |
+====================================================================+
```
