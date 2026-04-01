---
type: execute
wave: 1
depends_on: []
files_modified:
  # Config
  - evals/fixtures/nextjs-app-deep/next.config.ts
  - evals/fixtures/nextjs-app-deep/tsconfig.json
  - evals/fixtures/nextjs-app-deep/tailwind.config.ts
  - evals/fixtures/nextjs-app-deep/components.json
  - evals/fixtures/nextjs-app-deep/postcss.config.mjs
  - evals/fixtures/nextjs-app-deep/playwright.config.ts
  - evals/fixtures/nextjs-app-deep/.env.example
  - evals/fixtures/nextjs-app-deep/CLAUDE.md
  # shadcn UI
  - evals/fixtures/nextjs-app-deep/src/components/ui/button.tsx
  - evals/fixtures/nextjs-app-deep/src/components/ui/card.tsx
  - evals/fixtures/nextjs-app-deep/src/components/ui/dialog.tsx
  - evals/fixtures/nextjs-app-deep/src/components/ui/input.tsx
  - evals/fixtures/nextjs-app-deep/src/components/ui/badge.tsx
  - evals/fixtures/nextjs-app-deep/src/components/ui/dropdown-menu.tsx
  # Lib
  - evals/fixtures/nextjs-app-deep/src/lib/supabase.ts
  - evals/fixtures/nextjs-app-deep/src/lib/auth.ts
  - evals/fixtures/nextjs-app-deep/src/lib/api.ts
  - evals/fixtures/nextjs-app-deep/src/lib/utils.ts
  - evals/fixtures/nextjs-app-deep/src/lib/validators.ts
  - evals/fixtures/nextjs-app-deep/src/types/index.ts
  # Hooks
  - evals/fixtures/nextjs-app-deep/src/hooks/use-auth.ts
  - evals/fixtures/nextjs-app-deep/src/hooks/use-debounce.ts
  # Components
  - evals/fixtures/nextjs-app-deep/src/components/sidebar.tsx
  - evals/fixtures/nextjs-app-deep/src/components/data-table.tsx
  - evals/fixtures/nextjs-app-deep/src/components/comment-card.tsx
  - evals/fixtures/nextjs-app-deep/src/components/user-form.tsx
  - evals/fixtures/nextjs-app-deep/src/components/metric-card.tsx
  - evals/fixtures/nextjs-app-deep/src/components/chart-widget.tsx
  - evals/fixtures/nextjs-app-deep/src/components/notification-toast.tsx
  - evals/fixtures/nextjs-app-deep/src/components/theme-toggle.tsx
  - evals/fixtures/nextjs-app-deep/src/components/search-input.tsx
  - evals/fixtures/nextjs-app-deep/src/components/user-avatar.tsx
  # Pages
  - evals/fixtures/nextjs-app-deep/src/app/globals.css
  - evals/fixtures/nextjs-app-deep/src/app/layout.tsx
  - evals/fixtures/nextjs-app-deep/src/app/page.tsx
  - evals/fixtures/nextjs-app-deep/src/app/login/page.tsx
  - evals/fixtures/nextjs-app-deep/src/app/users/page.tsx
  - evals/fixtures/nextjs-app-deep/src/app/settings/page.tsx
  # API Routes
  - evals/fixtures/nextjs-app-deep/src/app/api/auth/login/route.ts
  - evals/fixtures/nextjs-app-deep/src/app/api/auth/refresh/route.ts
  - evals/fixtures/nextjs-app-deep/src/app/api/users/route.ts
  - evals/fixtures/nextjs-app-deep/src/app/api/data/route.ts
  - evals/fixtures/nextjs-app-deep/src/app/api/comments/route.ts
  # Tests
  - evals/fixtures/nextjs-app-deep/src/__tests__/auth.test.ts
  - evals/fixtures/nextjs-app-deep/src/__tests__/data-table.test.tsx
  - evals/fixtures/nextjs-app-deep/e2e/login.spec.ts
  # Planning
  - evals/fixtures/nextjs-app-deep/.planning/PROJECT.md
  - evals/fixtures/nextjs-app-deep/.planning/STATE.md
  - evals/fixtures/nextjs-app-deep/.planning/ROADMAP.md
  - evals/fixtures/nextjs-app-deep/.planning/DESIGN.md
  - evals/fixtures/nextjs-app-deep/.planning/todos/todo-001.md
  - evals/fixtures/nextjs-app-deep/.planning/todos/todo-002.md
  - evals/fixtures/nextjs-app-deep/.planning/todos/todo-003.md
  - evals/fixtures/nextjs-app-deep/.planning/phases/01-auth/01-01-PLAN.md
  - evals/fixtures/nextjs-app-deep/.planning/phases/01-auth/01-01-SUMMARY.md
  - evals/fixtures/nextjs-app-deep/.planning/phases/02-dashboard/02-01-PLAN.md
  # Eval updates
  - evals/evals.json
