---
name: fh:plan-work
description: Plan before you build. Researches the problem and produces a step-by-step plan.
user-invocable: true
---

Plan a feature before building it. Brainstorm, research, and produce an execution-ready plan.

The user wants to plan: $ARGUMENTS

You are the **planning orchestrator**. Follow every step below — each one exists because skipping it caused real failures in past sessions. Delegate research and analysis to subagents to keep your context clean.

> **CRITICAL — GSD project required:**
> Check if `.planning/PROJECT.md` exists.
> - **If YES → proceed.** Read STATE.md for current phase/plan. Read ROADMAP.md for phase goals. Read phase-specific CONTEXT.md for locked decisions.
>   - **If ROADMAP.md is missing:** "Project exists but has no roadmap. Run `/fh:new-project` to regenerate, or proceed without phase tracking?" If proceeding without, skip Step 0 and treat as a standalone plan.
> - **If NO → stop.** Tell the user: "No project found.

→ Run /fh:new-project — set up project tracking

This creates the .planning/ directory that all planning and build skills depend on." Do not proceed.

---

## Step 0: Tool Readiness

claude-mem tools are **deferred** — they must be fetched before they can be called. Do this first, before any other work.

```
ToolSearch("select:mcp__plugin_claude-mem_mcp-search__smart_search,mcp__plugin_claude-mem_mcp-search__smart_outline,mcp__plugin_claude-mem_mcp-search__smart_unfold,mcp__plugin_claude-mem_mcp-search__search,mcp__plugin_claude-mem_mcp-search__get_observations")
```

Also verify ast-grep CLI is available:
```bash
command -v sg &>/dev/null || command -v ast-grep &>/dev/null || echo "WARN: ast-grep not found"
```

**If ToolSearch returns empty for claude-mem:** Fall back to Read-based approach for this session.

---

### Cross-Session Cache Check

Before reading planning files, check if a prior skill already loaded this context:

```
search({query: "[plan-work-output] {phase-name}", project: "<project>", limit: 3})
search({query: "[auto-output] {phase-name}", project: "<project>", limit: 3})
```

If fresh results found (< 2 hours): use the observation's summary as primary context. Skip redundant STATE.md / ROADMAP.md reads. If stale or absent: proceed with normal file reading.

---

## Step -0.5: Past Context Check

1. Derive project name consistently:
```bash
PROJECT_NAME=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || basename "$(pwd)")
```
Use `$PROJECT_NAME` as the `project` parameter for all claude-mem calls in this session.
2. Call `search` with query=2-3 keywords from the phase/project domain, project=<project-name>, limit=10
3. Scan the returned index for relevant IDs — prioritize types: gotcha, decision, trade-off
4. For the top 2-3 relevant IDs, call `get_observations` to fetch full details
5. Present as: "**From prior sessions:** - {observation}" — max 3 items
6. Feed these into the planning context so past mistakes and decisions inform this session

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

### Phase Dependency Check

After identifying the target phase, check if it has prerequisites:

1. Read the phase's CONTEXT.md or RESEARCH.md for dependency declarations (look for "depends on Phase", "requires Phase", "prerequisite", "blocked by")
2. Read ROADMAP.md for phase ordering and any explicit dependency annotations
3. For each declared dependency, check STATE.md — is the prerequisite phase marked complete?

| Dependency Status | Action |
|-------------------|--------|
| All prerequisites complete | Proceed normally |
| Prerequisites incomplete | **WARN:** "Phase X depends on Phase Y which is incomplete (status: {status}). Proceeding may cause rework. Continue anyway, or work on Phase Y first?" Wait for user choice. |
| Prerequisites not started | **BLOCK:** "Phase X requires Phase Y which hasn't started. Recommend planning Phase Y first." Wait for user choice. |

This prevents wasted work from building on incomplete foundations.

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
| **Simple** (1-3 tasks, familiar patterns, single file area) | Skip | Abbreviated brainstorm (1 alternative approach). Identify 1-2 gray areas only. | Suggest `/fh:plan-review` (can skip for trivial: rename, typo) |
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

See @.claude/skills/shared/freshness-check.md

---

## Step 1: Research (if needed)

Check whether the user's request involves unfamiliar APIs, external services, library selection, or technical feasibility questions. If so, research before designing — it prevents brainstorming in a vacuum.

### Past Learnings Check

Follow **Pattern A** (Past Learnings Check) from `@.claude/skills/shared/claude-mem-rules.md`. Keywords: 2-3 keywords from the user's task description, filter for: mistake, pitfall, learning, retro, "should have", warning, regression. Feed findings into the brainstorm/design context so past mistakes inform decisions.

See @references/research-paths.md for research path details (deep, codebase exploration, inline, skip).

### Research Protocol per Complexity Tier

