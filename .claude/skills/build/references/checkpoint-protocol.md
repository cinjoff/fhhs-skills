# Checkpoint Protocol

When a task has `type="checkpoint:*"`, the subagent must STOP and return structured state.

## Checkpoint Types

**checkpoint:human-verify (90%)** — Visual/functional verification needed.
Return: what was built, verification steps (URLs, commands, expected behavior).

**checkpoint:decision (9%)** — Implementation choice needed.
Return: decision context, options with pros/cons.

**checkpoint:human-action (1%)** — Unavoidable manual step (auth, 2FA, email link).
Return: what was automated, single manual step needed, verification command.

## Return Format

```
CHECKPOINT REACHED
Type: [human-verify | decision | human-action]
Progress: {completed}/{total} tasks
Completed Tasks: [task | commit hash | key files] per task
Current Task: [name, status, blocker]
Checkpoint Details: [type-specific content]
Awaiting: [what user needs to do]
```

## Auto-mode (when `AUTO_MODE` is `"true"`)

- `checkpoint:human-verify` → Auto-approve. Log `Auto-approved: [description]`. Continue.
- `checkpoint:decision` → Auto-select first option (planners front-load recommended). Log `Auto-selected: [option]`. Continue.
- `checkpoint:human-action` → Stop normally. Auth gates cannot be automated.

Log each auto-approval/auto-selection to `.planning/DECISIONS.md` using the decision entry format from `decisions-template.md` (co-located in this directory).
- For `checkpoint:human-verify`: `confidence=HIGH`, `rationale='Auto-approved — visual verification passed by evaluator.'`
- For `checkpoint:decision`: `confidence=MEDIUM`, `rationale='Auto-selected recommended option from planner.'`

## Standard mode

Present checkpoint to user, wait for response, then dispatch a **new subagent** for the next task. The continuation prompt must include:
- Completed tasks summary: task names + commit hashes (so it doesn't redo work)
- The user's checkpoint response (approval, decision choice, or confirmation of manual action)
- The next task's full content — same template format as original dispatch
- For `checkpoint:decision`: which option the user selected and why

## Authentication Gates

Auth errors (401, 403, "Not authenticated", "Please run X login") are gates, not failures. Subagent must:
1. Recognize it's an auth gate
2. STOP and return as `checkpoint:human-action`
3. Provide exact auth steps (CLI commands, where to get keys)
4. Specify verification command
