# Quality Gate

Lightweight post-wave structural checks — not full LLM evaluation.

## When

Run after **each wave** completes, before dispatching the next wave.

## Checks

For each task completed in the wave, verify:

1. **Files exist** — expected output files are present on disk
   ```bash
   [ -f "{expected_file}" ] || echo "MISSING: {expected_file}"
   ```

2. **Content markers** — key exports, class names, or function signatures present
   ```bash
   grep -q "{marker}" "{file}" || echo "MISSING MARKER: {marker} in {file}"
   ```

3. **Tests pass** — run the project test command; capture exit code
   ```bash
   npm test --silent 2>&1 | tail -5
   ```
   Skip if no test command configured.

4. **SPEC.md rubric spot-check** — if plan has a `spec:` field, check 1–2 rubric items:
   - Pick rubric items relevant to this wave's tasks
   - Verify structural evidence (file structure, exported interfaces, config keys)
   - Do NOT run full spec gate — that's for `/fh:review`

## Scoring

| Score | Condition |
|-------|-----------|
| **PASS** | All checks green |
| **WARN** | Non-critical check failed (e.g., coverage below target, advisory rubric item) |
| **FAIL** | Required file missing, tests failing, or critical marker absent |

## Adaptive Response

| Score | Action |
|-------|--------|
| PASS | Proceed to next wave |
| WARN | Proceed, log concern in SUMMARY.md under "Quality Warnings" |
| FAIL — single task | Retry that task per `task-state-protocol.md` retry protocol |
| FAIL — architectural (wrong interface, missing dep) | Stop. Surface to user: "Wave {N} failed structural check — architectural issue detected. Intervention needed." |
| FAIL — multiple tasks | Stop. Surface all failures. Ask user: "Multiple wave failures — retry, skip, or abort?" |

## What This Is Not

- Not a replacement for `npm test` (that runs in Step 4)
- Not a full spec gate (that's `/fh:review`)
- Not an LLM code quality review — structural checks only

Budget: keep gate execution under 2% context per wave.
