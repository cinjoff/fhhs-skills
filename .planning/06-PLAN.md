---
type: execute
wave: 1
depends_on: []
files_modified:
  - .claude/skills/plan-work/SKILL.md
  - .claude/skills/build/SKILL.md
  - .claude/skills/build/references/implementer-prompt.md
autonomous: true

must_haves:
  truths:
    - "Running /fh:plan-work shows a task checklist in Claude Code UI with all planning steps and live status updates as each step starts/completes/skips"
    - "Running /fh:build shows each plan task as a native task with wave dependencies, and subagents create sub-tasks for granular live progress"
    - "If native task tools are unavailable, both workflows degrade gracefully to GSD-only tracking with a single warning message"
    - "All GSD artifacts (PLAN.md, SUMMARY.md, STATE.md, VERIFICATION.md) are still produced with identical format and quality"
  artifacts:
    - path: ".claude/skills/plan-work/SKILL.md"
      provides: "Native task tracking in planning workflow"
      contains: "TaskCreate"
    - path: ".claude/skills/build/SKILL.md"
      provides: "Native task tracking in build execution"
      contains: "TaskCreate"
    - path: ".claude/skills/build/references/implementer-prompt.md"
      provides: "Sub-task tracking instructions for subagents"
      contains: "TASK_ID"
  key_links:
    - from: ".claude/skills/plan-work/SKILL.md"
      to: "TaskCreate/TaskUpdate tools"
      via: "direct tool calls from orchestrator"
    - from: ".claude/skills/build/SKILL.md"
      to: ".claude/skills/build/references/implementer-prompt.md"
      via: "{TASK_ID} placeholder in subagent dispatch"
    - from: ".claude/skills/build/references/implementer-prompt.md"
      to: "TaskCreate/TaskUpdate tools"
      via: "subagent sub-task creation and status updates"
---

<objective>Integrate Claude Code's native TaskCreate/TaskUpdate/TaskList tools into the plan-work and build workflows for live progress visibility in the UI, while preserving all existing GSD file-based tracking.</objective>

<context>
@.claude/skills/plan-work/SKILL.md
@.claude/skills/build/SKILL.md
@.claude/skills/build/references/implementer-prompt.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: Add native task tracking to plan-work</name>
  <files>.claude/skills/plan-work/SKILL.md</files>
  <action>
  Add a new section "## Step -1: Initialize Task Tracking" before Step 0. This step:

  1. Creates all planning steps as native tasks upfront using TaskCreate:
     - "Phase matching" (activeForm: "Matching to phase")
     - "Research" (activeForm: "Researching")
     - "Brainstorm design" (activeForm: "Brainstorming")
     - "Discuss implementation" (activeForm: "Discussing gray areas")
     - "Derive must_haves" (activeForm: "Deriving must_haves")
     - "Create plan" (activeForm: "Writing plan")
     - "Plan-check" (activeForm: "Validating plan")

  2. Sets up wave dependencies: each task addBlockedBy the previous task ID.

  3. Wraps task creation in a graceful degradation block:
     "Try creating tasks. If TaskCreate fails or is unavailable, set TASKS_AVAILABLE=false, log 'Task tracking unavailable, continuing with GSD tracking', and proceed normally. All subsequent TaskUpdate calls should be skipped when TASKS_AVAILABLE=false."

  Then add TaskUpdate calls at the natural transition points in each existing step:
  - Start of each step: TaskUpdate(taskId, status="in_progress")
  - End of each step: TaskUpdate(taskId, status="completed")
  - When a step is skipped (research not needed, design already exists, CONTEXT.md already locked): TaskUpdate(taskId, status="completed", metadata={skipped: true, reason: "..."})

  Also update Step 7 (Handoff) to add `/fh:plan-review` as the recommended intermediate step. The current handoff offers two options (/build or continue planning). Change it to a three-option flow:

  1. **`/fh:plan-review`** (recommended) — Challenge the plan before building. Catches failure modes, edge cases, and architectural issues. Three modes: SCOPE EXPANSION (dream big), HOLD SCOPE (maximum rigor), SCOPE REDUCTION (strip to essentials).
  2. **`/fh:build`** — Execute now. Skip review if the plan is straightforward or already reviewed.
  3. **Continue planning** — Plan more phases before building or reviewing.

  Default to option 1 unless the plan is trivially simple (1 task, well-known patterns).
  The note should make clear that plan-review sits between plan-work and build: "Plan-review produces comprehensive error maps, security analysis, and edge case coverage that strengthen the plan before execution."

  Do NOT modify the existing step logic, GSD checks, plan format, or any other behavior. The task tracking and handoff update are the only changes.
  </action>
  <verify>
  - SKILL.md contains TaskCreate calls for all 7 planning steps
  - SKILL.md contains TaskUpdate calls at step transitions
  - SKILL.md contains graceful degradation logic
  - Step 7 handoff now recommends /fh:plan-review before /fh:build
  - All existing steps (0-7) are unchanged in their core logic (except Step 7 option ordering)
  - GSD project check, phase matching, brainstorming invocation, plan format, plan-check validation — all identical
  </verify>
  <done>plan-work SKILL.md has upfront task creation, per-step status updates, skip handling, graceful degradation, and handoff recommending /fh:plan-review before /fh:build — with zero changes to existing planning logic or GSD tracking</done>
</task>

