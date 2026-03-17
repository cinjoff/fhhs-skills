---
type: execute
wave: 1
depends_on: []
files_modified:
  - .claude/skills/plan-work/SKILL.md
  - .claude/skills/build/references/implementer-prompt.md
  - .claude/skills/build/references/spec-gate-prompt.md
autonomous: true

must_haves:
  truths:
    - "When plan-work creates a plan with business-logic tasks lacking tdd=true, it WARNs the planner and asks to confirm"
    - "When plan-work plans frontend interactive features, it prompts whether E2E tests are needed and suggests a Playwright test task"
    - "The spec gate WARNs when a tdd=true task shows feat commits before test commits"
    - "Subagent task updates show descriptive activeForm with task name, and sub-tasks use concrete step names"
  artifacts:
    - path: ".claude/skills/plan-work/SKILL.md"
      provides: "TDD validation WARN + Playwright E2E prompt"
      contains: "TDD validation"
    - path: ".claude/skills/build/references/implementer-prompt.md"
      provides: "Improved task messaging + Playwright frontend prompt"
      contains: "activeForm"
    - path: ".claude/skills/build/references/spec-gate-prompt.md"
      provides: "TDD commit-order WARN check"
      contains: "TDD discipline"
  key_links:
    - from: ".claude/skills/plan-work/SKILL.md"
      to: ".claude/skills/build/references/implementer-prompt.md"
      via: "Plan creates tdd=true tasks that implementer enforces"
    - from: ".claude/skills/build/references/implementer-prompt.md"
      to: ".claude/skills/build/references/spec-gate-prompt.md"
      via: "Implementer commits in order, spec gate verifies order"
---

<objective>Close the TDD and Playwright enforcement gaps identified in the audit. Add WARN-level checks at planning, execution, and verification layers. Fix task messaging to show descriptive names.</objective>

<context>
@.claude/skills/plan-work/SKILL.md
@.claude/skills/build/references/implementer-prompt.md
@.claude/skills/build/references/spec-gate-prompt.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: Add TDD + Playwright validation to plan-work</name>
  <files>.claude/skills/plan-work/SKILL.md</files>
  <action>
  Add two validation checks to Step 6 (Plan-check), as new items in the existing checks list:

  **Check 7 — TDD coverage WARN:**
  "For each task in the plan that creates or modifies `.ts`, `.js`, `.tsx`, `.jsx` files (excluding config, types-only, constants-only files): if the task involves business logic, state management, or data transformation and does NOT have `tdd="true"`, emit a WARN: 'Task N ({name}) modifies business logic but lacks tdd=true. Confirm this is intentional or add tdd=true.' Present the list of flagged tasks and ask the user to confirm or fix."

  **Check 8 — Playwright E2E WARN (frontend only):**
  "If any task creates interactive UI (forms, auth flows, navigation, CRUD operations) and the project has `playwright.config.*`: check whether any task in the plan includes E2E test files (`e2e/*.spec.*` or `*.spec.*`). If no E2E test task exists, emit a WARN: 'Frontend interactive features planned but no E2E test task found. Add a Playwright test task, or confirm E2E coverage is not needed.' If the user wants a test task, create one referencing `skills/playwright-testing/`."

  Also add a brief note to Step 3 (Discuss Implementation), point 1 (Scout codebase):
  "Check for `playwright.config.*` in the project root. If present, note it — frontend interactive features should consider E2E test tasks during planning."

  Do NOT modify any existing checks (1-6) or other step logic.
  </action>
  <verify>
  - Plan-check section has checks 7 and 8
  - Check 7 is WARN-level, not blocking
  - Check 8 only triggers when playwright.config exists AND frontend interactive UI is planned
  - Step 3 mentions Playwright config detection
  - All existing checks and step logic unchanged
  </verify>
  <done>plan-work validates TDD coverage and Playwright E2E needs at WARN level during plan-check, and scouts for Playwright config during implementation discussion</done>
</task>

