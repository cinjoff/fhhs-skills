---
name: fh:plan-work
description: Plan before you build. Researches the problem and produces a step-by-step plan.
user-invocable: true
---

Plan a feature before building it. Brainstorm, research, and produce an execution-ready plan.

The user wants to plan: $ARGUMENTS

You are a **lean orchestrator**. Your job is to coordinate, not to do heavy work yourself. Delegate research and analysis to subagents to keep your context clean.

> **CRITICAL — GSD project required:**
> Check if `.planning/PROJECT.md` exists.
> - **If YES → proceed.** Read STATE.md for current phase/plan. Read ROADMAP.md for phase goals. Read phase-specific CONTEXT.md for locked decisions.
>   - **If ROADMAP.md is missing:** "Project exists but has no roadmap. Run `/fh:new-project` to regenerate, or proceed without phase tracking?" If proceeding without, skip Step 0 and treat as a standalone plan.
> - **If NO → stop.** Tell the user: "No project found.

→ Run /fh:new-project — set up project tracking

This creates the .planning/ directory that all planning and build skills depend on." Do not proceed.

---

## Step -0.5: Past Context Check

If claude-mem is available (check tool list for `mcp__plugin_claude-mem_*`):

1. Derive project name from `.planning/PROJECT.md` name field (fall back to basename of cwd). Use this as the `project` parameter for all claude-mem calls.
2. Call `search` with query=2-3 keywords from the phase/project domain, project=<project-name>, limit=10
3. Scan the returned index for relevant IDs — prioritize types: gotcha, decision, trade-off
4. For the top 2-3 relevant IDs, call `get_observations` to fetch full details
5. Present as: "**From prior sessions:** - {observation}" — max 3 items
6. Feed these into the planning context so past mistakes and decisions inform this session

If claude-mem is not available, skip silently. The rest of plan-work reads planning files directly as fallback.

claude-mem observations from prior steps persist automatically — no explicit pre-indexing needed.

See @.claude/skills/shared/claude-mem-rules.md for canonical patterns.

---

## Step 0: Phase Matching

Compare the user's `$ARGUMENTS` against existing phases in ROADMAP.md:

| Match | Action |
|-------|--------|
| **Matches current phase** | "This falls under Phase X: {name}. Planning as plan NN in that phase." Proceed. |
| **Matches a future phase** | "This looks like Phase Y: {name}. Plan ahead for that phase, or add to current phase?" Wait for user choice. |
| **No match** | "This doesn't match any existing phase. Add as a new phase to the roadmap, or fold into the current phase?" If new phase: use `gsd-tools.cjs` or manually add phase to ROADMAP.md, create phase directory, then proceed. |

Once the target phase is determined, hold it — it determines the output path for PLAN.md in Step 3.

---

## Step 0.5: Complexity & Scope Assessment

Before diving in, evaluate the task to suggest appropriate depth AND determine whether the phase should be split into multiple focused plans.

**Complexity signals to check:**

1. **Task count estimate:** How many files/components will this touch? (quick scan of the codebase area)
2. **Domain familiarity:** Does the codebase already have patterns for this? (check with quick glob/grep for similar code)
3. **Architectural impact:** Does this introduce new dependencies, data flows, or system boundaries?
4. **Multi-session likelihood:** Will this span multiple conversations?

**Depth suggestion matrix:**

| Complexity | Research | Discussion | Review |
|-----------|----------|------------|--------|
| **Simple** (1-3 tasks, familiar patterns, single file area) | Skip | Skip brainstorm (Step 2). Identify 1-2 gray areas only. | Suggest `/fh:plan-review` (can skip for trivial: rename, typo) |
| **Medium** (4-8 tasks, some unfamiliar patterns) | Inline research | Identify gray areas | Strongly suggest `/fh:plan-review` |
| **Complex** (9+ tasks, unfamiliar domain, new architecture, multi-session) | Suggest deep research via phase-researcher agent | Full discussion with decision-locking | Strongly suggest `/fh:plan-review` |

### Scope Decomposition (Medium and Complex only)

For Medium and Complex tasks, assess whether the phase should produce multiple focused plans rather than one large plan:

1. **Count requirements** for this phase from ROADMAP.md
2. **Estimate total files** that will be created/modified (quick codebase scan)
3. **Identify natural splits** — does the work decompose into independent sub-features, vertical slices, or sequential stages?

