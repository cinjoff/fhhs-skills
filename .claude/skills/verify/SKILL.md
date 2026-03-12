---
name: verify
description: Verify completed work with goal-backward truth tables and fresh evidence. Use when the user says 'verify', 'check if it works', 'did we miss anything', 'validate', or wants proof that a phase or branch is complete. Delegates to /review --verify for the full verification workflow.
user-invokable: true
---

This skill delegates to `/review --verify` — the goal verification dimension of the comprehensive review skill.

Pass through any arguments (phase number, branch name, or blank for current work): $ARGUMENTS

---

## What it does

`/review --verify` runs goal-backward verification:

1. **Scope detection** — determines what to verify from arguments or STATE.md
2. **must_haves truth table** — checks each truth against codebase evidence
3. **Artifact verification** — runs `gsd-tools.cjs verify artifacts` and `verify key-links`
4. **Evidence collection** — runs tests, build, lint with fresh output
5. **Gap-closure routing** — FAIL findings route to `/fix`, `/plan-work`, or `/refactor`

## Invoke

Run `/review --verify $ARGUMENTS`.

If the user wants a full analysis (code quality + security + architecture + gaps + verification), suggest `/review` without the `--verify` flag.
