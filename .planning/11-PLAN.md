---
plan: 11
type: execute
wave: 1
depends_on: []
files_modified:
  - .claude/skills/simplify/SKILL.md
  - .claude/skills/build/SKILL.md
  - .claude/skills/build/references/spec-gate-prompt.md
  - .claude/skills/review/SKILL.md
  - .claude/skills/review/references/review-prompt.md
autonomous: true

must_haves:
  truths:
    - "When fallow is installed, simplify agents receive deterministic duplication, dead-code, and complexity data alongside the diff"
    - "When fallow is installed, spec-gate unwired-code check uses fallow output for definitive unused-export detection instead of LLM inference"
    - "When fallow is installed, review agents receive circular dependency, dead code, and complexity metrics as ground truth"
    - "When fallow is NOT installed, all three skills behave identically to their current behavior — no errors, no missing steps, no degraded output"
    - "[review] When a fallow command fails (nonzero exit), the output variable is set to empty string and that analysis is skipped — no garbage injected into agent prompts"
    - "[review] Fallow dupes and health output is post-filtered to files in the diff and capped at 200 lines before injection into agent prompts"
  artifacts:
    - path: ".claude/skills/simplify/SKILL.md"
      provides: "Fallow-enhanced simplify with duplication/dead-code/complexity data for agents"
      contains: "fallow dupes"
    - path: ".claude/skills/build/references/spec-gate-prompt.md"
      provides: "Fallow-enhanced spec gate with deterministic unwired-code detection"
      contains: "fallow check"
    - path: ".claude/skills/review/SKILL.md"
      provides: "Fallow-enhanced review orchestrator with static analysis step"
      contains: "fallow check"
    - path: ".claude/skills/review/references/review-prompt.md"
      provides: "Instructions for review agent to consume Fallow static analysis findings"
      contains: "Static Analysis Findings"
    - path: ".claude/skills/build/SKILL.md"
      provides: "Fallow orchestration in Step 3b for spec-gate data injection"
      contains: "fallow check"
  key_links:
    - from: ".claude/skills/simplify/SKILL.md"
      to: ".claude/skills/build/SKILL.md"
      via: "build Step 8 invokes skills/simplify/"
    - from: ".claude/skills/simplify/SKILL.md"
      to: ".claude/skills/refactor/SKILL.md"
      via: "refactor Step 5 invokes skills/simplify/"
    - from: ".claude/skills/build/references/spec-gate-prompt.md"
      to: ".claude/skills/build/SKILL.md"
      via: "build Step 3b dispatches spec gate agent with this prompt"
    - from: ".claude/skills/review/references/review-prompt.md"
      to: ".claude/skills/review/SKILL.md"
      via: "review Step 2 dispatches Agent 1 with this prompt"
---

<objective>
Integrate Fallow CLI static analysis into the three highest-leverage skills: simplify (cascades to build/refactor/fix), spec-gate (build pipeline checkpoint), and review (main quality gate). Each integration follows the same pattern: detect fallow availability, run relevant commands with JSON output, inject findings into agent prompts as ground truth data. Graceful degradation when fallow is not installed.
</objective>

<context>
@file .claude/skills/simplify/SKILL.md
@file .claude/skills/build/references/spec-gate-prompt.md
@file .claude/skills/review/SKILL.md
@file .claude/skills/review/references/review-prompt.md
@file .planning/research/fallow-tools-research.md
@file .planning/research/fallow-integration-points.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Fallow static analysis to simplify</name>
  <files>.claude/skills/simplify/SKILL.md</files>
  <action>
  Modify `simplify/SKILL.md` to add a Fallow pre-analysis step before the 3 parallel review agents are dispatched.

  **Add after line 20 ("Invoke `skills/simplify/`. It runs 3 parallel review agents..."), before the commit line:**

  Add a new section "## Fallow Static Analysis (if available)" with these instructions:

  1. **Availability check and execution:** Before dispatching the 3 review agents, check if fallow is installed and run analysis. Use the robust base-ref pattern from the review skill:
     ```bash
     if command -v fallow &>/dev/null; then
       BASE=$(git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null || echo "HEAD~10")
       DIFF_FILES=$(git diff --name-only "$BASE"..HEAD)
       FALLOW_CHECK=$(fallow check --changed-since "$BASE" --format json --quiet 2>/dev/null) || FALLOW_CHECK=""
       FALLOW_DUPES=$(fallow dupes --mode semantic --format json --quiet 2>/dev/null) || FALLOW_DUPES=""
       FALLOW_HEALTH=$(fallow health --format json --quiet 2>/dev/null) || FALLOW_HEALTH=""
     fi
     ```

  2. **Post-filter and cap output size:**
     - `FALLOW_CHECK` is already scoped via `--changed-since` — use as-is
     - `FALLOW_DUPES`: filter to entries involving files in `$DIFF_FILES` only
     - `FALLOW_HEALTH`: filter to entries involving files in `$DIFF_FILES`, then take top-10 by complexity score
     - **Hard cap:** If any output exceeds 200 lines after filtering, truncate to top findings by severity. Agent prompts must stay lean.
     - **Skip empty:** Only inject non-empty outputs into agent prompts. If a command failed (empty string), omit that section entirely.

  3. **Inject filtered output into each agent's prompt** under a `## Static Analysis Findings` header:
     - **Code reuse agent** receives: `fallow dupes` output (exact duplicate locations with similarity %) + `fallow check` unused exports (dead code that should be removed, not refactored)
     - **Code quality agent** receives: `fallow health` output (cyclomatic/cognitive complexity per function, maintainability scores) + `fallow check` circular dependency chains
     - **Efficiency agent** receives: `fallow health` output (complexity hotspots to prioritize attention)

  4. **If NOT available:** Skip silently. The 3 agents run with their existing diff-only analysis. No mention of Fallow in output.

  5. **Key instruction to agents:** "Static analysis findings are deterministic ground truth. When Fallow reports a duplicate or unused export, cite the exact file:line from the Fallow output. Do not second-guess Fallow's structural findings — focus your LLM analysis on whether the finding is actionable (e.g., is the unused export intentionally part of a public API?)."

  Keep the existing SKILL.md content intact. The Fallow section is additive.
  </action>
  <verify>
  - Read the modified SKILL.md and confirm it contains `fallow dupes`, `fallow check`, `fallow health` commands
  - Confirm the availability check pattern is present (`command -v fallow`)
  - Confirm graceful degradation instruction ("If NOT available: skip silently")
  - Confirm the three agents each receive appropriate Fallow data
  </verify>
  <done>When fallow is installed, simplify agents receive deterministic duplication, dead-code, and complexity data alongside the diff. When fallow is NOT installed, the skill behaves identically to before.</done>
