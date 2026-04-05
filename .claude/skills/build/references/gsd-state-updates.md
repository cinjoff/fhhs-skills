# GSD State Updates

Run these after SUMMARY.md is committed. Skip entirely if not in GSD mode.

## Commands

```bash
# Batch state update (single I/O cycle)
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state finalize-plan \
  --phase "${PHASE}" --plan "${PLAN}" \
  --duration "${DURATION}" --tasks "${TASK_COUNT}" --files "${FILE_COUNT}" \
  --decision "${DECISION_TEXT}"
```

## Manual Fallback

Use these individual commands if the batch command is unavailable or you need granular control:

```bash
# Advance plan counter
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state advance-plan

# Recalculate progress bar from disk state
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state update-progress

# Record execution metrics
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state record-metric \
  --phase "${PHASE}" --plan "${PLAN}" --duration "${DURATION}" \
  --tasks "${TASK_COUNT}" --files "${FILE_COUNT}"

# Add decisions from SUMMARY key-decisions
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state add-decision \
  --phase "${PHASE}" --summary "${DECISION_TEXT}"

# Update session info
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state record-session \
  --stopped-at "Completed ${PHASE}-${PLAN}-PLAN.md"

# Update ROADMAP progress
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap update-plan-progress "${PHASE}"
```

## Commit

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${PHASE}-${PLAN}): update state and roadmap" --files .planning/STATE.md .planning/ROADMAP.md
```

## Phase Completion

After state updates, check if all plans in the phase are complete:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" verify phase-completeness "${PHASE_NUM}"
```

If complete, mark the phase done:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" phase complete "${PHASE_NUM}"
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${PHASE}): phase verified and complete" --files .planning/STATE.md .planning/ROADMAP.md
```
