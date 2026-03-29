---
name: fh:secure
description: Scan for OWASP Top 10 security vulnerabilities. Use when the user says 'security scan', 'check security', 'audit security', or before promoting changes.
user-invocable: false
disable-model-invocation: true
---

Scan for OWASP Top 10 security vulnerabilities using parallel scanning agents.

Scan target or flags: $ARGUMENTS

You are a **lean orchestrator**. Stay under 10% context usage. Delegate all scanning to subagents.

---

### Past Learnings Check

If claude-mem is available, recall known security patterns:
1. Derive project name from `.planning/PROJECT.md` name field (fall back to basename of cwd). Use this as the `project` parameter for all claude-mem calls.
2. Call `mcp__plugin_claude-mem_mcp-search__search` with query="security" + framework/stack name, limit=5, project=<project-name>
3. Filter for: vulnerability, injection, XSS, auth bypass, exposure, CVE, security fix
4. If relevant: "**Known security context:** - {summary}" — max 3 items. Feed into agent scan prompts.
5. Skip silently if unavailable

---

## Step 1: Scope

Determine scan target:

**Default (changed files):**
```bash
MERGE_BASE=$(git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null || echo "HEAD~1")
git diff --name-only "$MERGE_BASE..HEAD" -- ':!.planning/' ':!*.lock' ':!.next/' ':!*.map'
git diff --name-only --staged -- ':!.planning/' ':!*.lock' ':!.next/' ':!*.map'
git diff --name-only -- ':!.planning/' ':!*.lock' ':!.next/' ':!*.map'
```
Combine into a deduplicated file list. Filter to source files only (`.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.go`, `.rs`, `.java`, `.sql`, `.env*`, `.yml`, `.yaml`, `.json`).

**If `--full` flag is present:** scan the entire codebase source tree instead.

Read the file list content — this becomes the scan payload for all agents.

Report: "Scanning N files for OWASP Top 10 vulnerabilities."

---

## Step 2: Parallel Security Scan

Dispatch **4 parallel subagents** using the Task tool with `subagent_type: "general-purpose"`. Each agent gets:
- The file list and file contents from Step 1
- The OWASP checklist reference at `skills/secure/references/owasp-checklist.md`
- Their assigned vulnerability categories (below)
- Instruction to report findings in structured format: `file:line | SEVERITY | category | description | fix suggestion`

### Agent 1: Injection + XSS
Categories: SQL injection, NoSQL injection, command injection, LDAP injection, XSS (reflected, stored, DOM-based), template injection, header injection.

### Agent 2: Authentication + Session
Categories: broken authentication, JWT misuse (no expiry, weak signing, secret in code), session fixation, CSRF, missing token validation, insecure password storage, broken OAuth flows.

### Agent 3: Data Exposure
Categories: hardcoded secrets/API keys/tokens in source, PII in logs, sensitive data in error messages, insecure storage, missing encryption, secrets in git history, `.env` files committed, verbose error responses exposing internals.

### Agent 4: Access Control + Configuration
Categories: IDOR (insecure direct object references), permissive CORS, missing security headers (CSP, HSTS, X-Frame-Options), debug endpoints in production, misconfigured permissions, directory traversal, open redirects, insecure defaults.

**Context budget:** Each scanner gets only the file contents + checklist. No plan files, no GSD state.

### Context-Mode Acceleration

If ctx_batch_execute is available, index the combined output from all 4 security scan agents:
- Index each agent's findings with labeled sections (injection, auth, data-exposure, access-control)
- Use ctx_search to filter by severity (critical/high/medium), threat category, or remediation effort
- Enables efficient cross-referencing without holding all 4 reports in context
- If unavailable, process agent reports sequentially

---

## Step 3: Collect + Classify

Collect results from all 4 agents. Then:

1. **Deduplicate:** Same file:line appearing in multiple agents → keep the most specific finding
2. **Classify severity:**
   - **CRITICAL:** Exploitable with direct impact — SQL injection, RCE, hardcoded production secrets, auth bypass
   - **HIGH:** Exploitable with some conditions — XSS, CSRF without token, IDOR, JWT with weak signing
   - **MEDIUM:** Defense-in-depth gaps — missing security headers, verbose errors, permissive CORS on non-sensitive endpoints
   - **LOW:** Best practice violations — missing rate limiting, cookie flags, informational issues
3. **Sort:** CRITICAL first, then HIGH, MEDIUM, LOW

---

## Step 4: Report

Generate a structured security report:

```
## Security Scan Results

**Scanned:** N files | **Findings:** X total (C critical, H high, M medium, L low)

### CRITICAL
| File:Line | Category | Description | Fix |
|-----------|----------|-------------|-----|
| ... | ... | ... | ... |

### HIGH
| File:Line | Category | Description | Fix |
|-----------|----------|-------------|-----|
| ... | ... | ... | ... |

### MEDIUM / LOW
(grouped table)

### Summary
- Gate decision: BLOCK / WARN / PASS
- CRITICAL/HIGH findings require fixes before promotion
- MEDIUM/LOW findings are advisory
```

**Gate output for callers:**
- Any CRITICAL → return `BLOCK` with finding details
- Any HIGH (no CRITICAL) → return `WARN` with finding details
- MEDIUM/LOW only → return `PASS` with notes
- No findings → return `PASS (clean)`

### Persist Findings

After the security report, output vulnerability patterns for future scans:
1. If ctx_search is available, query indexed agent findings for critical/high severity vulnerabilities
2. Output each finding as:
   **[security-finding]** {threat-category}: {vulnerability pattern} in {file/component} — status: {fixed/unfixed}
3. Include remediation status so future scans can verify fixes held
4. Max 5 findings per scan
5. Skip silently if no critical/high findings
