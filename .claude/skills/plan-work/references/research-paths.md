# Research Paths (Step 1)

The complexity assessment from Step 0.5 determines the research path:

## Research Caching (all tiers)

Before dispatching any researcher, follow **Pattern E** (Research Caching) from `@.claude/skills/shared/claude-mem-rules.md` — check if prior research exists for this domain. Reuse if recent and relevant; re-research only when stale or insufficient. Skip silently if claude-mem is unavailable.

## Codebase Pattern Discovery (all research tiers)

Before any external research, surface existing codebase patterns so research doesn't reinvent established conventions. Uses **Pattern B** from `@.claude/skills/shared/claude-mem-rules.md`:

```
If .planning/codebase/ exists:
  1. smart_outline({path: ".planning/codebase/CONVENTIONS.md"}) → scan headings
  2. smart_outline({path: ".planning/codebase/CONCERNS.md"}) → scan headings
  3. smart_unfold relevant headings for this phase's domain
  4. Check ARCHITECTURE.md, TESTING.md, INTEGRATIONS.md as needed

If .planning/codebase/ doesn't exist: Grep for domain-relevant patterns in src/
```

Look for: caching patterns, data flow (avoid double-parsing), integration adapters, existing utilities. Feed findings into the researcher prompt or inline research context.

Budget: <3% context. This step catches the gaps that plan-review would otherwise flag late.

## Deep Research Path (complex tasks)

When the complexity assessment suggests deep research, spawn a `fh:gsd-phase-researcher` subagent:

```
Task(
  prompt="Research Phase [X]: [name]. Goal: [phase goal].
  <files_to_read>
  .planning/phases/XX-name/XX-CONTEXT.md (if exists)
  </files_to_read>
  Phase requirements: [list from ROADMAP.md]
  Write to: .planning/phases/XX-name/XX-RESEARCH.md
  Web research: follow `@.claude/skills/shared/firecrawl-guide.md` content-type patterns",
  subagent_type="fh:gsd-phase-researcher",
  description="Phase research"
)
```

The agent produces a structured `.planning/phases/XX-name/XX-RESEARCH.md` containing:
- Stack patterns and architecture approaches
- Pitfalls and known failure modes
- Code examples from authoritative sources
- Prescriptive recommendations

After the agent completes, read the RESEARCH.md and carry its findings into Step 2 (Brainstorm).

**Confidence gate:** After research completes, review findings for confidence levels. If confidence is LOW on any critical finding (architectural choice, feasibility question, or key dependency), suggest escalating to deeper research before proceeding to brainstorm.

## Codebase Exploration Path (unfamiliar codebase)

When working in an unfamiliar codebase, suggest dispatching a `fh:code-explorer` agent before brainstorming to understand existing patterns. The agent scans for:
- Existing abstractions and utilities relevant to the task
- Naming conventions and file organization patterns
- Similar features already implemented that can serve as templates

## Inline Research Path (medium tasks — default)

Announce "This needs technical research before design — researching first." First run the Codebase Pattern Discovery step above, then spawn a Task agent with:
- Codebase pattern findings from the discovery step (existing conventions, caching, data flow, integration patterns)
- The specific research questions implied by the user's request
- Instruction to follow `@.claude/skills/shared/firecrawl-guide.md` for content-type-specific web research patterns, and Context7 for library documentation
- Instruction to write findings to `.planning/phases/XX-name/XX-RESEARCH.md` with prescriptive recommendations, stack decisions, pitfalls, and code examples
- Instruction to include `## Existing Codebase Patterns` section documenting what was found in the codebase before external research

## Tool Selection

See @.claude/skills/plan-work/references/workflow-matrix.md for the full tool selection guide. Default to Smart Explore. Escalate to Explore Agent only when synthesis is needed. For web research content-type routing, see `@.claude/skills/shared/firecrawl-guide.md`.

## Skip Research (simple tasks)

**If the feature uses well-known patterns**, skip this step and say so.

If the user mentions wanting an isolated branch or worktree, set up a git worktree before continuing.
