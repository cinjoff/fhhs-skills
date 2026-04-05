# Production Safety Checklist

> Adapted from gstack review/checklist.md (v0.3.3). Framework-agnostic.

Review the diff for the issues listed below. Be specific — cite `file:line` and suggest fixes. Skip anything that's fine. Only flag real problems.

**Two-pass review:**
- **Pass 1 (CRITICAL):** Blocks shipping. Must be resolved before merge.
- **Pass 2 (INFORMATIONAL):** Included in review output but does not block.

---

## Pass 1 — CRITICAL

### SQL & Data Safety
- String interpolation in SQL queries — use parameterized queries or the ORM's safe interpolation
- TOCTOU races: check-then-set patterns that should be atomic (e.g., `WHERE` + `UPDATE` in one statement)
- Bulk updates bypassing validations on fields that have or should have constraints
- N+1 queries: missing eager loading for associations used in loops or rendered collections

### Race Conditions & Concurrency
- Read-check-write without a uniqueness constraint or conflict-retry loop (e.g., lookup-then-insert without handling concurrent inserts)
- Find-or-create on columns without a unique index — concurrent calls can create duplicates
- Status transitions that aren't atomic — concurrent updates can skip or double-apply transitions

### LLM Output Trust Boundary
- LLM-generated values (emails, URLs, names) written to a database or passed to downstream services without format validation. Add lightweight guards (regex, URL parse, `.trim()`) before persisting.
- Structured LLM output (arrays, objects) accepted without type/shape checks before database writes or API calls.

---

## Pass 2 — INFORMATIONAL

### Conditional Side Effects
- Code paths that branch on a condition but forget to apply a side effect on one branch, creating an inconsistent record.
- Log messages that claim an action happened but the action was conditionally skipped.

### Magic Numbers & String Coupling
- Bare numeric literals used in multiple files — should be named constants
- Error message strings used as query filters elsewhere (grep for the string — is anything matching on it?)

### Dead Code & Consistency
- Variables assigned but never read
- Version mismatch between PR title and VERSION/CHANGELOG files
- CHANGELOG entries that describe changes inaccurately
- Comments/docstrings that describe old behavior after the code changed

### LLM Prompt Issues
- 0-indexed lists in prompts (LLMs reliably return 1-indexed)
- Prompt text listing available tools/capabilities that don't match what's actually wired up
- Word/token limits stated in multiple places that could drift

### Test Gaps
- Negative-path tests that assert type/status but not the side effects (field populated? callback fired?)
- Assertions on string content without checking format
- Missing assertions that a code path should explicitly NOT call an external service
- Security enforcement features (blocking, rate limiting, auth) without integration tests verifying the enforcement path end-to-end

### Crypto & Entropy
- Truncation of data instead of hashing (last N chars instead of SHA-256) — less entropy, easier collisions
- `Math.random()` / non-cryptographic RNG for security-sensitive values — use cryptographic randomness
- Non-constant-time comparisons (`==` / `===`) on secrets or tokens — vulnerable to timing attacks

### Time Window Safety
- Date-key lookups that assume "today" covers 24h — a report at 8am only sees midnight-to-8am under today's key
- Mismatched time windows between related features — one uses hourly buckets, another uses daily keys for the same data

### Type Coercion at Boundaries
- Values crossing language/serialization boundaries where type could change (numeric vs string) — hash/digest inputs must normalize types
- Hash/digest inputs that don't normalize to string before serialization — `{ cores: 8 }` vs `{ cores: "8" }` produce different hashes

### View/Frontend
- Inline `<style>` blocks in components re-parsed every render
- O(n*m) lookups in views (array find in a loop instead of a hash/map index)
- Client-side filtering on full result sets that could be a server-side `WHERE` clause

---

## Suppressions — DO NOT flag these

- "X is redundant with Y" when the redundancy is harmless and aids readability
- "Add a comment explaining why this threshold/constant was chosen" — thresholds change during tuning, comments rot
- "This assertion could be tighter" when the assertion already covers the behavior
- Consistency-only changes with no behavioral impact (e.g., wrapping a value in a conditional to match how another constant is guarded)
- "Regex doesn't handle edge case X" when the input is constrained and X never occurs in practice
- "Test exercises multiple guards simultaneously" — that's fine, tests don't need to isolate every guard
- Eval parameter tuning (thresholds, min scores) — these are tuned empirically and change constantly
- Harmless no-ops (e.g., `.filter()` on an element that's never in the array)
- ANYTHING already addressed in the diff you're reviewing — read the FULL diff before commenting
