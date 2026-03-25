---
name: fh:simplify
description: Review changed code for reuse, quality, and efficiency. Use when the user says 'simplify', 'clean up this code', 'check for duplication', 'optimize this', or after completing a build/refactor/fix. Runs automatically as part of /fh:build, /fh:refactor, and /fh:fix (MODERATE+) pipelines.
user-invocable: false
---

Review changed code for reuse, quality, and efficiency, then fix any issues found.

What to simplify: $ARGUMENTS

---

## When to Use

- **Automatically:** Runs as part of `/fh:build` (Step 8b) and `/fh:refactor` (Step 5b) and `/fh:fix` (Step 4b, MODERATE+ only)
- **Standalone:** After any manual changes, or when you want a focused cleanup pass on recent work

## How It Works

Read `skills/simplify/PROMPT.md` and follow it completely. It runs 3 parallel review agents on the git diff — code reuse, code quality, and efficiency — then fixes issues directly.

## Fallow Static Analysis (if available)

Before dispatching the 3 review agents, check if Fallow is installed and gather deterministic findings to augment each agent's analysis.

### 1. Availability check and execution

```bash
if command -v fallow &>/dev/null; then
  BASE=$(git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null || echo "HEAD~10")
  DIFF_FILES=$(git diff --name-only "$BASE"..HEAD)
  FALLOW_CHECK=$(fallow check --changed-since "$BASE" --format json --quiet 2>/dev/null) || FALLOW_CHECK=""
  FALLOW_DUPES=$(fallow dupes --mode semantic --format json --quiet 2>/dev/null) || FALLOW_DUPES=""
  FALLOW_HEALTH=$(fallow health --format json --quiet 2>/dev/null) || FALLOW_HEALTH=""
fi
```

### 2. Post-filter and cap output size

- `FALLOW_CHECK` is already scoped via `--changed-since` — use as-is
- `FALLOW_DUPES`: filter to entries involving files in `$DIFF_FILES` only
- `FALLOW_HEALTH`: filter to entries involving files in `$DIFF_FILES`, then take top-10 by complexity score
- **Hard cap:** If any output exceeds 200 lines after filtering, truncate to top findings by severity
- **Skip empty:** Only inject non-empty outputs into agent prompts

### 3. Inject filtered output into each agent's prompt

Under a `## Static Analysis Findings` header:

- **Code reuse agent** receives: `fallow dupes` output (exact duplicate locations) + `fallow check` unused exports
- **Code quality agent** receives: `fallow health` output (complexity metrics) + `fallow check` circular dependency chains
- **Efficiency agent** receives: `fallow health` output (complexity hotspots)

### 4. If NOT available

Skip silently. The 3 agents run with their existing diff-only analysis. No mention of Fallow in output.

### 5. Key instruction to agents

"Static analysis findings are deterministic ground truth. When Fallow reports a duplicate or unused export, cite the exact file:line from the Fallow output. Do not second-guess Fallow's structural findings — focus your LLM analysis on whether the finding is actionable (e.g., is the unused export intentionally part of a public API?)."

Commit fixes: `refactor(scope): simplify pass`