**Present the decomposition to the user:** "This phase has N requirements touching ~M files. I suggest splitting into K focused plans: (1) [scope], (2) [scope], (3) [scope]. Each stays under 4-6 tasks for peak execution quality."

**Why this matters:** A single 8-task plan consumes 70%+ context, degrading quality in later tasks — leading to review rework. Three 3-task plans each execute at peak quality (under 50% context). The planning overhead is small; the quality gain is large.

Get user approval on the decomposition BEFORE proceeding to research/brainstorm. Plan each sub-scope through the remaining steps, producing one PLAN.md per sub-scope.

**Present the full assessment to the user:** "This looks [simple/medium/complex]. [If Medium+: scope decomposition suggestion]. I suggest [depth]. Want to proceed, or adjust?"

Wait for user confirmation before proceeding. The user can override both depth and decomposition.

---

## Step 0.6: Codebase Freshness Check

If `.planning/codebase/.last-mapped` exists:
```bash
MAPPED_SHA=$(cat .planning/codebase/.last-mapped 2>/dev/null)
if [ -n "$MAPPED_SHA" ]; then
  CHANGED=$(git diff --stat "$MAPPED_SHA" HEAD -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.py' '*.go' '*.rs' 2>/dev/null | tail -1)
  [ -n "$CHANGED" ] && echo "STALE: $CHANGED" || echo "FRESH"
fi
```
If STALE, warn: "Codebase mapping is outdated ($CHANGED). Consider `/fh:map-codebase` for fresh context."
If `.planning/codebase/` doesn't exist, skip silently.
Advisory only — never block.

---

## Step 1: Research (if needed)

Check whether the user's request involves unfamiliar APIs, external services, library selection, or technical feasibility questions. If so, research before designing — it prevents brainstorming in a vacuum.

### Past Learnings Check

Before researching, check claude-mem for relevant past learnings:
1. Derive project name from `.planning/PROJECT.md` name field (fall back to basename of cwd). Use this as the `project` parameter for all claude-mem calls.
2. If claude-mem is available, call `mcp__plugin_claude-mem_mcp-search__search` with query=2-3 keywords from the user's task description, project=<project-name>, limit=10
3. Scan the returned index for relevant observation IDs — prioritize types: gotcha, decision, trade-off. Filter for keywords: mistake, pitfall, learning, retro, "should have", "next time", warning, regression
4. For the top 2-3 relevant IDs, call `mcp__plugin_claude-mem_mcp-search__get_observations` with ids=[ID1, ID2, ID3] to fetch full details
5. If temporal context would help (e.g., understanding what led to a past mistake), call `mcp__plugin_claude-mem_mcp-search__timeline` with query=task/feature keywords, depth_before=3
6. If relevant results found, present as:

   **Past learnings relevant to this work:**
   - {full observation detail} (from {date})

   Max 3 items, <2% context budget.
7. Feed these into the brainstorm/design context so past mistakes inform decisions
8. Skip silently if claude-mem not installed or no relevant results

The complexity assessment from Step 0.5 determines the research path:

### Deep research path (complex tasks)

When the complexity assessment suggests deep research, spawn a `gsd-phase-researcher` subagent:

```
Task(
  prompt="Research Phase [X]: [name]. Goal: [phase goal].
  <files_to_read>
  .planning/phases/XX-name/XX-CONTEXT.md (if exists)
  </files_to_read>
  Phase requirements: [list from ROADMAP.md]
  Write to: .planning/phases/XX-name/XX-RESEARCH.md",
  subagent_type="gsd-phase-researcher",
  description="Phase research"
)
```

The agent produces a structured `.planning/phases/XX-name/XX-RESEARCH.md` containing:
- Stack patterns and architecture approaches
- Pitfalls and known failure modes
- Code examples from authoritative sources
- Prescriptive recommendations

After the agent completes, read the RESEARCH.md and carry its findings into Step 2 (Brainstorm).

**Confidence gate:** After research completes, review the findings for confidence levels. If confidence is LOW on any critical finding (architectural choice, feasibility question, or key dependency), suggest escalating to deeper research (e.g., additional targeted web search, expert consultation) before proceeding to brainstorm.

