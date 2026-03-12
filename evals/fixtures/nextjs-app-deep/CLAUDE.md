# Acme Dashboard

## Tech Stack
- Next.js 15 (App Router)
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui
- Supabase (auth + database)
- Vitest (unit) + Playwright (E2E)

## Conventions
- Server Components by default; `'use client'` only for interactivity
- Prefer named exports
- Conventional commits: `feat(scope):`, `fix(scope):`, `refactor(scope):`
- No `any` types — use `unknown` with type guards
- Use shadcn/ui components from `@/components/ui/` — don't create raw HTML inputs/buttons
- E2E tests use Page Object Model pattern with role-based locators