<task type="auto">
  <name>Task 2: Improve task messaging + add Playwright frontend prompt</name>
  <files>.claude/skills/build/references/implementer-prompt.md</files>
  <action>
  Two changes to the Task Progress Tracking section:

  **Fix task messaging (lines 49-56):**
  Replace the current generic instructions with:

  "Your parent task ID is `{TASK_ID}` and your task name is `{TASK_NAME}`.

  At the very start: `TaskUpdate({TASK_ID}, status='in_progress', activeForm='Implementing: {TASK_NAME}')`

  For each major step in your work, create a sub-task with a concrete, descriptive subject:
  - Good: `TaskCreate(subject='Write failing test for auth middleware', activeForm='Writing auth test...')`
  - Good: `TaskCreate(subject='Implement JWT validation handler', activeForm='Implementing JWT handler...')`
  - Bad: `TaskCreate(subject='Step 1', activeForm='Working...')`

  Update sub-tasks to `in_progress` when starting and `completed` when done."

  Note: {TASK_NAME} is a new placeholder. Add it to the comment at the top of the template alongside {TASK_ID}.

  **Add Playwright frontend prompt to the Frontend section (around line 79-82):**
  After the existing "Add stable selectors for Playwright" line, add:
  "If this task creates interactive UI (forms, navigation, auth flows) and the project has `playwright.config.*` but no E2E test is part of this task's scope, note in your report: 'This task creates interactive UI — consider adding E2E coverage in a follow-up task.'"

  Do NOT modify any other sections.
  </action>
  <verify>
  - Task Progress Tracking uses {TASK_NAME} in activeForm
  - Sub-task creation shows concrete examples (not generic)
  - {TASK_NAME} placeholder documented
  - Frontend section includes Playwright prompt for interactive UI
  - All other sections unchanged
  </verify>
  <done>Subagent task updates show descriptive names with task context, and frontend tasks prompt about E2E coverage needs</done>
</task>

<task type="auto">
  <name>Task 3: Add TDD commit-order WARN to spec gate</name>
  <files>.claude/skills/build/references/spec-gate-prompt.md</files>
  <action>
  Add a new section "## TDD Discipline Check (WARN only)" AFTER the "## Lightweight Security Check" section and BEFORE "## Output Format". Content:

  "For tasks marked `tdd="true"` in the task specs, check the git log for this wave:

  ```bash
  git log --oneline {WAVE_START_SHA}..HEAD
  ```

  Look at commit ordering for each TDD task:
  - Expected: `test(...)` commit appears BEFORE `feat(...)` commit (RED before GREEN)
  - Violation: `feat(...)` commit appears with no preceding `test(...)` commit

  If a violation is found, add a WARN (not BLOCKING) to the output:
  ```
  WARN: TDD discipline — Task {name} has feat commit before test commit.
        Expected RED-GREEN-REFACTOR order: test(...) → feat(...) → refactor(...)
        This suggests implementation may have preceded the failing test.
  ```

  This is advisory only. Do not add it to the BLOCKING issues count. Include it in a separate 'Warnings' section of the output."

  Also update the Output Format section to include a Warnings subsection:
  After the PASS and BLOCKING formats, add:
  "### If warnings found (non-blocking):
  ```
  Warnings:
    WARN: {description}
  ```
  Warnings appear after PASS or BLOCKING verdict. They do not change the verdict."

  Do NOT modify any existing checks, scope rules, or the BLOCKING criteria.
  </action>
  <verify>
  - TDD Discipline Check section exists after Security Check
  - Check is WARN-level, explicitly not BLOCKING
  - Uses git log to verify commit ordering
  - Output format includes Warnings subsection
  - All existing checks and scope rules unchanged
  </verify>
  <done>Spec gate WARNs when tdd=true tasks show implementation commits before test commits, without blocking the build</done>
</task>
</tasks>

<verification>
1. Grep plan-work/SKILL.md for "TDD" — confirm validation check exists in plan-check section
2. Grep plan-work/SKILL.md for "playwright" — confirm E2E check and config detection
3. Grep implementer-prompt.md for "TASK_NAME" — confirm descriptive messaging
4. Grep implementer-prompt.md for "interactive UI" — confirm Playwright frontend prompt
5. Grep spec-gate-prompt.md for "TDD discipline" — confirm WARN check
6. Grep spec-gate-prompt.md for "Warnings" — confirm non-blocking output format
</verification>

<success_criteria>
- plan-work WARNs on business-logic tasks without tdd=true
- plan-work WARNs on frontend interactive work without E2E tasks
- Spec gate WARNs on TDD commit-order violations
- Task messages show descriptive names, not just IDs
</success_criteria>

<output>.planning/SUMMARY.md</output>
