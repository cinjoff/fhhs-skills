---
name: fh:simplify
description: Review changed code for reuse, quality, and efficiency. Use when the user says 'simplify', 'clean up this code', 'check for duplication', 'optimize this', or after completing a build/refactor/fix. Runs automatically as part of /fh:build, /fh:refactor, and /fh:fix (MODERATE+) pipelines.
user-invokable: false
---

Review changed code for reuse, quality, and efficiency, then fix any issues found.

What to simplify: $ARGUMENTS

---

## When to Use

- **Automatically:** Runs as part of `/fh:build` (Step 8b) and `/fh:refactor` (Step 5b) and `/fh:fix` (Step 4b, MODERATE+ only)
- **Standalone:** After any manual changes, or when you want a focused cleanup pass on recent work

## How It Works

Read `skills/simplify/PROMPT.md` and follow it completely. It runs 3 parallel review agents on the git diff — code reuse, code quality, and efficiency — then fixes issues directly.

Commit fixes: `refactor(scope): simplify pass`