</task>

<task type="auto">
  <name>Task 2: Add Fallow to spec-gate unwired-code detection</name>
  <files>.claude/skills/build/SKILL.md, .claude/skills/build/references/spec-gate-prompt.md</files>
  <action>
  Modify both files: the orchestrator (`build/SKILL.md`) runs Fallow and injects output; the template (`spec-gate-prompt.md`) consumes it.

  **In `build/SKILL.md` — find Step 3b (spec-gate dispatch) and add Fallow orchestration:**

  Before dispatching the spec-gate agent, add:
  ```bash
  if command -v fallow &>/dev/null; then
    FALLOW_OUTPUT=$(fallow check --changed-since {WAVE_START_SHA} --format json --quiet 2>/dev/null) || FALLOW_OUTPUT=""
  fi
  ```
  When dispatching the spec-gate agent, if `FALLOW_OUTPUT` is non-empty, include it in the agent prompt under a `## Fallow Static Analysis` section. If empty, omit the section entirely.

  **In `spec-gate-prompt.md`:**

  1. **Add before the "What to Check" section** a Fallow data consumption block:
     ```
     ## Fallow Static Analysis (if provided)

     If the orchestrator has included Fallow output below, use it as ground truth for unwired code detection. Fallow has analyzed the full codebase import graph — its findings are definitive, not heuristic.
     ```

  2. **Modify the "Unwired code" subsection** to reference Fallow:
     ```
     **Unwired code:**
     - If Fallow output is provided: cite its unused-exports and unused-files findings for files in this wave's diff. These are definitive — the export/file is not imported anywhere in the codebase.
     - If Fallow output is NOT provided: fall back to manual inspection:
       - Files created but never imported
       - Functions defined but never called
       - State defined but never rendered
       - API routes defined but never fetched from
     - In both cases: check whether "unused" is intentional (public API for future waves) or a genuine bug (unwired code that should be connected).
     ```
  </action>
  <verify>
  - Read build/SKILL.md and confirm Step 3b contains `fallow check --changed-since` with `|| FALLOW_OUTPUT=""` fallback
  - Read spec-gate-prompt.md and confirm the "Fallow Static Analysis (if provided)" consumption section exists
  - Confirm the two-tier unwired-code approach: Fallow when provided, manual fallback when not
  - Confirm the existing manual checks are preserved as fallback
  </verify>
  <done>When fallow is installed, spec-gate unwired-code check uses fallow output for definitive unused-export detection instead of LLM inference. When fallow is NOT provided, the spec gate falls back to its existing manual inspection.</done>
</task>

