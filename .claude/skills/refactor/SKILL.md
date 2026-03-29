---
name: fh:refactor
description: Reorganize code without changing what it does. Keeps tests passing at every step.
user-invocable: true
---

Restructure existing code safely. Not a bug (use /fh:fix). Not new functionality (use /fh:build). Behavior preservation is the iron law.

The refactoring goal: $ARGUMENTS

> **Dependency check:** Verify `.planning/PROJECT.md` exists (required — if missing, tell user: "No project found.

→ Run /fh:new-project — set up project tracking before refactoring"). Engineering disciplines (verification, review) are built into this plugin.

This command runs in a single context by default. For large refactors (10+ files), write a PLAN.md and delegate to subagents.

---

## Iron Law

**Tests never go red during refactoring.** If a test goes red after a structural change, REVERT immediately. Do NOT debug forward. Revert, understand why, try differently.

---

## Step 0: Analysis Mode (no target specified)

If the user asks to "refactor this codebase", "clean up", or "find things to refactor" without specifying a target, read `skills/simplify/PROMPT.md` and follow it to identify refactoring candidates. It runs 3 parallel review agents that scan for:

- **God components/classes** — files doing too many things, violating single responsibility
- **Kitchen-sink utilities** — catch-all modules that should be split by domain
- **Duplicate patterns** — copy-pasted logic with minor variations that should be extracted
- **Redundant abstractions** — wrappers that add no value over the underlying API

Present the findings to the user as a numbered list with file paths, descriptions, and estimated blast radius. Let them choose what to refactor. Then proceed to Step 1 with the chosen target.

**Skip this step** if the user already specified a concrete refactoring target (file, function, module, pattern).

---

## Step 1: Scope

Identify the blast radius:
1. Find all files involved in the refactoring target. **Use LSP first — faster and more precise than grep:**
   - `findReferences` on the target symbol to get precise usage sites
   - `incomingCalls`/`outgoingCalls` to map the call graph
   - `documentSymbol` to understand file structure before planning changes
   - For renames: use LSP `rename` — it atomically updates all references across files

2. Map dependencies: what imports/calls the target, what does the target import/call
3. Estimate: how many files change, which subsystems affected

### Fallow Scope Augmentation (if available)

```bash
if command -v fallow &>/dev/null; then
  FALLOW_CHECK=$(timeout 30 fallow check --format json --quiet 2>/dev/null) || FALLOW_CHECK=""
fi
```

If Fallow ran successfully:
- **Circular dependencies:** Check if the refactoring target is part of any circular dependency chain. If yes, note it — the refactoring should break the cycle, not preserve it.
- **Unused exports:** Check if any exports in the target files are unused. These can be removed as part of the refactor rather than restructured.
- **Dependency graph:** Use import/export data to supplement LSP's `findReferences` — Fallow sees the full module graph, not just direct callers.

If Fallow is not installed: skip silently. LSP-based analysis is sufficient for most refactors.

Report: "This refactoring touches N files across M subsystems. Blast radius: [description]."

If large (10+ files or 3+ subsystems), suggest writing a PLAN.md via `/fh:plan-work` first.

### Context-Mode Acceleration

If ctx_batch_execute is available, index the analysis scope before planning refactoring steps:
- Index files in the target module/directory via ctx_batch_execute
- Include `.planning/codebase/CODEBASE.md` for structure, conventions, and architecture reference (fall back to individual files in `.planning/codebase/` if CODEBASE.md doesn't exist)
- Use ctx_search for "coupling between modules", "dependency patterns", "abstraction layers" to find refactoring targets
- If unavailable, fall back to direct Grep/Glob/Read

---

## Step 2: Capture Baseline

Run the existing test suite for the affected area. Record: X tests, all GREEN.

**If coverage is insufficient** (key behaviors have no tests):
1. Write characterization tests capturing current behavior — not desired behavior
2. These document what the code does today, even if imperfect
3. Commit: `test(refactor): add characterization tests for <area>`
4. Run again — all GREEN

**Baseline established.** From here, tests must stay GREEN at every step.

---

### Past Learnings Check

If claude-mem is available, recall prior refactoring outcomes:
1. Call `mcp__plugin_claude-mem_mcp-search__smart_search` with the target module/pattern name, limit=5
2. Filter for: refactor, extract, simplify, "blast radius", coupling, migration
3. If relevant: "**Prior refactoring context:** - {summary}" — max 3 items
4. Skip silently if unavailable

---

## Step 3: Plan Atomic Steps

Break refactoring into the smallest atomic steps where each:
- Makes exactly one structural change
- Preserves all behavior (tests stay GREEN)
- Can be committed independently

Order: safest and most independent changes first, riskiest last.

Present the step sequence to the user. Wait for approval.

---

## Step 4: Execute

For each step:
1. Make the structural change. Use LSP `findReferences` before each modification to verify you've found all usage sites. For symbol renames, prefer LSP `rename` over manual find-and-replace.
2. Run the full test suite
3. **GREEN** → commit: `refactor(scope): <what changed and why>`
4. **RED** → REVERT immediately (`git checkout -- .`), analyze why, try differently

Do NOT fix the test or hack around it. The iron law is absolute.

Report progress after each commit.

---

## Step 5: Simplify

After execution, read `skills/simplify/PROMPT.md` and follow it on the refactoring diff. Refactoring often introduces new abstractions or moves code around — simplify catches:

- Extracted utilities that duplicate existing ones elsewhere in the codebase
- Restructured code with missed efficiency opportunities (sequential → parallel, redundant reads)
- Copy-paste remnants from the restructuring

Fix issues. Tests must remain GREEN (iron law still applies). Commit: `refactor(scope): simplify pass`

---

## Step 6: Completion

After simplify pass, suggest `/fh:review` for comprehensive analysis (code quality + architecture + behavior preservation evidence). The user decides when to run it.

Generate SUMMARY.md with refactoring steps, commit hashes, before/after metrics, test evidence.
Update STATE.md: note refactoring completed, structural changes made.

Report: what was restructured, why it's better, test evidence confirming behavior preserved.

---

### Persist Findings

After refactoring is complete, output key patterns discovered for future sessions:
1. If ctx_search is available, query for coupling patterns and extraction outcomes from this session
2. Only persist structural insights — skip mechanical rename/move details
3. Output each finding as:
   **[refactor-learning]** {module/area}: {pattern discovered} → {approach that worked}
4. Max 3 findings per refactoring session
5. Skip silently if refactoring was purely mechanical
