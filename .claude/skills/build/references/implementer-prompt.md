# Task Subagent Prompt Template

> **This template is now inlined in SKILL.md Step 3a** to ensure the orchestrator always uses it.
> This file is kept as a reference for other skills that may need to understand the subagent contract.

The canonical template lives in `SKILL.md` under the heading "SUBAGENT PROMPT TEMPLATE". It includes:

- **Tool Decision Tree** — ast-grep for structural transforms, Edit for targeted changes
- **Code Navigation** — claude-mem smart tools (smart_outline, smart_unfold, smart_search)
- **Project Context** — conventions, decisions, architecture, constraints (filled by orchestrator)
- **Testing** — shared references cache, TDD rules, Playwright patterns
- **Deviation Rules** — when to fix vs. stop and report
- **Stub Check** — catch placeholder code before reporting
- **Self-Check** — verify claims with filesystem checks
- **Report Format** — structured output for orchestrator triage

## Code Discovery

Use smart tools for efficient code navigation:
- `smart_outline({path: "file"})` — see file structure without reading the whole file
- `smart_unfold({path: "file", symbol: "name"})` — read a specific function/class
- `smart_search({query: "pattern"})` — find patterns across the codebase

Only Read full files when you need to Edit them.

## Why Inlined?

The template was previously in this file and referenced via `@references/implementer-prompt.md`.
In practice, the orchestrator skipped loading this file and wrote ad-hoc prompts instead — losing
the Tool Decision Tree, Code Navigation, Deviation Rules, and Stub Check sections entirely.

Inlining the template directly in SKILL.md eliminates the indirection and ensures every subagent
receives the full contract.

## Placeholder Reference

These placeholders are filled by the orchestrator from Steps 1-2:

| Placeholder | Source |
|---|---|
| `{TASK_TEXT}` | Full task content from PLAN.md |
| `{FILE_OUTLINES}` | smart_outline results for each file listed in the task (Step 3a) |
| `{IMPACT_CONTEXT}` | Files that import/depend on task files — blast radius (Step 3a) |
| `{CLAUDE_MD_SECTIONS}` | Conventions from codebase mapping (Step 2e) |
| `{DESIGN_DECISIONS}` | CONTEXT.md decisions (Step 1c) |
| `{SPEC_ARCHITECTURE}` | SPEC.md Architecture section (Step 1b) |
| `{SPEC_DATA_FLOW}` | SPEC.md Data Flow section (Step 1b) |
| `{SPEC_QUALITY_RUBRICS}` | SPEC.md Quality Rubrics section (Step 1b) |
| `{SPEC_FAILURE_MODES}` | SPEC.md Failure Modes section (Step 1b) |
| `{PROJECT_CONSTRAINTS}` | CLAUDE.md Gotchas section (Step 2d) |
| `{SHARED_REFERENCES}` | Testing guide sections from Reference Warm-Up (Step 2b) |
| `{PAST_LEARNINGS}` | claude-mem past mistakes (Step 2c) |
| `{DECISION_RATIONALE}` | DECISIONS.md entries affecting task files (Step 3a) |
| `{PHASE_DIR}` | Path to `.planning/phases/{phase}/` |
| `{PHASE_NAME}` | Phase directory name |
| `{FILE_TYPES}` | Comma-separated file type descriptions |
| `{TASK_NAME}` | Task identifier for deferred items |
