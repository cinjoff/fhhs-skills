---
name: fh:progress
description: Where am I? Shows project status and what to do next. Also resumes previous sessions.
user-invocable: true
---

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="git_and_session_context">
**Gather git state and cross-session context (always runs, no project dependency):**

### Git State

Collect the following via shell commands:

```bash
# Current branch
git rev-parse --abbrev-ref HEAD

# Uncommitted changes
git status --short

# Unpushed commits
git log @{upstream}..HEAD --oneline 2>/dev/null || echo "no upstream"

# Last commit
git log -1 --format="%h %s (%cr)"
```

Store: `branch`, `uncommitted_count`, `unpushed_count`, `last_commit_hash`, `last_commit_message`, `last_commit_time`.

### State Integrity Check

If `.planning/STATE.md` exists, compare its claims against actual files on disk:

| STATE.md Claim | Actual Disk State | Verdict |
|---|---|---|
| Phase N is IN_PROGRESS | `phases/{N}-*/` directory doesn't exist | **State corruption** |
| Phase N is COMPLETE | No SUMMARY.md in `phases/{N}-*/` | **State corruption** |
| Current phase is N | ROADMAP.md shows different phase | **State mismatch** |

If any corruption or mismatch is detected, flag it and store `state_corruption = true`. Will be surfaced in the report.

### claude-mem Cross-Session Context

Derive project name from `.planning/PROJECT.md` name field (fall back to basename of cwd). Use this as the `project` parameter for all claude-mem calls.

Try calling `mcp__plugin_claude-mem_mcp-search__timeline` with query=project name or current phase, depth_before=5, project=<project-name>.

- If the MCP tool call returns an error or is not available (plugin not installed), skip this entire substep -- add nothing to the report.
- If results are returned: take only the first 5 observations (hard cap). Store as `claude_mem_timeline`.

If a current phase name is known (from `.planning/STATE.md` or later from GSD init), also try `mcp__plugin_claude-mem_mcp-search__search` with query=the current phase name, project=<project-name>, limit=10 to surface related past work.

- Same error handling: if unavailable or errors, skip silently.
- Scan the returned index for relevant observation IDs — prioritize types: gotcha, decision, trade-off.
- For the top 2-3 relevant IDs, call `mcp__plugin_claude-mem_mcp-search__get_observations` with ids=[ID1, ID2, ID3] to fetch full details.
- Store the full observation details as `claude_mem_related` (hard cap 5 items).

Budget: less than 3% context for this entire substep.
</step>

<!-- Re-indexing step removed: claude-mem's PostToolUse hook automatically observes file reads.
     Planning docs become available to subsequent sessions via smart_search without explicit indexing. -->

<step name="init_context">
**Load GSD progress context (conditional -- skipped if no project):**

