# Wave Execution Details

## Smart Context Loading

Use smart_search to find relevant patterns before reading files. Use smart_outline to understand file structure before editing. Don't read full files to find one function — use smart_outline then smart_unfold, then Read only when you need to Edit.

Specifically before wave execution:
1. `smart_search({query: "patterns in <primary module>"})` to find existing conventions
2. `smart_outline({path: "<plan target files>"})` to understand structure without full reads
3. `smart_search({query: "locked decisions for <phase>"})` to retrieve phase context compactly

## Reference Warm-Up (once per build)

Shared references (`testing-guide.md`, `claude-mem-rules.md`) are static between plugin updates. Extract task-relevant sections once here and inject into all subagent prompts — eliminates N redundant full-file reads per build.

1. `smart_outline({path: ".claude/skills/shared/testing-guide.md"})` — get heading structure
2. For each task type, `smart_unfold` the relevant section:
   - Tasks with `tdd="true"`: `smart_unfold({path: "...", symbol: "Part B"})` + `smart_unfold({..., symbol: "Part C"})`
   - Tasks with E2E/Playwright scope: `smart_unfold({..., symbol: "Part D"})` + `smart_unfold({..., symbol: "Part C"})`
   - All other tasks: `smart_unfold({..., symbol: "Part A"})` + `smart_unfold({..., symbol: "Part C"})`
3. For tasks involving tests (tdd="true", test tasks, or E2E tasks): also read `.planning/codebase/TESTING.md` if it exists — inject project-specific test patterns (runner, mocking approach, fixture conventions) alongside testing-guide.md sections for full TDD discipline.
4. Store extracted sections as `SHARED_REFERENCES_CACHE`

**Project-specific testing context:**
For test runner commands, mocking patterns, fixture locations, and coverage targets: inject from `.planning/codebase/TESTING.md` (project-specific).
For TDD discipline and philosophy: inject from `testing-guide.md` (universal).
Use `smart_search({query: "test patterns for {task type}"})` to find the right source.
Never read both full docs when only one is needed.

**If smart tools return no relevant results**: Read `testing-guide.md` once via the Read tool. Store full content as `SHARED_REFERENCES_CACHE`.

**If all lookups fail**: Leave `SHARED_REFERENCES_CACHE` empty — subagents will read files directly.

Inject `SHARED_REFERENCES_CACHE` into each subagent prompt via the `{SHARED_REFERENCES}` placeholder in the implementer-prompt.

## Subagent Prompt Placeholders

Use the structured template at `references/implementer-prompt.md`. Fill its placeholders:

- `{TASK_TEXT}` — Full task content (files, action, verify, done). Copy the text, don't reference the plan file.
- `{CLAUDE_MD_SECTIONS}` — Relevant sections from CLAUDE.md for this task type, plus task-type-routed codebase mapping files from `.planning/codebase/`:
  - UI tasks (`.tsx`, `.css`, `.scss`) → inject CONVENTIONS.md + STRUCTURE.md
  - API tasks (routes, handlers, endpoints) → inject ARCHITECTURE.md + CONVENTIONS.md
  - DB tasks (migrations, models, schemas) → inject ARCHITECTURE.md + STACK.md
  - Test tasks → inject TESTING.md + CONVENTIONS.md
  - Infrastructure/config tasks → inject STACK.md + INTEGRATIONS.md
  - General tasks → inject STRUCTURE.md + CONVENTIONS.md

  Use smart_search for task-relevant conventions instead of reading full files.
- `{DESIGN_DECISIONS}` — If `.planning/phases/{phase}/{phase}-CONTEXT.md` exists, include the "Decisions", "Discretion Areas", and "Deferred Ideas" sections.
- `{PHASE_DIR}` — Path to `.planning/phases/{phase}/` for deferred items logging.
- `{PHASE_NAME}` — Phase directory name for smart_search queries (e.g. "13-pending-payments-invoicing").
- `{FILE_TYPES}` — Comma-separated file type descriptions for convention queries (e.g. "tsx components", "test files").
- `{TASK_NAME}` — Task identifier for deferred items format.
- `{PROJECT_CONSTRAINTS}` — See population rule below.
- `{SHARED_REFERENCES}` — Pre-loaded testing/TDD rules from `SHARED_REFERENCES_CACHE` (populated in Reference Warm-Up). Task-filtered: TDD tasks get Part B, E2E tasks get Part D, all get Part A + C. If empty, subagent reads files directly.

