# Testing Guide

Single source of truth for all testing in this plugin. Referenced by build, fix, and plan-work skills.

## Part A: Testing Philosophy

1. **Test behavior, not implementation.** Refactoring internals shouldn't break tests. If changing HOW code works (not WHAT it does) breaks a test, that test is coupled to implementation.

2. **Every test answers: "What user-visible behavior breaks if this fails?"** Tests without this answer are noise that slows the build without catching real bugs.

3. **Mostly integration.** Integration tests verify real module interactions. Isolated unit tests with heavy mocks often test the mocks, not the code.

4. **Don't test what TypeScript guarantees.** No tests for getters, type contracts, or framework rendering. The type system already catches these.

5. **Never mock what you don't own.** Mock your interfaces, use real implementations for third-party code. Mocking libraries you don't control creates false confidence.

6. **One bug, one regression test, forever.** Every production bug gets a permanent test. The bug must never reappear.

7. **E2E tests cover critical user journeys only.** Auth flows, payments, core CRUD — not form validation rules or component variations. E2E tests are expensive; spend them on paths users actually follow.

8. **Tests are production code.** Same naming, review standards, and refactoring discipline. Copy-paste test methods are tech debt.

## Part B: TDD Discipline

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

**Iron Law:** No production code without a failing test first. Write code before the test? Delete it. Start over.

### When to Use TDD

**Always:** New features, bug fixes, refactoring, behavior changes.
**Exceptions (ask your human partner):** Throwaway prototypes, generated code, configuration files.

### Red-Green-Refactor

**RED — Write Failing Test:**
Write one minimal test showing what should happen. One behavior, clear name, real code (no mocks unless unavoidable).

**Verify RED — Watch It Fail (MANDATORY):**
```bash
# Always use non-watch mode (watch mode hangs subagents)
npx vitest run path/to/test.test.ts   # Vitest
CI=true npm test path/to/test.test.ts  # Jest
```
Confirm: test fails (not errors), failure message is expected, fails because feature missing (not typos).

**GREEN — Minimal Code:**
Write simplest code to pass the test. Don't add features, refactor other code, or "improve" beyond the test.

**Verify GREEN — Watch It Pass (MANDATORY):**
Confirm: test passes, other tests still pass, output pristine (no errors, warnings).

**REFACTOR — Clean Up:**
After green only: remove duplication, improve names, extract helpers. Keep tests green. Don't add behavior.

### Good Tests

| Quality | Good | Bad |
|---------|------|-----|
| **Minimal** | One thing. "and" in name? Split it. | `test('validates email and domain and whitespace')` |
| **Clear** | Name describes behavior | `test('test1')` |
| **Shows intent** | Demonstrates desired API | Obscures what code should do |

### Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Already manually tested" | Ad-hoc =/= systematic. No record, can't re-run. |
| "Need to explore first" | Fine. Throw away exploration, start with TDD. |
| "TDD will slow me down" | TDD faster than debugging. Pragmatic = test-first. |

### TDD Verification Checklist

Before marking work complete:
- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for expected reason (feature missing, not typo)
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
- [ ] Output pristine (no errors, warnings)
- [ ] Tests use real code (mocks only if unavoidable)
- [ ] Edge cases and errors covered

## Part C: Stack Defaults

Detect from project config. Fall back to these defaults:

| Type | Tool | Run Command |
|------|------|-------------|
| **Unit/Integration** | Vitest | `pnpm test --run` (non-watch — watch mode hangs subagents) |
| **React components** | @testing-library/react | `getByRole` > `getByLabel` > `getByTestId` > never CSS selectors |
| **Async Server Components** | E2E only | Vitest can't unit test them yet |
| **E2E** | Playwright | Page Object Model, role-based selectors, no `waitForTimeout()` |

When in doubt about watch mode: prefix `CI=true`.

## Part D: E2E with Playwright

For Playwright E2E tests, also read `.claude/skills/playwright-testing/PROMPT.md` for the full decision tree and detailed patterns. Below are the essentials.

### Locator Priority

Use locators in this order — prefer user-facing selectors:

1. **Role-based** (most resilient): `page.getByRole('button', { name: 'Submit' })`
2. **Label-based**: `page.getByLabel('Email')`, `page.getByPlaceholder('Search...')`
3. **Text-based**: `page.getByText('Welcome')`, `page.getByTitle('Settings')`
4. **Test IDs** (when semantic locators aren't possible): `page.getByTestId('submit-btn')`
5. **CSS/XPath** (last resort): `page.locator('css=...')`

Never use brittle CSS chains like `div.container > div:nth-child(2) > button.btn-primary`.

### Assertion Patterns

Always use **web-first assertions** (auto-retry) over generic assertions:

```typescript
// Good — auto-retries until condition met or timeout
await expect(page.getByRole('heading')).toHaveText('Dashboard');
await expect(page.getByRole('button')).toBeEnabled();
await expect(page).toHaveURL('/dashboard');

// Bad — no retry, flaky
const text = await page.getByRole('heading').textContent();
expect(text).toBe('Dashboard');
```

### Page Object Model

Encapsulate page structure in page classes. Keep locators in one place, expose methods for actions.

```typescript
export class LoginPage {
  constructor(readonly page: Page) {}
  readonly emailInput = this.page.getByLabel('Email');
  readonly submitButton = this.page.getByRole('button', { name: 'Sign in' });

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.submitButton.click();
  }
}
```

### Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| `waitForTimeout(5000)` | Use auto-waiting assertions or `waitForResponse` |
| Generic assertions on DOM | Use web-first `expect(locator).toHaveText(...)` |
| Shared test data across workers | Isolate data per worker with fixtures |
| Tests depend on execution order | Keep tests independent, use `beforeEach` |
| CSS selectors for locators | Use role/label/text/testid locators |
| `page.click('#id')` | `page.getByRole('button', { name: '...' }).click()` |

### CI/CD Essentials

```typescript
// playwright.config.ts — CI-optimized
export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
});
```

### Subagent Context

Always use `--run` or `CI=true` — watch mode hangs subagents.
Run: `npx playwright test --reporter=list`
Repeat for confidence: `npx playwright test --repeat-each=5`

## Part E: Anti-Patterns (delete these tests)

- **Over-mocking:** if mock setup > test logic, you're testing mocks not code
- **Testing CSS:** `toHaveStyle({color: 'red'})` breaks on every design update — use visual regression
- **Testing framework code:** `render(<X/>)` with no assertion tests React, not your component
- **Exact string matching:** `expect(msg).toBe('Error: Invalid email...')` — test the error type, not the copy
- **Tests without assertions:** a test that can't fail catches nothing
