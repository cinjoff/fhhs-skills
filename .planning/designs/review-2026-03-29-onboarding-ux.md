# Plan Review: 04-02 UX & Onboarding

**Date:** 2026-03-29
**Mode:** HOLD SCOPE
**Plan:** `.planning/phases/04-ux-onboarding/04-02-PLAN.md`

## System Audit

- Branch `tracker-phase-detail` with recent Phase 04 tracker commits
- CONTEXT.md has 6 decisions + 4 prior review decisions + deferred ideas
- DECISIONS.md has D-001 through D-006 — all consistent with CONTEXT.md
- No phase RESEARCH.md exists (not needed for UX text changes)
- No codebase mapping exists
- Plan touches 9 files, all markdown skill files + evals.json

## Step 0: Scope Assessment

**Premise:** Correct problem to solve. Non-technical users hit dead ends when core skills show terse error messages without next steps.

**Existing code leverage:** All changes are additive text edits to existing skill files. No new abstractions, services, or files beyond evals.

**Dream state:**
```
CURRENT STATE                    THIS PLAN                      12-MONTH IDEAL
Skills show terse        --->    Core skills show standard  ---> All 47 skills have
"run X first" errors             → Run /fh:X — description       consistent UX with
No setup detection               Setup detection in progress     guided discovery,
Help is reference-only           Getting Started section          contextual tooltips,
                                 Setup --check mode               progressive disclosure
```

**Complexity check:** 9 files touched but each change is 5-20 lines of markdown. No new abstractions. Appropriate scope for HOLD.

**Expansion opportunity snapshot:** If EXPAND, the ambitious version would add an interactive onboarding wizard with experience-level detection and in-skill contextual tooltips. (Already in CONTEXT.md deferred ideas.)

## Section 1: Architecture Review — OK

No new system architecture. Changes are markdown instruction edits within existing skill files. The setup detection mechanism (symlink check) is appropriate — reuses existing artifact from setup Step 4.

```
  /fh:progress
       │
       ├── Check: ~/.claude/get-shit-done/bin/gsd-tools.cjs exists?
       │   ├── NO  → "Run /fh:setup"
       │   └── YES → Check: .planning/PROJECT.md exists?
       │       ├── NO  → "Run /fh:new-project"
       │       └── YES → Normal GSD routing
       │
  /fh:help
       │
       └── Getting Started (4 steps: setup → new-project → plan → build)
```

## Section 2: Error & Rescue Map — N/A

No new methods or services. Changes are markdown instructions that guide Claude's output text. No codepaths that can fail at runtime.

## Section 3: Security & Threat Model — OK

No new attack surface. The `$HOME` in the symlink check is standard shell variable, no injection risk. No new user input handling.

## Section 4: Data Flow & Edge Cases

**Edge case: symlink check false negative.** User ran setup but deleted `~/.claude/get-shit-done/` manually. They'd be told to re-run setup. **Benign** — running setup again is harmless (idempotent).

**Edge case: symlink check false positive.** User created the symlink manually without running full setup. They'd skip to "Run /fh:new-project". **Benign** — they have the tools, just not the full setup experience.

## Section 5: Test Review

```
  NEW UX FLOWS:
    - Progress setup routing (setup_complete check → two-path message)
    - Help Getting Started section (4-step flow)
    - Setup --check mode (status table without installing)

  NEW CODEPATHS:
    - Symlink existence check in progress
    - --check argument parsing in setup
    - Dependency check text in review, plan-review
    - Standardized error format in build, fix, refactor, plan-work

  EVAL COVERAGE:
    - Progress routing → Eval A (covered)
    - Setup --check → Eval B (covered)
    - Help Getting Started → not covered (low risk — static text)
    - Error format changes → not covered (low risk — text wording)
```

2 evals is sufficient for the behavioral changes. Static text changes don't warrant evals.

## Section 6: Long-Term Trajectory

- **Reversibility:** 5/5 — all changes are markdown text edits, trivially revertable
- **Technical debt:** None introduced
- **Path dependency:** None — future skills can adopt the error format incrementally
- **Knowledge concentration:** Low — the standard format `→ Run /fh:{command} — {description}` is self-documenting

## Critical Finding: /fh:verify Reference

**FIXED IN PLAN.** Getting Started originally listed `/fh:verify` as step 5. No `verify` skill exists in `.claude/skills/`. Reduced to 4 steps ending at `/fh:build` (which includes verification). Decision logged as D-006R in DECISIONS.md.

Deferred idea added: audit all `/fh:help` command references against actual skill inventory.

## Completion Summary

```
  +====================================================================+
  |            PLAN REVIEW — COMPLETION SUMMARY                        |
  +====================================================================+
  | Mode selected        | HOLD SCOPE                                  |
  | System Audit         | Clean — CONTEXT.md and DECISIONS.md aligned |
  | Step 0               | HOLD — scope appropriate                    |
  | Section 1  (Arch)    | 0 issues — markdown-only changes            |
  | Section 2  (Errors)  | N/A — no new codepaths                      |
  | Section 3  (Security)| 0 issues                                    |
  | Section 4  (Data/UX) | 2 edge cases mapped, both benign            |
  | Section 5  (Tests)   | 2 evals, sufficient for scope               |
  | Section 6  (Future)  | Reversibility: 5/5, debt: 0                |
  +--------------------------------------------------------------------+
  | Section 7  (Eng Arch)| 0 issues — no engineering architecture      |
  | Section 8  (Code Ql) | 0 DRY violations                           |
  | Section 9  (Eng Test)| 2 evals covering key behaviors              |
  | Section 10 (Perf)    | N/A — no runtime code                       |
  +--------------------------------------------------------------------+
  | PLAN.md updated      | 2 truths added, 0 artifacts added           |
  | CONTEXT.md updated   | 2 decisions locked, 2 items deferred        |
  | DECISIONS.md updated | 1 decision logged (D-006R)                  |
  | Diagrams produced    | 1 (progress routing flow)                   |
  | Unresolved decisions | 0                                           |
  +====================================================================+
```