### Codebase exploration path (unfamiliar codebase)

When working in an unfamiliar codebase, suggest dispatching a `code-explorer` agent before brainstorming to understand existing patterns. The agent scans for:
- Existing abstractions and utilities relevant to the task
- Naming conventions and file organization patterns
- Similar features already implemented that can serve as templates

### Inline research path (medium tasks — default)

Announce "This needs technical research before design — researching first." Delegate to a subagent:

Spawn a Task agent with:
- The specific research questions implied by the user's request
- Instruction to use Firecrawl for web search and Context7 for library documentation
- Instruction to write findings to `.planning/phases/XX-name/XX-RESEARCH.md` with prescriptive recommendations, stack decisions, pitfalls, and code examples

### Tool Selection

See @.claude/skills/plan-work/references/workflow-matrix.md for the full tool selection guide. Default to Smart Explore. Escalate to Explore Agent only when synthesis is needed.

### Skip research (simple tasks)

**If the feature uses well-known patterns**, skip this step and say so.

If the user mentions wanting an isolated branch or worktree, set up a git worktree before continuing.

---

## Step 2: Brainstorm

**Skip if complexity is Simple.** Jump to Step 3 (Discuss Implementation) with abbreviated scope: identify 1-2 gray areas, lock decisions, proceed to plan creation.

**Skip if:** A phase-specific CONTEXT.md already exists AND a design doc for this topic already exists in `.planning/designs/`. The design was already approved — proceed to Step 3.

### Past Decisions Check (before brainstorming)

If claude-mem is available, check for prior decisions and gotchas in this domain before exploring design options:
1. Call `search` with query=2-3 keywords from the phase topic + "architecture decision", project=<project-name>, limit=10
2. For top 2-3 relevant IDs (prioritize types: decision, gotcha, trade-off), fetch full details with `get_observations`
3. Present: "**From prior sessions:** - {observation}" — max 3 items
4. Feed into brainstorm context — avoid re-debating settled questions and surface mistakes that burned time before
5. Skip silently if claude-mem unavailable or no relevant results

Read `references/brainstorming-prompt.md` (co-located in this skill's directory) and follow it completely — it handles exploration, questions, design sections, and user approval.

If research was done in Step 1, feed the findings into the brainstorming context.

If this involves frontend/UI work, read `.planning/DESIGN.md` and incorporate the project's Design Context.

Save approved design to `.planning/designs/YYYY-MM-DD-<topic>.md`.

**Wait for user approval before continuing.**

---

## Step 3: Discuss Implementation

**Skip if:** A CONTEXT.md already exists for this phase (decisions already locked from a previous planning session).

### AUTO_MODE branch

Check auto-mode:
```bash
AUTO_MODE=$(node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs config-get workflow.auto_advance 2>/dev/null || echo "false")
```

If `AUTO_MODE` is `"true"`, skip interactive gray area discussion. Instead:

**Crash reconciliation:** Before scouting, search `.planning/DECISIONS.md` for entries where Phase matches the current phase directory name AND Step starts with 'plan-work'. If such entries exist BUT the corresponding CONTEXT.md does not exist or is incomplete (missing one of the three canonical sections: Decisions, Discretion Areas, Deferred Ideas), this indicates a prior crash. Warn: 'Prior plan-work decisions found for this phase but CONTEXT.md is incomplete — resuming from existing decisions.' Reuse the existing decisions to populate CONTEXT.md rather than re-deciding. Only auto-decide gray areas not covered by existing entries.

a) **Scout and identify** the same 3-4 gray areas by scanning the codebase (existing components, utilities, patterns, data flows) — same scouting as the normal path below.
b) **Classify each gray area** as `product` (user experience, feature scope, what to build), `architecture` (system design, data model, tech choices), or `implementation` (naming, file structure, config). Focus decision-recording effort on product and architecture decisions — these shape the system long-term.
c) **Auto-decide** each gray area using best judgment, following the heuristics in `.claude/skills/build/references/decisions-template.md` (match existing patterns > reversible > simpler > well-documented libs > fewer deps > keep doors open).
d) **Log each decision** to `.planning/DECISIONS.md` using the decision entry format from the template. Create the file first if it doesn't exist, or recover if corrupt — see the template's "Subagent Instructions: Creating DECISIONS.md" section. Use `step='plan-work Step 3'` in each entry.
   - For **product and architecture** decisions: always include `alternatives` — the other options you considered and why you didn't pick them. Also add a one-sentence "expand scope" note: what a more ambitious version of this decision might look like. This preserves strategic context for future sessions even though auto-mode uses HOLD SCOPE.
   - For **implementation** decisions: alternatives are optional. Keep the entry terse.
   - Use the `category` field (`product` | `architecture` | `implementation`) in each entry.
   - Use high-level `affects` descriptions ("auth subsystem", "onboarding flow") not file paths.
