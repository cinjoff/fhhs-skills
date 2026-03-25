---
name: fh:playwright-testing
description: Playwright testing patterns and best practices. Provides guidance for writing, debugging, and maintaining Playwright tests. Not invoked directly — loaded conditionally by /fh:build and /fh:fix when test files are in scope.
user-invokable: false
---

# Playwright Testing Patterns

Distilled from [playwright-best-practices](https://github.com/currents-dev/playwright-best-practices-skill) upstream. Use this as a decision tree when writing, debugging, or maintaining Playwright tests.

## Decision Tree

```
What are you doing?
│
├─ Writing a new test?
│  ├─ E2E test → references/test-organization.md, references/locators.md, references/assertions-waiting.md
│  ├─ Component test → references/component-testing.md
│  ├─ API mock test → references/test-organization.md, references/network-advanced.md
│  ├─ Visual regression → references/canvas-webgl.md, references/test-organization.md
│  ├─ Accessibility test → references/accessibility.md
│  ├─ Mobile/responsive → references/mobile-testing.md
│  └─ Multi-user test → references/multi-user.md
│
├─ Structuring test code?
│  ├─ Page Object Model → references/page-object-model.md
│  ├─ Fixtures & hooks → references/fixtures-hooks.md
│  ├─ Test data factories → references/test-data.md
│  └─ Test organization → references/test-organization.md
│
├─ Test is failing/flaky?
│  ├─ Flaky test investigation → references/flaky-tests.md
│  ├─ Element not found → references/locators.md, references/debugging.md
│  ├─ Timeout issues → references/assertions-waiting.md, references/debugging.md
│  ├─ Race conditions → references/flaky-tests.md, references/debugging.md
│  ├─ Fails only in CI → references/flaky-tests.md (CI-Specific section)
│  └─ General debugging → references/debugging.md
│
├─ Setting up infrastructure?
│  ├─ CI/CD pipelines → references/ci-cd.md
│  ├─ Global setup/teardown → references/global-setup.md
│  ├─ Parallel execution → references/performance.md
│  ├─ Sharding → references/ci-cd.md (Sharding section)
│  └─ Test coverage → references/test-coverage.md
│
└─ Testing specific features?
   ├─ Auth / OAuth → references/fixtures-hooks.md, references/third-party.md
   ├─ File upload/download → references/file-operations.md
   ├─ Date/time mocking → references/clock-mocking.md
   ├─ WebSockets → references/websockets.md
   ├─ Geolocation/permissions → references/browser-apis.md
   ├─ iFrames → references/iframes.md
   ├─ Network/API mocking → references/network-advanced.md
   ├─ Security (XSS, CSRF) → references/security-testing.md
   ├─ Performance/Web Vitals → references/performance-testing.md
   └─ Error/offline states → references/error-testing.md
```

## Core Patterns (Always Follow)

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

Encapsulate page structure in page classes. Keep locators in one place, expose methods for actions, return new page objects on navigation.

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

See `references/page-object-model.md` for composition, component objects, and fixture integration.

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| `waitForTimeout(5000)` | Use auto-waiting assertions or `waitForResponse` |
| Generic assertions on DOM | Use web-first `expect(locator).toHaveText(...)` |
| Shared test data across workers | Isolate data per worker with fixtures |
| Tests depend on execution order | Keep tests independent, use `beforeEach` |
| CSS selectors for locators | Use role/label/text/testid locators |
| `page.click('#id')` | `page.getByRole('button', { name: '...' }).click()` |

## CI/CD Essentials

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

See `references/ci-cd.md` for GitHub Actions workflows, sharding, Docker, and reporting.

## Test Validation Loop

After writing or modifying tests:

1. **Run tests**: `npx playwright test --reporter=list`
2. **If tests fail**: review error output, fix locators/waits/assertions, re-run
3. **Only proceed when all tests pass**
4. **Run multiple times** for critical tests: `npx playwright test --repeat-each=5`

**Subagent context**: Always use `--run` or `CI=true` — watch mode hangs subagents.
