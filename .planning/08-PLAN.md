---
type: execute
wave: 1
depends_on: ["07"]
files_modified:
  - evals/evals.json
autonomous: true

must_haves:
  truths:
    - "Evals verify plan-work creates native tasks and updates them per step"
    - "Evals verify build creates tasks from plan, maps wave deps, and threads TASK_ID to subagents"
    - "Evals verify plan-work Step 7 recommends /fh:plan-review before /fh:build"
    - "Evals verify plan-work WARNs on business-logic tasks without tdd=true"
    - "Evals verify plan-work prompts for Playwright E2E on frontend interactive features"
  artifacts:
    - path: "evals/evals.json"
      provides: "Behavioral evals for native task tracking, TDD enforcement, Playwright prompting, plan-review handoff"
      contains: "TaskCreate"
  key_links:
    - from: "evals/evals.json"
      to: ".claude/skills/plan-work/SKILL.md"
      via: "Evals test plan-work behavior"
    - from: "evals/evals.json"
      to: ".claude/skills/build/SKILL.md"
      via: "Evals test build behavior"
---

<objective>Add evals covering the new features: native task tracking in plan-work and build, plan-review handoff, TDD enforcement WARN, and Playwright E2E prompting.</objective>

<context>
@evals/evals.json (structure only — read last 2 entries for format)
@.claude/skills/plan-work/SKILL.md
@.claude/skills/build/SKILL.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: Add evals for native task tracking + plan-review handoff</name>
  <files>evals/evals.json</files>
  <action>
  Add the following evals to the evals array in evals.json (IDs starting from 140). Follow the exact format of existing entries.

  **Eval 140 — plan-work native task tracking:**
  ```json
  {
    "id": 140,
    "command": "plan-work",
    "prompt": "plan adding a user preferences API endpoint. well-known REST patterns, no research needed",
    "expected_output": "Should create native tasks for all planning steps (Phase matching, Research, Brainstorm, Discuss implementation, Derive must_haves, Create plan, Plan-check) using TaskCreate at the start. Should update tasks to in_progress/completed as each step progresses. Should mark Research as completed with skipped metadata since well-known patterns. Should include graceful degradation (TASKS_AVAILABLE flag).",
    "files": [],
    "assertions": [
      {"text": "Creates native tasks for planning steps using TaskCreate", "type": "behavioral"},
      {"text": "Updates tasks to in_progress when starting each step", "type": "behavioral"},
      {"text": "Marks Research as skipped (well-known patterns)", "type": "behavioral"},
      {"text": "Includes graceful degradation if TaskCreate fails", "type": "behavioral"}
    ],
    "scenario_requires": ["gsd_project"]
  }
  ```

  **Eval 141 — build native task tracking:**
  ```json
  {
    "id": 141,
    "command": "build",
    "prompt": "execute the plan at .planning/phases/05-api/05-01-PLAN.md. it has 3 tasks in 2 waves — task 1 and 2 are wave 1, task 3 is wave 2",
    "expected_output": "Should create native tasks from plan's tasks block using TaskCreate with metadata (wave, phase, plan). Should create pipeline stage tasks (spec gate per wave, design gates, self-check). Should set up wave dependencies via addBlockedBy (wave 2 blocked by wave 1, spec gates blocked by wave tasks). Should thread {TASK_ID} to subagent prompts. Should update task status as subagents complete.",
    "files": [],
    "assertions": [
      {"text": "Creates native tasks from plan tasks block with metadata", "type": "behavioral"},
      {"text": "Creates pipeline stage tasks (spec gate, self-check)", "type": "behavioral"},
      {"text": "Sets up wave dependencies using addBlockedBy", "type": "behavioral"},
      {"text": "Threads TASK_ID to subagent prompts via implementer-prompt placeholder", "type": "behavioral"},
      {"text": "Includes TASKS_AVAILABLE graceful degradation", "type": "behavioral"}
    ],
    "scenario_requires": ["gsd_project"]
  }
  ```

  **Eval 142 — plan-work plan-review handoff:**
  ```json
  {
    "id": 142,
    "command": "plan-work",
    "prompt": "plan adding role-based access control to the API routes. this touches auth middleware, 3 route handlers, and a new permissions table",
    "expected_output": "After plan creation and plan-check, Step 7 handoff should recommend /fh:plan-review as the first option (before /fh:build). Should present three options: (1) /fh:plan-review recommended, (2) /fh:build for straightforward plans, (3) continue planning. Should default to plan-review since this is a non-trivial multi-file change.",
    "files": [],
    "assertions": [
      {"text": "Recommends /fh:plan-review as first handoff option", "type": "behavioral"},
      {"text": "Presents /fh:build as second option", "type": "behavioral"},
      {"text": "Defaults to plan-review for non-trivial plans", "type": "behavioral"},
      {"text": "Mentions plan-review produces error maps and security analysis", "type": "output"}
    ],
    "scenario_requires": ["gsd_project"]
  }
  ```
  </action>
  <verify>
  - evals.json is valid JSON after changes
  - Entries 140-142 exist with correct format
  - Each has command, prompt, expected_output, assertions array
  - Assertion types are valid (behavioral, output, guard, ordering)
  </verify>
  <done>Evals exist that verify plan-work creates native tasks, build maps wave dependencies and threads TASK_ID, and plan-work recommends plan-review in handoff</done>
