# Testing Patterns

**Analysis Date:** 2026-03-12

## Test Framework

**Runner:**
- Bun test (`bun:test`) for JavaScript tests
- Vitest for TypeScript tests (Next.js fixture)
- Playwright for E2E tests (browser automation)
- Config files: `bun` uses inline imports, Vitest/Playwright configs not explicitly defined in root

**Assertion Library:**
- Bun built-in expect API: `expect(...).toBe()`, `expect(...).toHaveLength()`
- Vitest expect API: same interface as Bun
- Playwright expect API: async matchers like `await expect(locator).toBeVisible()`

**Run Commands:**
```bash
bun test                    # Run all tests using Bun test runner
bun run test                # From scripts if defined in package.json
```

Tests in TypeScript fixture run with Vitest (implied by `vitest` import pattern in `evals/fixtures/nextjs-app-deep/`)

## Test File Organization

**Location:**
- `upstream/impeccable-1.2.0/tests/lib/transformers/` - Transformer unit tests
- `upstream/impeccable-1.2.0/tests/` - Root test directory
- `evals/fixtures/nextjs-app-deep/src/__tests__/` - Co-located with source in fixtures
- `evals/fixtures/nextjs-app-deep/e2e/` - E2E tests in separate directory

**Naming:**
- `.test.js` suffix for Bun tests
- `.spec.ts` suffix for Playwright E2E tests
- `.test.ts` suffix for Vitest unit tests
- Descriptive test names reflecting scenario being tested

**Structure:**
```
upstream/impeccable-1.2.0/
├── tests/
│   ├── build.test.js           # Integration tests for build pipeline
│   └── lib/transformers/
│       ├── claude-code.test.js  # Transformer unit tests
│       ├── cursor.test.js
│       └── gemini.test.js
evals/fixtures/nextjs-app-deep/
├── src/__tests__/
│   └── auth.test.ts             # Co-located unit tests
└── e2e/
    └── login.spec.ts            # E2E browser tests
```

## Test Structure

**Suite Organization:**
```typescript
// Bun/Vitest pattern - from upstream/impeccable-1.2.0/tests/build.test.js
import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';

describe('build orchestration', () => {
  beforeEach(() => {
    // Setup: create temp directories
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    // Teardown: cleanup temp files
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  test('should call readSourceFiles with root directory', () => {
    // Arrange
    const readSourceFilesSpy = spyOn(utils, 'readSourceFiles').mockReturnValue({
      commands: [],
      skills: []
    });

    // Act
    const { commands, skills } = utils.readSourceFiles(ROOT_DIR);

    // Assert
    expect(readSourceFilesSpy).toHaveBeenCalledWith(ROOT_DIR);
    readSourceFilesSpy.mockRestore();
  });
});
```

**Patterns:**
- Setup: `beforeEach` creates isolated test directories (`TEST_DIR`)
- Teardown: `afterEach` removes test artifacts synchronously
- Mocking: `spyOn(module, 'function').mockReturnValue()`
- Restoration: `spy.mockRestore()` cleans up after each test
- Temporary file management essential for filesystem-heavy tests

## Mocking

**Framework:** Bun's `spyOn` API (built-in, no external dependency)

**Patterns:**
```typescript
// From upstream/impeccable-1.2.0/tests/build.test.js
const readSourceFilesSpy = spyOn(utils, 'readSourceFiles').mockReturnValue({
  commands: [],
  skills: []
});

const transformCursorSpy = spyOn(transformers, 'transformCursor').mockImplementation(() => {});

// Track call order
const callOrder = [];
spyOn(transformers, 'transformCursor').mockImplementation(() => {
  callOrder.push('cursor');
});

// Assertions on mocks
expect(readSourceFilesSpy).toHaveBeenCalledWith(ROOT_DIR);
expect(transformCursorSpy).toHaveBeenCalledWith(commands, skills, DIST_DIR);
expect(callOrder).toEqual(['cursor', 'claude-code', 'gemini', 'codex']);

// Mock restoration
readSourceFilesSpy.mockRestore();
transformCursorSpy.mockRestore();
```

**What to Mock:**
- External function calls: `readSourceFiles`, `transformCursor`
- System operations that would be slow: actual filesystem writes
- Integration points between modules
- Dependencies to isolate unit under test

**What NOT to Mock:**
- Filesystem operations in integration tests (explicitly test the actual I/O)
- Actual validation logic (test real validation rules)
- Core business logic (test real transformations)
- Parser functions (test actual YAML/markdown parsing)

## Fixtures and Factories

**Test Data:**
```typescript
// From upstream/impeccable-1.2.0/tests/lib/transformers/claude-code.test.js
const commands = [
  {
    name: 'test-command',
    description: 'A test command',
    args: [
      { name: 'target', description: 'The target', required: false },
      { name: 'output', description: 'Output format', required: true }
    ],
    body: 'Command body here.'
  }
];

const skills = [
  {
    name: 'test-skill',
    description: 'A test skill',
    license: 'MIT',
    body: 'Skill instructions.'
  }
];
```

