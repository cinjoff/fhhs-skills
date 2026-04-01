---
name: fh:map-codebase
description: Explore and document how your codebase is structured.
user-invocable: true
---

Spawns 4 parallel mapper agents that explore the codebase and write 7 focused documents — each independently indexable by claude-mem, each loaded only when the task type demands it.

<philosophy>
**Seven documents, not one.**
Each file serves a specific task context: UI work loads CONVENTIONS.md + STRUCTURE.md; API work loads ARCHITECTURE.md; dependency decisions load STACK.md + INTEGRATIONS.md; risk assessment loads CONCERNS.md. Separate files mean claude-mem can surface exactly the right context without loading everything.

**Prescriptive over descriptive.**
"Put new routes in `src/routes/{feature}/`" is useful. "Routes are in src/routes" is grep output.

**Run once, update incrementally.**
Full mapping runs at project bootstrap. After that, use `--refresh-stale` to regenerate only documents with detected drift. Full re-mapping should be rare — only after major restructuring.
</philosophy>

<process>

<step name="init_context" priority="first">
Load codebase mapping context:

```bash
# Ensure GSD CLI symlink exists (self-heals if /fh:setup wasn't run)
if [ ! -f "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" ]; then
  _FHHS="$(ls -d "$HOME/.claude/plugins/cache/fhhs-skills/fh"/*/ 2>/dev/null | sort | tail -1)"
  _FHHS="${_FHHS%/}"
  if [ -n "$_FHHS" ] && [ -d "$_FHHS/bin" ]; then
    mkdir -p "$HOME/.claude/get-shit-done"
    ln -sfn "$_FHHS/bin" "$HOME/.claude/get-shit-done/bin"
    [ -d "$_FHHS/hooks" ] && ln -sfn "$_FHHS/hooks" "$HOME/.claude/get-shit-done/hooks"
  fi
fi

INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init map-codebase)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Extract from init JSON: `mapper_model`, `commit_docs`, `codebase_dir`, `existing_maps`, `has_maps`, `codebase_dir_exists`.

Also check for flags:
```bash
REFRESH_STALE=false
[[ "$ARGUMENTS" == *"--refresh-stale"* ]] && REFRESH_STALE=true
```
</step>

<step name="check_existing">
Check if .planning/codebase/ already exists using `has_maps` from init context.

**Cost awareness:** Full mapping spawns 4 parallel agents, uses ~250K tokens, and takes ~3-5 minutes. Re-mapping is only worthwhile after major changes.

The 7 output files:
- STACK.md — technology stack (languages, frameworks, runtime)
- INTEGRATIONS.md — external services and APIs
- ARCHITECTURE.md — conceptual layers and data flow
- STRUCTURE.md — physical file organization
- CONVENTIONS.md — naming, style, and coding patterns
- TESTING.md — test framework and patterns
- CONCERNS.md — known issues and fragile areas

If `codebase_dir_exists` is true:
```bash
ls -la .planning/codebase/
# Check staleness
if [ -f .planning/codebase/.last-mapped ]; then
  MAPPED_SHA=$(cat .planning/codebase/.last-mapped)
  CURRENT_SHA=$(git rev-parse HEAD)
  COMMITS_SINCE=$(git rev-list --count $MAPPED_SHA..$CURRENT_SHA 2>/dev/null || echo "unknown")
  EXISTING_COUNT=$(ls .planning/codebase/*.md 2>/dev/null | wc -l | tr -d ' ')
  echo "Mapped at: $MAPPED_SHA"
  echo "Current:   $CURRENT_SHA"
  echo "Commits since mapping: $COMMITS_SINCE"
  echo "Existing files: $EXISTING_COUNT/7"
fi
```

**Enhanced freshness check — decision matrix:**
- <50 commits AND <3 drift signals → Skip (default)
- <50 commits AND 3+ drift signals → Suggest `--refresh-stale`
- 50+ commits → Suggest full refresh

If claude-mem is available, check drift signals via smart_search:
```
mcp__plugin_claude-mem_mcp-search__smart_search(query="codebase structure changed new module refactor")
```
Count results that post-date the mapped SHA. Each recent result = 1 drift signal.

If claude-mem unavailable, use commit count only.

**If `--refresh-stale` flag:**
- Query claude-mem for drift signals per document type
- Proceed to spawn only targeted agents for documents with drift
- If no drift found: print "Mapping appears current based on session history." and exit.
- If claude-mem unavailable: fall back to full refresh

**If exists without flags — present staleness context and options:**

```
.planning/codebase/ exists ([N]/7 files).
Mapped [N] commits ago.

What's next?
1. Refresh — Full remap (4 agents, ~250K tokens, ~5 min)
2. Skip — Use existing maps as-is [recommended if <50 commits, <3 drift signals]
3. Refresh stale — `/fh:map-codebase --refresh-stale` [targeted, uses claude-mem]
```

Default to **Skip** if map is recent. Only suggest Refresh if there has been major structural change.

Wait for user response.

If "Refresh": continue to create_structure (full run)
If "Skip": exit workflow
If "Refresh stale": re-invoke with --refresh-stale

**If doesn't exist:** Continue to create_structure.
</step>

<step name="create_structure">
Create .planning/codebase/ directory and clean up legacy consolidated file if present:

```bash
mkdir -p .planning/codebase
```

**Capture legacy CODEBASE.md as seed context if present.** Previous versions produced a single consolidated CODEBASE.md. If found, read it and pass its content to each agent as prior knowledge — this gives agents a head start and preserves any manual edits the user made. The file is removed after the new granular files are verified.

```bash
LEGACY_CODEBASE=""
if [ -f ".planning/codebase/CODEBASE.md" ]; then
  echo "Found legacy CODEBASE.md — will use as seed context for agents and remove after migration."
  LEGACY_CODEBASE=$(cat .planning/codebase/CODEBASE.md)
fi
```

Store `LEGACY_CODEBASE` for injection into agent prompts in the spawn_agents step.

**Expected output:** 7 files in `.planning/codebase/` — STACK.md, INTEGRATIONS.md, ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md.

Continue to static_analysis.
</step>

<step name="static_analysis">
Gather deterministic codebase metrics from Fallow if installed.

```bash
if command -v fallow &>/dev/null; then
  FALLOW_CHECK=$(timeout 30 fallow check --format json --quiet 2>/dev/null) || FALLOW_CHECK=""
  FALLOW_DUPES=$(timeout 30 fallow dupes --format json --quiet 2>/dev/null) || FALLOW_DUPES=""
  FALLOW_HEALTH=$(timeout 30 fallow health --format json --quiet 2>/dev/null) || FALLOW_HEALTH=""
fi
```

**Post-filter:**
- From `FALLOW_CHECK`: extract summary counts (unused files, unused exports, circular deps) — not full file lists
- From `FALLOW_DUPES`: extract duplication clusters (file pairs + similarity %) — top 10 by size
- From `FALLOW_HEALTH`: extract top-10 complexity hotspots (file path + cyclomatic score)
- **Hard cap:** Each output section ≤50 lines after filtering
- If all empty or fallow not installed: skip injection silently

These metrics are passed to the Quality and Concerns agents.

Continue to spawn_agents.
</step>

<step name="spawn_agents">
Spawn 4 parallel gsd-codebase-mapper agents. Use Agent tool with `subagent_type="fh:gsd-codebase-mapper"`, `model="{mapper_model}"`, `mode="bypassPermissions"`, and `run_in_background=true`.

**CRITICAL: `mode="bypassPermissions"` is required.** Without it, the agent cannot surface Write permission prompts in interactive sessions — it fails silently.

**CRITICAL: `run_in_background=true` on all 4 calls.** They run in parallel. Wait for all 4 completion notifications before proceeding.

**Legacy seed context:** If `LEGACY_CODEBASE` is non-empty (captured in create_structure), append this block to each agent's prompt:

```
## Prior Mapping (seed context)

A previous consolidated CODEBASE.md was found. Use it as a starting point — it may contain
accurate findings, manual edits, or domain knowledge worth preserving. Validate against the
actual codebase and update/correct as needed. Do NOT copy it verbatim — rewrite into the
focused format for your assigned files.

<prior_mapping>
{LEGACY_CODEBASE}
</prior_mapping>
```

If `LEGACY_CODEBASE` is empty, omit this block entirely — agents explore from scratch.

---

**Agent 1 — Tech** (writes STACK.md + INTEGRATIONS.md):

```
Agent(
  subagent_type="fh:gsd-codebase-mapper",
  model="{mapper_model}",
  mode="bypassPermissions",
  run_in_background=true,
  description="Map technology stack and external integrations",
  prompt="You are a codebase mapper. Explore this codebase and write two focused documents.

Focus: STACK.md (technology stack) and INTEGRATIONS.md (external services).

## Your Task

Write these two files to .planning/codebase/:

### STACK.md

Capture the technology foundation — what executes when the code runs.

Template structure:
```
# Technology Stack

**Analysis Date:** [YYYY-MM-DD]

## Languages
**Primary:** [Language Version - where used]
**Secondary:** [Language Version - where used]

## Runtime
**Environment:** [Runtime Version]
**Package Manager:** [Manager Version, lockfile present?]

## Frameworks
**Core:** [Framework Version - purpose]
**Testing:** [Framework Version - purpose]
**Build/Dev:** [Tool Version - purpose]

## Key Dependencies
[Only 5-10 most important — name version and WHY it matters]
**Critical:** [Package Version - why it matters]
**Infrastructure:** [Package Version - role]

## Configuration
**Environment:** [How configured, required vars]
**Build:** [Config files]

## Platform Requirements
**Development:** [OS, tooling]
**Production:** [Deployment target, version requirements]

---
*Stack analysis: [date]*
```

Good example: 'TypeScript 5.3 - All application code' not just 'TypeScript'.
Check package.json, .nvmrc, package.json engines for versions.

### INTEGRATIONS.md

Capture external systems the code communicates with.

Template structure:
```
# External Integrations

**Analysis Date:** [YYYY-MM-DD]

## APIs & External Services
**[Category]:**
- [Service] - [what it does]
  - SDK/Client: [package version]
  - Auth: [env var name, not value]
  - [Key details]

## Data Storage
**Databases:** [Type/Provider, connection via env var, client/ORM]
**File Storage:** [Service, SDK, auth]
**Caching:** [Service or 'None']

## Authentication & Identity
**Auth Provider:** [Service, implementation, token storage]
**OAuth:** [Provider, credentials env vars, scopes]

## Monitoring & Observability
**Error Tracking:** [Service, DSN env var]
**Analytics:** [Service or 'None']
**Logs:** [Service or 'stdout only']

## CI/CD & Deployment
**Hosting:** [Platform, deployment trigger]
**CI Pipeline:** [Service, workflows]

## Environment Configuration
**Development:** [Required env vars, secrets location, mock services]
**Production:** [Secrets management]

## Webhooks & Callbacks
**Incoming:** [Service - endpoint - verification method]
**Outgoing:** [Service - trigger]

---
*Integration audit: [date]*
```

NEVER write actual secrets or values. Document WHERE secrets live (env var names, vault), not the values.
Check .env.example, package.json imports, config files to identify integrations.

## Rules
- Write both files using the Write tool.
- ~40-60 lines each. Prescriptive, not descriptive.
- Include file paths in backticks throughout.
- Return confirmation only: '## Mapping Complete\n\n- STACK.md (N lines)\n- INTEGRATIONS.md (N lines)'
- DO NOT commit."
)
```

---

**Agent 2 — Arch** (writes ARCHITECTURE.md + STRUCTURE.md):

```
Agent(
  subagent_type="fh:gsd-codebase-mapper",
  model="{mapper_model}",
  mode="bypassPermissions",
  run_in_background=true,
  description="Map architecture patterns and directory structure",
  prompt="You are a codebase mapper. Explore this codebase and write two focused documents.

Focus: ARCHITECTURE.md (conceptual layers) and STRUCTURE.md (physical file organization).

## Your Task

Write these two files to .planning/codebase/:

### ARCHITECTURE.md

Capture how the code is organized conceptually — layers, data flow, key abstractions.

Template structure:
```
# Architecture

**Analysis Date:** [YYYY-MM-DD]

## Pattern Overview
**Overall:** [Pattern name: e.g., 'Layered MVC', 'Serverless API', 'CLI tool']
**Key Characteristics:**
- [Characteristic 1]
- [Characteristic 2]

## Layers
**[Layer Name]:**
- Purpose: [what this layer does]
- Contains: [types of code]
- Location: `[path]`
- Depends on: [what it uses]
- Used by: [what uses it]

(repeat for each layer)

## Data Flow
**[Flow Name] (e.g., HTTP Request, CLI Command):**
1. [Entry point]
2. [Processing step]
3. [Processing step]
4. [Output]

**State Management:** [How state is handled]

## Key Abstractions
**[Name]:**
- Purpose: [what it represents]
- Examples: `[path]`, `[path]`
- Pattern: [Singleton, Factory, Repository, etc.]

## Entry Points
**[Entry Point]:**
- Location: `[path]`
- Triggers: [what invokes it]
- Responsibilities: [what it does]

## Error Handling
**Strategy:** [throw + catch, Result<T,E>, middleware, etc.]
**Patterns:** [key patterns used]

## Cross-Cutting Concerns
**Logging:** [approach]
**Validation:** [approach]
**Authentication:** [approach]

---
*Architecture analysis: [date]*
```

File paths as concrete examples: `src/services/user.ts` not 'the user service'.
Trace a real request/command through the codebase to understand data flow.

### STRUCTURE.md

Capture where things physically live — answers 'where do I put X?'

Template structure:
```
# Codebase Structure

**Analysis Date:** [YYYY-MM-DD]

## Directory Layout
[ASCII tree, 2-3 levels max]
```
project-root/
├── dir/          # Purpose
│   └── subdir/  # Purpose
└── file          # Purpose
```

## Directory Purposes
**dir/:**
- Purpose: [what lives here]
- Contains: [file types]
- Key files: [important files]
- Subdirectories: [if nested]

## Key File Locations
**Entry Points:** [path - purpose]
**Configuration:** [path - purpose]
**Core Logic:** [path - purpose]
**Testing:** [path - purpose]

## Naming Conventions
**Files:** [pattern + example]
**Directories:** [pattern + example]
**Special Patterns:** [index.ts, __tests__, etc.]

## Where to Add New Code
**New Feature:** primary [path], tests [path]
**New Component:** implementation [path], types [path]
**New Route/Command:** definition [path], handler [path]
**Utilities:** shared helpers [path]

## Special Directories
**[dir]:**
- Purpose: [generated code, build artifacts, etc.]
- Committed: [Yes/No]

---
*Structure analysis: [date]*
```

Use tree-based exploration. Focus on top-level dirs and where NEW code goes.

## Rules
- Write both files using the Write tool.
- ~40-60 lines each. Prescriptive, not descriptive.
- Include file paths in backticks throughout.
- Return confirmation only: '## Mapping Complete\n\n- ARCHITECTURE.md (N lines)\n- STRUCTURE.md (N lines)'
- DO NOT commit."
)
```

---

**Agent 3 — Quality** (writes CONVENTIONS.md + TESTING.md):

```
Agent(
  subagent_type="fh:gsd-codebase-mapper",
  model="{mapper_model}",
  mode="bypassPermissions",
  run_in_background=true,
  description="Map coding conventions and test patterns",
  prompt="You are a codebase mapper. Explore this codebase and write two focused documents.

Focus: CONVENTIONS.md (coding style and patterns) and TESTING.md (test framework and patterns).

[COMPLEXITY_HOTSPOTS_PLACEHOLDER — if Fallow hotspot data is available, it was passed here. Use complexity hotspots to identify representative files worth examining for conventions.]

## Your Task

Write these two files to .planning/codebase/:

### CONVENTIONS.md

Capture how code is written — prescriptive guide for matching existing style.

Template structure:
```
# Coding Conventions

**Analysis Date:** [YYYY-MM-DD]

## Naming Patterns
**Files:** [pattern, e.g., 'kebab-case.ts', '*.test.ts alongside source']
**Functions:** [pattern, e.g., 'camelCase, handleEventName for handlers']
**Variables:** [pattern, e.g., 'camelCase, UPPER_SNAKE_CASE for constants']
**Types:** [pattern, e.g., 'PascalCase, no I prefix for interfaces']

## Code Style
**Formatting:** [tool + key settings, e.g., 'Prettier, 100 chars, single quotes']
**Linting:** [tool, extends, run command]

## Import Organization
**Order:**
1. [External packages]
2. [Internal modules with aliases]
3. [Relative imports]
4. [Type imports]
**Grouping:** [blank lines between groups, alphabetical, etc.]
**Path Aliases:** [@ mappings]

## Error Handling
**Patterns:** [throw + catch at boundary, Result<T,E>, etc.]
**Error Types:** [when to throw vs return, custom error classes]
**Logging:** [log before throw, context object pattern]

## Logging
**Framework:** [console.log, pino, winston, etc.]
**Patterns:** [structured logging, where to log]

## Comments
**When:** [explain why not what, document business rules]
**JSDoc:** [required for public APIs? format]
**TODOs:** [format, link to issue?]

## Function Design
**Size:** [max lines, when to extract]
**Parameters:** [max count, options object pattern]
**Return Values:** [explicit returns, guard clauses]

## Module Design
**Exports:** [named vs default, when each]
**Barrel Files:** [index.ts pattern, circular dep avoidance]

---
*Convention analysis: [date]*
```

Check .prettierrc, .eslintrc, eslint.config.js, biome.json. Read 5-10 source files.
Be prescriptive: 'Use X' not 'Sometimes Y is used'.

### TESTING.md

Capture how tests are written and run.

Template structure:
```
# Testing Patterns

**Analysis Date:** [YYYY-MM-DD]

## Test Framework
**Runner:** [Framework version, config file]
**Assertion Library:** [built-in expect, chai, etc.]
**Run Commands:**
```bash
npm test              # all tests
npm test -- --watch   # watch mode
npm run test:coverage # coverage
```

## Test File Organization
**Location:** [collocated *.test.ts or separate tests/ tree]
**Naming:** [unit, integration, e2e patterns]
**Structure:**
```
src/
  lib/
    utils.ts
    utils.test.ts
```

## Test Structure
**Suite Organization:**
```typescript
describe('ModuleName', () => {
  describe('functionName', () => {
    beforeEach(() => { /* reset */ });
    it('should handle success case', () => {
      // arrange / act / assert
    });
  });
});
```
**Patterns:** [beforeEach vs beforeAll, afterEach cleanup, arrange/act/assert]

## Mocking
**Framework:** [Jest built-in, Vitest vi, Sinon]
**Pattern:**
```typescript
vi.mock('./external', () => ({ fn: vi.fn() }));
```
**Mock:** [external APIs, fs, database]
**Don't mock:** [pure functions, internal utils]

## Fixtures and Factories
**Pattern:**
```typescript
function createTestUser(overrides?: Partial<User>): User {
  return { id: 'test-id', ...overrides };
}
```
**Location:** [test file or tests/fixtures/]

## Coverage
**Requirements:** [target % or 'none enforced']
**Configuration:** [tool, exclusions]

## Test Types
**Unit:** [scope, mocking strategy]
**Integration:** [scope, mocking strategy]
**E2E:** [framework or 'not used']

---
*Testing analysis: [date]*
```

