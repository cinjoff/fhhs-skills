# External Integrations

**Analysis Date:** 2026-03-17

## APIs & External Services

**Database & Authentication:**
- Supabase - PostgreSQL database + auth provider
  - SDK: `@supabase/supabase-js`
  - Client initialization: `src/lib/supabase.ts`
  - Auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Data Storage

**Databases:**
- Supabase (PostgreSQL)
  - Connection: Initialized with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Client: `@supabase/supabase-js` via `createClient()`
  - Usage: `src/lib/supabase.ts` exports both anonymous and service role clients
  - Tables accessed:
    - `users` - User management (GET search via RPC, POST create, DELETE remove)
    - `analytics` - Metrics/data retrieval
    - `activity` - Activity logs
    - `metrics` - Dashboard metrics
    - Comment data (schema not visible)

**File Storage:**
- Local filesystem only (no external storage service detected)
- User avatars referenced via `avatarUrl` field but no upload mechanism visible in codebase

**Caching:**
- None detected - All queries hit database directly

## Authentication & Identity

**Auth Provider:**
- Supabase Auth + JWT custom implementation
  - Supabase auth: `signInWithPassword()` in `src/app/api/auth/login/route.ts`
  - Custom JWT: `jsonwebtoken` library
  - Implementation approach:
    - Supabase validates email/password
    - Custom JWT issued for session management (15-minute expiry)
    - Refresh tokens stored in Supabase session
    - Session persistence: localStorage (`access_token`, `refresh_token`)
    - Functions: `signToken()`, `verifyToken()`, `refreshAccessToken()` in `src/lib/auth.ts`

**Session Storage:**
- Browser localStorage (client-side)
  - Keys: `access_token`, `refresh_token`
  - Management: `saveSession()`, `getSession()`, `clearSession()` in `src/lib/auth.ts`

**JWT Secret:**
- Hardcoded: "acme-dashboard-secret-2024" in `src/lib/auth.ts` (not environment variable - security risk)

## Monitoring & Observability

**Error Tracking:**
- None detected - No Sentry, DataDog, or similar integration

**Logs:**
- Console-based only (implicit via JavaScript console)
- API error responses returned as JSON error messages

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured in codebase
- Likely Vercel (standard for Next.js projects, but no explicit config)

**CI Pipeline:**
- Playwright CI config present in `playwright.config.ts`:
  - Condition: `process.env.CI` triggers different behavior
  - CI settings: retries: 2, workers: 1 (sequential), forbidOnly enabled
  - Dev settings: retries: 0, parallel workers, reuses existing server

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for server operations (private)
- `CI` - Optional, set in CI environments to enable retry/logging strategies

**Secrets location:**
- `.env.example` file present at root showing expected variables
- Actual `.env` file not committed (follows convention)

**Public vs Private:**
- NEXT_PUBLIC_* variables are embedded in client bundle (safe for public keys)
- SUPABASE_SERVICE_ROLE_KEY is server-side only and must not leak to client

## API Endpoints

**Internal API Routes:**
All endpoints use Next.js App Router in `src/app/api/`:

- `POST /api/auth/login` - User authentication
  - Input: `{ email, password }`
  - Output: `{ accessToken, refreshToken, user: { id, email, name } }`
  - Integration: Supabase auth + custom JWT signing

- `POST /api/auth/refresh` - Token refresh
  - Input: `{ refreshToken }`
  - Output: `{ accessToken }`
  - Uses `refreshAccessToken()` function

- `GET /api/users` - Search users
  - Query params: `search`, `limit`
  - Integration: Supabase RPC `search_users(search_query, result_limit)`

- `POST /api/users` - Create user
  - Input: User object
  - Integration: Supabase `from('users').insert()`

- `DELETE /api/users` - Delete user
  - Query params: `id`
  - Integration: Supabase `from('users').delete().eq('id', id)`

- `GET /api/data` - Fetch table data
  - Query params: `table` (analytics/metrics/activity), `limit`
  - Integration: Supabase `from(table).select('*').limit()`

- `POST /api/comments` - Comment management
  - Implementation: Not fully visible in audit

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected
- No external service integrations that would receive callbacks

## Known Integrations Not Used

**Missing but common:**
- Error tracking (Sentry, DataDog)
- Analytics (Mixpanel, Posthog, Google Analytics)
- Email service (SendGrid, Resend, Mailgun)
- Storage (AWS S3, Cloudinary)
- Monitoring (Vercel Analytics, New Relic)

---

*Integration audit: 2026-03-17*
