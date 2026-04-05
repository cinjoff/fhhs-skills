# PLAN.md Format and Planning Rules

## PLAN.md Format

Write plans to `.planning/phases/XX-name/XX-NN-PLAN.md`.
- Include full frontmatter (`phase`, `plan`, `requirements`)
- `requirements` must reference IDs from ROADMAP.md
- Next plan number = highest existing NN in the phase directory + 1

**YAML frontmatter:**

```yaml
---
phase: XX-name          # GSD only — omit when not in GSD
plan: NN                # GSD only — omit when not in GSD
type: execute           # execute | checkpoint:human-verify | checkpoint:decision | tdd
wave: N                 # parallelization group (1 = no deps)
depends_on: []          # plan IDs this depends on
files_modified: []      # all files created/modified
autonomous: true        # can run without human gates

must_haves:
  truths:
    - "Observable user-facing truth from Step 2.5"
  artifacts:
    - path: "path/to/file"
      provides: "what it delivers"
      contains: "content marker to verify"
  key_links:
    - from: "path/a"
      to: "path/b"
      via: "how they connect"

spec: XX-NN-SPEC.md     # optional — add if SPEC.md created in Step 4.5
requirements: []        # GSD only — requirement IDs from ROADMAP
---
```

**XML body:**

```xml
<objective>What this plan accomplishes and why.</objective>
<context>@file references for executor context</context>
<tasks>
<task type="auto|tdd|checkpoint:human-verify|checkpoint:decision">
  <name>Task N: descriptive name</name>
  <files>paths to create/modify</files>
  <read_first>Files the executor MUST read before touching anything. Always include the file being modified plus any source-of-truth references (schemas, existing patterns, config files).</read_first>
  <action>Step-by-step instructions with CONCRETE values — exact config keys, function signatures, SQL, class names, import paths, env vars. Never say "align X with Y" without specifying the exact target state. Executor must be able to complete the task from this text alone.</action>
  <verify>Testable checkpoints</verify>
  <done>Acceptance criteria — grep-verifiable conditions that prove the task was done correctly. Must trace back to a must_haves truth. NEVER use subjective language ("looks correct"). ALWAYS use exact strings, patterns, values, or command outputs.</done>
</task>
</tasks>
<verification>Commands that prove success</verification>
<success_criteria>Observable truths (echo must_haves.truths)</success_criteria>
<output>Path to SUMMARY.md</output>
```

> **Anti-shallow execution (mandatory):** Every task MUST have `<read_first>` and `<done>` (grep-verifiable, not subjective). The `<action>` must contain concrete values — not "align X with Y" without specifying the exact target. Vague instructions produce shallow one-line changes; concrete instructions produce complete work.

## Planning Rules

Read plan limits from `.planning/config.json` (fall back to defaults if not set):
- `plan_limits.tasks_per_plan`: min-max range (default: [4, 6])
- `plan_limits.files_per_plan`: min-max range (default: [8, 15])
- `plan_limits.words_per_plan`: max words (default: 2500)
- `plan_limits.context_target`: percentage (default: 60)

Scope each plan to **{tasks_per_plan} tasks** (keeps execution context under {context_target}%).
Target **{files_per_plan} files** total across tasks.
Keep plan total under **{words_per_plan} words**.

- Each task has: files, action, verify, done
- Mark tasks `tdd="true"` when they involve logic, state, or behavior — the executor will follow `.claude/skills/shared/testing-guide.md` for these
- Set `wave` numbers for parallelization (independent tasks = same wave)
- Test tasks can be marked `wave: same` as their implementation task when they test independent interfaces
- If frontend: add `type="checkpoint:human-verify"` for key visual moments
- Reference only the specific source files each task needs (not the whole codebase)

## Context Optimization

- In `<context>` blocks, reference only files the executor actually needs
- Reference the specific granular codebase file each task needs:
  - Style/patterns → `.planning/codebase/CONVENTIONS.md`
  - File placement → `.planning/codebase/STRUCTURE.md`
  - Layer boundaries → `.planning/codebase/ARCHITECTURE.md`
  - External services → `.planning/codebase/INTEGRATIONS.md`
  - Test approach → `.planning/codebase/TESTING.md`
  - Tech stack → `.planning/codebase/STACK.md`
  - Tech debt → `.planning/codebase/CONCERNS.md`
- For codebase questions: if claude-mem is available, use `smart_search`; otherwise Read the specific file directly
- If GSD and CONTEXT.md exists: honor locked decisions, exclude deferred ideas