Check package.json scripts, vitest.config.ts or jest.config.js, read 5 test files.
Document actual patterns used, not ideal patterns.

## Rules
- Write both files using the Write tool.
- ~40-60 lines each. Prescriptive, not descriptive.
- Include file paths in backticks throughout.
- Return confirmation only: '## Mapping Complete\n\n- CONVENTIONS.md (N lines)\n- TESTING.md (N lines)'
- DO NOT commit."
)
```

**Before spawning Agent 3:** Replace `[COMPLEXITY_HOTSPOTS_PLACEHOLDER — if Fallow hotspot data is available, it was passed here. Use complexity hotspots to identify representative files worth examining for conventions.]` with the actual FALLOW_HEALTH top-10 complexity hotspots if available, or remove that block entirely if Fallow was not installed.

---

**Agent 4 — Concerns** (writes CONCERNS.md):

```
Agent(
  subagent_type="fh:gsd-codebase-mapper",
  model="{mapper_model}",
  mode="bypassPermissions",
  run_in_background=true,
  description="Map codebase concerns, tech debt, and fragile areas",
  prompt="You are a codebase mapper. Explore this codebase and write one focused document.

Focus: CONCERNS.md — known issues, fragile areas, and actionable warnings.

[FALLOW_METRICS_PLACEHOLDER — if Fallow metric data is available, it was passed here. Use dead code counts, duplication clusters, and circular deps as evidence for concerns.]

## Your Task

Write .planning/codebase/CONCERNS.md.

Template structure:
```
# Codebase Concerns

**Analysis Date:** [YYYY-MM-DD]

## Tech Debt
**[Area/Component]:**
- Issue: [what's the shortcut]
- Files: `path/to/file.ts` (and others)
- Why: [why done this way]
- Impact: [what degrades]
- Fix approach: [how to address properly]

## Known Bugs
**[Bug description]:**
- Symptoms: [what happens]
- Trigger: [how to reproduce]
- File: `path/to/file.ts`
- Workaround: [if any]
- Root cause: [if known]

## Security Considerations
**[Area]:**
- Risk: [what could go wrong]
- Files: `path/to/file.ts`
- Current mitigation: [what's in place]
- Recommendations: [what to add]

## Performance Bottlenecks
**[Slow operation]:**
- Problem: [what's slow]
- File: `path/to/file.ts`
- Measurement: [actual numbers if available]
- Cause: [why it's slow]
- Improvement path: [how to fix]

## Fragile Areas
**[Component]:**
- Why fragile: [what makes it break]
- Common failures: [what typically goes wrong]
- File: `path/to/file.ts`
- Safe modification: [how to change without breaking]
- Test coverage: [tested? gaps?]

## Scaling Limits
**[Resource]:**
- Current capacity: [numbers]
- Limit: [where it breaks]
- Scaling path: [how to increase capacity]

## Dependencies at Risk
**[Package]:**
- Risk: [deprecated, unmaintained, breaking changes]
- Impact: [what breaks]
- Migration plan: [alternative or upgrade path]

## Test Coverage Gaps
**[Untested area]:**
- What's not tested: [specific functionality]
- Risk: [what could break silently]
- Priority: [High/Medium/Low]

---
*Concerns audit: [date]*
```

Good tone: 'N+1 query pattern in courses endpoint' not 'terrible queries'.
Always include file paths — concerns without locations are not actionable.
Be specific with measurements ('500ms p95' not 'slow').
Suggest fix approaches, not just problems.

## Rules
- Write the file using the Write tool.
- ~40-80 lines. Only include real findings, not placeholder sections.
- Include file paths in backticks throughout.
- Return confirmation only: '## Mapping Complete\n\n- CONCERNS.md (N lines)'
- DO NOT commit."
)
```

**Before spawning Agent 4:** Replace `[FALLOW_METRICS_PLACEHOLDER — if Fallow metric data is available, it was passed here. Use dead code counts, duplication clusters, and circular deps as evidence for concerns.]` with the actual FALLOW_CHECK + FALLOW_DUPES + FALLOW_HEALTH data if available, or remove that block if Fallow was not installed.

---

**Spawn all 4 agents simultaneously.** You will be **notified automatically** when each completes — do NOT poll or sleep-loop.

**Handling failure:**
- If an agent fails silently (missing output file): re-spawn once. If it fails again, spawn a replacement with the same prompt and have it write the file.
- Check `ls -la .planning/codebase/` to verify the directory is writable.

Wait for all 4 completion notifications, then continue to verify_output.
</step>

<step name="verify_output">
Verify all documents created successfully:

```bash
ls -la .planning/codebase/*.md
wc -l .planning/codebase/*.md
```

**Verification checklist:**
- All 7 files exist: STACK.md, INTEGRATIONS.md, ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md
- Each file >10 lines
- Total across all files >100 lines

If any file is missing or empty, note the failure and re-spawn the responsible agent.

**Clean up legacy CODEBASE.md after successful migration:**

```bash
if [ -f ".planning/codebase/CODEBASE.md" ]; then
  rm ".planning/codebase/CODEBASE.md"
  echo "Removed legacy CODEBASE.md — migrated to 7 granular files."
fi
```

This runs only after verification passes, ensuring the legacy file is preserved if the new mapping fails.

Continue to finalize_context.
</step>

<step name="finalize_context">
Create path-scoped rules, index documents, and record git SHA.

**Create .claude/rules/ with path-scoped references:**

```bash
mkdir -p .claude/rules
```

Write `.claude/rules/gsd-planning.md`:
```markdown
---
paths:
  - ".planning/**"
---
GSD project tracking is active. See @.planning/STATE.md for current position and @.planning/ROADMAP.md for phase goals.
When making decisions, check the active phase CONTEXT.md for locked decisions.
```

Write `.claude/rules/codebase-context.md`:
```markdown
---
paths:
  - "src/**"
  - "lib/**"
  - "app/**"
  - "components/**"
  - "pages/**"
---
Codebase mapping available. Load only what your task needs:
- @.planning/codebase/STACK.md — languages, frameworks, runtime
- @.planning/codebase/INTEGRATIONS.md — external services, APIs, auth
- @.planning/codebase/ARCHITECTURE.md — layers, data flow, key abstractions
- @.planning/codebase/STRUCTURE.md — where to put new code, directory layout
- @.planning/codebase/CONVENTIONS.md — naming, style, imports, error handling
- @.planning/codebase/TESTING.md — test framework, patterns, how to run
- @.planning/codebase/CONCERNS.md — known issues, fragile areas, tech debt
```

**Post-mapping claude-mem indexing:** If claude-mem is available, Read each of the 7 files to trigger PostToolUse observation hooks. This makes the documents available in subsequent sessions via `smart_search`.

```
Read(".planning/codebase/STACK.md")
Read(".planning/codebase/INTEGRATIONS.md")
Read(".planning/codebase/ARCHITECTURE.md")
Read(".planning/codebase/STRUCTURE.md")
Read(".planning/codebase/CONVENTIONS.md")
Read(".planning/codebase/TESTING.md")
Read(".planning/codebase/CONCERNS.md")
```

**Record git SHA for freshness:**
```bash
git rev-parse HEAD > .planning/codebase/.last-mapped
```

Continue to scan_for_secrets.
</step>

<step name="scan_for_secrets">
**CRITICAL SECURITY CHECK.** Scan all 7 output files for leaked secrets before committing.

```bash
grep -E '(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]+|sk_test_[a-zA-Z0-9]+|ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|glpat-[a-zA-Z0-9_-]+|AKIA[A-Z0-9]{16}|xox[baprs]-[a-zA-Z0-9-]+|-----BEGIN.*PRIVATE KEY|eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.)' .planning/codebase/STACK.md .planning/codebase/INTEGRATIONS.md .planning/codebase/ARCHITECTURE.md .planning/codebase/STRUCTURE.md .planning/codebase/CONVENTIONS.md .planning/codebase/TESTING.md .planning/codebase/CONCERNS.md 2>/dev/null && SECRETS_FOUND=true || SECRETS_FOUND=false
```

If SECRETS_FOUND=true: alert user and wait for confirmation before committing.
If SECRETS_FOUND=false: continue.
</step>

<step name="commit_codebase_map">
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: map existing codebase" --files .planning/codebase/STACK.md .planning/codebase/INTEGRATIONS.md .planning/codebase/ARCHITECTURE.md .planning/codebase/STRUCTURE.md .planning/codebase/CONVENTIONS.md .planning/codebase/TESTING.md .planning/codebase/CONCERNS.md
```
</step>

<step name="offer_next">
**Get line counts:**
```bash
wc -l .planning/codebase/*.md
```

```
Codebase mapped.

Created in .planning/codebase/:
- STACK.md ([N] lines) — languages, frameworks, runtime
- INTEGRATIONS.md ([N] lines) — external services and APIs
- ARCHITECTURE.md ([N] lines) — layers, data flow, abstractions
- STRUCTURE.md ([N] lines) — where to put new code
- CONVENTIONS.md ([N] lines) — naming, style, patterns
- TESTING.md ([N] lines) — test framework and patterns
- CONCERNS.md ([N] lines) — known issues and fragile areas

---

## ▶ Next Up

**Initialize project** — `/fh:new-project`

<sub>`/clear` first → fresh context window</sub>

---
```

End workflow.
</step>

</process>

<success_criteria>
- .planning/codebase/ directory created before agents spawn
- Legacy CODEBASE.md used as seed context for agents if present, then removed after verification
- 4 fh:gsd-codebase-mapper agents spawned in parallel with `mode="bypassPermissions"` and `run_in_background=true`
- Agents write their files directly (orchestrator doesn't receive document contents)
- Orchestrator waits for all 4 completion notifications (no sleep-polling)
- All 7 files exist: STACK.md, INTEGRATIONS.md, ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md
- Each file >10 lines, total >100 lines combined
- Fallow metrics passed to Quality (hotspots) and Concerns (all metrics) agents
- .claude/rules/codebase-context.md points to all 7 files individually
- Post-mapping claude-mem indexing reads all 7 files to trigger observation hooks
- .planning/codebase/.last-mapped written with current git SHA
- --refresh-stale mode: queries claude-mem for drift signals, spawns only targeted agents
- Clear completion summary showing all 7 files with line counts
</success_criteria>
