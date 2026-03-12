---
type: execute
wave: 1
files_modified:
  - evals/evals.json

must_haves:
  truths:
    - "Every skill in .claude/skills/ has at least 1 eval in evals.json"
    - "Eval 83 command field matches its actual intent (critique, not fix)"
    - "Design skill evals each have 5+ assertions covering DESIGN.md read, commit, and guard behavior"
    - "At least one eval tests /build failure recovery (subagent crash or spec gate cascade)"
    - "At least one eval tests STATE.md corruption handling"
    - "At least one eval tests skill misrouting (wrong command for the intent)"
    - "At least one standalone /review eval uses nextjs-app-deep fixtures"
    - "At least one /simplify eval uses fixture files"
  artifacts:
    - path: "evals/evals.json"
      provides: "comprehensive eval coverage for all shipped skills"
      contains: "colorize"
  key_links: []
---

<objective>
Close all eval coverage gaps identified in the audit: fix mislabeled eval, add evals for 5 uncovered skills, enrich thin design skill assertions, and add evals for failure recovery, state corruption, misrouting, and fixture-backed flows.
</objective>

<context>
@evals/evals.json
@evals/fixtures/nextjs-app-deep/.planning/STATE.md
@evals/fixtures/nextjs-app-deep/.planning/ROADMAP.md
@evals/fixtures/nextjs-app-deep/.planning/DESIGN.md
@evals/fixtures/nextjs-app-deep/CLAUDE.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: Fix existing eval issues</name>
  <files>evals/evals.json</files>
  <action>
  1. **Fix eval 83**: Change `"command": "fix"` to `"command": "critique"`. Update expected_output to reflect critique behavior (read frontend-design skill, produce structured report). Update assertions to match critique skill expectations (structured report, severity ratings, anti-pattern detection).

  2. **Enrich design skill assertions to 5+ each**. Add these assertion patterns where missing:

  For evals 54 (polish), 55 (harden), 56 (adapt), 57 (animate), 58 (distill), 59 (normalize), 61 (onboard), 90 (clarify):
  - Add: `{"text": "Reads .planning/DESIGN.md for design context", "type": "behavioral"}` (where applicable — polish, normalize, adapt, animate)
  - Add: `{"text": "Commits changes with descriptive message", "type": "output"}` (for all that modify files)
  - Add: `{"text": "Does not over-engineer beyond the specific request", "type": "guard"}`
  - Add skill-specific assertions to reach 5+ total (e.g., animate should check transition duration, adapt should check min touch target size, etc.)

  3. **Enrich evals 75 (normalize), 76 (optimize), 80 (polish), 81 (extract), 82 (adapt), 89 (onboard)** with the same assertion enrichment pattern — these fixture-backed design evals also only have 3 assertions each.
  </action>
  <verify>
  - Eval 83 command is "critique"
  - All design skill evals (54-61, 75, 76, 80-82, 89, 90) have 5+ assertions
  - JSON is valid
  </verify>
  <done>Eval 83 correctly labeled as critique. All design skill evals have 5+ meaningful assertions.</done>
</task>