autonomous: true

must_haves:
  truths:
    - "Every skill in the plugin has at least one eval with fixture files that exercise its core detection/generation capability"
    - "The fixture contains unlabeled issues (no // VULNERABILITY or // VIOLATION comments) that skills must detect on their own"
    - "The fixture has mixed quality — some components are clean (button, search-input, use-debounce) so skills can demonstrate false-positive avoidance"
    - "GSD project state reflects realistic partial completion (Phase 01 done with SUMMARY, Phase 02 in-progress) for progress/resume/build skills"
    - "All old fixture references in evals.json are replaced with nextjs-app-deep paths"
  artifacts:
    - path: "evals/fixtures/nextjs-app-deep/src/app/page.tsx"
      provides: "Dashboard page with client-side waterfall and missing Suspense"
      contains: "useEffect"
    - path: "evals/fixtures/nextjs-app-deep/src/components/data-table.tsx"
      provides: "God component with performance issues and refactoring opportunities"
      contains: "useState"
    - path: "evals/fixtures/nextjs-app-deep/src/components/metric-card.tsx"
      provides: "AI slop anti-patterns for design skill detection"
      contains: "bg-gradient-to-r"
    - path: "evals/fixtures/nextjs-app-deep/src/lib/auth.ts"
      provides: "Security vulnerabilities for /secure detection"
      contains: "localStorage"
    - path: "evals/fixtures/nextjs-app-deep/.planning/STATE.md"
      provides: "Multi-phase project state for progress/resume skills"
      contains: "IN_PROGRESS"
  key_links:
    - from: "evals/fixtures/nextjs-app-deep/src/components/user-form.tsx"
      to: "evals/fixtures/nextjs-app-deep/src/components/ui/input.tsx"
      via: "should import but doesn't (normalize issue)"
    - from: "evals/fixtures/nextjs-app-deep/src/__tests__/data-table.test.tsx"
      to: "evals/fixtures/nextjs-app-deep/src/components/data-table.tsx"
      via: "import — test uses old prop interface (failing test)"
    - from: "evals/fixtures/nextjs-app-deep/.planning/phases/02-dashboard/02-01-PLAN.md"
      to: "evals/fixtures/nextjs-app-deep/src/app/page.tsx"
      via: "plan references page as target file"
---

<objective>
Build a comprehensive eval fixture project (nextjs-app-deep) that replaces all 3 shallow fixtures with a single realistic Next.js 15 + shadcn + Supabase application. The project contains ~2500 LOC of real code with 80+ intentional issues across security, TypeScript, accessibility, performance, design, and refactoring categories — all unlabeled, requiring skills to detect them independently. Update evals.json to reference the new fixture and add coverage for previously untested skills.
</objective>