<task type="auto">
  <name>Task 3: Add Fallow to review pipeline</name>
  <files>.claude/skills/review/SKILL.md, .claude/skills/review/references/review-prompt.md</files>
  <action>
  Modify both files to add Fallow static analysis to the review pipeline.

  **In `review/SKILL.md`:**

  1. Add a new "Step 1.7: Static Analysis (if available)" between Step 1.5 (Runtime Error Check) and Step 2 (Dispatch Analysis):

     ```markdown
     ## Step 1.7: Static Analysis (if available)

     If `fallow` is installed, run static analysis to provide ground truth data for the review agents.

     ```bash
     if command -v fallow &>/dev/null; then
       FALLOW_CHECK=$(fallow check --format json --quiet 2>/dev/null) || FALLOW_CHECK=""
       FALLOW_DUPES=$(fallow dupes --format json --quiet 2>/dev/null) || FALLOW_DUPES=""
       FALLOW_HEALTH=$(fallow health --format json --quiet 2>/dev/null) || FALLOW_HEALTH=""
     fi
     ```

     **Post-filter:** For `FALLOW_DUPES` and `FALLOW_HEALTH`, filter to entries involving files in the diff (from Step 1's file list). Cap each output at 200 lines. Skip injection for any empty outputs.

     If Fallow ran successfully and produced non-empty output, include it in the agent prompts dispatched in Step 2:
     - **Agent 1 (Code Quality + Architecture):** receives all three non-empty outputs — dead code, circular deps, duplication, complexity
     - **Agent 3 (Gap Analysis):** receives `FALLOW_CHECK` — unused exports/files for unwired code detection

     If fallow is NOT installed or all commands fail: skip silently. Do not mention Fallow in the report.

     Budget: less than 1% context. Fallow runs in <1 second.
     ```

  2. In Step 2, modify the Agent 1 and Agent 3 dispatch descriptions to note:
     - Agent 1: "If Fallow data is available from Step 1.7, include it in the agent prompt under '## Static Analysis Findings'"
     - Agent 3: "If Fallow data is available from Step 1.7, include the unused-exports findings in the agent prompt"

  **In `review/references/review-prompt.md`:**

  1. Add a new section before "## Severity Classification" (line 132):

     ```markdown
     ---

     ## Static Analysis Findings (if provided)

     If this section contains Fallow output, treat it as **ground truth** — these findings are deterministic, based on full codebase import graph analysis.

     ### How to use Fallow data in your review:

     **Dead code (unused exports/files):** Flag as Important. Cite the exact export name and file from Fallow output. Note: some unused exports are intentional public API — check if the export is documented or in an `index.ts` barrel file before flagging.

     **Circular dependencies:** Flag as Important or Critical (depending on whether it causes runtime issues). Cite the exact cycle chain from Fallow output. Reference the "Dependency Direction" criteria above.

     **Code duplication:** Flag as Minor or Important (depending on duplication size). Cite exact file:line ranges from Fallow output. Reference the "DRY" criteria above.

     **Complexity hotspots:** Flag functions exceeding cyclomatic complexity 15 or cognitive complexity 20 as Important. Cite the exact metric from Fallow output. Reference the "Complexity" criteria above.

     If no Fallow data is provided, use your existing analysis approach for these areas.
     ```

  2. In the "### Dependency Direction" section (lines 49-52), add after "Are there circular imports?":
     ```
     - If Fallow data is available, circular dependency findings are definitive — cite them directly
     ```

  3. In the "### DRY" section (lines 27-28), add:
     ```
     - If Fallow duplication data is available, cite exact duplicate locations rather than inferring from the diff
     ```
  </action>
  <verify>
  - Read review/SKILL.md and confirm Step 1.7 exists with fallow commands
  - Read review-prompt.md and confirm "Static Analysis Findings" section exists
  - Confirm Agent 1 and Agent 3 dispatch descriptions reference Fallow data
  - Confirm graceful degradation ("skip silently", "If no Fallow data is provided")
  - Confirm review-prompt.md integrates Fallow into DRY and Dependency Direction sections
  </verify>
  <done>When fallow is installed, review agents receive circular dependency, dead code, complexity metrics, and duplication data as ground truth. When fallow is NOT installed, the review behaves identically to before.</done>
</task>

</tasks>

<verification>
1. Read all 5 modified files and confirm Fallow integration is present
2. Grep for "fallow" across all modified files to verify command references
3. Grep for "command -v fallow" to verify availability check pattern in simplify, build, and review
4. Grep for '|| FALLOW_' to verify error fallback pattern in all 3 orchestrators (simplify, build, review)
5. Grep for "200 lines" or equivalent cap instruction in simplify and review
6. Grep for "filter" or "DIFF_FILES" to verify post-filtering instruction for dupes/health in simplify and review
7. Grep for "Static Analysis Findings" in review-prompt.md
8. Verify no existing behavior was removed (all original content preserved, Fallow is additive)
9. Verify base-ref uses fallback pattern (main || master || HEAD~10) in simplify — not hardcoded "main"
</verification>

<success_criteria>
- When fallow is installed, simplify agents receive deterministic duplication, dead-code, and complexity data alongside the diff
- When fallow is installed, spec-gate unwired-code check uses fallow output for definitive unused-export detection instead of LLM inference
- When fallow is installed, review agents receive circular dependency, dead code, and complexity metrics as ground truth
- When fallow is NOT installed, all three skills behave identically to their current behavior — no errors, no missing steps, no degraded output
</success_criteria>

<output>.planning/SUMMARY.md</output>
