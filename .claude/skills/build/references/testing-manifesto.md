# Testing Rules
Concise testing guidance for build subagents. Explains WHY, not just WHAT.

## Rules

1. **Test behavior, not implementation.** Refactoring internals shouldn't break tests. If changing HOW code works (not WHAT it does) breaks a test, that test is coupled to implementation.

2. **Every test answers: "What user-visible behavior breaks if this fails?"** Tests without this answer are noise that slows the build without catching real bugs.

3. **Mostly integration.** Integration tests verify real module interactions. Isolated unit tests with heavy mocks often test the mocks, not the code.

4. **Don't test what TypeScript guarantees.** No tests for getters, type contracts, or framework rendering. The type system already catches these; duplicating that work wastes time.

5. **Never mock what you don't own.** Mock your interfaces, use real implementations for third-party code. Mocking libraries you don't control creates false confidence.

6. **One bug, one regression test, forever.** Every production bug gets a permanent test. The bug must never reappear.

7. **E2E tests cover critical user journeys only.** Auth flows, payments, core CRUD — not form validation rules or component variations. E2E tests are expensive; spend them on paths users actually follow.

8. **Tests are production code.** Same naming, review standards, and refactoring discipline. Copy-paste test methods are tech debt.

## Stack Defaults
Detect from project config. Fall back to these defaults:
- **Unit/Integration:** Vitest with `pnpm test --run` (non-watch — watch mode hangs subagents)
- **React components:** `@testing-library/react` — prefer `getByRole` > `getByLabel` > `getByTestId` > never CSS selectors
- **Async Server Components:** E2E only (Vitest can't unit test them yet)
- **E2E:** Playwright with Page Object Model and role-based selectors. No `waitForTimeout()`.

## E2E Reference
For Playwright tests, read the Playwright testing skill:
- Plugin path: `$HOME/.claude/plugins/cache/fhhs-skills/*/playwright-testing/PROMPT.md`
- Fallback: `.claude/skills/playwright-testing/PROMPT.md`

## Anti-Patterns (delete these tests)
- Over-mocking: if mock setup > test logic, you're testing mocks not code
- Testing CSS: `toHaveStyle({color: 'red'})` breaks on every design update — use visual regression
- Testing framework code: `render(<X/>)` with no assertion tests React, not your component
- Exact string matching: `expect(msg).toBe('Error: Invalid email...')` — test the error type, not the copy
- Tests without assertions: a test that can't fail catches nothing
