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
> - **If NO → stop.** Tell the user: "No project found. Run `/fh:new-project` first to set up project tracking." Do not proceed.

---

## Step -1: Initialize Task Tracking

Before beginning any planning work, create native tasks for all planning steps so progress is visible throughout the session.

**Try creating tasks. If TaskCreate fails or is unavailable, set TASKS_AVAILABLE=false, log "Task tracking unavailable, continuing with GSD tracking", and proceed normally. All subsequent TaskUpdate calls should be skipped when TASKS_AVAILABLE=false.**

If TaskCreate succeeds, create the following tasks in order and capture their IDs:

1. **"Phase matching"** (activeForm: "Matching to phase")
2. **"Complexity assessment"** (activeForm: "Assessing complexity")
3. **"Research"** (activeForm: "Researching")
4. **"Brainstorm design"** (activeForm: "Brainstorming")
5. **"Discuss implementation"** (activeForm: "Discussing gray areas")
6. **"Derive must_haves"** (activeForm: "Deriving must_haves")
7. **"Create plan"** (activeForm: "Writing plan")
8. **"Plan-check"** (activeForm: "Validating plan")

Set up sequential dependencies: each task `addBlockedBy` the previous task's ID (task 2 blocked by task 1, task 3 blocked by task 2, etc.).

---

## Step -0.5: Phase Context Bootstrap

If `ctx_batch_execute` is available (test by checking tool list), index stable planning docs that don't change during a phase. These persist in the shared context-mode DB across plan-work → plan-review → build → review steps.

```
ctx_batch_execute([
  { label: "PROJECT", cmd: "cat .planning/PROJECT.md" },
  { label: "ROADMAP", cmd: "cat .planning/ROADMAP.md" },
  { label: "REQUIREMENTS", cmd: "cat .planning/REQUIREMENTS.md" },
  { label: "DESIGN", cmd: "cat .planning/DESIGN.md" },
  { label: "ARCHITECTURE", cmd: "cat .planning/codebase/ARCHITECTURE.md" },
  { label: "STRUCTURE", cmd: "cat .planning/codebase/STRUCTURE.md" },
  { label: "CONVENTIONS", cmd: "cat .planning/codebase/CONVENTIONS.md" },
  { label: "TESTING", cmd: "cat .planning/codebase/TESTING.md" },
  { label: "STACK", cmd: "cat .planning/codebase/STACK.md" },
], queries: [
  "project vision and scope",
  "architecture patterns and boundaries",
  "code conventions and style",
  "test patterns and setup",
  "file structure conventions"
])
```

Also index research files if they exist:
- `.planning/research/*.md` (project-level research from /fh:new-project)
- `.planning/phases/{phase}/{phase}-RESEARCH.md` (phase-level research)
- `.planning/research/v2/*.md` (milestone-level research)
- `.planning/startup/*.md` and `.planning/startup/**/*.md` (startup validation artifacts from /fh:startup-design — market data, competitors, positioning inform planning decisions)

If `ctx_batch_execute` is not available, skip silently. The rest of plan-work reads these files directly as fallback.

This is a one-time cost (~2 seconds) that saves repeated reads across all 4 phase steps.

---

## Step 0: Phase Matching

> **Task tracking:** `TaskUpdate(phaseMatchingId, status="in_progress")` — skip if TASKS_AVAILABLE=false.

Compare the user's `$ARGUMENTS` against existing phases in ROADMAP.md:

| Match | Action |
|-------|--------|
| **Matches current phase** | "This falls under Phase X: {name}. Planning as plan NN in that phase." Proceed. |
| **Matches a future phase** | "This looks like Phase Y: {name}. Plan ahead for that phase, or add to current phase?" Wait for user choice. |
| **No match** | "This doesn't match any existing phase. Add as a new phase to the roadmap, or fold into the current phase?" If new phase: use `gsd-tools.cjs` or manually add phase to ROADMAP.md, create phase directory, then proceed. |

Once the target phase is determined, hold it — it determines the output path for PLAN.md in Step 3.

> **Task tracking:** `TaskUpdate(phaseMatchingId, status="completed")` — skip if TASKS_AVAILABLE=false.

---

## Step 0.5: Complexity Assessment

> **Task tracking:** `TaskUpdate(complexityAssessmentId, status="in_progress")` — skip if TASKS_AVAILABLE=false.

Before diving in, evaluate the task to suggest appropriate depth for research, discussion, and review.

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

**Present the assessment to the user:** "This looks [simple/medium/complex] — I suggest [depth]. Want to proceed with that depth, or adjust?"

Wait for user confirmation before proceeding. The user can override the suggested depth.

> **Task tracking:** `TaskUpdate(complexityAssessmentId, status="completed")` — skip if TASKS_AVAILABLE=false.

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

