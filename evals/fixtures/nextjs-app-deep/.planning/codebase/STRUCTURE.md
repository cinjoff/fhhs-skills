# Codebase Structure

**Analysis Date:** 2026-03-17

## Directory Layout

```
nextjs-app-deep/
├── .planning/               # GSD planning artifacts (not part of app)
├── e2e/                     # Playwright E2E tests
├── src/
│   ├── __tests__/           # Vitest unit tests
│   ├── app/                 # Next.js 15 App Router (pages & API routes)
│   │   ├── api/             # API route handlers
│   │   │   ├── auth/        # Authentication endpoints
│   │   │   ├── comments/    # Comments CRUD endpoint
│   │   │   ├── data/        # Data (metrics, activity) endpoint
│   │   │   └── users/       # Users CRUD & search endpoint
│   │   ├── login/           # Login page
│   │   ├── users/           # Users list page
│   │   ├── settings/        # Settings page
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Dashboard home page
│   ├── components/          # Reusable React components
│   │   ├── ui/              # shadcn/ui primitive components
│   │   ├── data-table.tsx   # Generic table with search/sort/pagination
│   │   ├── sidebar.tsx      # Navigation sidebar
│   │   ├── user-form.tsx    # User input form
│   │   ├── user-avatar.tsx  # User avatar display
│   │   ├── chart-widget.tsx # Activity chart component
│   │   ├── metric-card.tsx  # KPI metric card
│   │   ├── comment-card.tsx # Comment display card
│   │   └── [other-ui].tsx   # Theme toggle, search input, notification toast, empty states
│   ├── hooks/               # Custom React hooks
│   │   ├── use-auth.ts      # Authentication hook (login, logout, session)
│   │   └── use-debounce.ts  # Search debounce hook
│   ├── lib/                 # Utility and data access functions
│   │   ├── auth.ts          # JWT token functions (signToken, verifyToken, saveSession)
│   │   ├── api.ts           # Fetch wrapper functions (fetchUsers, fetchMetrics, etc.)
│   │   ├── supabase.ts      # Supabase client & service client
│   │   ├── validators.ts    # Input validation functions
│   │   └── utils.ts         # General utilities (cn, etc.)
│   └── types/               # TypeScript type definitions
│       └── index.ts         # User, Role, Metric, Comment, ApiResponse types
├── next.config.ts           # Next.js config (empty)
├── tsconfig.json            # TypeScript strict mode config
├── tailwind.config.ts       # Tailwind CSS config with shadcn/ui
├── playwright.config.ts     # Playwright E2E test config
├── components.json          # shadcn/ui CLI config
├── postcss.config.mjs       # PostCSS config for Tailwind
├── CLAUDE.md                # Project conventions doc
└── .env.example             # Environment variable template
```

## Directory Purposes

**`src/app/`:**
- Purpose: All pages and API routes (Next.js App Router entry points)
- Contains: `.tsx` page files, `route.ts` API handlers, `layout.tsx` wrappers
- Key files: `page.tsx` (dashboard), `layout.tsx` (root HTML setup), `login/page.tsx`, `users/page.tsx`

**`src/app/api/`:**
- Purpose: Server-side API endpoints
- Contains: Route handlers that query Supabase and return JSON
- Key files: `auth/login/route.ts`, `users/route.ts`, `data/route.ts`, `comments/route.ts`

**`src/components/`:**
- Purpose: Reusable React components
- Contains: UI building blocks and feature-specific components
- Key files: `data-table.tsx` (table with sort/search/pagination), `sidebar.tsx` (navigation), UI primitives in `ui/` subdirectory

**`src/hooks/`:**
- Purpose: Custom React hooks for shared logic
- Contains: Client-side hooks for auth state, debouncing
- Key files: `use-auth.ts` (login, logout, session), `use-debounce.ts`

**`src/lib/`:**
- Purpose: Non-component utilities, data access, validation
- Contains: Pure functions, Supabase client, token signing, input validators
- Key files: `auth.ts`, `supabase.ts`, `api.ts`, `validators.ts`, `utils.ts`

**`src/types/`:**
- Purpose: Centralized TypeScript types
- Contains: Interfaces for User, Metric, Comment, ApiResponse; helper functions like getRolePermissions
- Key files: `index.ts` (all types)

**`src/__tests__/`:**
- Purpose: Vitest unit tests (co-located with source)
- Contains: Test files for auth utilities, data-table component
- Key files: `auth.test.ts`, `data-table.test.tsx`

