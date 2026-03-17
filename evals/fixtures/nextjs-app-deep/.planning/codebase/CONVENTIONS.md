# Coding Conventions

**Analysis Date:** 2026-03-17

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `DataTable.tsx`, `UserForm.tsx`)
- Utilities/Helpers: camelCase with `.ts` extension (e.g., `useDebounce.ts`, `validators.ts`)
- Hooks: kebab-case with `use-` prefix (e.g., `use-auth.ts`, `use-debounce.ts`)
- API routes: Follow Next.js App Router convention in nested `/api` directories (e.g., `src/app/api/auth/login/route.ts`)
- Page components: File-per-route with `page.tsx` (e.g., `src/app/page.tsx`, `src/app/login/page.tsx`)

**Functions:**
- camelCase for all functions: `signToken()`, `verifyToken()`, `validateEmail()`
- Exported hooks use `use` prefix: `useAuth()`, `useDebounce()`
- Handler functions prefixed with `handle`: `handleSubmit()`, `handleSort()`
- Validation functions prefixed with `validate`: `validateEmail()`, `validatePassword()`, `validateName()`

**Variables:**
- camelCase for all variables and constants: `mockPayload`, `accessToken`, `searchQuery`
- Boolean variables use `is`/`has` prefix: `isActive`, `isPositive`, `hasError`
- State setters follow React convention: `setUser()`, `setLoading()`, `setSearchQuery()`

**Types & Interfaces:**
- PascalCase for all types and interfaces: `UserRole`, `ApiAction`, `TokenPayload`, `DataTableProps`
- Props interfaces suffixed with `Props`: `DataTableProps`, `UserFormProps`, `MetricCardProps`
- API response types use clear naming: `ApiResponse`, `TokenPayload`

## Code Style

**Formatting:**
- TypeScript strict mode enabled (see `tsconfig.json`)
- Trailing semicolons required
- Prefer explicit type annotations over inference in function signatures

**Linting:**
- No linting config detected in repository (no `.eslintrc` or `biome.json`)
- Code follows standard TypeScript conventions with strict mode

**Spacing & Indentation:**
- 2-space indentation (observed throughout codebase)
- Single blank lines between logical sections
- Template literals used for multi-line JSX

## Import Organization

**Order:**
1. External libraries (`react`, `next/...`, third-party packages)
2. Type imports separated with `import type`
3. Internal imports from `@/` path alias
4. Relative imports (rare)

**Examples:**
```typescript
import { useState, FormEvent } from 'react';
import type { NextRequest } from 'next/server';
import { useAuth } from '@/hooks/use-auth';
import { DataTable } from '@/components/data-table';
```

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- Always use `@/` prefix for internal imports: `@/lib/auth`, `@/components/ui/button`, `@/hooks/use-auth`
- Avoid relative paths; use aliases for clarity

## Error Handling

**Patterns:**
- API routes return `NextResponse.json()` with appropriate status codes
- Try-catch blocks used in async operations with error logging
- Error messages passed as JSON response properties
- Re-throw errors in client-side hooks after logging
- No custom error classes; use standard `Error` with descriptive messages

**Example from `src/app/api/auth/login/route.ts`:**
```typescript
try {
  const { email, password } = await request.json();
  // ... operation ...
} catch (error) {
  return NextResponse.json(
    { message: 'Internal server error', details: String(error) },
    { status: 500 }
  );
}
```

**Validation Error Returns:**
- Validation functions return `string | null` (error message or null on success)
- API handlers check error and return appropriate status codes (400, 401, 500)

## Logging

**Framework:** `console` only (no structured logging library detected)

**Patterns:**
- `console.error()` used for error logging
- Simple string concatenation with error context
- Example: `console.error('Failed to load dashboard data:', error)`
- Logging happens in catch blocks and error states

## Comments

**When to Comment:**
- Comments minimal; code is generally self-documenting
- No JSDoc observed in codebase
- Descriptive function names and variable names preferred over inline comments

**JSDoc/TSDoc:**
- Not used in this codebase
- Type annotations serve as inline documentation

## Function Design

**Size:** Functions kept concise, typically 5-25 lines

**Parameters:**
- Named parameters in interfaces for components (e.g., `DataTableProps`, `UserFormProps`)
- Destructure props in component signatures
- Type all parameters explicitly

**Return Values:**
- Explicit return type annotations on all functions
- Async functions return `Promise<T>`
- Validation functions return `string | null` (null for success)
- Components return `JSX.Element` or `React.ReactNode`

**Example from `src/hooks/use-debounce.ts`:**
```typescript
export function useDebounce<T>(value: T, delay: number): T {
  // ... implementation ...
  return debouncedValue;
}
```

## Module Design

**Exports:**
- Named exports preferred over default exports (see CLAUDE.md convention)
- Example: `export function DataTable()` rather than `export default DataTable`
- Component files export single component with that name
- Utility files export multiple named functions

**Barrel Files:**
- `src/types/index.ts` aggregates all type definitions and utility functions
- Imported as: `import { User, UserRole, getRolePermissions } from '@/types'`

**File Structure by Category:**
- Components in `src/components/` (composable UI pieces)
- Utilities in `src/lib/` (pure functions, API helpers, validators)
- Hooks in `src/hooks/` (React hooks with side effects)
- API routes in `src/app/api/` (Next.js API handlers)
- Page components in `src/app/` (route handlers)

## Client vs Server Components

**Server Components by default** (per CLAUDE.md):
- Page components and layouts are server components
- `'use client'` directive added only when component requires interactivity
- Observed in interactive components: `DataTable`, `UserForm`, `Sidebar`, `ThemeToggle`
- No `'use client'` on: layout components, simple presentational components

**Example server-side (no directive):**
```typescript
// src/components/metric-card.tsx - pure presentation
export function MetricCard({ label, value, change, icon }: MetricCardProps) {
  // ...
}
```

**Example client-side:**
```typescript
// src/components/data-table.tsx - has state and interactivity
'use client';
export function DataTable({ data, fields, pageSize = 10, onRowClick }: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  // ...
}
```

## Conventional Commits

**Format:** `{type}({scope}): {message}`

**Types observed:** `feat`, `fix`, `refactor`

**Examples:**
- `feat(auth): add JWT token verification`
- `fix(api): handle missing user ID parameter`
- `refactor(components): extract SearchInput to separate component`

---

*Convention analysis: 2026-03-17*
