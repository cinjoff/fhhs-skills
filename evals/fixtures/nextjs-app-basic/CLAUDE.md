# Project Conventions

## Code Style
- Use Server Components by default; add `'use client'` only for interactivity
- Prefer named exports over default exports
- Use `satisfies` operator for type-safe object literals
- No barrel files (index.ts re-exports) — import directly from source module

## Testing
- Unit tests: Vitest, co-located as `*.test.ts` next to source
- E2E tests: Playwright in `e2e/` directory, Page Object Model pattern
- TDD workflow: failing test first, then implementation, then refactor

## Git
- Conventional commits: `feat(scope): summary`, `fix(scope): summary`
- One logical change per commit
- Squash-merge to main

## TypeScript
- `strict: true` in tsconfig.json — no exceptions
- Never use `any` — prefer `unknown` with type guards
- No `as` assertions unless provably safe (prefer type narrowing)
- Exhaustive switch statements on discriminated unions

## Performance
- Avoid client-side data fetching waterfalls — use Server Components + parallel data loading
- Dynamic imports for heavy client components
- Image optimization via next/image
