# Project: Acme Dashboard

## Overview
Internal dashboard for Acme Corp. Provides user management, analytics visualization, and settings configuration.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL + Auth)
- **Testing:** Vitest (unit), Playwright (E2E)
- **State:** React Server Components + client hooks

## Repository Structure
```
src/
  app/           # Next.js App Router pages and API routes
  components/    # Shared UI components
    ui/          # shadcn/ui base components
  lib/           # Utility functions and service modules
  types/         # TypeScript type definitions
  hooks/         # Custom React hooks
  __tests__/     # Unit tests (Vitest)
e2e/             # Playwright E2E tests
```

## Conventions
- Server Components by default; `'use client'` only for interactivity
- Use shadcn/ui components from `@/components/ui/` — don't create raw inputs/buttons
- Conventional commits: `feat(scope):`, `fix(scope):`, `refactor(scope):`
- No `any` types — use `unknown` with type guards
- E2E tests use Page Object Model pattern with role-based locators
