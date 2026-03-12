# Project: Acme Dashboard

## Overview
Internal dashboard for Acme Corp. Next.js 14 App Router with TypeScript, Tailwind CSS, and Prisma ORM.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS with custom design tokens
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth.js v5
- **Testing:** Vitest (unit), Playwright (E2E)
- **State:** React Server Components + minimal client state via Zustand

## Repository Structure
```
src/
  app/           # Next.js App Router pages and API routes
  components/    # Shared UI components
  lib/           # Utility functions and service modules
  types/         # TypeScript type definitions
  hooks/         # Custom React hooks
e2e/             # Playwright E2E tests
prisma/          # Prisma schema and migrations
```

## Conventions
- All API routes use Edge Runtime where possible
- Server Components by default; `'use client'` only when needed
- Conventional commits: `feat(scope):`, `fix(scope):`, `refactor(scope):`
- No `any` types — use `unknown` + type guards