**{PROJECT_CONSTRAINTS} population:**
Read the `## Gotchas` section from `./CLAUDE.md`. Extract each gotcha as an imperative constraint:
- Convert "X renamed Y to Z" → "Use Z, not Y"
- Convert "X are async" → "Always await X"
- Convert "X uses TEXT IDs" → "All FKs to X tables must be TEXT, never UUID"
Inject as `{PROJECT_CONSTRAINTS}`. Max 15 lines.
If no Gotchas section exists, leave {PROJECT_CONSTRAINTS} empty (do not error).

## claude-mem Context Acceleration

Before reading CONTEXT.md and DECISIONS.md files directly:
- Use `smart_search({query: "locked decisions for phase {phase}"})` and `smart_search({query: "decisions affecting {files}"})` to find relevant entries.
- Use `smart_outline` to understand file structure before editing. Don't read full files to find one function — use `smart_outline` → `smart_unfold`, then Read only when you need to Edit.

The template tells subagents to self-discover relevant skill context (Playwright, Next.js, frontend design) by reading skill files when their task involves those domains. No orchestrator pre-processing needed.

## Token Efficiency Notes

When executing tasks, be aware of tool call efficiency:
- **Default to Smart Explore** (smart_search/smart_outline/smart_unfold) for targeted lookups; escalate to Explore Agent only for open-ended synthesis
- **Avoid re-reading** files already in context from earlier steps (freshness check, plan read, CONTEXT.md injection)
- **Fallow output is authoritative** — do not re-derive dead code, complexity, or duplication findings that Fallow already provided
- **Note tool call patterns:** If you find yourself reading the same file multiple times across tasks, flag it as a context optimization opportunity in the SUMMARY.md

## Post-Wave Triage

claude-mem's PostToolUse hook automatically observes all file reads and edits from each wave's agents. Subsequent waves can query these observations via `search` or `timeline` — no explicit re-indexing needed.

Triage subagent outcomes:

**BLOCKED:** Surface immediately:
```
⚠ Task "{task}" is BLOCKED: {blocker}
Options:
  A) Fix the blocker and retry
  B) Skip and defer
  C) Adjust the plan
```
Do not proceed to the next wave until resolved or skipped.

**Interrupted/stuck:** Re-dispatch with revised prompt or clarify with user.

**Silent failure (no files changed):** Treat as BLOCKED.

**`classifyHandoffIfNeeded` false failure:** If a subagent reports "failed" with error containing `classifyHandoffIfNeeded is not defined`, this is a Claude Code runtime bug — not a task failure. Spot-check instead: verify key files exist on disk and no `## Self-Check: FAILED` marker is present. If spot-checks pass, treat as successful.

Once all tasks are accounted for:
1. **Spot-check:** verify key files from subagent reports exist on disk (`[ -f path ]`). Also check for `## Self-Check: FAILED` marker in any subagent report.
2. **Done criteria check:** compare each task's `done` criteria against subagent output — flag mismatches
3. **Report** results to user

## Pre-Wave Dependency Check (wave 2+ only)

Before dispatching each wave after wave 1, verify that artifacts from prior waves are actually present:

```bash
# For each plan in the upcoming wave, check key-links from prior waves:
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" verify key-links {phase_dir}/{plan}-PLAN.md 2>/dev/null
```

If any key-link from a prior wave's artifact fails verification:

```
## Cross-Plan Wiring Gap

| Plan | Link | From | Expected Pattern | Status |
|------|------|------|-----------------|--------|
| {plan} | {via} | {from} | {pattern} | NOT FOUND |

Wave N artifacts may not be properly wired. Options:
1. Investigate and fix before continuing
2. Continue (may cause cascading failures in next wave)
```

Key-links referencing files in the upcoming wave itself are skipped. If `gsd-tools verify key-links` is unavailable, skip silently.
