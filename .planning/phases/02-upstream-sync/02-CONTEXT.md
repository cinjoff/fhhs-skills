---
phase: 02-upstream-sync
type: context
created: "2026-03-25"
---

# Phase 2: Upstream Sync & Patch Stability — Context

## Decisions

### Pre-sync validation approach
Add a validation step (Step 0.5) to the sync-upstream skill that checks:
- All `forked_to` paths from the registry exist on disk
- Current snapshot directories in `upstream/` match registry expectations
- PATCHES.md has entries for every forked upstream
Rationale: Prevents mid-sync failures that leave the repo in a half-updated state.

### Post-sync regression detection
Add a regression step (Step 4.5) to the sync-upstream skill that:
- Maps the updated upstream → its `forked_to` skills → the eval commands those skills correspond to
- Runs `python3 evals/run_all_evals.py --commands <affected_commands>` (targeted subset)
- Reports pass/fail per command, blocks commit if any eval fails
Rationale: The core Phase 2 goal — "eval suite catches regressions introduced by upstream changes."

### Rollback mechanism
Use git — `git stash create` before any file modifications in Step 4. If post-sync evals fail, offer `git stash pop` to revert. No custom rollback infrastructure.
Rationale: Simple, reliable, no new code to maintain.

### Eval runner filtering
The eval runner (`run_all_evals.py`) needs a `--commands` flag to run only evals matching specific command names. Currently runs all or nothing.
Rationale: Full eval suite is too slow for post-sync validation of a single upstream. Targeted runs give fast feedback.

### Eval runner --commands flag
Add `--commands` argument to `fhhs-skills-workspace/run_all_evals.py` to enable targeted eval runs. Required for Step 4.5 to work — full suite is too slow for post-sync validation.

### Explicit eval_commands in registry
Each upstream entry in `upstream-registry.md` gets an `eval_commands` field listing the eval command names to run when that upstream is updated. Deterministic mapping, no runtime inference.

### [review] Git stash must use --include-untracked
`git stash push --include-untracked` captures new snapshot directories (untracked files). Plain `git stash` only handles modified tracked files, leaving new directories orphaned on rollback.

### [review] Pre-validation must handle 4 path patterns
Forked paths use different file patterns: `{path}/PROMPT.md` (internal skills), `{path}/SKILL.md` (shipped skills), `{path}.md` (agents, commands). Validation must check the correct pattern per path type.

### [review] Stash failure is a user decision, not silent
If `git stash` fails, warn and ask — never silently proceed without a checkpoint.

### [review] Eval runner failure is non-blocking
If the eval runner script itself fails (missing python, script error), warn but don't block the sync. The user can run evals manually.

## Deferred Ideas

- Adding evals for git checkpoint step itself (low-value — simple guard logic)
- Automated retry of failed evals (user decides what to do)

- Automated CI alerts for new upstream versions (requires CI setup, out of Phase 2 scope)
- Interactive conflict resolution UI (requires Conductor features, not available)
- Upstream version pinning in config.json (nice-to-have, not blocking)
