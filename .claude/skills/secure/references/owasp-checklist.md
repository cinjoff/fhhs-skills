# OWASP Security Checklist — Concrete Patterns

Use these patterns to scan source files for vulnerabilities. Each entry has: what to look for, why it's dangerous, severity, and fix example.

---

## 1. Injection + XSS

### SQL Injection
**Pattern:** String concatenation in SQL queries
```
# Regex patterns to search for:
/["'`]SELECT\s.*\+\s*\w/
/["'`]INSERT\s.*\+\s*\w/
/["'`]UPDATE\s.*\+\s*\w/
/["'`]DELETE\s.*\+\s*\w/
/\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|WHERE)/
/query\s*\(\s*["'`].*\$\{/
/\.raw\s*\(\s*["'`].*\$\{/
/\.execute\s*\(\s*["'`].*\+/
```
**Why dangerous:** Attacker-controlled input becomes executable SQL.
**Severity:** CRITICAL
**Fix:** Use parameterized queries / prepared statements.
```typescript
// BAD
db.query(`SELECT * FROM users WHERE id = ${userId}`)
// GOOD
db.query('SELECT * FROM users WHERE id = $1', [userId])
```

### Command Injection
**Pattern:** User input in shell commands
```
/exec\s*\(\s*["'`].*\$\{/
/execSync\s*\(\s*["'`].*\$\{/
/spawn\s*\(\s*["'`].*\$\{/
/child_process/
/subprocess\.call\s*\(\s*["'`].*\+/
/os\.system\s*\(/
```
**Why dangerous:** Arbitrary command execution on server.
**Severity:** CRITICAL
**Fix:** Use parameterized APIs, avoid shell interpolation, use `execFile` instead of `exec`.

### XSS (Cross-Site Scripting)
**Pattern:** Unescaped user content in HTML output
```
/dangerouslySetInnerHTML/
/innerHTML\s*=/
/\.html\s*\(/
/document\.write\s*\(/
/v-html\s*=/
/\[innerHTML\]\s*=/
/__html\s*:/
```
**Why dangerous:** Attacker injects scripts into pages viewed by other users.
**Severity:** HIGH
**Fix:** Use framework's built-in escaping. Sanitize with DOMPurify if raw HTML is required.
```typescript
// BAD
<div dangerouslySetInnerHTML={{ __html: userContent }} />
// GOOD
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
```

### Template Injection
**Pattern:** Dynamic template compilation with user input
```
/new Function\s*\(/
/eval\s*\(/
/setTimeout\s*\(\s*["'`]/
/setInterval\s*\(\s*["'`]/
/Function\s*\(\s*["'`].*return/
```
**Why dangerous:** Arbitrary code execution via template engine.
**Severity:** CRITICAL
**Fix:** Never pass user input to `eval`, `new Function`, or template engines. Use static templates.

---

## 2. Authentication + Session

### JWT Misuse
**Pattern:** Weak or missing JWT configuration
```
/jwt\.sign\s*\(.*(?:algorithm|alg).*['"](?:none|HS256)['"]/
/jwt\.sign\s*\([^)]*(?!expiresIn)[^)]*\)/
/jwt\.verify\s*\([^)]*algorithms.*['"]none['"]/
/jsonwebtoken.*(?:secret|key)\s*[:=]\s*["'][^"']{0,20}["']/
/JWT_SECRET\s*[:=]\s*["'][^"']{0,20}["']/
```
**Why dangerous:** Tokens can be forged, never expire, or be brute-forced.
**Severity:** HIGH
**Fix:** Use RS256+ with key rotation; always set `expiresIn`; use long, random secrets from env.

### Missing CSRF Protection
**Pattern:** State-changing endpoints without CSRF tokens
```
/app\.(post|put|patch|delete)\s*\(/
/router\.(post|put|patch|delete)\s*\(/
# Then verify no CSRF middleware in the chain
/csrf/i
/csurf/
/csrfToken/
```
**Why dangerous:** Attackers can trick authenticated users into performing actions.
**Severity:** HIGH
**Fix:** Use CSRF tokens for all state-changing requests. SameSite cookies help but aren't sufficient alone.

### Insecure Password Storage
**Pattern:** Passwords stored without proper hashing
```
/password.*=.*(?:md5|sha1|sha256)\s*\(/
/createHash\s*\(\s*['"](?:md5|sha1)['"]\)/
/password.*=.*(?:encode|encrypt)\s*\(/
# Missing bcrypt/argon2/scrypt
```
**Why dangerous:** Weak hashes are trivially crackable.
**Severity:** CRITICAL
**Fix:** Use bcrypt, argon2, or scrypt with appropriate cost factors.

### Session Fixation
**Pattern:** Session ID not regenerated after auth
```
/req\.session\s*(?!=.*regenerate)/
/session\.(?:save|store).*(?!regenerate)/
```
**Why dangerous:** Attacker sets a known session ID before victim authenticates.
**Severity:** HIGH
**Fix:** Regenerate session ID after login: `req.session.regenerate()`.

---

## 3. Data Exposure

### Hardcoded Secrets
**Pattern:** API keys, tokens, passwords in source code
```
/(?:api[_-]?key|apikey)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i
/(?:secret|token|password|passwd|pwd)\s*[:=]\s*["'][^"']{8,}["']/i
/(?:aws_access_key_id|aws_secret_access_key)\s*[:=]\s*["'][^"']+["']/i
/AKIA[0-9A-Z]{16}/
/sk-[A-Za-z0-9]{32,}/
/ghp_[A-Za-z0-9]{36}/
/xox[bpsar]-[A-Za-z0-9\-]+/
/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/
/mongodb\+srv:\/\/[^:]+:[^@]+@/
/postgres:\/\/[^:]+:[^@]+@/
/mysql:\/\/[^:]+:[^@]+@/
```
**Why dangerous:** Credentials committed to source control are exposed to anyone with repo access.
**Severity:** CRITICAL
**Fix:** Use environment variables. Never commit secrets. Use `.env` files (gitignored) or secret managers.

### PII in Logs
**Pattern:** Personal data logged without sanitization
```
/console\.log\s*\(.*(?:email|phone|ssn|password|creditCard|cardNumber|cvv)/i
/logger\.(?:info|debug|warn|error)\s*\(.*(?:email|phone|ssn|password|credit)/i
/\.log\s*\(.*(?:req\.body|request\.body)/
```
**Why dangerous:** PII in logs violates privacy regulations (GDPR, CCPA) and can leak via log aggregators.
**Severity:** HIGH
**Fix:** Sanitize/redact PII before logging. Never log request bodies wholesale.

### Sensitive Data in Error Responses
**Pattern:** Stack traces and internal details returned to clients
```
/res\.(?:json|send)\s*\(.*(?:stack|stackTrace|err\.message)/
/catch\s*\(.*\)\s*\{[^}]*res\..*(?:error|err|e)\./
/\.status\(500\)\.(?:json|send)\s*\(.*(?:message|stack)/
```
**Why dangerous:** Internal details help attackers understand system architecture.
**Severity:** MEDIUM
**Fix:** Return generic error messages to clients. Log detailed errors server-side only.

---

## 4. Access Control + Configuration

### IDOR (Insecure Direct Object References)
**Pattern:** User-supplied IDs without ownership verification
```
/params\.id|params\.userId|req\.params\.\w+Id/
/query\.id|req\.query\.\w+Id/
# Then check: is there an ownership/authorization check before the DB query?
```
**Why dangerous:** Attacker changes ID parameter to access other users' data.
**Severity:** HIGH
**Fix:** Always verify the requesting user owns/has access to the resource. Use session user ID, not request parameter.

### Permissive CORS
**Pattern:** Wildcard or overly permissive CORS configuration
```
/Access-Control-Allow-Origin.*\*/
/cors\s*\(\s*\{?\s*origin\s*:\s*(?:true|\*|['"]?\*['"]?)/
/cors\s*\(\s*\)/
```
**Why dangerous:** Any website can make authenticated requests to your API.
**Severity:** MEDIUM (HIGH if credentials allowed)
**Fix:** Whitelist specific origins. Never use `*` with credentials.

### Missing Security Headers
**Pattern:** Absence of security headers in responses
```
# Check for presence of these headers in middleware/config:
/Content-Security-Policy/
/Strict-Transport-Security/
/X-Content-Type-Options/
/X-Frame-Options/
/Referrer-Policy/
# If using helmet.js, check it's actually applied:
/helmet\s*\(\s*\)/
```
**Why dangerous:** Missing headers leave browsers without defense-in-depth protections.
**Severity:** MEDIUM
**Fix:** Use `helmet` (Express) or set headers manually. At minimum: CSP, HSTS, X-Content-Type-Options.

### Debug Endpoints / Dev Mode in Production
**Pattern:** Debug routes or development flags
```
/app\.use\s*\(\s*['"]\/debug/
/app\.use\s*\(\s*['"]\/test/
/NODE_ENV.*!==?\s*['"]production['"]/
/debug\s*[:=]\s*true/
/NEXT_PUBLIC_.*SECRET/
/NEXT_PUBLIC_.*KEY.*[:=]/
```
**Why dangerous:** Debug endpoints bypass auth. Dev mode exposes internals.
**Severity:** HIGH
**Fix:** Remove debug routes. Use environment-based feature flags properly.

### Open Redirects
**Pattern:** Redirect destination from user input
```
/res\.redirect\s*\(\s*req\.(query|params|body)\./
/location\.href\s*=\s*(?:req|params|query)\./
/window\.location\s*=\s*(?:new URL|params|query)/
/router\.push\s*\(\s*(?:query|params|searchParams)\./
```
**Why dangerous:** Attacker crafts a link that redirects authenticated users to phishing sites.
**Severity:** MEDIUM
**Fix:** Validate redirect URLs against an allowlist of permitted destinations.

---

## 5. Next.js-Specific Checks

### Server-Side Secrets Leaking to Client
**Pattern:** Server-only values exposed via props or public env
```
/NEXT_PUBLIC_.*(?:SECRET|KEY|TOKEN|PASSWORD|API_KEY)/i
/getServerSideProps.*return\s*\{[^}]*props:\s*\{[^}]*(?:secret|key|token|password)/i
/getStaticProps.*return\s*\{[^}]*props:\s*\{[^}]*(?:secret|key|token|password)/i
```
**Why dangerous:** Server-side secrets serialized into HTML/JSON are visible to all clients.
**Severity:** CRITICAL
**Fix:** Never pass secrets through props. Use server-only modules. Prefix public env vars with `NEXT_PUBLIC_` only if they're truly public.

### API Route Auth Gaps
**Pattern:** API routes without authentication checks
```
# Check all files in app/api/ or pages/api/ for auth verification:
/export\s+(?:async\s+)?function\s+(?:GET|POST|PUT|PATCH|DELETE)/
/export\s+default\s+(?:async\s+)?function\s+handler/
# Then verify they call auth/session check:
/getServerSession|getSession|auth\(\)|requireAuth|verifyToken|authenticate/
```
**Why dangerous:** Unauthenticated API routes allow anyone to read/modify data.
**Severity:** HIGH
**Fix:** Add auth middleware or session check to every API route that handles user data.

### Middleware Bypass
**Pattern:** Middleware not covering all routes
```
# Check middleware.ts matcher configuration:
/export\s+const\s+config\s*=\s*\{[^}]*matcher/
# Verify it covers API routes and protected pages
# Watch for negative patterns that exclude too much:
/matcher.*!\s*\//
```
**Why dangerous:** Improperly configured matchers leave routes unprotected.
**Severity:** HIGH
**Fix:** Use positive matchers for protected routes. Verify all API routes and protected pages are covered.

### Server Actions Without Validation
**Pattern:** Server actions accepting unvalidated input
```
/['"]use server['"]/
# Then check: is input validated with zod/yup/etc?
/z\.object|yup\.object|schema\.validate|safeParse/
```
**Why dangerous:** Server actions are public endpoints — unvalidated input enables injection and data corruption.
**Severity:** HIGH
**Fix:** Validate all server action inputs with Zod or similar. Never trust client data.
