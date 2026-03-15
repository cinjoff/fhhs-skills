---
plan: 04
type: execute
wave: 3
depends_on: [02, 03]
files_modified:
  - .claude/skills/build/SKILL.md
  - .claude/skills/fix/SKILL.md
  - .claude/skills/verify-ui/SKILL.md
  - PATCHES.md
autonomous: false

must_haves:
  truths:
    - "The build skill includes a priority hierarchy for context pressure and suggests /fh:qa after build completion for frontend-heavy work"
    - "The fix skill includes anti-drift rules preventing scope expansion during triage"
    - "The verify-ui skill delegates to /fh:qa for diff-aware testing when on a feature branch"
  artifacts:
    - path: ".claude/skills/build/SKILL.md"
      provides: "enhanced build with context pressure handling and QA routing"
      contains: "priority hierarchy"
    - path: ".claude/skills/fix/SKILL.md"
      provides: "enhanced fix with anti-drift"
      contains: "commit to selected"
    - path: ".claude/skills/verify-ui/SKILL.md"
      provides: "enhanced verify-ui with QA delegation"
      contains: "/fh:qa"
---

<objective>Integrate cross-cutting gstack patterns (priority hierarchies, anti-drift rules, QA routing) into existing skills that benefit from them.</objective>

<context>
@file .claude/skills/build/SKILL.md
@file .claude/skills/fix/SKILL.md
@file .claude/skills/verify-ui/SKILL.md
@file .claude/skills/qa/SKILL.md
@file .planning/designs/2026-03-14-gstack-upstream-integration.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: Add context pressure handling and QA routing to build</name>
  <files>.claude/skills/build/SKILL.md</files>
  <action>
    1. Add priority hierarchy section at the end of build skill:
       "## Context Pressure Priority
       If context is running low, prioritize in this order:
       Step 3 (execute waves) > Step 3b (spec gate) > Step 7 (phase completion) > Step 5 (self-check) > Step 8 (simplify) > Step 9 (post-build review) > Step 4 (design gates) > Step 6 (GSD state).
       Never skip Step 3 or Step 3b."

    2. Add QA routing to Step 9 (post-build review):
       "If the build involved frontend changes (>.tsx/.css/.html files), suggest:
       'Frontend changes detected. Run `/fh:qa` for diff-aware browser testing, or `/fh:verify-ui` for design critique.'"

    3. Add AskUserQuestion discipline note to any interactive steps:
       "When presenting findings that need user decisions, present one issue per question with 2-3 lettered options. Lead with recommendation and WHY."
  </action>
  <verify>grep "priority hierarchy\|Context Pressure" .claude/skills/build/SKILL.md && grep "fh:qa" .claude/skills/build/SKILL.md</verify>
  <done>Build skill has context pressure priority hierarchy and QA routing for frontend work</done>
</task>

<task type="auto">
  <name>Task 2: Add anti-drift rules to fix and enhance verify-ui</name>
  <files>.claude/skills/fix/SKILL.md, .claude/skills/verify-ui/SKILL.md</files>
  <action>
    1. **fix/SKILL.md**: Add anti-drift rule after Step 1 (Triage):
       "Once a triage strategy is selected (SIMPLE/MODERATE/PARALLEL/COMPLEX), commit fully. Do not escalate to a higher strategy mid-fix unless new evidence proves the initial assessment wrong. Do not fix adjacent issues — log them to `.planning/todos/` instead."

    2. **verify-ui/SKILL.md**: Add QA delegation:
       - After Step 1 (ensure dev server), add:
         "If on a feature branch (not main), suggest: 'You're on a feature branch. Would you like diff-aware QA testing (`/fh:qa`) instead of manual verification? /fh:qa auto-detects affected routes from your git diff.'"
       - In Step 2, add agent-browser video recording for critical bugs:
         "If a CRITICAL visual bug is found, record a video: `agent-browser record start ./evidence.webm`, reproduce the bug, `agent-browser record stop`"

    Update PATCHES.md with all cross-cutting changes.
  </action>
  <verify>
    grep "commit fully" .claude/skills/fix/SKILL.md
    grep "fh:qa" .claude/skills/verify-ui/SKILL.md
  </verify>
  <done>Fix skill has anti-drift rules; verify-ui suggests /fh:qa on feature branches</done>
</task>
</tasks>

<verification>
grep "Context Pressure" .claude/skills/build/SKILL.md
grep "commit fully" .claude/skills/fix/SKILL.md
grep "fh:qa" .claude/skills/verify-ui/SKILL.md
grep "fh:qa" .claude/skills/build/SKILL.md
</verification>

<success_criteria>
- Build has context pressure priority and QA routing
- Fix has anti-drift preventing scope expansion
- Verify-ui delegates to /fh:qa on feature branches
</success_criteria>

<output>.planning/04-SUMMARY.md</output>