<context>
@file .planning/designs/2026-03-12-deep-eval-fixture.md
@file evals/evals.json
@file evals/fixtures/nextjs-app-basic/.planning/PROJECT.md
@file evals/fixtures/nextjs-app-basic/.planning/ROADMAP.md
@file evals/fixtures/nextjs-app-basic/.planning/STATE.md
@file evals/fixtures/nextjs-app-basic/.planning/DESIGN.md
@file evals/fixtures/nextjs-app-security-issues/src/lib/auth.ts
@file evals/fixtures/nextjs-app-security-issues/src/app/api/data/route.ts
@file evals/fixtures/nextjs-app-typescript-issues/src/components/form.tsx
@file evals/fixtures/nextjs-app-typescript-issues/src/lib/api.ts
</context>

<tasks>
<task type="auto" wave="1">
  <name>Task 1: Foundation — Config, shadcn UI, Lib, Hooks, Types</name>
  <files>
    evals/fixtures/nextjs-app-deep/next.config.ts
    evals/fixtures/nextjs-app-deep/tsconfig.json
    evals/fixtures/nextjs-app-deep/tailwind.config.ts
    evals/fixtures/nextjs-app-deep/components.json
    evals/fixtures/nextjs-app-deep/postcss.config.mjs
    evals/fixtures/nextjs-app-deep/playwright.config.ts
    evals/fixtures/nextjs-app-deep/.env.example
    evals/fixtures/nextjs-app-deep/CLAUDE.md
    evals/fixtures/nextjs-app-deep/src/app/globals.css
    evals/fixtures/nextjs-app-deep/src/app/layout.tsx
    evals/fixtures/nextjs-app-deep/src/lib/utils.ts
    evals/fixtures/nextjs-app-deep/src/lib/supabase.ts
    evals/fixtures/nextjs-app-deep/src/lib/auth.ts
    evals/fixtures/nextjs-app-deep/src/lib/api.ts
    evals/fixtures/nextjs-app-deep/src/lib/validators.ts
    evals/fixtures/nextjs-app-deep/src/types/index.ts
    evals/fixtures/nextjs-app-deep/src/hooks/use-auth.ts
    evals/fixtures/nextjs-app-deep/src/hooks/use-debounce.ts
    evals/fixtures/nextjs-app-deep/src/components/ui/button.tsx
    evals/fixtures/nextjs-app-deep/src/components/ui/card.tsx
    evals/fixtures/nextjs-app-deep/src/components/ui/dialog.tsx
    evals/fixtures/nextjs-app-deep/src/components/ui/input.tsx
    evals/fixtures/nextjs-app-deep/src/components/ui/badge.tsx
    evals/fixtures/nextjs-app-deep/src/components/ui/dropdown-menu.tsx
  </files>
  <action>
    Create the project foundation. Reference the design doc for exact issue specifications per file.

    **Config files:** Standard Next.js 15 + shadcn + Supabase setup. tsconfig strict:true. Tailwind with custom theme. playwright.config.ts with webServer config.

    **shadcn UI components:** Standard shadcn implementations of Button (with variants via cva), Card, Dialog, Input, Badge, DropdownMenu. These are the CLEAN baseline — other components that bypass them are the issue.

    **Lib layer with planted issues:**
    - `supabase.ts`: Clean Supabase client with `createClient()` from env vars
    - `auth.ts`: Hardcoded JWT secret (`const JWT_SECRET = 'acme-dashboard-secret-2024'`), stores tokens in localStorage, `as TokenPayload` assertion on jwt.verify, no token expiry validation on refresh
    - `api.ts`: Every param/return typed `any`, duplicated fetch+error pattern (same 10-line fetch-parse-handle block in 3 functions)
    - `utils.ts`: Clean `cn()` at top, then 5 unrelated utils crammed below (formatDate, truncateText, debounce, parseQueryString, generateId) — kitchen sink
    - `validators.ts`: Email regex + password length check. Will be duplicated in user-form and login page

    **Types with issues:**
    - `types/index.ts`: `UserRole = 'admin' | 'editor' | 'viewer'` with switch missing 'viewer' case. `ApiAction = 'create' | 'update' | 'delete' | 'batch'` with switch missing 'batch'. `Record<string, any>` for API response. Missing discriminated union for success/error responses

    **Hooks:**
    - `use-auth.ts`: `login(credentials)` — no type on credentials param. Returns `{ user, login, logout, loading }` but loading/error states are incomplete (loading set true but never set false on error path)
    - `use-debounce.ts`: Clean, well-typed debounce hook. Positive finding.

    **CRITICAL: No `// VULNERABILITY:` or `// VIOLATION:` comment labels anywhere.** Issues must be detectable only through code analysis.
  </action>
  <verify>
    - All config files are syntactically valid
    - shadcn components follow standard shadcn/ui patterns (cva variants, cn() usage, forwardRef)
    - auth.ts contains hardcoded secret without any label comment
    - api.ts has `any` in every function signature
    - types/index.ts has non-exhaustive switches
    - use-auth.ts has implicit any params
    - utils.ts has cn() plus 5+ unrelated functions
  </verify>
  <done>Foundation layer created with clean shadcn baseline and unlabeled issues in lib/hooks/types</done>