**Location:**
- Inline in test files (small, focused datasets)
- Test utilities: `path.join(TEST_DIR, 'source/commands/test-command.md')` for file fixtures
- No separate fixture factory files — data embedded in test cases

## Coverage

**Requirements:** Not enforced

**View Coverage:** No coverage reporting configuration detected in codebase

## Test Types

**Unit Tests:**
- Scope: Single function or module in isolation
- Approach: Mock external dependencies, test specific behavior
- Examples: `claude-code.test.js` tests `transformClaudeCode` with various input combinations
- Files: `upstream/impeccable-1.2.0/tests/lib/transformers/*.test.js`

**Integration Tests:**
- Scope: Multiple modules working together
- Approach: Actual filesystem I/O, real parsing, real transformation pipeline
- Example from `build.test.js` line 124-174: Creates real files, runs all transformers, verifies outputs exist with correct structure
- Pattern: Write test files to temp directory, run full pipeline, assert directory structure and file contents

```typescript
// Integration test pattern - from build.test.js
test('integration: full build creates all expected outputs', () => {
  const commandContent = `---\nname: test-command\n---\n\nBody`;
  const skillContent = `---\nname: test-skill\n---\n\nSkill body`;

  // Write real files
  utils.writeFile(path.join(TEST_DIR, 'source/commands/test-command.md'), commandContent);
  utils.writeFile(path.join(TEST_DIR, 'source/skills/test-skill.md'), skillContent);

  // Run full pipeline
  const { commands, skills } = utils.readSourceFiles(TEST_DIR);
  transformers.transformCursor(commands, skills, DIST_DIR);
  transformers.transformClaudeCode(commands, skills, DIST_DIR);
  transformers.transformGemini(commands, skills, DIST_DIR);
  transformers.transformCodex(commands, skills, DIST_DIR);

  // Assert all outputs created correctly
  expect(fs.existsSync(path.join(DIST_DIR, 'cursor/commands/test-command.md'))).toBe(true);
  expect(fs.existsSync(path.join(DIST_DIR, 'claude-code/commands/test-command.md'))).toBe(true);
});
```

**E2E Tests:**
- Framework: Playwright (browser automation)
- Scope: Full user workflows in a real browser
- Files: `evals/fixtures/nextjs-app-deep/e2e/login.spec.ts`
- Pattern: Navigate to page, interact with elements, assert outcomes

```typescript
// E2E test pattern - from login.spec.ts
test('should login successfully', async ({ page }) => {
  await page.goto('/login');
  await page.fill('.email-input', 'admin@acme.com');
  await page.fill('input[type="password"]', 'SecurePass123');
  await page.click('.btn-primary');

  await page.waitForURL('/');
  expect(page.url()).toContain('/');
});
```

## Common Patterns

**Async Testing:**
- Async test functions with `async ({ page })` for E2E tests
- `await` for page navigation: `await page.goto('/login')`
- `await` for interactions: `await page.fill()`, `await page.click()`
- Waiters for state changes: `await page.waitForURL('/')`
- Promise-based in unit tests with synchronous assertions

**Error Testing:**
- Mock validation failures and assert error returns
- Integration tests verify error conditions create expected outputs (e.g., empty arrays)
- No explicit error/exception assertions detected in test suite

```typescript
// Error condition testing pattern - from claude-code.test.js
test('should handle empty arrays', () => {
  transformClaudeCode([], [], TEST_DIR);

  const commandFiles = fs.readdirSync(path.join(TEST_DIR, 'claude-code/commands'));
  const skillDirs = fs.readdirSync(path.join(TEST_DIR, 'claude-code/skills'));

  expect(commandFiles).toHaveLength(0);
  expect(skillDirs).toHaveLength(0);
});
```

## Test Data Verification

**Frontmatter Parsing:**
Tests verify complex YAML parsing works correctly:
```typescript
// From claude-code.test.js
const parsed = parseFrontmatter(content);

expect(parsed.frontmatter.name).toBe('test-command');
expect(parsed.frontmatter.args).toHaveLength(2);
expect(parsed.frontmatter.args[0].name).toBe('target');
expect(parsed.frontmatter.args[1].required).toBe(true);
expect(parsed.body).toBe('Command body here.');
```

**Multiline Content Preservation:**
Tests ensure formatting is preserved through transformations:
```typescript
// From claude-code.test.js
test('should preserve multiline body content', () => {
  const commands = [{
    body: `First paragraph.\n\nSecond paragraph.\n\n- List item 1`
  }];
  transformClaudeCode(commands, [], TEST_DIR);

  const content = fs.readFileSync(outPath, 'utf-8');
  const parsed = parseFrontmatter(content);

  expect(parsed.body).toContain('First paragraph.');
  expect(parsed.body).toContain('- List item 1');
});
```

---

*Testing analysis: 2026-03-12*