</task>

<task type="auto">
  <name>Task 2: Add evals for TDD + Playwright enforcement</name>
  <files>evals/evals.json</files>
  <action>
  Add the following evals (continuing from Task 1's IDs):

  **Eval 143 — TDD WARN on unmarked business logic:**
  ```json
  {
    "id": 143,
    "command": "plan-work",
    "prompt": "plan adding a discount calculation engine and a coupon validation service. pure business logic, no frontend",
    "expected_output": "During plan-check (Step 6), should detect that business-logic tasks (discount calculation, coupon validation) involve state/logic and WARN if they lack tdd=true. Should ask the planner to confirm or add tdd=true. Should NOT block — only warn.",
    "files": [],
    "assertions": [
      {"text": "Detects business-logic tasks that should have tdd=true", "type": "behavioral"},
      {"text": "Emits WARN (not block) for tasks lacking tdd=true", "type": "behavioral"},
      {"text": "Asks planner to confirm or add tdd=true", "type": "behavioral"},
      {"text": "Does NOT block plan creation over missing tdd attribute", "type": "guard"}
    ],
    "scenario_requires": ["gsd_project"]
  }
  ```

  **Eval 144 — Playwright E2E prompt on frontend features:**
  ```json
  {
    "id": 144,
    "command": "plan-work",
    "prompt": "plan adding a user settings page with profile editing form, password change, and notification preferences toggles",
    "expected_output": "During plan-check (Step 6), should detect interactive frontend features (forms, toggles) and check for playwright.config in the project. Should WARN that no E2E test task exists and suggest adding a Playwright test task. Should offer to create the test task referencing skills/playwright-testing/. Should NOT block.",
    "files": [],
    "assertions": [
      {"text": "Detects interactive frontend features needing E2E coverage", "type": "behavioral"},
      {"text": "Checks for playwright.config in project", "type": "behavioral"},
      {"text": "WARNs about missing E2E test task", "type": "behavioral"},
      {"text": "Suggests creating Playwright test task", "type": "output"},
      {"text": "Does NOT block plan creation over missing E2E tests", "type": "guard"}
    ],
    "scenario_requires": ["gsd_project"]
  }
  ```

  **Eval 145 — Spec gate TDD commit-order WARN:**
  ```json
  {
    "id": 145,
    "command": "build",
    "prompt": "execute the plan. task 1 is marked tdd=true for implementing a rate limiter. after the subagent finishes, the git log shows: 'feat(01-01): implement rate limiter' then 'test(01-01): add rate limiter tests' — feat before test",
    "expected_output": "During spec gate (Step 3b), should detect that the tdd=true task has feat commit before test commit. Should emit a WARN (not blocking) about TDD discipline violation — expected test commit before feat commit (RED before GREEN). Should NOT change the PASS/BLOCKING verdict based on this warning alone.",
    "files": [],
    "assertions": [
      {"text": "Detects feat commit before test commit for tdd=true task", "type": "behavioral"},
      {"text": "Emits WARN about TDD discipline (not BLOCKING)", "type": "behavioral"},
      {"text": "Does NOT change PASS verdict to BLOCKING based on TDD warning alone", "type": "guard"},
      {"text": "References expected RED-GREEN-REFACTOR commit order", "type": "output"}
    ],
    "scenario_requires": ["gsd_project"]
  }
  ```
  </action>
  <verify>
  - evals.json is valid JSON after changes
  - Entries 143-145 exist with correct format
  - TDD eval (143) tests WARN behavior, not blocking
  - Playwright eval (144) tests E2E prompt for frontend features
  - Spec gate eval (145) tests commit-order WARN
  </verify>
  <done>Evals exist that verify TDD WARN on unmarked business-logic tasks, Playwright E2E prompt on frontend features, and spec gate TDD commit-order WARN</done>
</task>
</tasks>

<verification>
1. python3 -c "import json; json.load(open('evals/evals.json'))" — valid JSON
2. python3 -c "import json; d=json.load(open('evals/evals.json')); print(len(d['evals']))" — should be 145
3. Grep evals.json for "TaskCreate" — confirms native task tracking evals
4. Grep evals.json for "tdd=true" or "tdd" — confirms TDD enforcement evals
5. Grep evals.json for "playwright" — confirms Playwright evals
6. Grep evals.json for "plan-review" — confirms handoff eval
</verification>

<success_criteria>
- 6 new evals (140-145) covering all new features
- All evals follow existing format (id, command, prompt, expected_output, assertions, scenario_requires)
- TDD and Playwright evals test WARN behavior, not blocking
- Valid JSON after all additions
</success_criteria>

<output>.planning/SUMMARY.md</output>
