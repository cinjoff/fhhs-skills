# Codebase Concerns

**Analysis Date:** 2026-03-17

## Tech Debt

**Type Safety Violations (`any` types):**
- Issue: Multiple functions and components use `any` type, bypassing TypeScript's strict mode protection
- Files:
  - `src/lib/api.ts` (all four functions: `fetchUsers`, `fetchMetrics`, `fetchActivity`, `updateUser`)
  - `src/components/user-form.tsx` (form submission, event handlers)
- Impact: Loss of type safety enables silent bugs, incorrect API contract assumptions, runtime failures
- Fix approach: Define explicit interfaces for API parameters, responses, and event types. Create proper types for form event handlers (e.g., `React.ChangeEvent<HTMLInputElement>`).

**Incomplete Switch Statements:**
- Issue: `getRolePermissions()` and `getActionLabel()` functions in `src/types/index.ts` lack default cases for `'viewer'` role and `'batch'` action
- Files: `src/types/index.ts` lines 40-58
- Impact: Viewer role returns `undefined`, batch action returns `undefined`—silent failures in permission checks and UI labels
- Fix approach: Add comprehensive `default` case or explicitly handle all enum values

**Missing Error Recovery:**
- Issue: `use-auth.ts` hook catches errors but just re-throws without context: `catch (error) { throw error }`
- Files: `src/hooks/use-auth.ts` line 27-28
- Impact: Error details lost to caller, no opportunity for graceful fallback
- Fix approach: Add error context wrapping and implement user-facing error messages

## Security Vulnerabilities

**Hardcoded JWT Secret:**
- Risk: JWT secret stored as literal string `'acme-dashboard-secret-2024'` in source code
- Files: `src/lib/auth.ts` line 3
- Current mitigation: None
- Recommendations: Move to environment variable `JWT_SECRET`, rotate immediately, use strong secret (256+ bits), never commit secrets
- Impact: Any attacker with code access can forge valid tokens, completely bypassing authentication

**XSS Vulnerability (Comment Content):**
- Risk: `dangerouslySetInnerHTML` renders user-provided HTML without sanitization
- Files: `src/components/comment-card.tsx` line 33
- Current mitigation: None
- Recommendations: Use DOMPurify to sanitize comment content, or render as plain text unless Markdown is required
- Impact: Malicious scripts in comments execute in user browsers, stealing auth tokens or session data

