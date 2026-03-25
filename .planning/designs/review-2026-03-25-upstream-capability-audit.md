# Plan Review: Upstream Capability Audit

**Date:** 2026-03-25
**Mode:** HOLD SCOPE
**Plan:** `.planning/phases/03-capability-audit/03-01-PLAN.md`

## What Already Exists

- `/fh:sync-upstream` with `upstream-registry.md` — tracks sources but doesn't assess capabilities
- `PATCHES.md` — documents deviations from upstream
- `COMPATIBILITY.md` — tracks version compatibility
- 130+ evals covering existing skills

## Dream State Delta

This plan creates the **foundation layer** (index + maintenance skill). The 12-month ideal (auto-detecting releases, suggesting integrations, draft PRs) builds on this foundation. After this ships, the gap registry becomes the roadmap for integration work.

## Architecture Diagram

```
  ┌─────────────────┐     ┌──────────────────┐
  │ /fh:sync-upstream│────▶│ /fh:audit-upstream│
  │ (pulls code)     │     │ (evaluates)       │
  └─────────────────┘     └────────┬─────────┘
                                    │
                      ┌─────────────┼─────────────┐
                      ▼             ▼             ▼
              .planning/upstream/
              ├── INDEX.md (dashboard + matrix + gaps)
              ├── superpowers.md
              ├── impeccable.md
              ├── gsd.md
              ├── gstack.md
              ├── feature-dev.md
              ├── claude-md-management.md
              ├── playwright-best-practices.md
              └── vercel-react-best-practices.md
```

## Error/Rescue Registry

| Error Type | Rescued? | Rescue Action | User Sees |
|------------|----------|---------------|-----------|
| FileNotFound (no upstream/) | Y | Create dir | "Initializing..." |
| FirstRunScenario | Y | Full generation | "First audit — creating full index" |
| UnknownUpstream | Y | Add new file | "New upstream detected: {name}" |
| NoDiffBaseline | Y | Full assessment | "No previous version — full assessment" |
| SkillRemoved | Y | Mark removed | "{name} removed from {upstream}" |
| MalformedSkill | Y (review) | Flag in file | "Warning: Unreadable" |
| UpstreamRemoved | Y (review) | Archive | "Archived: {source}" |
| SkillRenamed | Y (review) | Detect + update | Name updated in catalog |
| NoChanges | Y (review) | Short-circuit | "No changes since {date}" |
| WriteError | Y (review) | Report failure | Explicit error message |

## Failure Modes Registry

| Codepath | Failure Mode | Rescued? | Test? | User Sees? | Logged? |
|----------|-------------|----------|-------|------------|---------|
| SCAN | upstream/ missing | Y | N | Init message | N/A |
| DIFF | no baseline | Y | N | Full assess | N/A |
| ASSESS | empty skill | Y | N | Warning flag | N/A |
| UPDATE | write fail | Y | N | Error msg | N/A |

No CRITICAL GAPS remaining after review additions.

## Completion Summary

```
+====================================================================+
|            PLAN REVIEW — COMPLETION SUMMARY                        |
+====================================================================+
| Mode selected        | HOLD SCOPE                                  |
| System Audit         | Branch 2118 lines ahead, no conflicts       |
| Step 0               | HOLD SCOPE, all 4 truths valid              |
| Section 1  (Arch)    | 1 issue (split vs monolith) → RESOLVED: B   |
| Section 2  (Errors)  | 10 error paths mapped, 2 GAPS → fixed       |
| Section 3  (Security)| 0 issues (no attack surface)                |
| Section 4  (Data/UX) | 7 edge cases mapped, 3 unhandled → fixed    |
| Section 5  (Tests)   | 10 evals planned, 1 chain eval added        |
| Section 6  (Future)  | Reversibility: 5/5, debt items: 0           |
+--------------------------------------------------------------------+
| PLAN.md updated      | 3 truths added, 3 artifacts updated          |
| CONTEXT.md created   | 3 decisions locked, 4 items deferred         |
| Error/rescue registry| 10 error types, 0 CRITICAL GAPS             |
| Failure modes        | 4 total, 0 CRITICAL GAPS                     |
| Diagrams produced    | 1 (architecture)                             |
| Unresolved decisions | 0                                            |
+====================================================================+
```

## Unresolved Decisions

None. All questions resolved during review.
