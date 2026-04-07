# Wave Execution Details

> **Smart Context Loading, Reference Warm-Up, and Subagent Prompt Placeholders are now inlined in SKILL.md Steps 2b-2e.**
> This file retains supplementary details that SKILL.md references for post-wave handling.

## Token Efficiency Notes

When executing tasks, be aware of tool call efficiency:
- **Default to Smart Explore** (smart_search/smart_outline/smart_unfold) for targeted lookups; escalate to Explore Agent only for open-ended synthesis
- **Avoid re-reading** files already in context from earlier steps (freshness check, plan read, CONTEXT.md injection)
- **Fallow output is authoritative** — do not re-derive dead code, complexity, or duplication findings that Fallow already provided
- **Note tool call patterns:** If you find yourself reading the same file multiple times across tasks, flag it as a context optimization opportunity in the SUMMARY.md

## claude-mem Context Acceleration

Before reading CONTEXT.md and DECISIONS.md files directly:
- Use `smart_search({query: "locked decisions for phase {phase}"})` and `smart_search({query: "decisions affecting {files}"})` to find relevant entries.
- Use `smart_outline` to understand file structure before editing. Don't read full files to find one function — use `smart_outline` then `smart_unfold`, then Read only when you need to Edit.

## Post-Wave Triage

claude-mem's PostToolUse hook automatically observes all file reads and edits from each wave's agents. Subsequent waves can query these observations via `search` or `timeline` — no explicit re-indexing needed.

Triage subagent outcomes:

**BLOCKED:** Surface immediately:
```
Task "{task}" is BLOCKED: {blocker}
Options:
  A) Fix the blocker and retry
  B) Skip and defer
  C) Adjust the plan
```
Do not proceed to the next wave until resolved or skipped.

**Interrupted/stuck:** Re-dispatch with revised prompt or clarify with user.

**Silent failure (no files changed):** Treat as BLOCKED.

**`classifyHandoffIfNeeded` false failure:** If a subagent reports "failed" with error containing `classifyHandoffIfNeeded is not defined`, this is a Claude Code runtime bug — not a task failure. Spot-check instead: verify key files exist on disk and no `## Self-Check: FAILED` marker is present. If spot-checks pass, treat as successful.

Once all tasks are accounted for:
1. **Spot-check:** verify key files from subagent reports exist on disk (`[ -f path ]`). Also check for `## Self-Check: FAILED` marker in any subagent report.
2. **Done criteria check:** compare each task's `done` criteria against subagent output — flag mismatches
3. **Report** results to user

## Pre-Wave Dependency Check (wave 2+ only)

Before dispatching each wave after wave 1, verify that artifacts from prior waves are actually present:

```bash
# For each plan in the upcoming wave, check key-links from prior waves:
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" verify key-links {phase_dir}/{plan}-PLAN.md 2>/dev/null
```

If any key-link from a prior wave's artifact fails verification:

```
## Cross-Plan Wiring Gap

| Plan | Link | From | Expected Pattern | Status |
|------|------|------|-----------------|--------|
| {plan} | {via} | {from} | {pattern} | NOT FOUND |

Wave N artifacts may not be properly wired. Options:
1. Investigate and fix before continuing
2. Continue (may cause cascading failures in next wave)
```

Key-links referencing files in the upcoming wave itself are skipped. If `gsd-tools verify key-links` is unavailable, skip silently.