e) **Still produce** the mandatory ASCII diagram and lightweight Error/Rescue Map for the gray areas (same tables as the normal path).
f) **Write** the same locked/discretion/deferred categories to CONTEXT.md as the normal path (Step 3 item 6 below). For product/architecture decisions in CONTEXT.md, append `(alternatives: X, Y)` to capture what was considered.

Then continue to Step 4.

---

### Normal (interactive) mode

Resolve implementation gray areas before planning:

### Codebase Scouting Tools

See @.claude/skills/plan-work/references/workflow-matrix.md for tool selection. Additionally:
If claude-mem is available (check tool list for `mcp__plugin_claude-mem_*`):
- Use `smart_outline` on modules in the target area for token-efficient structural views (function signatures, exports) without reading full files
- Use `smart_search` to search for existing patterns related to the gray areas being discussed — surfaces reusable abstractions faster than grep
- Default to Smart Explore. Escalate to Explore Agent only when synthesis is needed.

If claude-mem is not available: fall back to Read/Grep/Glob directly.

1. **Scout codebase** for reusable assets — existing components, utilities, patterns that could be leveraged. Use smart_outline/smart_search (if available), LSP `workspaceSymbol`, or Grep to find relevant abstractions.

   **Testing strategy detection** (do this once during scouting, carry results into the plan):
   - Check for `playwright.config.*` → E2E framework is Playwright
   - Check for `vitest.config.*` or `"vitest"` in package.json → unit runner is Vitest
   - Check for `jest.config.*` or `"jest"` in package.json → unit runner is Jest
   - Check for existing test dirs: `__tests__/`, `tests/`, `e2e/`, `*.test.*`, `*.spec.*`
   - Record findings as `TESTING_STRATEGY`:
     ```
     unit_runner: vitest|jest|none
     e2e_runner: playwright|none
     test_dirs: [paths where tests live]
     run_command: "pnpm test --run" | "CI=true npm test" | etc.
     ```
   Emit this in the plan's `<context>` block so build subagents don't need to re-detect. If Playwright is present, frontend interactive features should include E2E test tasks. See `.claude/skills/shared/testing-guide.md` for testing conventions.
