---
name: simplify
description: Review changed code for reuse, quality, and efficiency. Use when the user says 'simplify', 'clean up this code', 'check for duplication', 'optimize this', or after completing a build/refactor/fix. Runs automatically as part of /build, /refactor, and /fix (MODERATE+) pipelines.
user-invokable: false
---

Review changed code for reuse, quality, and efficiency, then fix any issues found.

What to simplify: $ARGUMENTS

---

## When to Use

- **Automatically:** Runs as part of `/build` (Step 8b) and `/refactor` (Step 5b) and `/fix` (Step 4b, MODERATE+ only)
- **Standalone:** After any manual changes, or when you want a focused cleanup pass on recent work

## How It Works

Invoke `skills/simplify/`. It runs 3 parallel review agents on the git diff — code reuse, code quality, and efficiency — then fixes issues directly.

Commit fixes: `refactor(scope): simplify pass`