<task type="auto">
  <name>Task 2: Add evals for uncovered skills and edge cases</name>
  <files>evals/evals.json</files>
  <action>
  Add the following new evals (IDs 106+):

  **A. Missing skills (5 skills, 2 evals each = 10 evals):**

  **tracker** (106, 107):
  - 106: Happy path — "tracker" with .planning/ present. Should launch dashboard, show phases, progress bars, todos.
  - 107: No .planning/ — should detect missing project, suggest /new-project.

  **colorize** (108, 109):
  - 108: "add some color to the settings page, it's too monochromatic" with fixture `src/app/settings/page.tsx`. Should analyze color usage, add strategic accent colors, read DESIGN.md.
  - 109: "colorize the data table" with fixture `src/components/data-table.tsx`. Should add color to status badges, row highlights, not over-saturate.

  **bolder** (110, 111):
  - 110: "make the landing page more visually impactful" with fixture `src/app/page.tsx`. Should amplify visual hierarchy, increase contrast, add emphasis.
  - 111: "bolder the metric cards" with fixture `src/components/metric-card.tsx`. Should NOT amplify existing AI slop (gradients/glassmorphism) — should detect and flag the anti-patterns instead.

  **quieter** (112, 113):
  - 112: "tone down the metric card, it's too flashy" with fixture `src/components/metric-card.tsx`. Should detect and remove AI slop (gradient text, backdrop-blur, SVG blobs), simplify to clean design.
  - 113: "the notification toast is too aggressive, quiet it down" with fixture `src/components/notification-toast.tsx`.

  **delight** (114, 115):
  - 114: "add moments of delight to the dashboard" with fixtures for page.tsx and components. Should add micro-interactions, subtle animations, personality touches.
  - 115: "add delight to the empty state on the users page" with fixture `src/app/users/page.tsx`. Should enhance empty state with illustration/animation, not just decorative noise.

  **B. Misrouting evals (3 evals):**

  - 116: `/fix` with no bug — "add a new button to the header for notifications". Should recognize this isn't a bug and redirect to /quick or /plan-work, NOT proceed with TDD triage.
  - 117: `/build` with 0-task plan — plan file exists but has empty `<tasks></tasks>`. Should detect empty plan, refuse to build, suggest user add tasks.
  - 118: `/polish` on pure backend — "polish src/lib/auth.ts". Should recognize backend-only scope and either proceed with code-level polish or note that /polish is design-focused and suggest /simplify instead.

  **C. Build failure recovery evals (2 evals):**

  - 119: `/build` where spec gate fails on wave 1 with wave 2 tasks queued. Expected: halts wave 2 dispatch, reports spec failure, allows user to fix before retrying. Does NOT execute wave 2 with known spec issues in wave 1 output.
  - 120: `/build` where /review BLOCKS after all waves complete. Expected: STATE.md does NOT mark phase as complete. Reports block reason. Offers fix-and-retry path.

  **D. STATE.md corruption evals (3 evals):**

  - 121: `/resume-work` with STATE.md referencing phase 5 but only phases 1-2 exist on disk. Should detect mismatch, report it, suggest /health --repair.
  - 122: `/progress` with STATE.md missing but PROJECT.md + ROADMAP.md present. Should handle gracefully (not crash), suggest /health --repair or regenerate state.
  - 123: `/build` with STATE.md current_phase disagreeing with actual plan being built. Should warn about state drift, ask user whether to update STATE.md or abort.
  </action>
  <verify>
  - Evals 106-123 exist and have valid JSON
  - Every new eval has: id, command, prompt, expected_output, files, assertions
  - Each uncovered skill now has 2+ evals
  - Misrouting evals have guard assertions for NOT proceeding incorrectly
  - Recovery evals have guard assertions for NOT continuing past failures
  </verify>
  <done>All 5 previously uncovered skills have 2+ evals. Misrouting, failure recovery, and state corruption edge cases covered.</done>
</task>