2. **Identify 3-4 gray areas** specific to this phase — layout choices, data flow decisions, error handling approaches, integration patterns
3. **Ask user** which gray areas to discuss (don't discuss all — let user prioritize)
4. **Deep-dive** selected areas — present options with trade-offs, get user decisions
5. **For each gray area discussed, produce:**
   - **Mandatory ASCII diagram** showing the system/data flow for that area
   - **Lightweight Error/Rescue Map** table (3-5 rows for the gray areas discussed):

     | OPERATION | ERROR | NAMED EXCEPTION | RESCUE ACTION | USER SEES |
     |-----------|-------|-----------------|---------------|-----------|

     > This is a lightweight ERM scoped to the discussed gray areas. If the user runs `/fh:plan-review` afterward, it will produce a comprehensive ERM across the entire plan, extending this one, and feed CRITICAL GAPs back into PLAN.md as `[review]` truths.

   - **Failure Modes Registry**:

     | CODEPATH | FAILURE MODE | RESCUED? | TEST? | USER SEES? | LOGGED? |
     |----------|--------------|----------|-------|------------|---------|

     Any row with all N's = **CRITICAL GAP** that must be addressed in the plan.

6. **Categorize and lock decisions** in `.planning/phases/{phase}/{phase}-CONTEXT.md`. After discussing gray areas, explicitly categorize each decision into one of three categories:

   - **Locked** — Claude must follow this in all subsequent sessions. No re-deciding.
   - **Discretion** — Claude decides within stated bounds. Document the bounds.
   - **Deferred** — Tracked for later. Not in scope for this plan.

   Write these to CONTEXT.md using a clear three-section format:

   > **CONTEXT.md Contract** — Canonical sections (source: bin/lib/commands.cjs):
   > - `## Decisions` — all locked choices (consumers: plan-review reads+updates, build injects into subagents)
   > - `## Discretion Areas` — bounds for executor decisions (consumers: build)
   > - `## Deferred Ideas` — out of scope items (consumers: build as scope boundary)
   > plan-review appends to Decisions with `[review]` prefix and to Deferred Ideas.
   > Any rename MUST be mirrored in: plan-review (PRE-REVIEW + Step B),
   > build (SKILL.md lines ~106, ~294), implementer-prompt.md, and bin/lib/commands.cjs.

   ```markdown
   ## Decisions
   - [Decision]: [What was decided and why]

   ## Discretion Areas
   - [Area]: [Bounds within which Claude can decide]

   ## Deferred Ideas
   - [Idea]: [Why deferred, when to revisit]
   ```

   These locked decisions are injected into build subagent prompts via the implementer-prompt template, preventing downstream re-deciding.

**Scope commitment rule:** Once the user selects which gray areas to discuss, commit fully to that selection. Do not lobby for different areas or silently expand scope.

---

## Step 4: Derive must_haves

From the approved design, extract the **must_haves** — these drive the plan and verify it when done.

**Truths (3-5):**
Extract observable, user-facing statements of what must be true when the work is complete. These are NOT implementation details. They describe user-visible states, outcomes, or behaviors.

Include failure modes from the Failure Modes Registry (Step 3) as must_haves.truths — each rescued failure mode should have a corresponding truth.

Good: "A user visiting /settings sees their current plan and can upgrade."
Bad: "The SettingsModule imports BillingService."

Each truth must map to at least one task's `done` criteria in the final plan.

**Artifacts:**
List every file that will be created or meaningfully modified. For each, note:
- `path`: where it lives
- `provides`: what it delivers to the system
- `contains`: a content marker you can grep for to verify it exists

**Key links:**
Identify how artifacts connect to each other:
- `from`: source artifact path
- `to`: target artifact path
- `via`: the mechanism (import, route registration, config reference, etc.)

Hold these must_haves — they feed directly into the PLAN.md frontmatter and the plan-check in Step 6.

---

## Step 5: Create Plan

Write plans to `.planning/phases/XX-name/XX-NN-PLAN.md` using the target phase from Step 0.
- Include full frontmatter (`phase`, `plan`, `requirements`)
- `requirements` must reference IDs from ROADMAP.md
- Next plan number = highest existing NN in the phase directory + 1

### PLAN.md format

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
  <action>Step-by-step instructions with specific paths</action>
  <verify>Testable checkpoints</verify>
  <done>Acceptance criteria — must trace back to a must_haves truth</done>
</task>
</tasks>
<verification>Commands that prove success</verification>
<success_criteria>Observable truths (echo must_haves.truths)</success_criteria>
<output>Path to SUMMARY.md</output>
```

### Planning rules

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
- Test tasks can be marked `wave: same` as their implementation task when they test independent interfaces (the test doesn't need the implementation output to run).
- If frontend: add `type="checkpoint:human-verify"` for key visual moments
- Reference only the specific source files each task needs (not the whole codebase)

### Context optimization

- In `<context>` blocks, reference only files the executor actually needs
- Reference relevant sections of CODEBASE.md per task (Conventions for style, Structure for file placement, Architecture for layer boundaries)
- If GSD and CONTEXT.md exists: honor locked decisions, exclude deferred ideas

---

## Step 6: Plan-check (inline verification loop)

Before presenting the plan to the user, run this verification checklist. If any check fails, revise and recheck (max 3 iterations, then ask the user for guidance).

**GSD mode — run structural validation first:**

```bash
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs verify plan-structure "${PLAN_PATH}"
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs frontmatter validate "${PLAN_PATH}" --schema plan
```

These catch schema issues (missing frontmatter fields, malformed tasks) automatically. Then run the semantic checks below.

**Checks:**

1. **Requirement coverage** (GSD only): every requirement ID from ROADMAP referenced in `requirements` has at least one task covering it.
2. **Task completeness**: every `<task>` has non-empty `<files>`, `<action>`, `<verify>`, and `<done>`.
3. **Dependency correctness**: no circular dependencies in `depends_on`; wave numbers are consistent (a task cannot depend on a higher or equal wave).
4. **Scope sanity**: task count within `tasks_per_plan` range, file count within `files_per_plan` range in `files_modified`, plan body under `words_per_plan` words (read limits from `.planning/config.json` `plan_limits` section; defaults: 4-6 tasks, 8-15 files, 2500 words, 60% context).
5. **must_haves trace**: every truth in `must_haves.truths` maps to at least one task's `<done>` criteria. Every artifact in `must_haves.artifacts` appears in `files_modified`.
6. **Context compliance** (GSD only): plan does not contradict locked decisions in CONTEXT.md; plan does not include work deferred in CONTEXT.md.
7. **Test coverage REQUIRE**: For each task that creates or modifies `.ts`, `.js`, `.tsx`, `.jsx` files (excluding config-only, types-only, or constants-only files): if the task involves business logic, state management, or data transformation, it MUST either have `tdd="true"` OR the plan must contain a companion test task covering the same files. If neither condition is met, FAIL the check: 'Task N ({name}) modifies business logic without test coverage. Add `tdd="true"` to the task, or add a companion test task in the same wave.' Revise the plan to include test coverage before presenting to the user. This is not advisory — untested business logic is the #1 source of regressions in autonomous builds.
8. **Playwright E2E check** (frontend only): If any task creates interactive UI (forms, auth flows, navigation, CRUD operations) and the project has `playwright.config.*`: check whether any task includes E2E test files (`e2e/*.spec.*` or `*.spec.*`). If none found, emit WARN and auto-suggest a concrete test task:
   - Playwright patterns: `.claude/skills/playwright-testing/PROMPT.md` (and testing-guide.md Part D for quick reference)
   - Suggested task should use: Page Object Model pattern, `getByRole` selectors, critical user journey focus
   - Present: 'No E2E test task found for interactive UI. Suggested test task: [task description]. Add it, or confirm E2E coverage is not needed for this plan.'
   Advisory — user can decline. But the suggestion is concrete and ready to add, not a vague warning.
9. **Test-to-code ratio check**: Count source files in `files_modified` (`.ts`, `.tsx`, `.js`, `.jsx` excluding `*.test.*`, `*.spec.*`, `*.d.ts`) and test files (`*.test.*`, `*.spec.*`). If the ratio of test files to source files is below 0.5 (fewer than 1 test per 2 source files) and the plan modifies business logic, WARN: 'Low test-to-code ratio ({ratio}). The Testing Trophy recommends mostly integration tests — consider adding test tasks.' Advisory only — some plans legitimately have low ratios (config, migrations, docs).

If a check fails, state which check failed, revise the plan, and recheck. After 3 failed iterations, present what you have and ask the user to resolve the issue.

**Present the plan to the user. Wait for approval.**

---

## Step 7: Handoff

After plan approval:

1. **`/fh:plan-review`** (default) — Review before building. Covers business alignment, architecture, code quality, tests, and performance. Three modes: SCOPE EXPANSION (dream big), HOLD SCOPE (maximum rigor), SCOPE REDUCTION (strip to essentials). **Feedback loop:** plan-review feeds findings back into PLAN.md (`must_haves.truths` with `[review]` prefix) and CONTEXT.md (review decisions + deferred scope). After plan-review completes, `/fh:build` automatically picks up the strengthened plan — no manual merging needed.
2. **`/fh:build`** — Skip review — only if this is trivially obvious (single-file rename, typo fix, config-only change with no behavioral impact).
3. **Continue planning** — Plan more phases before building.

**Review is the default for ALL plans.** Only skip review for trivially obvious work where the risk of a missed edge case is near zero. When in doubt, review.

---

## Priority Hierarchy

If context pressure is high: **Step 0** (phase matching) > **Step 3** (diagrams + failure modes) > **Step 5** (plan creation) > **Step 4** (must_haves) > **Step 2** (brainstorm) > **Step 1** (research). Never skip Step 0 or Step 5.

---

_Eng review patterns adapted from gstack plan-eng-review (v0.3.3)_
