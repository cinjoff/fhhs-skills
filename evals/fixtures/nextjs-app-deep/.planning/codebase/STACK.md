# Technology Stack

**Analysis Date:** 2026-03-17

## Languages

**Primary:**
- TypeScript 5.x - All source code (`src/**/*.ts`, `src/**/*.tsx`)

**Secondary:**
- JavaScript - Configuration files (postcss.config.mjs, tailwind.config.ts)
- CSS - Styling via Tailwind CSS preprocessor

## Runtime

**Environment:**
- Node.js (version not specified in codebase)

**Package Manager:**
- pnpm (inferred from playwright.config.ts: `command: 'pnpm dev'`)
- Lockfile: Not visible in fixture, but pnpm is used for dev tasks

## Frameworks

**Core:**
- Next.js 15 (App Router) - Full-stack application framework
  - Location: `src/app/` for page routing, `src/app/api/` for API routes
  - Server Components by default per CLAUDE.md

**UI/Styling:**
- React 19+ - Component library (part of Next.js 15)
- Tailwind CSS 4.x - Utility-first CSS styling
  - Config: `tailwind.config.ts`
  - CSS Variables for theming in `src/app/globals.css`
- shadcn/ui - Component library built on Radix UI
  - Location: `src/components/ui/`
  - Config: `components.json` (New York style, RSC enabled)

**Icons:**
- lucide-react - Icon library (imports: `lucide-react`)

**UI Primitives:**
- Radix UI - Headless component library
  - Packages: `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-slot`

**Utility:**
- class-variance-authority (cva) - Type-safe CSS utilities for component variants
- clsx/cn - Classname merging utility (`@/lib/utils`)

**Typography:**
- Next.js Font Google - Hosted fonts (Inter font)
  - Usage: `src/app/layout.tsx`

## Testing

**Unit Tests:**
- Vitest - Test runner and assertion library
  - Location: `src/__tests__/auth.test.ts`
  - Imports: `vitest` (describe, it, expect)

**Testing Library:**
- @testing-library/react - React component testing utilities
  - Imports: `@testing-library/react` (render, screen)

**E2E Tests:**
- Playwright - Browser automation and E2E testing
  - Config: `playwright.config.ts`
  - Location: `e2e/` directory
  - Test file: `e2e/login.spec.ts`
  - Setup: Runs `pnpm dev` server on http://localhost:3000
  - Reporter: HTML test report
  - Browser: Chromium only
  - CI config: 2 retries, parallel disabled, trace on first retry

## Key Dependencies

**Critical:**
- @supabase/supabase-js - Database and auth client
  - Location: `src/lib/supabase.ts`
  - Usage: Auth (signInWithPassword), database queries (from, insert, select, delete, rpc)
  - Keys: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

**Authentication:**
- jsonwebtoken - JWT signing and verification
  - Location: `src/lib/auth.ts`
  - Usage: Access token generation (15m expiry), token refresh, refresh token verification
  - Secret: Hardcoded "acme-dashboard-secret-2024" in `src/lib/auth.ts`

**Build & Development:**
- TypeScript - Language compiler
  - Config: `tsconfig.json` (strict: true, ES2017 target)
- PostCSS - CSS preprocessor
  - Config: `postcss.config.mjs`
  - Plugins: Tailwind CSS, Autoprefixer
- next (Next.js CLI) - Development server and build tool

## Configuration

**Environment Variables:**
- NEXT_PUBLIC_SUPABASE_URL - Supabase project URL (public)
- NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase anonymous key (public, safe for client)
- SUPABASE_SERVICE_ROLE_KEY - Supabase service role (server-side only)
- Example file: `.env.example` present in root

**Build Configuration:**
- `next.config.ts` - Minimal Next.js config (empty, using defaults)
- `tsconfig.json` - TypeScript compiler options with path alias `@/*` → `./src/*`
- `tailwind.config.ts` - Tailwind CSS configuration with dark mode class support
- `playwright.config.ts` - E2E test configuration

## Platform Requirements

**Development:**
- Node.js + pnpm
- Local dev server on http://localhost:3000
- TypeScript strict mode required

**Production:**
- Deployment target: Vercel (inferred from Next.js + typical deployment)
- Database: Supabase (PostgreSQL-based)
- No explicit build optimization flags set

---

*Stack analysis: 2026-03-17*
