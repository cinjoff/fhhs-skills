# Gray Area Discussion — Normal (Interactive) Mode

Resolve implementation gray areas before planning.

## Codebase Scouting Tools

See @.claude/skills/plan-work/references/workflow-matrix.md for tool selection. Additionally:

If claude-mem is available (check tool list for `mcp__plugin_claude-mem_*`):
- Use `smart_outline` on modules in the target area for token-efficient structural views (function signatures, exports) without reading full files
- Use `smart_search` to search for existing patterns related to the gray areas being discussed — surfaces reusable abstractions faster than grep
- Default to Smart Explore. Escalate to Explore Agent only when synthesis is needed.

If claude-mem is not available: fall back to Read/Grep/Glob directly.

## Discussion Steps

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

6. **Categorize and lock decisions** in `.planning/phases/{phase}/{phase}-CONTEXT.md`. After discussing gray areas, explicitly categorize each decision:

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
