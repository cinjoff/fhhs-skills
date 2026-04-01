# Plan Review: 05-04 External Tooling Integration

**Date:** 2026-03-29
**Mode:** HOLD SCOPE
**Plan:** `.planning/phases/05-context-mode/05-04-PLAN.md`
**Review rounds:** 2

## Completion Summary (Round 2)

```
+====================================================================+
|            PLAN REVIEW — COMPLETION SUMMARY (R2)                   |
+====================================================================+
| Mode selected        | HOLD SCOPE                                  |
| System Audit         | Clean — R1 fixes verified, research aligned  |
| Step 0               | HOLD — scope correct, 6 files, clean          |
| Section 1  (Arch)    | 0 issues — additive markdown, no coupling     |
| Section 2  (Errors)  | 0 GAPS — all Fallow errors caught by || ""    |
| Section 3  (Security)| 0 issues — --context ide-assistant mitigates   |
| Section 4  (Data/UX) | 1 fixed (LSP overlap note in setup)           |
| Section 5  (Tests)   | 4 evals, 0 gaps                               |
| Section 6  (Future)  | Reversibility: 5/5, debt items: 0             |
+--------------------------------------------------------------------+
| Section 7  (Eng Arch)| 1 fixed (step placement ambiguity)            |
| Section 8  (Code Ql) | 1 fixed (verify completeness)                 |
| Section 9  (Eng Test)| Test diagram below, 0 gaps                    |
| Section 10 (Perf)    | 0 issues — 30s timeouts appropriate            |
+--------------------------------------------------------------------+
| PLAN.md updated      | 0 new truths (R2), 0 artifacts added          |
| CONTEXT.md updated   | 3 decisions locked, 0 items deferred          |
| DECISIONS.md updated | 3 decisions logged (D-006, D-007, D-008)      |
| Error/rescue registry| Not needed — no new methods/services          |
| Failure modes        | 0 CRITICAL GAPS                               |
| Diagrams produced    | 1 (test coverage)                             |
| Unresolved decisions | 0                                             |
+====================================================================+
```

## Issues Found and Applied

### 1. CRITICAL: Missing `fallow dupes` in map-codebase

Research rates duplication detection as HIGH for map-codebase's concerns and architecture mappers. The simplify reference pattern includes all three commands (check + dupes + health). Plan only had check + health.

**Applied:** Added `fallow dupes --format json` to Task 1's bash block, post-filter, and agent prompt injection. Updated must_haves truth, artifact, done criteria, verification, and success criteria.

### 2. WARNING: Template syntax mismatch

Plan used `{if FALLOW_AVAILABLE}...{/if}` syntax not found in any existing skill. Simplify and review use natural language conditionals.

**Applied:** Rewrote Task 1 agent prompt injection to use natural language conditional ("only if Fallow data is non-empty") matching established patterns.

### 3. OK: Ambiguous step positioning

"Between check_existing and create_structure (or just before spawn_agent)" was redundant.

**Applied:** Simplified positioning instruction (already clear in the rewritten section).

## What Already Exists

- Fallow integration pattern: simplify/SKILL.md (check+dupes+health), review/SKILL.md (check+dupes+health with --changed-since), fix/SKILL.md (check+health at Step 0.5)
- Serena research: comprehensive at `.planning/research/serena-research.md`
- Setup Step 8 (Fallow): established pattern for optional tool installation

## Dream State Delta

```
CURRENT STATE              THIS PLAN                  12-MONTH IDEAL
Skills use LLM-only    →   4 skills get Fallow CLI    →   All analysis skills use
analysis. Fallow in        data + 3 skills reference      deterministic tools first,
simplify/review/fix/       Serena MCP tools with          LLM supplements gaps.
build only.                fallback.                      MCP-first architecture.
```

## Round 2 Issues Found and Applied

### 4. Step placement ambiguity (D-006)

Task 1 had "between check_existing and create_structure (or just before spawn_agent)" — two different positions. Fixed to "just before spawn_agent (after create_structure)" since data flows into spawn_agent's prompt.

### 5. Verify completeness gap (D-007)

Task 1 verify only checked `fallow check` but action adds check+dupes+health. Executor could skip dupes/health and pass verify. Fixed by adding grep checks for all three commands in both Task 1 verify and the plan verification section.

### 6. Serena/LSP overlap undocumented (D-008)

Research caveat #3 warns about duplicate tool descriptions when both Serena and built-in LSP are active. Setup step didn't mention this. Added brief overlap note to the setup Serena section.

## Test Coverage Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                  TEST COVERAGE DIAGRAM                           │
├────────────────────────────┬───────────┬─────────────────────────┤
│ CODEPATH                   │ TEST TYPE │ STATUS                  │
├────────────────────────────┼───────────┼─────────────────────────┤
│ map-codebase + Fallow      │ Eval      │ ✓ map-codebase-fallow   │
│ map-codebase no Fallow     │ Eval      │ ✓ map-codebase-no-fallow│
│ refactor + Fallow scope    │ Eval      │ ✓ refactor-fallow-scope │
│ fix + Serena fallback      │ Eval      │ ✓ serena-fallback       │
│ refactor + Serena fallback │ Eval      │ ✓ serena-fallback       │
│ extract + Serena fallback  │ Eval      │ ✓ serena-fallback       │
│ setup Serena step          │ Eval      │ — docs-only, no eval    │
└────────────────────────────┴───────────┴─────────────────────────┘
```

## Expansion Opportunity (deferred)

Wire Fallow into all 5 mapper agents individually with agent-specific filtering, extend Serena references to plan-work codebase scouting and plan-review architecture sections. Saved to CONTEXT.md Deferred Ideas.
