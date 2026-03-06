---
description: "Plan a feature before building it. Brainstorm, research, and produce an execution-ready plan."
---

Plan a feature before building it. Brainstorm, research, and produce an execution-ready plan.

The user wants to plan: $ARGUMENTS

You are a **lean orchestrator**. Your job is to coordinate, not to do heavy work yourself. Delegate research and analysis to subagents to keep your context clean.

> **CRITICAL — GSD project required:**
> Check if `.planning/PROJECT.md` exists.
> - **If YES → proceed.** Read STATE.md for current phase/plan. Read ROADMAP.md for phase goals. Read CONTEXT.md for locked decisions.
> - **If NO → stop.** Tell the user: "No project found. Run `/new-project` first to set up project tracking." Do not proceed.

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

## Step 0.5: Workspace Setup (optional)

Ask the user: "Want an isolated branch for this work, or work on the current branch?"

If isolated branch requested, invoke `superpowers:using-git-worktrees`.

---

## Step 1: Brainstorm

Invoke `superpowers:brainstorming`. Follow it completely — it handles exploration, questions, design sections, and user approval.

**Research-first detection:** If the user's request involves unfamiliar APIs, external services, library selection, or technical feasibility questions, run Step 1.5 (Research) FIRST, then return here for brainstorming with research findings in hand. Announce: "This needs technical research before design — researching first."

If the feature uses well-known patterns or the user has already specified the approach, proceed directly to brainstorming.

If this involves frontend/UI work, read `.planning/DESIGN.md` and incorporate the project's Design Context.

Save approved design to `.planning/designs/YYYY-MM-DD-<topic>.md`.

**Wait for user approval before continuing.**

---

## Step 1.5: Research (if needed)

If the feature involves unfamiliar APIs, libraries, patterns, or external services, **delegate research to a subagent**:

Spawn a Task agent with:
- The specific research questions from the brainstorming output
- Instruction to use Firecrawl for web search and Context7 for library documentation
- Instruction to write findings to `.planning/research/` with prescriptive recommendations, stack decisions, pitfalls, and code examples

If the feature uses well-known patterns, skip this step and say so.

---

## Step 2: Discuss Implementation

**Skip if:** A CONTEXT.md already exists for this phase (decisions already locked from a previous `/gsd:discuss-phase` run).

Resolve implementation gray areas before planning:

1. **Scout codebase** for reusable assets — existing components, utilities, patterns that could be leveraged
2. **Identify 3-4 gray areas** specific to this phase — layout choices, data flow decisions, error handling approaches, integration patterns
3. **Ask user** which gray areas to discuss (don't discuss all — let user prioritize)
4. **Deep-dive** selected areas — present options with trade-offs, get user decisions
5. **Lock decisions** in `.planning/phases/{phase}/{phase}-CONTEXT.md` with "Design Decisions" section

These locked decisions are fed to subagents during `/build` execution — they prevent re-deciding things downstream.

---

## Step 2.5: Derive must_haves

From the approved design, extract the **must_haves** — these drive the plan and verify it when done.

**Truths (3-5):**
Extract observable, user-facing statements of what must be true when the work is complete. These are NOT implementation details. They describe user-visible states, outcomes, or behaviors.

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

Hold these must_haves — they feed directly into the PLAN.md frontmatter and the plan-check in Step 3.5.

---

## Step 3: Create Plan

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

- Scope each plan to **2-3 tasks** (keeps execution context under 50%)
- Each task has: files, action, verify, done
- Mark tasks `tdd="true"` when they involve logic, state, or behavior — the executor will follow `superpowers:test-driven-development` for these
- Set `wave` numbers for parallelization (independent tasks = same wave)
- If frontend: add `type="checkpoint:human-verify"` for key visual moments
- Reference only the specific source files each task needs (not the whole codebase)
- Target **5-8 files** total across tasks
- Keep plan total under **1500 words**

### Context optimization

- In `<context>` blocks, reference only files the executor actually needs
- Pick 1-2 relevant codebase docs per task (CONVENTIONS.md for style, STRUCTURE.md for file placement)
- If GSD and CONTEXT.md exists: honor locked decisions, exclude deferred ideas

---

## Step 3.5: Plan-check (inline verification loop)

Before presenting the plan to the user, run this verification checklist. If any check fails, revise and recheck (max 3 iterations, then ask the user for guidance).

**GSD mode — run structural validation first:**

```bash
node ./.claude/get-shit-done/bin/gsd-tools.cjs verify plan-structure "${PLAN_PATH}"
node ./.claude/get-shit-done/bin/gsd-tools.cjs frontmatter validate "${PLAN_PATH}" --schema plan
```

These catch schema issues (missing frontmatter fields, malformed tasks) automatically. Then run the semantic checks below.

**Checks:**

1. **Requirement coverage** (GSD only): every requirement ID from ROADMAP referenced in `requirements` has at least one task covering it.
2. **Task completeness**: every `<task>` has non-empty `<files>`, `<action>`, `<verify>`, and `<done>`.
3. **Dependency correctness**: no circular dependencies in `depends_on`; wave numbers are consistent (a task cannot depend on a higher or equal wave).
4. **Scope sanity**: 2-3 tasks, 5-8 files in `files_modified`, plan body under 1500 words.
5. **must_haves trace**: every truth in `must_haves.truths` maps to at least one task's `<done>` criteria. Every artifact in `must_haves.artifacts` appears in `files_modified`.
6. **Context compliance** (GSD only): plan does not contradict locked decisions in CONTEXT.md; plan does not include work deferred in CONTEXT.md.

If a check fails, state which check failed, revise the plan, and recheck. After 3 failed iterations, present what you have and ask the user to resolve the issue.

**Present the plan to the user. Wait for approval.**

---

## Step 4: Handoff

After plan approval:

1. **`/build`** — Execute now. Fresh subagent per task, clean context, design gates auto-detected.
2. **Continue planning** — Plan more phases before building. Useful for planning ahead across multiple phases before executing any.

Default to option 1 unless the user indicates they want to keep planning.
