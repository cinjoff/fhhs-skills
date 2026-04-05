# Architecture

**Analysis Date:** 2026-03-17

## Pattern Overview

**Overall:** Next.js 15 App Router with server/client component separation and API layer pattern

**Key Characteristics:**
- Server components as default; client components only for interactivity
- API routes handle data operations with Supabase client
- Client-side state management via React hooks (useState, useCallback)
- Horizontal layer separation: presentation → API routes → Supabase
- Type-safe data flow with TypeScript strict mode

## Layers

**Presentation Layer (Server & Client Components):**
- Purpose: Render UI for pages and reusable components
- Location: `src/app/` (pages) and `src/components/`
- Contains: Page components, layout wrappers, UI components (shadcn/ui), custom components
- Depends on: API layer (`/api/*` routes), hooks, types
- Used by: Browser/Next.js request handler

**API Layer (Route Handlers):**
- Purpose: Handle HTTP requests, validate input, call Supabase, return responses
- Location: `src/app/api/`
- Contains: Route handlers (POST, GET, DELETE, PATCH) in `route.ts` files
- Depends on: Supabase client (`@/lib/supabase`), utilities, validators
- Used by: Client components via fetch, Playwright E2E tests

**Data Access Layer (Supabase Client):**
- Purpose: Connect to Supabase database and auth services
- Location: `src/lib/supabase.ts`
- Contains: Supabase client initialization, service role client factory
- Depends on: Environment variables (NEXT_PUBLIC_SUPABASE_URL, etc.)
- Used by: All API routes

**Utilities & Helpers:**
- Purpose: Shared logic for auth tokens, validation, API calls, utilities
- Location: `src/lib/` and `src/hooks/`
- Contains: Token signing (`auth.ts`), validators (`validators.ts`), API wrappers (`api.ts`), utilities (`utils.ts`)
- Depends on: jsonwebtoken, external libraries
- Used by: API routes, components, hooks

**Type Definitions:**
- Purpose: Centralized type definitions for User, Role, Metric, Comment, ApiResponse
- Location: `src/types/index.ts`
- Contains: TypeScript interfaces and type utilities with helper functions
- Used by: All layers

## Data Flow

**Authentication Flow:**

1. User submits credentials on `/login` page
2. `useAuth` hook calls `POST /api/auth/login`
3. Route handler calls `supabase.auth.signInWithPassword()`
4. On success: JWT token created via `signToken()`, saved to localStorage
5. User redirected to dashboard, session verified on demand

**Data Fetch Flow (Dashboard):**

1. Dashboard page mounts, `useEffect` triggers
2. Client-side fetch requests data: `/api/data?table=metrics`, `/api/users?limit=5`, `/api/data?table=activity`
3. Route handlers query Supabase RPC functions or tables
4. Data transformed and returned as JSON
5. Client setState updates UI

**State Management:**
- **Session state:** localStorage (access_token, refresh_token) + client-side useAuth hook
- **UI state:** React hooks (useState) for loading, data, search queries, pagination
- **Route state:** URL params (searchParams in route handlers)
- No global state manager (Redux, Zustand) — hooks and localStorage only

## Key Abstractions

**User Entity:**
- Purpose: Represents a dashboard user with role-based access
- Examples: `src/types/index.ts`, `src/app/users/page.tsx`, `src/components/user-avatar.tsx`
- Pattern: Defined in types, fetched via `/api/users`, displayed in DataTable with role badge

**API Response Pattern:**
- Purpose: Consistent shape for all API returns
- Examples: `{ data: [...], error?: string, status: number }` in `src/types/index.ts`
- Pattern: All route handlers return NextResponse.json() with data or error message

**DataTable Component:**
- Purpose: Reusable table with search, sort, pagination
- Examples: `src/components/data-table.tsx`
- Pattern: Generic with field configuration array, renderCell callback for custom cells

**Sidebar Navigation:**
- Purpose: Primary navigation across pages
- Examples: `src/components/sidebar.tsx`
- Pattern: Client component with usePathname hook to highlight active link

**Form Validation:**
- Purpose: Input validation with clear error messages
- Examples: `src/lib/validators.ts` (email, password, name validation functions)
- Pattern: Pure functions returning error message or null

## Entry Points

**Web App Root:**
- Location: `src/app/layout.tsx`
- Triggers: Browser request to `/` or any path
- Responsibilities: Set metadata (title, description), apply global font (Inter), wrap with body tags

**Dashboard Page:**
- Location: `src/app/page.tsx`
- Triggers: Navigation to `/`
- Responsibilities: Fetch metrics/users/activity from API, render sidebar + main content, display loading state

**Login Page:**
- Location: `src/app/login/page.tsx`
- Triggers: Navigation to `/login`
- Responsibilities: Render login form, handle submit, call useAuth hook, redirect on success

**Users Page:**
- Location: `src/app/users/page.tsx`
- Triggers: Navigation to `/users`
- Responsibilities: Fetch users list, render DataTable, handle user deletion

**API Route: Auth Login:**
- Location: `src/app/api/auth/login/route.ts`
- Triggers: POST request to `/api/auth/login`
- Responsibilities: Validate email/password, call Supabase auth, generate JWT, return access + refresh tokens

**API Route: Users:**
- Location: `src/app/api/users/route.ts`
- Triggers: GET/POST/DELETE requests to `/api/users`
- Responsibilities: Search users (RPC), create user, delete user via Supabase

**API Route: Data:**
- Location: `src/app/api/data/route.ts`
- Triggers: GET request to `/api/data?table=<metrics|activity>`
- Responsibilities: Fetch metrics or activity data from Supabase based on query param

## Error Handling

**Strategy:** Try-catch in route handlers, error message in JSON response; client components catch via .json() and throw

**Patterns:**
- Route handlers: `try { ... } catch (error) { NextResponse.json({ message: "...", details: String(error) }, { status: 500 }) }`
- Client hooks: `.catch(error) => throw error`
- API validation: Check response.ok before calling .json(), throw Error if not ok
- Type guards: Use `unknown` type when accepting arbitrary data (CLAUDE.md: "No `any` types")

## Cross-Cutting Concerns

**Logging:**
- console.error() in catch blocks (client-side data fetch, components)
- No structured logging framework; errors logged inline

**Validation:**
- Input validation in route handlers (email/password checks)
- Dedicated `validateEmail`, `validatePassword`, `validateName` functions in `src/lib/validators.ts`
- Client-side validation in login form before submit

**Authentication:**
- JWT tokens managed via `src/lib/auth.ts` (signToken, verifyToken, saveSession, getSession)
- Supabase native auth via `supabase.auth.signInWithPassword()` (delegates to Supabase)
- Session stored in localStorage; checked on app load via useAuth hook

---

*Architecture analysis: 2026-03-17*
