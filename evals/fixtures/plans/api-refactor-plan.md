---
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/api-client.ts
  - src/lib/api-types.ts
  - src/app/api/users/route.ts
  - src/app/api/billing/route.ts
  - src/app/api/data/route.ts
autonomous: true

must_haves:
  truths:
    - "All API routes use parameterized queries — zero string concatenation with user input"
    - "Shared ApiClient class with typed methods replaces ad-hoc fetch calls"
    - "Every route validates input with Zod schemas before processing"
    - "Error responses follow RFC 7807 Problem Details format"
  artifacts:
    - path: "src/lib/api-client.ts"
      provides: "typed API client with error handling"
    - path: "src/lib/api-types.ts"
      provides: "Zod schemas and inferred types for all API routes"
  key_links:
    - from: "src/app/api/users/route.ts"
      to: "src/lib/api-types.ts"
      via: "imports UserSchema for input validation"
    - from: "src/app/api/billing/route.ts"
      to: "src/lib/api-types.ts"
      via: "imports BillingSchema for input validation"
---

<objective>Refactor API routes to use parameterized queries, typed client, and Zod validation.</objective>

<context>
@file .planning/PROJECT.md
@file CLAUDE.md
</context>

<tasks>
<task type="auto" wave="1">
  <name>Task 1: API Types and Validation Schemas</name>
  <files>src/lib/api-types.ts</files>
  <action>
    Create shared type definitions and Zod schemas:
    - `UserSchema` — validates user creation/update payloads
    - `BillingSchema` — validates billing-related payloads
    - `QueryParamsSchema` — validates pagination, sorting, filtering params
    - `ProblemDetail` type following RFC 7807
    - Export both Zod schemas and inferred TypeScript types
  </action>
  <verify>
    - All schemas reject invalid input with descriptive errors
    - Inferred types match expected shapes
    - ProblemDetail type has required fields (type, title, status, detail)
  </verify>
  <done>Zod validation schemas and RFC 7807 error types for all API routes</done>
</task>

<task type="auto" wave="1">
  <name>Task 2: Typed API Client</name>
  <files>src/lib/api-client.ts</files>
  <action>
    Create typed API client class:
    - `ApiClient` with methods: `getUser()`, `createUser()`, `getBilling()`, `getData()`
    - All methods return typed responses using schemas from api-types.ts
    - Built-in error handling that returns ProblemDetail on failures
    - Request/response logging in development mode
    - Retry logic with exponential backoff for transient failures
  </action>
  <verify>
    - Client methods have correct parameter and return types
    - Error responses match ProblemDetail format
    - Retry logic works for 5xx responses
  </verify>
  <done>Typed API client with error handling and retry logic</done>
</task>

<task type="auto" wave="2">
  <name>Task 3: Refactor API Routes</name>
  <files>src/app/api/users/route.ts, src/app/api/billing/route.ts, src/app/api/data/route.ts</files>
  <action>
    Refactor all API routes to use new infrastructure:
    - Replace SQL string concatenation with parameterized queries (`$1`, `$2` placeholders)
    - Add Zod validation at route entry using schemas from api-types.ts
    - Return ProblemDetail on validation failures (400) and server errors (500)
    - Add authentication middleware check on all routes
    - Add CORS headers via Next.js middleware
  </action>
  <verify>
    - Zero instances of SQL string concatenation remain
    - All routes validate input before processing
    - Error responses follow RFC 7807 format
    - Authentication is required on all routes
  </verify>
  <done>All API routes refactored with parameterized queries, validation, and auth</done>
</task>
</tasks>
