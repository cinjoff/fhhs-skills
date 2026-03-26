---
name: fh:auto
description: Run autonomous execution — plans, reviews, builds, and reviews each phase without human intervention. Use when the user says 'auto', 'run autonomously', 'hands-off', or 'walk away'.
user-invocable: true
---

Run fully autonomous multi-phase execution. Plans, reviews, builds, and reviews each phase without human intervention.

What to run autonomously: $ARGUMENTS

---

## Step 1: Validate Prerequisites

Check that the project is set up for autonomous execution:

1. **`.planning/PROJECT.md` exists** — if missing: "No project found. Run `/fh:new-project` first to set up project tracking." Stop.
2. **`.planning/ROADMAP.md` exists** — if missing: "No roadmap found. Run `/fh:new-project` to generate a roadmap." Stop.
3. **`.planning/STATE.md` exists** — if missing: "No state tracking found. Run `/fh:new-project` to initialize state." Stop.

Read STATE.md and ROADMAP.md to determine current position, total phases, and which phases are incomplete.

---

## Step 2: Parse Arguments

Parse `$ARGUMENTS` for flags:

| Flag | Behavior |
|------|----------|
| `--resume` | Resume from last crash/stop point. Read STATE.md for the last completed step and continue from there. |
| `--phase N` | Run only phase N (skip all others). |
| `--dry-run` | Show what would run without executing. See Step 3. |
| `--budget N` | Set cost ceiling in dollars. Passed to the orchestrator as `--budget N`. |
| `--check-corrections` | Run decision correction cascade instead of normal execution. See Step 7. |
| *(no flags)* | Run all incomplete phases from current position in STATE.md. |

Determine `START_PHASE` and `END_PHASE`:
- `--phase N`: both are N
- `--resume`: START_PHASE = phase from STATE.md's last position, END_PHASE = last phase in ROADMAP
- Default: START_PHASE = first incomplete phase, END_PHASE = last phase in ROADMAP

---

## Step 3: Dry-Run Mode

If `--dry-run` is set:

1. Read ROADMAP.md and STATE.md
2. List each phase that would execute (from START_PHASE to END_PHASE, skipping completed phases)
3. For each phase, show the per-phase loop steps:
   ```
   Phase N: {phase name}
     1. /fh:plan-work  → produces PLAN.md
     2. /fh:plan-review → HOLD SCOPE review
     3. /fh:build       → executes plan
     4. /fh:review --quick → final code review
     5. Update STATE.md via gsd-tools
   ```
4. Report total phases to execute and exit. Do not set AUTO_MODE or invoke the orchestrator.

---

## Step 4: Set AUTO_MODE

Enable autonomous advance so downstream skills (build, plan-work) make decisions without stopping:

```bash
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs config-set workflow.auto_advance true
```

Confirm the config was set successfully before proceeding.

---

## Step 5: Shell Out to Orchestrator

Invoke the Node.js orchestrator for process-isolated phase execution:

```bash
node .claude/skills/auto/auto-orchestrator.cjs \
  --project-dir "$(pwd)" \
  --start-phase "${START_PHASE}" \
  --end-phase "${END_PHASE}" \
  ${BUDGET:+--budget $BUDGET} \
  ${DRY_RUN:+--dry-run} \
  ${RESUME:+--resume}
```

The orchestrator runs each phase through a sequential loop using `claude -p` for fresh-context sessions:

```
Per-phase loop:
1. claude -p "/fh:plan-work plan N for phase X"     → produces PLAN.md
2. claude -p "/fh:plan-review .planning/phases/..."  → HOLD SCOPE review
3. claude -p "/fh:build .planning/phases/..."        → executes plan
4. claude -p "/fh:review --quick"                    → final code review
5. Update STATE.md via gsd-tools
```

Each step is a separate `claude -p` session with fresh context. The orchestrator handles crash recovery, state persistence to `.planning/`, and budget tracking.

Monitor the orchestrator's stdout for progress updates. If the orchestrator exits with a non-zero code, read its error output and report the failure point.

---

## Step 6: Completion or Interruption

Whether the orchestrator completes successfully or is interrupted, always:

1. **Reset AUTO_MODE:**
   ```bash
   node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs config-set workflow.auto_advance false
   ```

2. **Report final state:**
   - Phases completed (e.g., "Completed phases 3-5 of 8")
   - Total decisions logged to `.planning/DECISIONS.md`
   - Any LOW confidence decisions that need human review (flagged with `⚠ NEEDS REVIEW`)
   - If interrupted: the exact stop point so `--resume` can pick up

3. **Read final STATE.md** and confirm it reflects the orchestrator's last successful step.

---

## Step 7: Decision Correction Cascade (`--check-corrections`)

When invoked with `--check-corrections`, the orchestrator runs in a separate mode that does NOT execute the normal phase loop. Instead:

1. Reads `.planning/DECISIONS.md` for entries with `Status: CORRECTED`
2. For each CORRECTED entry, parses the `Affects` field to identify impacted artifacts
3. Classifies each correction as **Mechanical** (string/config changes) or **Architectural** (design changes)
4. Mechanical corrections are auto-fixed via `claude -p` sessions targeting the affected files
5. Architectural corrections produce a `.planning/CORRECTION-PLAN.md` for manual review
6. Logs a cascade analysis decision entry summarizing what was processed

Invoke via:
```bash
node .claude/skills/auto/auto-orchestrator.cjs --project-dir "$(pwd)" --check-corrections
```

This mode is useful after a human reviews DECISIONS.md and marks entries as CORRECTED — the cascade propagates those corrections to affected artifacts automatically where possible.
