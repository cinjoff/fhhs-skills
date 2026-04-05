# Task State Protocol

Lightweight state tracking for build task execution — enables resume, retry, and cleanup.

## State File

**Location:** `.planning/build/task-{plan}-{task-id}-state.md`

**Example:** `.planning/build/task-24-10-task-3-state.md`

**Format:**

```yaml
---
plan: "24-10"
task_id: "task-3"
title: "Integrate task state into build pipeline"
status: in-progress
wave: 1
attempts: 1
started_at: "2026-04-05T14:32:00Z"
completed_at: ""
error: ""
---

## Subagent Output

(pasted from subagent response on completion or failure)
```

## Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Created, not yet dispatched |
| `in-progress` | Subagent dispatched, awaiting result |
| `completed` | Subagent returned success |
| `failed` | Subagent returned error or triage flagged blocker |
| `blocked` | Dependency not met — prior wave incomplete |

## State Transitions

```
pending → in-progress  (on dispatch)
in-progress → completed  (on success)
in-progress → failed     (on error or triage blocker)
failed → in-progress     (on retry, attempts++)
blocked → pending        (when blocking wave completes)
```

Max attempts: **2**. If `attempts >= 2` and status is `failed`, escalate to user.

## Resume Protocol

At the start of Step 1 (Find the Plan), after locating the plan file:

1. Check `.planning/build/` for `task-{plan}-*-state.md` files.
2. If any exist:
   - `completed` → skip (task is done)
   - `in-progress` → treat as `pending` (subagent was interrupted mid-run)
   - `pending` / `failed` (attempts < 2) → re-dispatch
   - `failed` (attempts >= 2) → surface to user before proceeding
   - `blocked` → re-evaluate once blocking wave finishes
3. Report: "Resuming plan {X}: {N} tasks completed, {M} remaining."

## Retry Protocol

On post-wave triage (from `wave-execution.md`) when a task fails:

1. Read the state file — check `attempts`.
2. If `attempts < 2`: increment `attempts`, update `error` field with the failure summary, set `status: pending`, re-dispatch the subagent with the error context appended to the prompt:
   ```
   ## Retry Context
   Previous attempt failed: {error}
   Fix this specific issue and complete the task.
   ```
3. If `attempts >= 2`: set `status: failed`, escalate.

**Adaptive escalation:**
- Single isolated failure → retry
- Architectural failure (wrong interfaces, missing deps) → stop wave, escalate to user
- Multiple failures in same wave → stop, surface all errors, ask user to intervene

## Cleanup

After SUMMARY.md is written and committed (end of Step 4):

```bash
mkdir -p .planning/build/archive
mv .planning/build/task-{plan}-*-state.md .planning/build/archive/ 2>/dev/null || true
```

Archive keeps history without cluttering the active directory. Do not delete — archived state aids post-mortems.