> **Task tracking:** `TaskUpdate(researchId, status="in_progress")` — skip if TASKS_AVAILABLE=false.

Check whether the user's request involves unfamiliar APIs, external services, library selection, or technical feasibility questions. If so, research before designing — it prevents brainstorming in a vacuum.

### Past Learnings Check

Before researching, check claude-mem for relevant past learnings:
1. If claude-mem is available, call `mcp__plugin_claude-mem_mcp-search__smart_search` with 2-3 keywords from the user's task description, limit=5
2. Filter results for observations containing: mistake, pitfall, learning, retro, "should have", "next time", warning, regression
3. If relevant results found, present as:

   **Past learnings relevant to this work:**
   - {observation summary} (from {date})

   Max 3 items, <2% context budget.
4. Feed these into the brainstorm/design context so past mistakes inform decisions
5. Skip silently if claude-mem not installed or no relevant results

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

### Context-Mode Acceleration

If the Phase Context Bootstrap ran in Step -0.5, these docs are already indexed — use ctx_search instead of Read for broad queries.

When scouting the codebase for reusable assets, existing patterns, or prior decisions:
- If ctx_search is available: search the indexed codebase mapping for architecture patterns, conventions, and existing abstractions before grepping the actual codebase. Also search for prior decisions related to the current gray areas.
- If not available: use the existing Grep/Glob/Read pattern.

ctx_search is faster for broad "what exists?" queries. Use Grep/Glob for precise "where exactly?" lookups.

### Skip research (simple tasks)

**If the feature uses well-known patterns**, skip this step and say so. When skipping: `TaskUpdate(researchId, status="completed", metadata={skipped: true, reason: "Well-known patterns, no research needed"})` — skip if TASKS_AVAILABLE=false.

If the user mentions wanting an isolated branch or worktree, set up a git worktree before continuing.

> **Task tracking:** On completion: `TaskUpdate(researchId, status="completed")` — skip if TASKS_AVAILABLE=false.

---

## Step 2: Brainstorm

> **Task tracking:** `TaskUpdate(brainstormId, status="in_progress")` — skip if TASKS_AVAILABLE=false.

**Skip if complexity is Simple.** Jump to Step 3 (Discuss Implementation) with abbreviated scope: identify 1-2 gray areas, lock decisions, proceed to plan creation. When skipping: `TaskUpdate(brainstormId, status="completed", metadata={skipped: true, reason: "Simple complexity — brainstorm skipped"})` — skip if TASKS_AVAILABLE=false.

**Skip if:** A phase-specific CONTEXT.md already exists AND a design doc for this topic already exists in `.planning/designs/`. The design was already approved — proceed to Step 3. When skipping: `TaskUpdate(brainstormId, status="completed", metadata={skipped: true, reason: "Design already exists"})` — skip if TASKS_AVAILABLE=false.

Read `skills/brainstorming/PROMPT.md` and follow it completely — it handles exploration, questions, design sections, and user approval.

If research was done in Step 1, feed the findings into the brainstorming context.

If this involves frontend/UI work, read `.planning/DESIGN.md` and incorporate the project's Design Context.

Save approved design to `.planning/designs/YYYY-MM-DD-<topic>.md`.

**Wait for user approval before continuing.**

> **Task tracking:** `TaskUpdate(brainstormId, status="completed")` — skip if TASKS_AVAILABLE=false.

---

## Step 3: Discuss Implementation

> **Task tracking:** `TaskUpdate(discussId, status="in_progress")` — skip if TASKS_AVAILABLE=false.

**Skip if:** A CONTEXT.md already exists for this phase (decisions already locked from a previous planning session). When skipping: `TaskUpdate(discussId, status="completed", metadata={skipped: true, reason: "CONTEXT.md already locked"})` — skip if TASKS_AVAILABLE=false.

### AUTO_MODE branch

Check auto-mode:
```bash
AUTO_MODE=$(node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs config-get workflow.auto_advance 2>/dev/null || echo "false")
```

If `AUTO_MODE` is `"true"`, skip interactive gray area discussion. Instead:

**Crash reconciliation:** Before scouting, search `.planning/DECISIONS.md` for entries where Phase matches the current phase directory name AND Step starts with 'plan-work'. If such entries exist BUT the corresponding CONTEXT.md does not exist or is incomplete (missing one of the three canonical sections: Decisions, Discretion Areas, Deferred Ideas), this indicates a prior crash. Warn: 'Prior plan-work decisions found for this phase but CONTEXT.md is incomplete — resuming from existing decisions.' Reuse the existing decisions to populate CONTEXT.md rather than re-deciding. Only auto-decide gray areas not covered by existing entries.