<task type="auto">
  <name>Task 3: Add fixture-backed evals for high-value flows</name>
  <files>evals/evals.json</files>
  <action>
  Add fixture-backed evals using existing nextjs-app-deep fixtures:

  **A. Standalone /review with fixtures (2 evals):**

  - 124: `/review` against nextjs-app-deep with auth.ts + API routes as "changed files". Fixtures include files with known SQL injection, hardcoded secrets, XSS. Should detect these in security scan, BLOCK on CRITICALs, generate report with file:line refs.
    Files: auth.ts, api/users/route.ts, comment-card.tsx, api/data/route.ts, .env.example, CLAUDE.md, next.config.ts, tsconfig.json

  - 125: `/review` against nextjs-app-deep with only frontend components as "changed files" (sidebar, metric-card, user-form). Security scan minimal. Quality review should catch design anti-patterns. Suggest /verify-ui.
    Files: sidebar.tsx, metric-card.tsx, user-form.tsx, DESIGN.md, CLAUDE.md

  **B. Fixture-backed /simplify (1 eval):**

  - 126: `/simplify` against nextjs-app-deep changed files (data-table.tsx, utils.ts, api.ts). Should detect: god component (data-table 180+ lines), kitchen-sink utils, duplicated fetch pattern. 3 parallel review agents run on git diff scope.
    Files: data-table.tsx, utils.ts, api.ts, validators.ts, CLAUDE.md

  **C. Convert high-value fileless evals to fixture-backed (3 evals):**

  - 127: `/resume-work` (replaces eval 7's coverage gap) with nextjs-app-deep fixtures. Should read STATE.md showing Phase 02 in-progress, find 02-01-PLAN.md incomplete, mention 3 pending todos, route to continue task 2 or fix regression.
    Files: STATE.md, ROADMAP.md, phases/02-dashboard/02-01-PLAN.md, todos/todo-001.md, todos/todo-002.md, todos/todo-003.md, CLAUDE.md

  - 128: `/verify` (complements eval 10's coverage) with nextjs-app-deep Phase 01 fixtures. Should compare 01-01-PLAN.md must_haves against 01-01-SUMMARY.md, verify claimed files exist, catch hardcoded JWT secret as security gap in "completed" phase, catch auth.test.ts only testing happy path.
    Files: phases/01-auth/01-01-PLAN.md, phases/01-auth/01-01-SUMMARY.md, ROADMAP.md, src/lib/auth.ts, src/__tests__/auth.test.ts, CLAUDE.md

  - 129: `/progress` (complements eval 26's coverage) with nextjs-app-deep fixtures. Should use gsd-tools, read STATE.md + ROADMAP.md, report Phase 01 COMPLETE + Phase 02 IN_PROGRESS, show ~25-30% progress, route to correct next action (Route A — unexecuted plan exists).
    Files: STATE.md, ROADMAP.md, PROJECT.md, phases/01-auth/01-01-SUMMARY.md, phases/02-dashboard/02-01-PLAN.md, CLAUDE.md

  **D. Lifecycle chain eval (1 eval):**

  - 130: User says "I just finished planning phase 2, build it, then verify and tell me progress". Should: invoke /build for 02-01-PLAN.md → on completion invoke /verify for phase 2 → then invoke /progress showing updated state. Tests the plan→build→verify→progress chain. Each step must complete before the next starts. /build should invoke /review internally. Final progress output should show Phase 02 further along.
    Files: nextjs-app-deep full fixture set (PROJECT.md, STATE.md, ROADMAP.md, DESIGN.md, CLAUDE.md, phases/02-dashboard/02-01-PLAN.md, next.config.ts, tsconfig.json, playwright.config.ts)
  </action>
  <verify>
  - Evals 124-130 exist with valid JSON
  - Each has non-empty files array pointing to real fixture paths
  - Fixture paths all resolve to files in evals/fixtures/nextjs-app-deep/
  - Assertions are 5+ for each fixture-backed eval
  - Lifecycle chain eval (130) has ordering assertions for sequential execution
  </verify>
  <done>High-value flows have fixture-backed evals. /review, /simplify, /resume-work, /verify, /progress all testable against real project state. Lifecycle chain tested end-to-end.</done>
</task>
</tasks>

<verification>
- `python3 -c "import json; json.load(open('evals/evals.json'))"` — valid JSON
- `python3 -c "import json; d=json.load(open('evals/evals.json')); print(len(d['evals']))"` — should be ~130
- `python3 -c "import json; d=json.load(open('evals/evals.json')); cmds={e['command'] for e in d['evals']}; missing=[s for s in ['tracker','colorize','bolder','quieter','delight'] if s not in cmds]; print('Missing:',missing or 'none')"` — should print "none"
- Grep for `"id": 83` and confirm command is "critique"
- Count assertions on design evals — all should be 5+
</verification>

<success_criteria>
- Every skill in .claude/skills/ has at least 1 eval
- Eval 83 correctly labeled as critique
- Design skill evals have 5+ assertions each
- Failure recovery, state corruption, and misrouting are tested
- High-value flows (/review, /simplify, /resume-work, /verify, /progress) have fixture-backed evals
- One lifecycle chain eval tests plan→build→verify→progress sequentially
</success_criteria>

<output>.planning/SUMMARY.md</output>