<task type="auto">
  <name>Task 2: Add native task tracking to build orchestrator</name>
  <files>.claude/skills/build/SKILL.md</files>
  <action>
  Add a new section "## Step 0: Initialize Task Tracking" before Step 1. This step:

  1. After finding the plan (Step 1), parse its `<tasks>` block and create a native task for each plan task using TaskCreate:
     - subject: task name from `<name>`
     - description: task's `<done>` criteria
     - metadata: {wave: N, phase: "XX-name", plan: NN, taskIndex: N}
     - activeForm: derived from task name (e.g., "Implementing auth middleware")

  2. Also create tasks for pipeline stages:
     - "Spec gate Wave N" for each wave
     - "Design gates" (if applicable)
     - "Self-check + SUMMARY"
     - "GSD state updates"

  3. Set up wave dependencies using addBlockedBy:
     - Wave 2 tasks are blocked by all Wave 1 tasks
     - Spec gate for Wave N is blocked by all Wave N tasks
     - Wave N+1 tasks are blocked by Spec gate Wave N

  4. Same graceful degradation pattern as plan-work.

  Then add TaskUpdate calls at orchestrator transition points:
  - Step 3 (execute waves): before dispatching subagent, update task to in_progress
  - Step 3 (after subagent returns): update task to completed, or add metadata {blocked: true, blocker: "reason"} if BLOCKED
  - Step 3 blocked propagation: when a task is blocked, add addBlockedBy to all dependent wave tasks
  - Step 3b (spec gate): update spec gate task status
  - Step 4 (design gates): update design gate task status
  - Step 5-9: update pipeline stage tasks

  In the subagent dispatch (Step 3), add {TASK_ID} to the implementer-prompt placeholders:
  - New placeholder: `{TASK_ID}` — the native task ID for this task
  - Added to the dispatch instructions alongside {TASK_TEXT}, {CLAUDE_MD_SECTIONS}, etc.

  Do NOT modify existing wave analysis, subagent prompt structure, spec gate logic, design gates, GSD state updates, or any verification steps.
  </action>
  <verify>
  - SKILL.md contains task creation from plan's tasks block
  - SKILL.md contains wave dependency setup via addBlockedBy
  - SKILL.md contains TaskUpdate calls at orchestrator transitions
  - SKILL.md contains blocked propagation logic
  - SKILL.md contains {TASK_ID} in subagent dispatch
  - SKILL.md contains graceful degradation
  - All existing steps (1-9) unchanged in core logic
  </verify>
  <done>build SKILL.md creates native tasks from plan, maps wave dependencies, threads {TASK_ID} to subagents, handles blocked propagation — with zero changes to existing execution logic or GSD tracking</done>
</task>

<task type="auto">
  <name>Task 3: Add sub-task tracking to implementer prompt</name>
  <files>.claude/skills/build/references/implementer-prompt.md</files>
  <action>
  Add a new section "## Task Progress Tracking" after "## Before You Begin" and before "## Implementation Rules". This section:

  1. Documents the {TASK_ID} placeholder:
     "Your parent task ID is `{TASK_ID}`. Update it when you start and finish."

  2. Instructions for claiming the task:
     "At the very start: `TaskUpdate({TASK_ID}, status='in_progress')`"

  3. Instructions for sub-task creation:
     "For each major step in your work (write test, implement, verify), create a sub-task:
      `TaskCreate(subject='Step description', description='What this step does', activeForm='Doing X...')`
      Update sub-tasks as you progress. This gives the user live visibility into your work."

  4. Instructions for completion:
     "When done: mark all sub-tasks completed, then `TaskUpdate({TASK_ID}, status='completed')`"

  5. Instructions for blocked state:
     "If BLOCKED: keep {TASK_ID} as in_progress. Your orchestrator will handle status. Just report BLOCKED as you already do."

  6. Graceful degradation:
     "If TaskCreate/TaskUpdate fails, continue your work normally. Task tracking is optional — your implementation and report are what matter."

  Do NOT modify any existing sections (Implementation Rules, Deviation Rules, Guardrails, Self-Review, Report Format). The task tracking section is purely additive.
  </action>
  <verify>
  - implementer-prompt.md contains {TASK_ID} placeholder reference
  - implementer-prompt.md contains sub-task creation instructions
  - implementer-prompt.md contains graceful degradation
  - All existing sections (Implementation Rules through Report Format) unchanged
  </verify>
  <done>implementer-prompt.md instructs subagents to claim their parent task, create sub-tasks for granular progress, and degrade gracefully if task tools are unavailable</done>
</task>
</tasks>

<verification>
1. Diff .claude/skills/plan-work/SKILL.md — confirm TaskCreate/TaskUpdate added, all existing steps unchanged
2. Diff .claude/skills/build/SKILL.md — confirm task creation, wave deps, {TASK_ID} threading, blocked propagation added, all existing steps unchanged
3. Diff .claude/skills/build/references/implementer-prompt.md — confirm task tracking section added, all existing sections unchanged
4. Grep for "TaskCreate" in all three files — confirm present
5. Grep for "TASKS_AVAILABLE" or equivalent degradation flag — confirm present in plan-work and build
6. Verify PLAN.md format section in plan-work is UNCHANGED (YAML frontmatter + XML body)
7. Verify implementer-prompt Report Format section is UNCHANGED
</verification>

<success_criteria>
- /fh:plan-work shows task checklist with live status updates
- /fh:build shows plan tasks with wave dependencies and subagent sub-tasks
- Graceful degradation to GSD-only when task tools unavailable
- All GSD artifacts produced with identical format and quality
</success_criteria>

<output>.planning/SUMMARY.md</output>