**`e2e/`:**
- Purpose: Playwright end-to-end tests
- Contains: Test specs that navigate pages and verify user flows
- Key files: `login.spec.ts` (login flow validation)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root HTML layout, sets title and metadata
- `src/app/page.tsx`: Dashboard (home page at `/`)
- `src/app/login/page.tsx`: Login form at `/login`
- `src/app/users/page.tsx`: Users list at `/users`

**Configuration:**
- `tsconfig.json`: TypeScript strict mode, path alias `@/*` → `src/*`
- `next.config.ts`: Next.js config (empty; defaults used)
- `playwright.config.ts`: E2E test runner config, baseURL = http://localhost:3000
- `tailwind.config.ts`: Tailwind CSS with shadcn/ui presets
- `components.json`: shadcn/ui component library config
- `CLAUDE.md`: Project conventions (server components, named exports, conventional commits, no any types)

**Core Logic:**
- `src/lib/auth.ts`: JWT signing/verification, localStorage session management
- `src/lib/supabase.ts`: Supabase client initialization with public anon key and service role key
- `src/lib/api.ts`: Fetch wrapper functions (fetchUsers, fetchMetrics, updateUser)
- `src/lib/validators.ts`: Input validation functions (validateEmail, validatePassword, validateName)

**Testing:**
- `src/__tests__/auth.test.ts`: Vitest unit tests for JWT token functions
- `src/__tests__/data-table.test.tsx`: Vitest tests for table component behavior
- `e2e/login.spec.ts`: Playwright E2E test for login flow (shows form, successful login, error handling)

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js standard)
- API routes: `route.ts` (Next.js standard)
- Components: `kebab-case.tsx` (e.g., `user-avatar.tsx`, `data-table.tsx`)
- Hooks: `use-*.ts` (React convention, e.g., `use-auth.ts`)
- Utilities: `camelCase.ts` (e.g., `validators.ts`, `utils.ts`)
- Tests: `*.test.ts` or `*.spec.ts` (e.g., `auth.test.ts`, `login.spec.ts`)

**Directories:**
- App routes: `kebab-case/` matching URL path (e.g., `/login` → `src/app/login/`)
- API routes: `kebab-case/` matching endpoint path (e.g., `/api/auth/login` → `src/app/api/auth/login/`)
- Logical groups: lowercase plural (e.g., `components/`, `hooks/`, `lib/`)

## Where to Add New Code

**New Feature (e.g., new dashboard page):**
- Primary code: `src/app/[feature]/page.tsx`
- Tests: `src/__tests__/[feature].test.tsx`
- Components if needed: `src/components/[feature-name].tsx`

**New Component/Module:**
- Implementation: `src/components/[name].tsx` (if reusable) or inline in page
- Example: `src/components/comment-card.tsx` for comment display
- Tests: `src/__tests__/[name].test.tsx` if complex logic

**Utilities:**
- Shared helpers: `src/lib/[utility].ts` (e.g., `validators.ts`, `api.ts`)
- Hooks: `src/hooks/use-[feature].ts` (e.g., `use-auth.ts`)

**API Endpoints:**
- Route handlers: `src/app/api/[resource]/route.ts` for collection, `src/app/api/[resource]/[id]/route.ts` for item
- Example: `/api/users` → `src/app/api/users/route.ts` (GET all, POST create, DELETE via query param)

**Types:**
- Add to `src/types/index.ts` (single barrel file for all types)
- Example: New interface `Comment` added directly to index.ts, not a separate file

## Special Directories

**`src/components/ui/`:**
- Purpose: shadcn/ui primitive components (Button, Card, Dialog, Input, etc.)
- Generated: Yes (via `npx shadcn-ui@latest add`)
- Committed: Yes (components are source code)
- Pattern: Import from `@/components/ui/button`, `@/components/ui/card`, etc.

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes (created by `npm run build` or dev server)
- Committed: No (excluded in .gitignore)

**`src/__tests__/`:**
- Purpose: Test files co-located with source
- Generated: No (manually written)
- Committed: Yes
- Pattern: `*.test.ts` for unit tests run by Vitest

**`e2e/`:**
- Purpose: Playwright E2E test specs
- Generated: No (manually written)
- Committed: Yes
- Pattern: `*.spec.ts` run by Playwright test runner

---

*Structure analysis: 2026-03-17*
