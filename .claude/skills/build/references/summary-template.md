# SUMMARY.md Template

Use this template when generating SUMMARY.md after plan execution.

## Location

`{phase}-{plan}-SUMMARY.md` in the same directory as PLAN.md.

## Scaffold with gsd-tools

```bash
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs template fill summary \
  --phase "${PHASE_NUM}" --plan "${PLAN_NUM}" \
  --name "${PLAN_DESCRIPTION}" \
  --fields '{"subsystem":"...", "duration":"...", "requirements-completed": [...]}'
```

This creates a pre-filled SUMMARY.md with correct frontmatter schema. Then fill in the body sections with execution-specific data.

## Manual fallback (if gsd-tools unavailable)

Construct with this YAML frontmatter:

```yaml
---
phase: {from PLAN.md}
plan: {from PLAN.md}
subsystem: {inferred: auth, payments, ui, etc.}
tags: []
requires:
  - phase: {dep phase}
    provides: "what it provided"
provides:
  - "what this plan delivered"
affects: [downstream IDs]
tech-stack:
  added: []
  patterns: []
key-files:
  created: []
  modified: []
key-decisions:
  - "decision and why"
requirements-completed: [copy requirements array from PLAN.md verbatim]
duration: {elapsed}
completed: {ISO timestamp}
---
```

## Body Sections

| Section | Content |
|---------|---------|
| Performance Metrics | Build time, test count, coverage delta |
| Task Commits | Table: Task \| Name \| Commit \| Key Files |
| What Was Done | Bullet summary of deliverables |
| Decisions Made | Table: Decision \| Rationale \| Alternatives Considered |
| Deviations from Plan | All deviation entries with rule number, description, fix, commit |
| Issues Encountered | Problems hit and how resolved (or "None") |
| Next Phase Readiness | What downstream plans can now proceed |

If design gates ran (frontend): also capture critique fixes, polish commit, normalize commit in Task Commits table and design deviations in Deviations section.

One-liner must be substantive: "JWT auth with refresh rotation using jose library" not "Authentication implemented"