```bash
# Ensure GSD CLI symlink exists (self-heals if /fh:setup wasn't run)
if [ ! -f "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" ]; then
  _FHHS="$(ls -d "$HOME/.claude/plugins/cache/fhhs-skills/fh"/*/ 2>/dev/null | sort | tail -1)"
  _FHHS="${_FHHS%/}"
  if [ -n "$_FHHS" ] && [ -d "$_FHHS/bin" ]; then
    mkdir -p "$HOME/.claude/get-shit-done"
    ln -sfn "$_FHHS/bin" "$HOME/.claude/get-shit-done/bin"
    [ -d "$_FHHS/hooks" ] && ln -sfn "$_FHHS/hooks" "$HOME/.claude/get-shit-done/hooks"
  fi
fi

INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init progress)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Extract from init JSON: `project_exists`, `roadmap_exists`, `state_exists`, `phases`, `current_phase`, `next_phase`, `milestone_version`, `completed_count`, `phase_count`, `paused_at`, `state_path`, `roadmap_path`, `project_path`, `config_path`.

If `project_exists` is false (no `.planning/` directory):
- Set `gsd_available = false`
- Skip to the **report** step (git state and claude-mem context are still shown)

If missing STATE.md: note for report, suggest `/fh:new-project`.

**If ROADMAP.md missing but PROJECT.md exists:**

This means a milestone was completed and archived. Set `between_milestones = true` for routing.

If missing both ROADMAP.md and PROJECT.md: set `gsd_available = false`, skip GSD sections.
</step>

<step name="load">
**Use structured extraction from gsd-tools (only if gsd_available):**

Instead of reading full files, use targeted tools to get only the data needed for the report:
- `STATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state-snapshot)`

This minimizes orchestrator context usage.
</step>

<step name="analyze_roadmap">
**Get comprehensive roadmap analysis (only if gsd_available and roadmap exists):**

```bash
ROADMAP=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap analyze)
```

This returns structured JSON with:
- All phases with disk status (complete/partial/planned/empty/no_directory)
- Goal and dependencies per phase
- Plan and summary counts per phase
- Aggregated stats: total plans, summaries, progress percent
- Current and next phase identification

Use this instead of manually reading/parsing ROADMAP.md.
</step>

<step name="recent">
**Gather recent work context (only if gsd_available):**

- Find the 2-3 most recent SUMMARY.md files
- Use `summary-extract` for efficient parsing:
  ```bash
  node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" summary-extract <path> --fields one_liner
  ```
- This shows "what we've been working on"
  </step>

<step name="position">
**Parse current position from init context and roadmap analysis (only if gsd_available):**

- Use `current_phase` and `next_phase` from `$ROADMAP`
- Note `paused_at` if work was paused (from `$STATE`)
- Count pending todos: use `init todos` or `list-todos`
- Check for active debug sessions: `ls .planning/debug/*.md 2>/dev/null | grep -v resolved | wc -l`
  </step>

<step name="report">
**Present status report. Always include git state; include GSD sections only if gsd_available.**

### Always shown:

```
**Branch:** {branch} ({N uncommitted | clean} | {N unpushed | up to date})
**Last commit:** {last_commit_hash} {last_commit_message} ({last_commit_time})
```

If `state_corruption` is true:

```
## State Integrity Warning

STATE.md is out of sync with actual files on disk.
[table of mismatches from git_and_session_context step]

Run `/fh:health --repair` to fix.
```

If `claude_mem_timeline` or `claude_mem_related` has results:

```
## Cross-Session Context

From previous sessions:
- [observation summary 1]
- [observation summary 2]
- ...
```

Show up to 5 bullet points total across both timeline and related results. Deduplicate if the same observation appears in both.

### GSD sections (only if gsd_available):

Generate progress bar from gsd-tools:

```bash
PROGRESS_BAR=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" progress bar --raw)
```

```
# [Project Name]

**Progress:** {PROGRESS_BAR}
**Profile:** [quality/balanced/budget]

## Recent Work
- [Phase X, Plan Y]: [what was accomplished - 1 line from summary-extract]
- [Phase X, Plan Z]: [what was accomplished - 1 line from summary-extract]

## Current Position
Phase [N] of [total]: [phase-name]
Plan [M] of [phase-total]: [status]
CONTEXT: [checkmark if has_context | - if not]

## Key Decisions Made
- [extract from $STATE.decisions[]]
- [e.g. jq -r '.decisions[].decision' from state-snapshot]

## Blockers/Concerns
- [extract from $STATE.blockers[]]
- [e.g. jq -r '.blockers[].text' from state-snapshot]

## Pending Todos
- [count] pending -- /fh:todos to review

## Active Debug Sessions
- [count] active -- debug to continue
(Only show this section if count > 0)

## What's Next
[Next phase/plan objective from roadmap analyze]
```

### Non-GSD fallback (if gsd_available is false):

If `setup_complete = false`:

```
fhhs-skills is installed but not configured yet.

→ Run `/fh:setup` — one-time setup for tools, LSP, and hooks

This takes ~2 minutes and only needs to run once.
```

If `setup_complete = true` (no `.planning/` directory):

```
Setup complete. No project found.

→ Run `/fh:new-project` — set up vision, tech stack, and roadmap

This creates the `.planning/` directory that tracks your project.
```

</step>

<step name="route">
**Determine next action based on state.**

### Setup Detection

Check if fhhs-skills setup has been completed:

```bash
[ -f "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" ] && echo "SETUP_COMPLETE" || echo "SETUP_NEEDED"
```

Store as `setup_complete`.

### Pre-GSD routing (always evaluated first)

| Condition | Recommendation |
|-----------|---------------|
| User says "improve N" or wants to address a learnings item | Suggest running `/fh:learnings` to review and act on accumulated observations |
| Uncommitted changes (uncommitted_count > 0) | "Uncommitted work in {N} files. Review before continuing?" |
| State corruption detected | "STATE.md is out of sync with actual files. Run `/fh:health --repair` to fix." |
| `setup_complete = false` | "fhhs-skills is installed but not configured yet.

→ Run `/fh:setup` — one-time setup for tools, LSP, and hooks

This takes ~2 minutes and only needs to run once." |
| No `.planning/PROJECT.md` AND `setup_complete = true` | "Setup complete. No project found.

→ Run `/fh:new-project` — set up vision, tech stack, and roadmap

This creates the `.planning/` directory that tracks your project." |
| No clear state (no project, no uncommitted changes) | "No active work detected. What would you like to work on?" |

If uncommitted changes exist, flag them but still continue to GSD routing below (both can be shown).
If state corruption is detected, show repair suggestion but still continue to GSD routing.
If gsd_available is false, show the recommendation above and stop.

### GSD routing (only if gsd_available)

If `between_milestones` is true, go directly to **Route F**.

**Step 1: Count plans, summaries, and issues in current phase**

List files in the current phase directory:

```bash
ls -1 .planning/phases/[current-phase-dir]/*-PLAN.md 2>/dev/null | wc -l
ls -1 .planning/phases/[current-phase-dir]/*-SUMMARY.md 2>/dev/null | wc -l
ls -1 .planning/phases/[current-phase-dir]/*-UAT.md 2>/dev/null | wc -l
```

State: "This phase has {X} plans, {Y} summaries."

**Step 1.5: Check for unaddressed UAT gaps**

Check for UAT.md files with status "diagnosed" (has gaps needing fixes).

```bash
# Check for diagnosed UAT with gaps
grep -l "status: diagnosed" .planning/phases/[current-phase-dir]/*-UAT.md 2>/dev/null
```

Track:
- `uat_with_gaps`: UAT.md files with status "diagnosed" (gaps need fixing)

**Step 2: Route based on counts**

| Condition | Meaning | Action |
|-----------|---------|--------|
| uat_with_gaps > 0 | UAT gaps need fix plans | Go to **Route E** |
| summaries < plans | Unexecuted plans exist | Go to **Route A** |
| summaries = plans AND plans > 0 | Phase complete | Go to Step 3 |
| plans = 0 | Phase not yet planned | Go to **Route B** |

---

**Route A: Unexecuted plan exists**

Find the first PLAN.md without matching SUMMARY.md.
Read its `<objective>` section.

```
---

## Next Up

**{phase}-{plan}: [Plan Name]** -- [objective summary from PLAN.md]

`/fh:build`

<sub>`/clear` first -- fresh context window</sub>

---
```

---

**Route B: Phase needs planning**

Check if `{phase_num}-CONTEXT.md` exists in phase directory.

**If CONTEXT.md exists:**

```
---

## Next Up

**Phase {N}: {Name}** -- {Goal from ROADMAP.md}
<sub>Context gathered, ready to plan</sub>

`/fh:plan-work`

<sub>`/clear` first -- fresh context window</sub>

---
```

**If CONTEXT.md does NOT exist:**

```
---

## Next Up

**Phase {N}: {Name}** -- {Goal from ROADMAP.md}

`/fh:plan-work {phase}` -- plan this phase (includes discussion and context gathering)

<sub>`/clear` first -- fresh context window</sub>

---

**Also available:**
- `/fh:plan-work {phase}` -- plan directly
- `/fh:plan-work {phase}` -- start planning (surfaces assumptions during brainstorm)

---
```

---

**Route E: UAT gaps need fix plans**

UAT.md exists with gaps (diagnosed issues). User needs to plan fixes.

```
---

## UAT Gaps Found

**{phase_num}-UAT.md** has {N} gaps requiring fixes.

`/fh:plan-work` -- plan fixes for the gaps

<sub>`/clear` first -- fresh context window</sub>

---

**Also available:**
- `/fh:build` -- execute phase plans
- `/fh:review` -- run review and verification

---
```

---

**Step 3: Check milestone status (only when phase complete)**

Read ROADMAP.md and identify:
1. Current phase number
2. All phase numbers in the current milestone section

Count total phases and identify the highest phase number.

State: "Current phase is {X}. Milestone has {N} phases (highest: {Y})."

**Route based on milestone status:**

| Condition | Meaning | Action |
|-----------|---------|--------|
| current phase < highest phase | More phases remain | Go to **Route C** |
| current phase = highest phase | Milestone complete | Go to **Route D** |

---

**Route C: Phase complete, more phases remain**

Read ROADMAP.md to get the next phase's name and goal.

```
---

## Phase {Z} Complete

## Next Up

**Phase {Z+1}: {Name}** -- {Goal from ROADMAP.md}

`/fh:plan-work {Z+1}` -- plan next phase (includes discussion and context gathering)

<sub>`/clear` first -- fresh context window</sub>

---

**Also available:**
- `/fh:review` -- review before continuing

---
```

---

**Route D: Milestone complete**

```
---

## Milestone Complete

All {N} phases finished!

## Next Up

**Complete Milestone** -- archive and prepare for next

`/fh:review` -- review and complete the milestone

<sub>`/clear` first -- fresh context window</sub>

---

**Also available:**
- `/fh:review` -- review before completing milestone

---
```

---

**Route F: Between milestones (ROADMAP.md missing, PROJECT.md exists)**

A milestone was completed and archived. Ready to start the next milestone cycle.

Read MILESTONES.md to find the last completed milestone version.

```
---

## Milestone v{X.Y} Complete

Ready to plan the next milestone.

## Next Up

**Start Next Milestone** -- questioning -> research -> requirements -> roadmap

`/fh:plan-work` -- plan the next milestone

<sub>`/clear` first -- fresh context window</sub>

---
```

</step>

<step name="edge_cases">
**Handle edge cases:**

- Phase complete but next phase not planned -> offer `/fh:plan-work`
- All work complete -> offer milestone completion
- Blockers present -> highlight before offering to continue
- Handoff file exists -> display handoff context directly
  </step>

</process>

<success_criteria>

- [ ] Git state always shown (branch, uncommitted, unpushed, last commit)
- [ ] claude-mem cross-session context shown if available, silently skipped if not
- [ ] State integrity checked and corruption flagged if found
- [ ] Rich GSD context provided when project exists (recent work, decisions, issues)
- [ ] Non-GSD projects still get useful output (git + claude-mem + routing)
- [ ] Current position clear with visual progress
- [ ] What's next clearly explained
- [ ] Smart routing: /build if plans exist, /plan-work if not
- [ ] User confirms before any action
- [ ] Seamless handoff to appropriate gsd command
      </success_criteria>
</output>