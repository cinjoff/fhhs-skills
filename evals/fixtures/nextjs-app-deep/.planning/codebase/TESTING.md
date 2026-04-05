# Testing Patterns

**Analysis Date:** 2026-03-17

## Test Framework

**Runner:**
- Vitest (for unit tests)
- Playwright (for E2E tests)

**Test Library:**
- React Testing Library (for component testing)

**Run Commands:**
```bash
# Unit tests (Vitest)
pnpm test

# Unit tests watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# E2E tests (Playwright)
pnpm e2e

# E2E tests UI mode
pnpm e2e:ui
```

## Test File Organization

**Location:**
- Unit tests co-located in `src/__tests__/` directory
- E2E tests in `e2e/` directory at project root

**Naming:**
- Unit tests: `{component-or-module}.test.ts` or `.test.tsx`
- E2E tests: `{feature}.spec.ts`
- Examples: `auth.test.ts`, `data-table.test.tsx`, `login.spec.ts`

**Structure:**
```
src/
├── __tests__/
│   ├── auth.test.ts          # Test for src/lib/auth.ts
│   └── data-table.test.tsx   # Test for src/components/data-table.tsx
└── [source files]

e2e/
└── login.spec.ts             # E2E test for login flow
```

## Test Structure

**Suite Organization (Vitest):**
```typescript
import { describe, it, expect } from 'vitest';

describe('auth', () => {
  const mockPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'admin',
  };

  it('should generate a valid JWT token', () => {
    const token = signToken(mockPayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('should verify a valid token and return payload', () => {
    const token = signToken(mockPayload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(mockPayload.userId);
  });
});
```

**Patterns:**
- Test suites use `describe('name', () => { ... })`
- Individual tests use `it('should...', () => { ... })`
- Arrange-Act-Assert pattern (implicit)
- Mock data defined at suite scope, reused across tests
- Descriptive test names start with "should"

## Component Testing

**Location:** `src/__tests__/data-table.test.tsx`

**Setup Pattern:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTable } from '@/components/data-table';

const mockData = [
  { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin' },
  // ...
];

const mockColumns = [
  { key: 'name', label: 'Name', sortable: true },
  // ...
];

describe('DataTable', () => {
  it('should render table headers', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    expect(screen.getByText('Name')).toBeDefined();
  });
});
```

**Testing Approach:**
- Use `render()` from React Testing Library
- Query DOM using `screen.getByText()`, `screen.getByRole()` (role-based preferred per CLAUDE.md)
- Assert with `expect()` - check existence, visibility, text content
- Mock data provided as test constants

## E2E Testing (Playwright)

**Configuration:** `playwright.config.ts`

**Base URL:** `http://localhost:3000`

**Reporters:** HTML report

**CI Settings:**
- Retries: 2 in CI, 0 locally
- Workers: 1 in CI (serial), parallel locally
- Trace: captured on first retry

**Test Structure (Playwright):**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('should show login form', async ({ page }) => {
    await page.goto('/login');
    expect(await page.locator('.email-input').isVisible()).toBeTruthy();
    expect(await page.locator('input[type="password"]').isVisible()).toBeTruthy();
  });

  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    await page.fill('.email-input', 'admin@acme.com');
    await page.fill('input[type="password"]', 'SecurePass123');
    await page.click('.btn-primary');
    await page.waitForURL('/');
    expect(page.url()).toContain('/');
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('.email-input', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('.btn-primary');
    await expect(page.locator('.text-red-600')).toBeVisible();
  });
});
```

**Patterns:**
- Suite organization: `test.describe('Feature', () => { ... })`
- Each test receives `{ page }` fixture providing browser automation
- Navigation: `await page.goto(path)`
- Form interaction: `await page.fill(selector, value)`, `await page.click(selector)`
- Assertions: `expect()` with `.toBeVisible()`, `.toBeTruthy()`, `toContain()`
- URL waiting: `await page.waitForURL(pattern)` after navigation actions

**Selector Strategy:**
- CSS selectors for classes: `.email-input`, `.btn-primary`
- Attribute selectors: `input[type="password"]`
- Note: CLAUDE.md specifies Page Object Model with role-based locators as best practice, but current tests use class-based selectors
- Recommended approach (not yet implemented): Use `getByRole()` pattern for accessibility

## Mocking

**Framework:** None explicitly configured; standard Jest/Vitest mocking patterns

**Patterns:**
- No mock implementations shown in test files
- Test data provided as constants (mockPayload, mockData, mockColumns)
- API calls would be mocked at integration test level (not shown in current tests)

**What to Mock:**
- External API calls (Supabase, database queries)
- Network requests
- Third-party services

**What NOT to Mock:**
- Pure functions (validators, token utilities)
- Local utilities and helpers
- Component logic without external dependencies

## Fixtures and Factories

**Test Data:**
```typescript
// src/__tests__/auth.test.ts
const mockPayload = {
  userId: 'user-123',
  email: 'test@example.com',
  role: 'admin',
};

// src/__tests__/data-table.test.tsx
const mockData = [
  { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin' },
  { id: '2', name: 'Bob', email: 'bob@example.com', role: 'editor' },
  { id: '3', name: 'Charlie', email: 'charlie@example.com', role: 'viewer' },
];

const mockColumns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: false },
];
```

**Location:**
- Defined at suite scope (top of test file)
- Reused across multiple test cases
- No factory pattern or test utilities library used

## Coverage

**Requirements:** Not explicitly enforced (no coverage config in package.json or build)

**View Coverage:**
```bash
pnpm test:coverage
```

## Test Types

**Unit Tests:**
- Scope: Pure functions, validators, utility functions
- Approach: Vitest with direct function calls
- Location: `src/__tests__/`
- Example: `auth.test.ts` tests `signToken()`, `verifyToken()` functions in isolation

**Component Tests:**
- Scope: React component rendering and user interaction
- Approach: React Testing Library + Vitest
- Location: `src/__tests__/`
- Example: `data-table.test.tsx` tests DataTable renders headers, rows, empty state

**E2E Tests:**
- Scope: Full user workflows across pages
- Approach: Playwright with Page Object Model (recommended but not fully implemented)
- Location: `e2e/`
- Example: `login.spec.ts` tests login form visibility, successful login, error handling
- Current state: Uses CSS selectors; should evolve to role-based locators per CLAUDE.md

## Common Patterns

**Async Testing:**
```typescript
// Vitest - No special syntax needed
it('should verify a valid token', () => {
  const token = signToken(mockPayload);
  const decoded = verifyToken(token);
  expect(decoded.userId).toBe(mockPayload.userId);
});

// Playwright - All tests are async by default
test('should login successfully', async ({ page }) => {
  await page.goto('/login');
  await page.fill('.email-input', 'admin@acme.com');
  await page.waitForURL('/');
});
```

**Error Testing (implicit):**
```typescript
// Validation functions return error messages
const passwordError = validatePassword('short');
// Assert error message is returned (not tested yet, but pattern exists)

// API error handling tested at E2E level
test('should show error on invalid credentials', async ({ page }) => {
  // ... fill form with invalid data ...
  await expect(page.locator('.text-red-600')).toBeVisible();
});
```

**Test Data Setup:**
- Mock data defined once at describe scope
- Reused across multiple test cases
- No beforeEach/afterEach hooks observed
- Data immutability relied upon implicitly

## Config Files

**playwright.config.ts:**
```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Vitest Config:**
- Not found as separate config file
- Likely uses default Vitest settings with Next.js plugin
- May be embedded in `next.config.ts` or `package.json`

---

*Testing analysis: 2026-03-17*
