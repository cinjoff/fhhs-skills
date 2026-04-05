# Test-Spec Generation (Step 2.5)

If the plan has `must_haves.truths` and at least one task modifies `.ts`, `.tsx`, `.js`, `.jsx` files (excluding config-only, types-only, or constants-only files):

Dispatch a **test-spec subagent** (`general-purpose`, model `$EXEC_MODEL`) **before Wave 1 begins**. This agent writes test skeletons from the plan specification — it has NOT seen the implementation code. Wave 1 subagents will find these test files already on disk and can implement code to make them pass.

**Subagent prompt:**
```
You are writing test skeletons from a plan specification. You have NOT seen the implementation.

Read `.claude/skills/shared/testing-guide.md` for testing rules.

## Spec
Must-haves: {PLAN_MUST_HAVES}
Task acceptance criteria: {PLAN_DONE_CRITERIA}
Error cases: {ERROR_RESCUE_MAP_IF_AVAILABLE}

## Instructions
1. For each must_haves.truth → write 1-3 behavioral test cases
2. For each task's done criteria → write the test proving it
3. For error/rescue entries → write failure-path tests
4. Write to `__tests__/` or `tests/` matching project convention
5. Use Vitest + @testing-library/react for components. Playwright for E2E.
6. Use `getByRole` > `getByLabel` > `getByTestId` for selectors
7. Mark tests needing implementation with `it.todo()` if API is unclear
8. DO NOT import from files that don't exist yet — use expected paths from the plan

Report: test files created, test count, which must_haves.truths are covered.
```

Wait for this subagent to complete before dispatching Wave 1. This ensures implementation subagents see pre-existing test skeletons and can implement to pass them — orchestration-level TDD.

Skip if: no `must_haves.truths`, all tasks are config/docs only, or plan has fewer than 2 tasks.
