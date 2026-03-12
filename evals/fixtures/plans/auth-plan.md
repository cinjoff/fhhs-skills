---
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/auth.ts
  - src/lib/tokens.ts
  - src/app/api/auth/login/route.ts
  - src/app/api/auth/refresh/route.ts
  - src/components/login-form.tsx
  - src/app/login/page.tsx
autonomous: true

must_haves:
  truths:
    - "JWT tokens are signed with RS256 using environment variable secrets, never hardcoded"
    - "Refresh token rotation invalidates the previous token on each use"
    - "Login form validates email format and password length client-side before submission"
    - "All auth API routes return consistent error shapes with appropriate HTTP status codes"
  artifacts:
    - path: "src/lib/auth.ts"
      provides: "JWT signing and verification utilities"
    - path: "src/lib/tokens.ts"
      provides: "refresh token rotation logic"
    - path: "src/components/login-form.tsx"
      provides: "login form with client-side validation"
  key_links:
    - from: "src/components/login-form.tsx"
      to: "src/app/api/auth/login/route.ts"
      via: "POST /api/auth/login"
---

<objective>Implement JWT authentication with refresh token rotation and a login form.</objective>

<context>
@file .planning/PROJECT.md
@file .planning/DESIGN.md
@file CLAUDE.md
</context>

<tasks>
<task type="auto" wave="1">
  <name>Task 1: JWT Auth Middleware</name>
  <files>src/lib/auth.ts, src/app/api/auth/login/route.ts</files>
  <action>
    Implement JWT authentication:
    - Create `src/lib/auth.ts` with `signToken()`, `verifyToken()`, `getSession()` using RS256
    - Read signing key from `process.env.JWT_PRIVATE_KEY` (never hardcode)
    - Create `/api/auth/login` route that validates credentials and returns access + refresh tokens
    - Access token expires in 15 minutes, refresh token in 7 days
    - Return consistent error shapes: `{ error: string, code: string }`
  </action>
  <verify>
    - `signToken()` and `verifyToken()` round-trip correctly
    - Login route returns 200 with tokens on valid credentials
    - Login route returns 401 with error shape on invalid credentials
    - No hardcoded secrets in source code
  </verify>
  <done>JWT auth middleware with login route, using env-based RS256 signing</done>
</task>

<task type="auto" wave="1">
  <name>Task 2: Refresh Token Rotation</name>
  <files>src/lib/tokens.ts, src/app/api/auth/refresh/route.ts</files>
  <action>
    Implement refresh token rotation:
    - Create `src/lib/tokens.ts` with `rotateRefreshToken()` that invalidates the old token
    - Store token family ID to detect token reuse attacks
    - Create `/api/auth/refresh` route that accepts refresh token and returns new pair
    - If a reused (already-rotated) token is detected, invalidate entire token family
  </action>
  <verify>
    - Refresh returns new access + refresh token pair
    - Old refresh token is invalidated after rotation
    - Reused token triggers family invalidation
  </verify>
  <done>Refresh token rotation with reuse detection</done>
</task>

<task type="auto" wave="2">
  <name>Task 3: Login Form</name>
  <files>src/components/login-form.tsx, src/app/login/page.tsx</files>
  <action>
    Create login form UI:
    - Build `LoginForm` component with email and password fields
    - Client-side validation: email format, password minimum 8 characters
    - Submit to `/api/auth/login` via fetch
    - Show inline validation errors and server error messages
    - On success, store tokens securely (httpOnly cookie via Set-Cookie header from server)
    - Follow design tokens from .planning/DESIGN.md
  </action>
  <verify>
    - Form renders with proper styling from design tokens
    - Client-side validation prevents empty/invalid submissions
    - Server errors display correctly
    - Successful login redirects to dashboard
  </verify>
  <done>Login form with validation, error handling, and design token compliance</done>
</task>
</tasks>