- **Simple:** Skip or minimal inline research (unchanged).
- **Medium:** Produce hypothesis comparison per @references/research-protocol.md medium tier. Tag findings with epistemic markers per @.claude/skills/shared/epistemic-tags.md.
- **Complex:** Follow @references/research-protocol.md complex tier. Produce bounded context, hypothesis comparison, CL-annotated findings.

---

## Step 2: Brainstorm

**Brainstorm is mandatory for all non-auto plan-work runs.** Even for Simple tasks, present at least one alternative approach and get user confirmation. For tasks where a prior design exists, present a 1-sentence summary of the existing design and ask: 'Existing design found at [path]. Reuse as-is, or revisit?'

### Past Decisions Check (before brainstorming)

Follow **Pattern A** (Past Learnings Check) from `@.claude/skills/shared/claude-mem-rules.md`. Keywords: 2-3 keywords from the phase topic + "architecture decision". Feed into brainstorm context — avoid re-debating settled questions and surface mistakes that burned time before.

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
AUTO_MODE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.auto_advance 2>/dev/null || echo "false")
```

If `AUTO_MODE` is `"true"`, follow @references/auto-mode-path.md, then continue to Step 4.

---

### Normal (interactive) mode

Gray area discussion runs for all complexities in non-auto mode. For Simple tasks: identify at least 2 gray areas minimum. There is no complexity-based skip for gray area discussion.

Follow @references/gray-area-discussion.md for codebase scouting, gray area identification, decision locking, and CONTEXT.md format.

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

## Step 4.5: Spec Creation

| Complexity | Action |
|------------|--------|
| **Simple** | Skip. No SPEC.md. |
| **Medium** | Create SPEC.md per @references/spec-creation-process.md (streamlined path). Present to user for approval before Step 5. |
| **Complex** | Create SPEC.md per @references/spec-creation-process.md (full 5-step path, dispatches spec-architect agent). Present to user for approval before Step 5. |

When dispatching the spec-architect agent, include tool instructions in the prompt:
```
## Tools Available
Use claude-mem smart tools for codebase understanding:
- `smart_outline({path})` — file structure without full read
- `smart_unfold({path, symbol})` — extract one function
- `smart_search({query})` — cross-codebase structural search

Use ast-grep for structural code analysis:
- `sg --pattern '<pattern>' --lang typescript src/`

Use `smart_outline` on files in the bounded context before reading them fully.
Use `smart_search` to find existing patterns when designing architecture sections.
```

Output: `.planning/phases/XX-name/XX-NN-SPEC.md`

---

## Step 5: Create Plan

Write the plan following the format and rules in @references/plan-format.md

If a SPEC.md was created in Step 4.5, add `spec: XX-NN-SPEC.md` to the PLAN.md frontmatter.

---

## Step 6: Plan-check (inline verification loop)

Run plan-check protocol per @references/plan-check-protocol.md

**Present the plan to the user. Wait for approval.**

---

### Cross-Session Output

Emit a structured observation for downstream skills:

**[plan-work-output]** Phase {N}: Plan created at `{plan_path}`. Must-haves: {count} truths, {count} artifacts. Spec: {yes/no}. Decisions locked: {count}. Key files: {top 3 files_modified}.

This observation is queryable by plan-review and build via `search({query: "[plan-work-output] phase {N}"})`, avoiding redundant file re-reads in auto flows.

---

## Step 7: Handoff

After plan approval:

1. **`/fh:plan-review`** (default) — Review before building. Covers business alignment, architecture, code quality, tests, and performance. Three modes: SCOPE EXPANSION (dream big), HOLD SCOPE (maximum rigor), SCOPE REDUCTION (strip to essentials). **Feedback loop:** plan-review feeds findings back into PLAN.md (`must_haves.truths` with `[review]` prefix) and CONTEXT.md (review decisions + deferred scope). After plan-review completes, `/fh:build` automatically picks up the strengthened plan — no manual merging needed.
2. **`/fh:build`** — Skip review — only if this is trivially obvious (single-file rename, typo fix, config-only change with no behavioral impact).
3. **Continue planning** — Plan more phases before building.
4. **`/fh:plan-work {N} --reviews`** — Re-plan this phase incorporating cross-AI review feedback (requires a REVIEWS.md to exist in the phase directory from `/fh:review --phase {N}`). The `--reviews` flag cannot be combined with `--gaps`.

**Review is the default for ALL plans.** Only skip review for trivially obvious work where the risk of a missed edge case is near zero. When in doubt, review.

---

## Priority Hierarchy

Follow all steps. If a step produces no findings, move on quickly. Priority: **Step 0** (phase matching) > **Step 5** (plan creation) > **Step 3** (diagrams + failure modes) > **Step 4** (must_haves) > **Step 2** (brainstorm) > **Step 1** (research). Never skip Step 0 or Step 5.

---

_Eng review patterns adapted from gstack plan-eng-review (v0.3.3)_