a) **Scout and identify** the same 3-4 gray areas by scanning the codebase (existing components, utilities, patterns, data flows) — same scouting as the normal path below.
b) **Auto-decide** each gray area using best judgment, following the heuristics in `.claude/skills/build/references/decisions-template.md` (match existing patterns > reversible > simpler > well-documented libs > fewer deps > keep doors open).
c) **Log each decision** to `.planning/DECISIONS.md` using the decision entry format from the template. Create the file first if it doesn't exist, or recover if corrupt — see the template's "Subagent Instructions: Creating DECISIONS.md" section. Use `step='plan-work Step 3'` in each entry.
d) **Still produce** the mandatory ASCII diagram and lightweight Error/Rescue Map for the gray areas (same tables as the normal path).
e) **Write** the same locked/discretion/deferred categories to CONTEXT.md as the normal path (Step 3 item 6 below).

Then continue to Step 4.

---

### Normal (interactive) mode

Resolve implementation gray areas before planning:

### Context-Mode Acceleration

If the Phase Context Bootstrap ran in Step -0.5, these docs are already indexed — use ctx_search instead of Read for broad queries.

When scouting the codebase for reusable assets, existing patterns, or prior decisions:
- If ctx_search is available: search the indexed codebase mapping for architecture patterns, conventions, and existing abstractions before grepping the actual codebase. Also search for prior decisions related to the current gray areas.
- If not available: use the existing Grep/Glob/Read pattern.

ctx_search is faster for broad "what exists?" queries. Use Grep/Glob for precise "where exactly?" lookups.

1. **Scout codebase** for reusable assets — existing components, utilities, patterns that could be leveraged. Use LSP `workspaceSymbol` to find relevant abstractions by name, and `findReferences` to see how existing patterns are used. Also check for `playwright.config.*` in the project root. If present, note it — frontend interactive features should consider E2E test tasks during planning.
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

> **Task tracking:** `TaskUpdate(discussId, status="completed")` — skip if TASKS_AVAILABLE=false.

---

## Step 4: Derive must_haves

> **Task tracking:** `TaskUpdate(deriveMustHavesId, status="in_progress")` — skip if TASKS_AVAILABLE=false.

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

> **Task tracking:** `TaskUpdate(deriveMustHavesId, status="completed")` — skip if TASKS_AVAILABLE=false.

---

## Step 5: Create Plan

> **Task tracking:** `TaskUpdate(createPlanId, status="in_progress")` — skip if TASKS_AVAILABLE=false.

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
- Mark tasks `tdd="true"` when they involve logic, state, or behavior — the executor will follow `skills/test-driven-development/PROMPT.md` for these
- Set `wave` numbers for parallelization (independent tasks = same wave)
- Test tasks can be marked `wave: same` as their implementation task when they test independent interfaces (the test doesn't need the implementation output to run).
- If frontend: add `type="checkpoint:human-verify"` for key visual moments
- Reference only the specific source files each task needs (not the whole codebase)

### Context optimization

- In `<context>` blocks, reference only files the executor actually needs
- Pick 1-2 relevant codebase docs per task (CONVENTIONS.md for style, STRUCTURE.md for file placement)
- If GSD and CONTEXT.md exists: honor locked decisions, exclude deferred ideas

> **Task tracking:** `TaskUpdate(createPlanId, status="completed")` — skip if TASKS_AVAILABLE=false.

---

## Step 6: Plan-check (inline verification loop)

> **Task tracking:** `TaskUpdate(planCheckId, status="in_progress")` — skip if TASKS_AVAILABLE=false.

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
7. **TDD coverage WARN**: For each task in the plan that creates or modifies `.ts`, `.js`, `.tsx`, `.jsx` files (excluding config, types-only, constants-only files): if the task involves business logic, state management, or data transformation and does NOT have `tdd="true"`, emit a WARN: 'Task N ({name}) modifies business logic but lacks tdd=true. Confirm this is intentional or add tdd=true.' Present the list of flagged tasks and ask the user to confirm or fix. This is advisory — do not block plan creation.
8. **Playwright E2E WARN** (frontend only): If any task creates interactive UI (forms, auth flows, navigation, CRUD operations) and the project has `playwright.config.*`: check whether any task in the plan includes E2E test files (`e2e/*.spec.*` or `*.spec.*`). If no E2E test task exists, emit a WARN: 'Frontend interactive features planned but no E2E test task found. Add a Playwright test task, or confirm E2E coverage is not needed.' If the user wants a test task, create one referencing `.claude/skills/playwright-testing/PROMPT.md`. This is advisory — do not block plan creation.

If a check fails, state which check failed, revise the plan, and recheck. After 3 failed iterations, present what you have and ask the user to resolve the issue.

**Present the plan to the user. Wait for approval.**

> **Task tracking:** `TaskUpdate(planCheckId, status="completed")` — skip if TASKS_AVAILABLE=false.

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