**JWT in localStorage (XSS Target):**
- Risk: Auth tokens stored in `localStorage` which is accessible to XSS attacks via `document.cookie` reading
- Files: `src/lib/auth.ts` lines 31-32, 39-40, 48-49
- Current mitigation: None (relies on CSP which isn't visible in codebase)
- Recommendations: Use httpOnly cookies with secure/sameSite flags via Set-Cookie headers (requires server-side auth), or implement memory-only token storage with refresh rotation
- Impact: XSS vulnerability = total credential theft; hardcoded JWT secret = forged tokens

**SQL Injection Risk (Dynamic Table Names):**
- Risk: Table name comes directly from query parameter without validation
- Files: `src/app/api/data/route.ts` line 6, 10
- Current mitigation: None
- Recommendations: Implement allowlist of valid table names, validate before passing to Supabase query
- Impact: Attacker can query arbitrary tables (users, sensitive_data, etc.)

**Missing Input Validation (API Routes):**
- Risk: API routes accept user input without validation or type checking
- Files:
  - `src/app/api/users/route.ts` - POST accepts body without validation
  - `src/app/api/comments/route.ts` - POST accepts content without sanitization
  - `src/app/api/auth/login/route.ts` - No email format or password policy validation
- Current mitigation: Client-side regex only
- Recommendations: Use runtime schema validation (zod, valibot) on all API endpoints, validate email format server-side, enforce password requirements
- Impact: Invalid data in database, potential injection attacks if validators removed from client

## Performance Bottlenecks

**Inefficient Data Re-fetching:**
- Problem: Dashboard and users pages fetch data on every component mount with no caching
- Files: `src/app/page.tsx` line 21-39, `src/app/users/page.tsx` line 21-27
- Cause: useEffect hooks with empty dependencies re-run, multiple serial fetches
- Improvement path: Implement request deduplication, add SWR/React Query, consider Next.js data caching (getStaticProps), parallelize fetch calls

**Pagination Performance Degradation:**
- Problem: DataTable loads entire dataset into memory, filters/sorts in-browser
- Files: `src/components/data-table.tsx` line 25-39
- Cause: No server-side pagination/filtering
- Improvement path: Implement cursor-based pagination API, filter/sort on backend where data lives, infinite scroll for large datasets

**Inefficient ID Generation:**
- Problem: `generateId()` concatenates two `Math.random()` calls creating predictable IDs
- Files: `src/lib/utils.ts` line 42-45
- Cause: Not using cryptographic randomness or UUID library
- Improvement path: Use `crypto.randomUUID()` or `uuid` package, ensure collision-free IDs

## Fragile Areas

**Data-Table Component (Generic but Unsafe):**
- Files: `src/components/data-table.tsx`
- Why fragile: Uses `Record<string, unknown>` for data and field keys—no type safety on what's rendered. Assumes `renderCell` function handles all value types correctly
- Safe modification: Create strict TypeScript generics with proper type constraints, add fallback error boundaries
- Test coverage: Only basic E2E tests exist (`login.spec.ts`), no unit tests for DataTable sorting/filtering edge cases

**Authentication Hook Missing Finalization:**
- Files: `src/hooks/use-auth.ts`
- Why fragile: `checkSession()` calls `setLoading(true)` but never sets `setLoading(false)`, causing infinite loading state
- Safe modification: Add finally block to reset loading state, add timeout for slow requests
- Test coverage: No tests for session refresh or timeout scenarios

**Error Handling Silent Failures:**
- Files: `src/app/page.tsx` line 32-35
- Why fragile: Catch block only logs error, UI doesn't reflect failure state. User sees "Loading..." forever if fetch fails
- Safe modification: Track error state in useState, show user-facing error UI with retry button
- Test coverage: No tests for fetch failure scenarios

## Scaling Limits

**Hardcoded Limits and Page Sizes:**
- Current capacity: Page size hardcoded to 10 rows (users page), 5 rows (dashboard)
- Limit: No pagination strategy for tables with 100k+ rows
- Scaling path: Implement server-side pagination, cursor-based infinite scroll, implement search indexing on backend

**Single-Instance Authentication:**
- Current capacity: JWT tokens valid indefinitely until expired
- Limit: No token revocation, session termination affects only client
- Scaling path: Implement token blacklist/denylist, session management backend, logout invalidation

## Dependencies at Risk

**Supabase Anon Key Exposure:**
- Risk: `NEXT_PUBLIC_SUPABASE_ANON_KEY` is intentionally public but can access any data via RLS policies
- Files: `src/lib/supabase.ts` line 4
- Impact: If RLS policies are misconfigured, all users can access/modify each other's data
- Migration plan: Audit all Supabase table RLS policies, use service-role key only in server routes, never expose anon key to client for write operations

**Outdated Security Patterns:**
- Risk: JWT with symmetric secret (`jwt.sign/verify`) instead of asymmetric (RS256)
- Files: `src/lib/auth.ts`
- Impact: Token verification and creation use same secret; if attacker obtains it, they can forge tokens
- Migration plan: Migrate to RS256 with public/private key pair, implement proper token refresh strategy

## Missing Critical Features

**No Rate Limiting:**
- Problem: API routes have no rate limiting on login attempts, user creation, or API queries
- Blocks: Cannot prevent brute-force attacks, DoS attacks, spam
- Priority: High

**No Request Validation Schema:**
- Problem: POST/PATCH endpoints don't validate request body structure
- Blocks: Cannot ensure data integrity, allows malformed data into database
- Priority: High

**No Authorization Checks:**
- Problem: API routes don't verify user permissions before returning/modifying data
- Files: All `/api/*` routes lack `Authorization` header verification
- Blocks: Any authenticated user can access all user data, delete any user, view all comments
- Priority: Critical

**No CSRF Protection:**
- Problem: No CSRF tokens on state-changing operations (DELETE, PATCH, POST)
- Files: All POST/PATCH/DELETE endpoints
- Blocks: Cross-site request forgery attacks possible
- Priority: High

## Test Coverage Gaps

**API Route Testing:**
- What's not tested: 401/403 responses, invalid query parameters, malformed JSON bodies, SQL injection attempts
- Files: No test files for `src/app/api/*` routes
- Risk: Regressions in authorization, input validation, error handling go unnoticed
- Priority: High

**Form Validation Testing:**
- What's not tested: Edge cases (null/undefined values), special characters, maximum length, email format edge cases
- Files: `src/components/user-form.tsx`, `src/app/login/page.tsx`
- Risk: Invalid data submitted to backend
- Priority: Medium

**Component Integration Testing:**
- What's not tested: DataTable with 1000+ rows, sorting performance, filter interactions, pagination edge cases
- Files: `src/components/data-table.tsx`, `src/components/search-input.tsx`
- Risk: Performance issues and bugs in common user workflows
- Priority: Medium

**Error Boundary Coverage:**
- What's not tested: Network failures, timeout scenarios, partial data load failures
- Files: Most components lack error boundaries
- Risk: App crashes instead of showing graceful error UI
- Priority: Medium

---

*Concerns audit: 2026-03-17*
