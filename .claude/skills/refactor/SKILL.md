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

For static analysis findings (dead code, duplication), run `/fh:review` first — it uses Fallow to inject deterministic ground truth before you begin restructuring.

Report: "This refactoring touches N files across M subsystems. Blast radius: [description]."

If large (10+ files or 3+ subsystems), suggest writing a PLAN.md via `/fh:plan-work` first.

### claude-mem Acceleration

If claude-mem is available (check tool list for mcp__plugin_claude-mem_* tools), use `smart_search` to find relevant patterns for coupling, dependency, and abstraction analysis in the target module. If not available, fall back to Read/Grep/Glob directly.

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
1. Derive project name from `.planning/PROJECT.md` name field (fall back to basename of cwd). Use this as the `project` parameter for all claude-mem calls.
2. Call `mcp__plugin_claude-mem_mcp-search__search` with query=the target module/pattern name, project=<project-name>, limit=10
3. Scan the returned index for relevant observation IDs — prioritize types: gotcha, decision, trade-off. Filter for keywords: refactor, extract, simplify, "blast radius", coupling, migration
4. For the top 2-3 relevant IDs, call `mcp__plugin_claude-mem_mcp-search__get_observations` with ids=[ID1, ID2, ID3] to fetch full details
5. If temporal context would help (e.g., understanding how the module evolved over multiple refactors), call `mcp__plugin_claude-mem_mcp-search__timeline` with query=module/pattern name, depth_before=3
6. Also call `mcp__plugin_claude-mem_mcp-search__smart_search` with query=the target module/function name, limit=3 — provides AST-aware codebase search for structural context on the target module (function signatures, coupling points, call hierarchy)
7. Present: "**Prior refactoring context:** - {full observation detail}" — max 3 items
8. Skip silently if unavailable

---

## Step 3: Plan Atomic Steps

**Structural analysis:** If claude-mem smart_explore tools are available:
- Call `mcp__plugin_claude-mem_mcp-search__smart_outline` on each target module to see all functions/classes/interfaces without reading full files
- Use this structural view to plan extraction boundaries and identify coupling points
- Call `mcp__plugin_claude-mem_mcp-search__smart_unfold` on specific functions to understand implementation details before planning changes
- Fall back to Read/LSP `documentSymbol` if smart_explore is not available

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
1. If claude-mem is available (check tool list for mcp__plugin_claude-mem_*), use smart_search to find relevant patterns from this session
2. Only persist structural insights — skip mechanical rename/move details
3. Output each finding as:
   **[refactor-learning]** {module/area}: {pattern discovered} → {approach that worked}
4. Max 3 findings per refactoring session
5. Skip silently if refactoring was purely mechanical
