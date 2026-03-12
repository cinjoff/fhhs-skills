# Coding Conventions

**Analysis Date:** 2026-03-12

## Naming Patterns

**Files:**
- `.js` for CommonJS/ES modules in script utilities and hooks
- `.ts` for TypeScript source code with strict typing
- `.md` for skill/command documentation (SKILL.md for skills, command frontmatter for commands)
- Test files: `*.test.js` or `*.spec.ts` pattern

**Functions:**
- camelCase for all function names: `parseFrontmatter`, `transformCursor`, `isValidId`
- Async functions use `async` keyword: `async function getSkills()`
- Named exports preferred over default exports: `export function waitForEvent(...)`
- Higher-order/factory functions follow camelCase: `transformClaudeCode`, `readSourceFiles`

**Variables:**
- camelCase for all variable names and constants
- Constants from external data (validation rules) use UPPER_SNAKE_CASE: `VALID_ID`, `ALLOWED_PROVIDERS`, `ALLOWED_TYPES`
- Descriptive names with context: `threadManager`, `timeoutMs`, `matchingEvents`, not abbreviated forms
- Boolean variables prefix with `is`, `has`, `should`, `can`: `isValidId`, `existsSync`, `userInvokable`

**Types:**
- TypeScript strict mode enforced in NextJS fixture (e.g., `evals/fixtures/nextjs-app-deep/`)
- Import types on same line as implementation when used together
- Type paths use `@/` alias for app-relative imports: `import { signToken, verifyToken } from '@/lib/auth'`

## Code Style

**Formatting:**
- Biome formatter configured in `upstream/impeccable-1.2.0/biome.json` (minimal config, CSS Tailwind directives enabled)
- Indentation: 2 spaces (not enforced but observed in all files)
- No semicolons enforced by Biome (clean code style)
- Max line length not explicitly enforced in linting config

**Linting:**
- Biome for code quality and formatting (primary tool)
- ESLint patterns not detected in recent code — Biome is the standard
- No type checking configuration in package.json for transformation scripts

## Import Organization

**Order:**
1. Node.js built-in modules: `import fs from 'fs'`, `import path from 'path'`
2. Third-party packages: `import { readFileSync } from 'fs'`, `import { build } from 'esbuild'`
3. Relative project imports: `import { parseFrontmatter } from './utils.js'`, `import { transformCursor } from '../transformers/cursor.js'`
4. Type imports in TypeScript: `import type { ThreadManager, LaceEvent } from '~/threads/...'`

**Path Aliases:**
- `@/` used in Next.js fixtures for app-relative paths: `import { signToken } from '@/lib/auth'`
- `~/` used in TypeScript skills for root project paths: `import type { ThreadManager } from '~/threads/thread-manager'`
- Relative imports (no alias) used in upstream scripts and utilities

**Module Resolution:**
- ES modules throughout (`.js` files use `import`/`export`)
- Type: "module" declared in package.json for ES module support
- File extensions included in relative imports: `import { utils } from '../utils.js'`

## Error Handling

**Patterns:**
- Try/catch blocks for file I/O operations: `try { readFile(...) } catch (error) { console.error(...) }`
- Promise-based error handling in async functions: `catch (error) => { return { error: message, status } }`
- Return tuple pattern for error states: `{ error: "Invalid ID", status: 400 }` or `null` for missing data
- Validation before operations: `if (!isValidId(id)) { return { error: ... } }`
- Throwing errors only in critical utility functions, not in business logic paths

**Logging:**
- `console.error()` for exception logs: `console.error("Error reading skill source:", error)`
- `console.log()` for summary/status output: `console.log('✓ Claude Code: 1 commands, 1 skills')`
- No logging library dependency — plain console methods used throughout

## Comments

**When to Comment:**
- Document complex logic (e.g., YAML parser in `parseFrontmatter` function)
- Explain workarounds or non-obvious decisions
- Document integration points between modules

**JSDoc/TSDoc:**
- Parameters documented with `@param` tags
- Return types documented with `@returns`
- Descriptions include context and examples
- Example format from `condition-based-waiting-example.ts`:
  ```typescript
  /**
   * Wait for a specific event type to appear in thread
   *
   * @param threadManager - The thread manager to query
   * @param threadId - Thread to check for events
   * @param eventType - Type of event to wait for
   * @param timeoutMs - Maximum time to wait (default 5000ms)
   * @returns Promise resolving to the first matching event
   *
   * Example:
   *   await waitForEvent(threadManager, agentThreadId, 'TOOL_RESULT');
   */
  ```
- TSDoc in TypeScript files, plain comment blocks in JavaScript

## Function Design

**Size:**
- Functions typically 10-50 lines
- Utility functions extracted to separate files (e.g., `parseFrontmatter`, `readFilesRecursive`)
- Validation logic separated from business logic

**Parameters:**
- Parameters named descriptively, not abbreviated
- Default parameters used for optional values: `timeoutMs = 5000`
- No more than 4 parameters per function (use object for multiple related options)
- Prefer explicit parameters over implicit dependencies

**Return Values:**
- Single value returns for transformations: `{ frontmatter, body }`
- Tuple pattern for optional values: `Promise<LaceEvent | null>`
- Explicit null for "not found" states rather than undefined
- Objects destructured at call site when needed

## Module Design

**Exports:**
- Named exports only (no default exports in utility modules)
- Barrel files not used — direct path imports preferred
- Each module has focused responsibility (e.g., `validation.js` only contains validation helpers)

**Barrel Files:**
- Not used in this codebase
- Direct imports from source modules favored

## Async Patterns

**Promise Usage:**
- Async/await preferred over `.then()` chains
- New Promise constructor used for polling loops: `return new Promise((resolve, reject) => { ... })`
- Timeout detection using `Date.now()` comparisons
- Polling intervals explicit (e.g., `setTimeout(check, 10)` for 10ms poll)

## Cross-Module Patterns

**Configuration:**
- Configuration as constants in utility files (`VALID_ID`, `ALLOWED_PROVIDERS`)
- Runtime options passed as function parameters with defaults
- Environment variables not used in transform/validation logic

**Validation:**
- Centralized in dedicated modules: `server/lib/validation.js`
- Functions export both validator functions and regex patterns
- Return boolean or error tuples, not throw on invalid input

---

*Convention analysis: 2026-03-12*
