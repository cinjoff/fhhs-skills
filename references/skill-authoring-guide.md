# Skill Authoring Guide

Reference patterns and rules for authoring skills in fhhs-skills.

## Non-Interactive Guard Pattern

Any CLI command that can open a browser, require TTY, or prompt for input must be guarded before use in skills. Pattern:

```bash
# Check auth/availability before interactive command
if ! vercel whoami 2>/dev/null; then
  # emit checkpoint with manual instructions instead of hanging
fi
```

Examples: `vercel link` (needs `vercel whoami` check), `gh auth login` (needs `gh auth status`), any `npm login` or OAuth CLI flow.

Never invoke an interactive CLI in a skill without a pre-flight check. If the pre-flight fails, emit a `checkpoint:human-verify` with manual instructions rather than letting the skill hang.

## Eval-Alongside-Feature Rule

Every plan that ships a new skill behavior MUST include an eval task covering that behavior. Signs you need an eval:

- New step added to a skill (e.g. Step 2.5 in build)
- New flag or mode added to a skill
- New subagent or orchestration pattern
- New CONTEXT.md enforcement rule

The eval task should be in the same plan wave as the feature task (wave: same = no deps). Do not defer evals to a follow-up phase — untested behavior ships as debt.

## Path Consistency Rules

- All file paths in skill docs must use `src/lib/` not `lib/` for files scaffolded by new-project
- Playwright resolution: always use find+sort-V+tail-1 pattern (not bare glob), with `.claude/skills/` fallback
- Plugin-cache paths: never hardcode project-relative paths in shipped skills; always resolve from `$HOME/.claude/plugins/cache/fhhs-skills`

Example Playwright resolution pattern:
```bash
PLAYWRIGHT=$(find "$HOME/.claude/plugins/cache/fhhs-skills" -name "playwright.md" | sort -V | tail -1)
```

## Dead-Code Check for Reverts

After any `git revert` commit: scan for orphaned imports and dead files:

```bash
# Quick dead-code check after revert
grep -r "import\|require" src/ --include="*.js" --include="*.jsx" | grep -v node_modules > /tmp/imports.txt
# Verify each imported file still exists
```

Add a `checkpoint:human-verify` task to any plan that includes a revert. Do not merge reverts without confirming dead-code sweep is complete.

## Eval Checks Quality Bar

Every eval must have `checks` with at least 2 regex patterns. Patterns must be:

- Skill-specific technical terms (not generic words)
- Case-appropriate (use lowercase + regex if case-insensitive matching needed)
- For smoke-tier evals: 3+ checks minimum

Bad (too generic):
```yaml
checks:
  - "done"
  - "success"
```

Good (skill-specific):
```yaml
checks:
  - "vercel whoami"
  - "checkpoint:human-verify"
  - "non-interactive"
```
