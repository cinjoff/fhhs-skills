# Plan-Check Protocol

Before presenting the plan to the user, run this verification checklist. If any check fails, revise and recheck (max 3 iterations, then ask the user for guidance).

**GSD mode — run structural validation first:**

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" verify plan-structure "${PLAN_PATH}"
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" frontmatter validate "${PLAN_PATH}" --schema plan
```

These catch schema issues (missing frontmatter fields, malformed tasks) automatically. Then run the semantic checks below.

**Checks:**

1. **Requirement coverage** (GSD only): every requirement ID from ROADMAP referenced in `requirements` has at least one task covering it. After all plans pass, also run an explicit coverage gate:
   ```bash
   PLAN_REQS=$(grep -h "requirements:" ${PHASE_DIR}/*-PLAN.md 2>/dev/null | tr -d '[]' | tr ',' '\n' | sed 's/^[[:space:]]*//' | sort -u)
   ```
   For each phase req ID not found in `PLAN_REQS`: report as uncovered gap. If gaps found, offer: 1) Revise plans to include missing requirements, 2) Move uncovered requirements to next phase, 3) Proceed anyway.
2. **Task completeness**: every `<task>` has non-empty `<files>`, `<action>`, `<verify>`, and `<done>`.
3. **Dependency correctness**: no circular dependencies in `depends_on`; wave numbers are consistent (a task cannot depend on a higher or equal wave).
4. **Scope sanity**: task count within `tasks_per_plan` range, file count within `files_per_plan` range in `files_modified`, plan body under `words_per_plan` words (read limits from `.planning/config.json` `plan_limits` section; defaults: 4-6 tasks, 8-15 files, 2500 words, 60% context).
5. **must_haves trace**: every truth in `must_haves.truths` maps to at least one task's `<done>` criteria. Every artifact in `must_haves.artifacts` appears in `files_modified`.
6. **Context compliance** (GSD only): plan does not contradict locked decisions in CONTEXT.md; plan does not include work deferred in CONTEXT.md.
7. **Test coverage REQUIRE**: For each task that creates or modifies `.ts`, `.js`, `.tsx`, `.jsx` files (excluding config-only, types-only, or constants-only files): if the task involves business logic, state management, or data transformation, it MUST either have `tdd="true"` OR the plan must contain a companion test task covering the same files. If neither condition is met, FAIL the check: 'Task N ({name}) modifies business logic without test coverage. Add `tdd="true"` to the task, or add a companion test task in the same wave.' Revise the plan to include test coverage before presenting to the user. This is not advisory — untested business logic is the #1 source of regressions in autonomous builds.
8. **Playwright E2E check** (frontend only): If any task creates interactive UI (forms, auth flows, navigation, CRUD operations) and the project has `playwright.config.*`: check whether any task includes E2E test files (`e2e/*.spec.*` or `*.spec.*`). If none found, emit WARN and auto-suggest a concrete test task:
   - Playwright patterns: `.claude/skills/playwright-testing/PROMPT.md` (and testing-guide.md Part D for quick reference)
   - Suggested task should use: Page Object Model pattern, `getByRole` selectors, critical user journey focus
   - Present: 'No E2E test task found for interactive UI. Suggested test task: [task description]. Add it, or confirm E2E coverage is not needed for this plan.'
   Advisory — user can decline. But the suggestion is concrete and ready to add, not a vague warning.
9. **Test-to-code ratio check**: Count source files in `files_modified` (`.ts`, `.tsx`, `.js`, `.jsx` excluding `*.test.*`, `*.spec.*`, `*.d.ts`) and test files (`*.test.*`, `*.spec.*`). If the ratio of test files to source files is below 0.5 (fewer than 1 test per 2 source files) and the plan modifies business logic, WARN: 'Low test-to-code ratio ({ratio}). The Testing Trophy recommends mostly integration tests — consider adding test tasks.' Advisory only — some plans legitimately have low ratios (config, migrations, docs).

If a check fails, state which check failed, revise the plan, and recheck. After 3 failed iterations, present what you have and ask the user to resolve the issue.
