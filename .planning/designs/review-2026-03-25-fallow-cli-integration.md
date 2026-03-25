# Plan Review: Fallow CLI Integration (Plan 11)

**Date:** 2026-03-25
**Mode:** HOLD SCOPE
**Plan reviewed:** `.planning/11-PLAN.md`

## Completion Summary

```
+====================================================================+
|            PLAN REVIEW — COMPLETION SUMMARY                        |
+====================================================================+
| Mode selected        | HOLD SCOPE                                  |
| System Audit         | Clean branch, no TODOs in touched files      |
| Step 0               | Premise valid, must_haves solid, scope right |
| Section 1  (Arch)    | 3 issues found, all resolved                |
| Section 2  (Errors)  | 6 error paths mapped, 4 GAPS → resolved     |
| Section 3  (Security)| 0 issues (no new attack surface)            |
| Section 4  (Data/UX) | 1 edge case (dupes/health no --changed-since)|
| Section 5  (Tests)   | Adequate for markdown changes                |
| Section 6  (Future)  | Reversibility: 5/5, 0 debt items            |
+--------------------------------------------------------------------+
| PLAN.md updated      | 2 truths added, 1 artifact added            |
| CONTEXT.md updated   | N/A (no phase-level CONTEXT.md exists)      |
| Error/rescue registry| 7 error types, 4 GAPS rescued via Issue 4   |
| Failure modes        | 0 CRITICAL GAPS remaining                   |
| Diagrams produced    | 2 (architecture, data flow)                 |
| Unresolved decisions | 0                                           |
+====================================================================+
```

## Review Decisions (locked for executor)

1. **1A — Output filtering + size caps:** Fallow dupes and health output must be post-filtered to files in the diff, then capped at 200 lines. Prevents context blowout on large codebases.

2. **3A — build/SKILL.md added to scope:** Fallow orchestration (CLI invocation + injection) belongs in `build/SKILL.md` Step 3b, not as comments in the spec-gate template. Templates consume; orchestrators produce.

3. **4A — Error fallback pattern:** All fallow commands use `|| VAR=""` to ensure failed commands produce empty strings. Only non-empty outputs are injected into agent prompts. Pattern: `FALLOW_X=$(fallow ... 2>/dev/null) || FALLOW_X=""`

4. **5A — Post-filtering for dupes/health:** Since `fallow dupes` and `fallow health` don't support `--changed-since`, orchestrators must post-filter their output to entries involving files in the diff before injection.

5. **Base ref standardized:** All `--changed-since` refs use the review skill's existing robust pattern: `git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null || echo "HEAD~10"`

## What Already Exists

- Review skill's base-ref resolution pattern (line 31) — reused in simplify and build
- All 3 skills already have orchestrator → subagent → prompt injection architecture
- Spec-gate already checks for unwired code (lines 59-63) — Fallow replaces LLM inference here
- Review-prompt already has DRY and Dependency Direction sections — Fallow data supplements them

## Dream State Delta

This plan establishes the "optional static analysis tool" pattern:
```
check availability → run CLI → filter output → inject into agent context → fallback if missing
```
This same pattern applies to any future tool (Serena, npm audit, semgrep). The convention is set; future integrations follow the template.

## Diagrams

### Architecture (post-review)
```
Orchestrator (simplify/review/build)
  │
  ├─ command -v fallow?
  │   ├─ YES → run CLI commands (|| "" on failure)
  │   │         ├─ post-filter to diff files
  │   │         ├─ cap at 200 lines
  │   │         └─ inject non-empty outputs into agent prompts
  │   └─ NO  → skip silently
  │
  └─ dispatch agents (with or without Fallow data)
      ├─ Agent reads diff + optional "## Static Analysis Findings"
      └─ Agent uses Fallow as ground truth, LLM for judgment
```

### Data Flow (all 4 paths)
```
fallow CLI ──▶ JSON stdout ──▶ Shell variable ──▶ Post-filter ──▶ Agent prompt
    │               │               │                 │              │
    ▼               ▼               ▼                 ▼              ▼
[not found]    [malformed/     [|| "" sets     [>200 lines   [LLM reads as
 → skip]        crash → exit    to empty]       → truncate]   ground truth]
                 nonzero]
               [empty output                   [0 diff-
                → empty var]                    relevant
                                                → empty → skip]
```