</task>

<task type="auto" wave="1">
  <name>Task 2: App Components with Multi-Category Issues</name>
  <files>
    evals/fixtures/nextjs-app-deep/src/components/sidebar.tsx
    evals/fixtures/nextjs-app-deep/src/components/data-table.tsx
    evals/fixtures/nextjs-app-deep/src/components/comment-card.tsx
    evals/fixtures/nextjs-app-deep/src/components/user-form.tsx
    evals/fixtures/nextjs-app-deep/src/components/metric-card.tsx
    evals/fixtures/nextjs-app-deep/src/components/chart-widget.tsx
    evals/fixtures/nextjs-app-deep/src/components/notification-toast.tsx
    evals/fixtures/nextjs-app-deep/src/components/theme-toggle.tsx
    evals/fixtures/nextjs-app-deep/src/components/search-input.tsx
    evals/fixtures/nextjs-app-deep/src/components/user-avatar.tsx
  </files>
  <action>
    Create 10 app components with realistic code and planted issues. Reference design doc for exact issue specifications.

    **sidebar.tsx (~120 lines):** Navigation sidebar. Fixed `w-[280px]` width. Touch targets are `p-1.5` (~24px, below 44px minimum). Uses raw `<a href>` instead of Next.js `<Link>`. Hard-coded colors: `bg-[#1e293b]`, `text-[#94a3b8]`. No `role="navigation"`, no `aria-current="page"` on active item. No mobile responsive behavior (no hamburger, no overlay).

    **data-table.tsx (~180 lines):** God component. Inline search `onChange` triggers full table re-render on every keystroke (no debounce despite use-debounce hook existing). Inline arrow functions in JSX: `onClick={() => handleSort(col)}` on every cell. No `React.memo` on row components. Missing `<th scope="col">`, no `aria-sort`. 180+ lines mixing search bar, column headers, row rendering, pagination, and empty state — all in one component.

    **comment-card.tsx (~60 lines):** Uses `dangerouslySetInnerHTML={{ __html: comment.content }}` to render user-provided HTML. No sanitization. Uses raw `<div>` for timestamp instead of `<time dateTime={}>`. No `aria-label` on comment container.

    **user-form.tsx (~100 lines):** Uses raw `<input>` and `<button>` elements instead of shadcn `<Input>` and `<Button>`. 8 `as any` assertions on event handlers and form data. Duplicates email/password validation from `lib/validators.ts`. No error state rendering (validates but doesn't show errors). Hard-coded "Submit" / "Name" / "Email" strings (no i18n consideration). Missing `aria-describedby` linking error messages to inputs.

    **metric-card.tsx (~80 lines):** AI slop tells: `bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent` on value text. `backdrop-blur-xl bg-white/10 border border-white/20` glassmorphism on card. `text-5xl font-black` oversized hero number. Decorative SVG blob in background. Generic "Analytics" / "Revenue" / "Users" labels.

    **chart-widget.tsx (~90 lines):** Bar chart with CSS animations. Animates `width` property in transition (should use `transform: scaleX()`). Reads `el.offsetWidth` inside a `forEach` loop during resize (layout thrashing). No `will-change`. No `requestAnimationFrame` batching for resize handler.

    **notification-toast.tsx (~70 lines):** Toast component. Missing `role="alert"` and `aria-live="polite"`. No keyboard dismiss (Escape key). No auto-dismiss timer. Toasts stack without limit (overflow potential). Uses hard-coded `z-[9999]`.

    **theme-toggle.tsx (~50 lines):** Moon/sun icon toggle. Toggles a `dark` class on `document.documentElement`. But `--color-surface-elevated` CSS variable is missing its dark variant in globals.css — so elevated surfaces stay white in dark mode. Toggle `<button>` has no `aria-label`.

    **search-input.tsx (~50 lines):** Clean component. Properly uses shadcn `<Input>` component. Has accessible label. Uses the `use-debounce` hook. This is the positive reference for comparison.

    **user-avatar.tsx (~40 lines):** Uses raw `<img>` instead of `next/image`. Decorative avatars have `alt={user.name}` (should be `alt=""`). Profile avatars have generic `alt="avatar"` (should describe the user). No lazy loading attribute. No width/height (causes layout shift).

    **CRITICAL: No label comments. Code should look natural — like a real developer wrote it with real blind spots.**
  </action>
  <verify>
    - sidebar has hard-coded pixel width and colors
    - data-table is 150+ lines in one component with inline handlers
    - comment-card uses dangerouslySetInnerHTML without sanitization
    - user-form uses raw HTML elements instead of shadcn components
    - metric-card contains gradient text and glassmorphism classes
    - chart-widget animates width/height (not transform)
    - notification-toast has no ARIA roles
    - theme-toggle button has no aria-label
    - search-input correctly uses shadcn Input (clean reference)
    - No `// VULNERABILITY`, `// VIOLATION`, `// ISSUE`, `// TODO: fix`, or similar label comments
  </verify>
  <done>10 app components created with unlabeled issues spanning a11y, security, performance, design, TS, and responsive categories</done>
</task>

<task type="auto" wave="2">
  <name>Task 3: Pages, API Routes, Tests, and GSD Planning Layer</name>
  <files>
    evals/fixtures/nextjs-app-deep/src/app/page.tsx
    evals/fixtures/nextjs-app-deep/src/app/login/page.tsx
    evals/fixtures/nextjs-app-deep/src/app/users/page.tsx
    evals/fixtures/nextjs-app-deep/src/app/settings/page.tsx
    evals/fixtures/nextjs-app-deep/src/app/api/auth/login/route.ts
    evals/fixtures/nextjs-app-deep/src/app/api/auth/refresh/route.ts
    evals/fixtures/nextjs-app-deep/src/app/api/users/route.ts
    evals/fixtures/nextjs-app-deep/src/app/api/data/route.ts
    evals/fixtures/nextjs-app-deep/src/app/api/comments/route.ts
    evals/fixtures/nextjs-app-deep/src/__tests__/auth.test.ts
    evals/fixtures/nextjs-app-deep/src/__tests__/data-table.test.tsx
    evals/fixtures/nextjs-app-deep/e2e/login.spec.ts
    evals/fixtures/nextjs-app-deep/.planning/PROJECT.md
    evals/fixtures/nextjs-app-deep/.planning/STATE.md
    evals/fixtures/nextjs-app-deep/.planning/ROADMAP.md
    evals/fixtures/nextjs-app-deep/.planning/DESIGN.md
    evals/fixtures/nextjs-app-deep/.planning/todos/todo-001.md
    evals/fixtures/nextjs-app-deep/.planning/todos/todo-002.md
    evals/fixtures/nextjs-app-deep/.planning/todos/todo-003.md
    evals/fixtures/nextjs-app-deep/.planning/phases/01-auth/01-01-PLAN.md
    evals/fixtures/nextjs-app-deep/.planning/phases/01-auth/01-01-SUMMARY.md
    evals/fixtures/nextjs-app-deep/.planning/phases/02-dashboard/02-01-PLAN.md
  </files>
  <action>
    Create pages, API routes, test files, and the full GSD planning layer.

    **Pages:**
    - `page.tsx`: 'use client' dashboard. Uses `useEffect` to fetch metrics, then users, then activity in sequence (waterfall). Should be Server Component with parallel `Promise.all`. No `<Suspense>` boundaries. No empty/loading states. Imports MetricCard, DataTable, ChartWidget.
    - `login/page.tsx`: Login form. Duplicates validation from `lib/validators.ts` inline. Missing `aria-describedby` on inputs. Generic error message "Something went wrong" for all failures.
    - `users/page.tsx`: User list with DataTable. `min-w-[800px]` on container. Delete button with no confirmation. No empty state for zero users. Page param > totalPages shows blank content.
    - `settings/page.tsx`: Settings with theme toggle. Hard-coded `bg-white` and `text-gray-900` ignoring dark mode. Dense layout.

    **API Routes:**
    - `api/auth/login/route.ts`: Supabase signInWithPassword. Returns token in JSON body. Leaks Supabase error details in 500 response.
    - `api/auth/refresh/route.ts`: Reads refresh token from `request.json()` body (should be httpOnly cookie). No token family tracking.
    - `api/users/route.ts`: Raw SQL via supabase.rpc() with string interpolation (`WHERE name LIKE '%${search}%'`). DELETE has no auth check. No input validation with zod or similar.
    - `api/data/route.ts`: Takes `table` param from query string, passes directly to query. No allowlist. No auth. No CORS.
    - `api/comments/route.ts`: Stores raw HTML content from POST body. No sanitization. No content length limit. No pagination on GET.

    **Tests:**
    - `auth.test.ts`: Tests signToken/verifyToken happy path. Passes. Doesn't test expired tokens, malformed input, missing env vars.
    - `data-table.test.tsx`: Tests DataTable rendering. FAILS — references `columns` prop but component now uses `fields` prop. The test imports DataTable and passes `columns={mockColumns}` but the component signature expects `fields`.
    - `e2e/login.spec.ts`: Playwright test for login flow. Uses CSS selectors: `page.click('.btn-primary')`, `page.fill('.email-input', ...)`. No Page Object Model pattern. Tests happy path only.

    **GSD Planning Layer:**
    - `PROJECT.md`: Tech stack (Next.js 15, shadcn, Supabase, Vitest, Playwright). Repo structure. Conventions.
    - `ROADMAP.md`: Phase 01 (Auth) R-001/R-002/R-003, Phase 02 (Dashboard) R-004/R-005, Phase 03 (User Mgmt) R-006/R-007, Phase 04 (Settings) R-008/R-009.
    - `STATE.md`: Phase 01 COMPLETE (all 3 tasks done). Phase 02 IN_PROGRESS (task 01 done: dashboard layout, task 02 in-progress: widget system).
    - `DESIGN.md`: Design tokens matching shadcn CSS variables. Colors, typography, spacing, border-radius, dark mode spec.
    - `todos/todo-001.md`: Pending — "Add rate limiting to auth endpoints" (tagged security)
    - `todos/todo-002.md`: Pending — "Extract shared fetch wrapper from API routes" (tagged refactor)
    - `todos/todo-003.md`: In-progress — "Fix data-table regression test" (tagged bug)
    - `phases/01-auth/01-01-PLAN.md`: Completed auth plan. 3 tasks (JWT middleware, refresh rotation, login form). All marked done.
    - `phases/01-auth/01-01-SUMMARY.md`: Evidence of completion. Lists files created, tests passing, requirements satisfied.
    - `phases/02-dashboard/02-01-PLAN.md`: In-progress. Task 1 (layout + sidebar) done. Task 2 (widget system with MetricCard, ChartWidget) in-progress. Task 3 (real-time SSE) not started.
  </action>
  <verify>
    - page.tsx is a 'use client' component with sequential useEffect fetches
    - api/users/route.ts has string interpolation in SQL query
    - data-table.test.tsx references `columns` prop (component expects `fields`)
    - e2e/login.spec.ts uses CSS selectors not role-based locators
    - STATE.md shows Phase 01 COMPLETE and Phase 02 IN_PROGRESS
    - todo-003.md references the failing data-table test
    - 02-01-PLAN.md has task 1 done, task 2 in-progress
  </verify>
  <done>Pages, API routes, tests, and GSD state created with realistic issues and multi-phase project tracking</done>
</task>

<task type="auto" wave="3">
  <name>Task 4: Update evals.json — Replace Fixtures and Add Coverage</name>
  <files>
    evals/evals.json
  </files>
  <action>
    Update evals.json in three passes:

    **Pass 1: Replace old fixture references.**
    All evals referencing `nextjs-app-basic/`, `nextjs-app-security-issues/`, or `nextjs-app-typescript-issues/` get updated to `nextjs-app-deep/`. File paths updated to match new locations. Plan references updated (plans/ dir files adapted into the .planning/phases/ structure inside nextjs-app-deep).

    **Pass 2: Strengthen existing fixture-backed evals.**
    For evals that already reference fixtures, add assertions that test against specific planted issues. E.g., the build eval that uses the auth plan now references actual source files the plan modifies. The security scan eval now has assertions for specific vulnerability types (SQL injection, XSS, hardcoded secrets, auth bypass).

    **Pass 3: Add new evals for uncovered skills.**
    Add evals with fixture files for skills that currently have zero file-backed coverage:
    - `/audit` eval: Points at deep fixture, asserts detection of a11y issues (missing ARIA), perf issues (layout thrashing), anti-patterns (AI slop in metric-card), responsive issues (fixed sidebar width)
    - `/critique` eval: Points at metric-card.tsx, asserts identification of AI slop tells
    - `/normalize` eval: Points at user-form.tsx, asserts detection of shadcn component bypass
    - `/optimize` eval: Points at page.tsx + chart-widget.tsx, asserts detection of client waterfall and layout thrashing
    - `/harden` eval: Points at user-form.tsx + notification-toast.tsx, asserts detection of missing error states and i18n
    - `/refactor` eval with files: Points at data-table.tsx + lib/utils.ts, asserts identification of god component and kitchen sink
    - `/fix` eval with failing test: Points at data-table.test.tsx + data-table.tsx, asserts TDD diagnosis of prop interface mismatch
    - `/polish` eval with files: Points at components with spacing/alignment inconsistencies
    - `/extract` eval: Points at validators.ts + user-form.tsx + login/page.tsx, asserts detection of duplicated validation
    - `/adapt` eval: Points at sidebar.tsx + users/page.tsx, asserts detection of fixed widths
    - `/playwright-testing` eval: Points at e2e/login.spec.ts, asserts detection of CSS selector anti-pattern
    - `/progress` eval with files: Points at STATE.md + ROADMAP.md, asserts correct phase/task status reading
    - `/resume-work` eval with files: Points at STATE.md + phases/, asserts context restoration from partial completion
    - `/verify` eval with files: Points at 01-auth PLAN + SUMMARY, asserts truth-based verification
    - `/health` eval with files: Points at full .planning/ structure, asserts integrity validation
    - `/check-todos` eval with files: Points at todos/, asserts todo listing and status awareness
    - `/onboard` eval: Points at page.tsx, asserts detection of missing empty/loading states
    - `/clarify` eval: Points at login/page.tsx, asserts detection of generic error messages

    **Keep the existing no-file evals unchanged** — they test orchestration logic and remain valuable.

    Fill gaps in eval ID sequence (71, 72 were missing). Ensure new evals have proper assertion types (behavioral, output, guard, ordering, context_discipline).
  </action>
  <verify>
    - Zero references to `nextjs-app-basic/`, `nextjs-app-security-issues/`, or `nextjs-app-typescript-issues/` remain
    - Every new eval has at least 2 assertions with proper types
    - No duplicate eval IDs
    - All file paths in eval `files` arrays point to files that exist in nextjs-app-deep/
    - evals.json is valid JSON
  </verify>
  <done>All old fixture references replaced, fixture-backed evals strengthened, and new evals added covering previously untested skills</done>
</task>

<task type="auto" wave="3">
  <name>Task 5: Remove Old Fixtures</name>
  <files>
    evals/fixtures/nextjs-app-basic/
    evals/fixtures/nextjs-app-security-issues/
    evals/fixtures/nextjs-app-typescript-issues/
    evals/fixtures/plans/
  </files>
  <action>
    Delete the 3 old fixture directories and the standalone plans/ directory:
    - `rm -rf evals/fixtures/nextjs-app-basic/`
    - `rm -rf evals/fixtures/nextjs-app-security-issues/`
    - `rm -rf evals/fixtures/nextjs-app-typescript-issues/`
    - `rm -rf evals/fixtures/plans/`

    Verify no references to these paths remain in evals.json or any other project file.
  </action>
  <verify>
    - Old fixture directories no longer exist
    - `grep -r "nextjs-app-basic\|nextjs-app-security-issues\|nextjs-app-typescript-issues\|fixtures/plans/" evals/` returns no matches
    - Only `evals/fixtures/nextjs-app-deep/` remains
  </verify>
  <done>Old shallow fixtures removed, only deep fixture remains</done>
</task>
</tasks>

<verification>
1. `find evals/fixtures/nextjs-app-deep -name '*.ts' -o -name '*.tsx' -o -name '*.css' | wc -l` → 35+ source files
2. `wc -l evals/fixtures/nextjs-app-deep/src/**/*.{ts,tsx}` → ~2500 lines total
3. `grep -r 'VULNERABILITY\|VIOLATION\|TODO.*fix\|ISSUE:' evals/fixtures/nextjs-app-deep/src/` → 0 matches (no labels)
4. `grep -r 'dangerouslySetInnerHTML' evals/fixtures/nextjs-app-deep/src/` → matches in comment-card.tsx (XSS planted)
5. `grep -r 'as any' evals/fixtures/nextjs-app-deep/src/` → matches in user-form.tsx, api.ts, auth.ts (TS issues planted)
6. `grep -r 'bg-gradient-to-r' evals/fixtures/nextjs-app-deep/src/` → matches in metric-card.tsx (AI slop planted)
7. `python3 -c "import json; json.load(open('evals/evals.json'))"` → valid JSON
8. `grep -c 'nextjs-app-deep' evals/evals.json` → 15+ evals reference the deep fixture
9. `grep -c 'nextjs-app-basic\|nextjs-app-security\|nextjs-app-typescript' evals/evals.json` → 0 references to old fixtures
</verification>

<success_criteria>
- Every skill in the plugin has at least one eval with fixture files that exercise its core detection/generation capability
- The fixture contains unlabeled issues that skills must detect on their own
- The fixture has mixed quality — some components are clean so skills can demonstrate false-positive avoidance
- GSD project state reflects realistic partial completion for progress/resume/build skills
- All old fixture references in evals.json are replaced with nextjs-app-deep paths
</success_criteria>

<output>.planning/designs/2026-03-12-deep-eval-fixture-SUMMARY.md</output>
