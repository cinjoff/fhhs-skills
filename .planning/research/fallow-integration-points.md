# Fallow CLI Integration Points Analysis

**Analyzed:** 2026-03-25
**Scope:** Every skill in fhhs-skills that performs code analysis
**Fallow commands referenced:**
- `fallow check --format json` -- dead code: unused exports, files, deps, types
- `fallow dupes --format json` -- code duplication detection
- `fallow dupes --mode semantic --format json` -- semantic clone detection (renamed variables)
- `fallow health --format json` -- complexity metrics, hotspots
- `fallow check --changed-since HEAD~1 --format json` -- incremental dead code on recent changes

---

## Integration Impact Summary

| Skill | Integration Points | Highest Impact | Overall Value |
|-------|-------------------|----------------|---------------|
| **review** | 4 | HIGH | HIGH |
| **simplify** | 3 | HIGH | HIGH |
| **refactor** | 3 | HIGH | HIGH |
| **build (spec-gate)** | 2 | HIGH | HIGH |
| **map-codebase** | 3 | HIGH | HIGH |
| **plan-work** | 2 | MEDIUM | MEDIUM |
| **plan-review** | 2 | MEDIUM | MEDIUM |
| **fix** | 2 | MEDIUM | MEDIUM |
| **extract** | 2 | MEDIUM | MEDIUM |
| **secure** | 1 | MEDIUM | LOW |
| **audit** | 2 | MEDIUM | MEDIUM |
| **optimize** | 1 | MEDIUM | LOW |
| **health** | 0 | -- | NONE |
| **harden** | 0 | -- | NONE |
| **normalize** | 1 | LOW | LOW |

---

## Skill-by-Skill Analysis

---

### 1. review (HIGH impact)

**File:** `.claude/skills/review/SKILL.md`

#### Integration Point 1: Code Quality + Architecture Agent (Step 2, Agent 1)

**Exact section (SKILL.md lines 75-80):**
```
**Agent 1 -- Code Quality + Architecture** (`subagent_type: "code-reviewer"`)
- Covers: naming, structure, error handling, DRY, complexity, test quality,
  cross-file consistency, dependency direction, separation of concerns,
  abstraction quality, API design, cross-cutting concerns
```

**What the skill currently does:** The subagent reads the full diff and uses LLM inference to assess DRY violations, complexity, and dependency direction. No tooling -- pure pattern matching by the model.

**Fallow command:** `fallow check --changed-since $BASE_BRANCH --format json` + `fallow dupes --format json` + `fallow health --format json`

**How output feeds in:** Include Fallow JSON output in the Agent 1 prompt alongside the diff. The agent gets:
- **Dead code from `check`:** Unused exports introduced in this branch, newly orphaned files. The agent can flag "you added `export function processOrder()` in `src/utils/orders.ts` but nothing imports it."
- **Duplication from `dupes`:** Instead of LLM guessing at DRY violations, Fallow provides exact file:line ranges of duplicated blocks. The agent reports precise locations rather than vague "this looks similar to..."
- **Complexity from `health`:** Cyclomatic complexity scores per function. The agent flags functions exceeding thresholds (e.g., >15) with exact metrics, not subjective "this is complex."

**Impact:** HIGH -- transforms three subjective LLM assessments (DRY, complexity, dependency direction) into evidence-backed findings with exact locations.

#### Integration Point 2: Architecture Criteria in review-prompt.md

**Exact section (review-prompt.md lines 49-52):**
```
### Dependency Direction
- Do dependencies flow in one direction (e.g., UI -> service -> data)?
- Are there circular imports? Check for A imports B imports A patterns.
- Do lower-level modules depend on higher-level abstractions?
```

**What the skill currently does:** LLM reads the diff and tries to infer circular dependencies from import statements. This is unreliable -- the LLM only sees the diff, not the full import graph.

**Fallow command:** `fallow check --format json` (includes circular dependency detection)

**How output feeds in:** Fallow's circular dependency report is authoritative -- it traces the full import graph, not just the diff. Inject the circularity findings into Agent 1's prompt. The review can now definitively say "Circular dependency: `src/services/auth.ts` -> `src/middleware/session.ts` -> `src/services/auth.ts`" instead of guessing.

**Impact:** HIGH -- circular dependency detection is fundamentally impossible from diff-only LLM analysis. Fallow makes it accurate.

#### Integration Point 3: Gap Analysis Agent (Step 2, Agent 3)

**Exact section (review-prompt.md lines 57-65):**
```
### Unwired code
- Files created but never imported
- Functions defined but never called
- State defined but never rendered
- API routes defined but never fetched from
```

**What the skill currently does:** LLM infers "unwired code" by reading the diff. Unreliable because the LLM cannot see the full codebase to know whether something IS imported elsewhere.

**Fallow command:** `fallow check --format json` (unused exports, unused files)

**How output feeds in:** Fallow definitively identifies files created but never imported and exports defined but never referenced. This replaces LLM guesswork with certainty. Agent 3 receives the Fallow unused-exports list filtered to files in the diff, then only needs to assess whether the "unused" status is intentional (public API) or a bug.

**Impact:** HIGH -- "unwired code" detection goes from unreliable LLM inference to ground truth.

#### Integration Point 4: Production Safety Checklist (Pass 2)

**Exact section (production-safety-checklist.md lines 42-44):**
```
### Dead Code & Consistency
- Variables assigned but never read
```

**What the skill currently does:** LLM scans diff for assigned-but-unused variables. This is limited to what the model can see in the diff context window.

**Fallow command:** `fallow check --changed-since $BASE_BRANCH --format json`

**How output feeds in:** Fallow catches dead code at module level (unused exports, files) while the checklist catch is more granular (variables). These are complementary -- Fallow covers the module-level blind spot that LLMs miss.

**Impact:** MEDIUM -- supplements rather than replaces.

---

### 2. simplify (HIGH impact)

**File:** `.claude/skills/simplify/SKILL.md`

**Note:** The SKILL.md is a thin wrapper -- it says "runs 3 parallel review agents on the git diff -- code reuse, code quality, and efficiency." The actual agent prompts are inline. But we know the three domains:

#### Integration Point 1: Code Reuse Agent

**Exact section (SKILL.md line 7-8 + build/SKILL.md lines 402-406):**
```
- **Code reuse**: newly written code that duplicates existing utilities or helpers
```

**What the skill currently does:** LLM reads the diff and tries to identify if new code duplicates existing code. The LLM would need to have seen the entire codebase to know this -- it cannot.

**Fallow command:** `fallow dupes --format json` + `fallow dupes --mode semantic --format json`

**How output feeds in:** Fallow's duplication report identifies exact blocks of duplicated code across the entire codebase, not just the diff. The reuse agent receives concrete evidence: "Lines 15-45 in `src/utils/format.ts` are 87% similar to lines 22-52 in `src/helpers/string.ts`." The agent then decides whether to extract a shared utility.

Semantic mode catches clones where variables were renamed but logic is identical -- something no LLM can reliably detect across a full codebase.

**Impact:** HIGH -- this is the core mission of the reuse agent, and Fallow provides the data it currently lacks.

#### Integration Point 2: Code Quality Agent

**Exact section (build/SKILL.md line 407):**
```
- **Code hygiene**: parameter sprawl, copy-paste with variation, stringly-typed code
```

**What the skill currently does:** LLM infers copy-paste patterns from the diff alone.

**Fallow command:** `fallow dupes --mode semantic --format json`

**How output feeds in:** "Copy-paste with variation" is exactly what semantic duplication detection catches. Fallow provides the evidence; the agent recommends the consolidation.

**Impact:** MEDIUM -- supplements the quality agent's already reasonable LLM analysis.

#### Integration Point 3: Efficiency Agent

**Exact section (build/SKILL.md line 407):**
```
- **Efficiency**: redundant computations, missed concurrency, N+1 patterns, hot-path bloat
```

**What the skill currently does:** LLM reads the diff looking for N+1 and redundancy patterns.

**Fallow command:** `fallow health --format json`

**How output feeds in:** Complexity hotspots from `fallow health` identify the highest-complexity functions. The efficiency agent can focus its attention on the most complex functions rather than scanning everything equally.

**Impact:** LOW -- complexity metrics point the agent in the right direction but don't directly identify N+1 patterns.

---

### 3. refactor (HIGH impact)

**File:** `.claude/skills/refactor/SKILL.md`

#### Integration Point 1: Analysis Mode (Step 0)

**Exact section (SKILL.md lines 25-33):**
```
## Step 0: Analysis Mode (no target specified)

If the user asks to "refactor this codebase", "clean up", or "find things to refactor"
without specifying a target, invoke `skills/simplify/` first to identify refactoring
candidates. It runs 3 parallel review agents that scan for:

- **God components/classes** -- files doing too many things
- **Kitchen-sink utilities** -- catch-all modules that should be split
- **Duplicate patterns** -- copy-pasted logic with minor variations
- **Redundant abstractions** -- wrappers that add no value
```

**What the skill currently does:** Delegates to simplify agents which use LLM inference on the diff to find candidates. No structural analysis of the codebase.

**Fallow commands:**
- `fallow health --format json` -- identifies god files via complexity metrics (high cyclomatic complexity + many exports = god module)
- `fallow dupes --mode semantic --format json` -- identifies duplicate patterns precisely
- `fallow check --format json` -- identifies redundant abstractions (exports that wrap other exports with no added logic can be detected as unused if the wrapper is bypassed)

**How output feeds in:** Before spawning simplify agents, run all three Fallow commands and inject results into the analysis. The agents now have:
- God files: sorted by complexity score -- top 10 most complex files
- Kitchen-sink utilities: files with 20+ exports (from `check` output's export enumeration)
- Duplicate patterns: exact locations and similarity percentages
- Dead code: exports nobody uses -- candidates for removal rather than refactoring

**Impact:** HIGH -- transforms "find things to refactor" from a vague LLM scan into a data-driven prioritized list.

#### Integration Point 2: Scope Mapping (Step 1)

**Exact section (SKILL.md lines 41-48):**
```
## Step 1: Scope

1. Find all files involved in the refactoring target. Use LSP first:
   - findReferences on the target symbol
   - incomingCalls/outgoingCalls to map the call graph
2. Map dependencies: what imports/calls the target
3. Estimate: how many files change, which subsystems affected
```

**What the skill currently does:** LSP-based reference finding. Good for single-symbol refactors, but doesn't reveal the broader dependency structure.

**Fallow command:** `fallow check --format json` (dependency graph and circular dependency data)

**How output feeds in:** Fallow's dependency graph supplements LSP. When refactoring a module, Fallow shows:
- Whether the module is involved in any circular dependency chains (refactoring must break cycles, not preserve them)
- Unused exports in the target that can be removed as part of the refactor
- Whether the refactoring target is itself dead code (why refactor something nobody uses?)

**Impact:** MEDIUM -- valuable context for scoping, but LSP already covers the primary use case.

#### Integration Point 3: Post-Refactor Simplify (Step 5)

**Exact section (SKILL.md lines 97-104):**
```
## Step 5: Simplify

After execution, invoke `skills/simplify/`. Refactoring often introduces new abstractions
or moves code around -- simplify catches:

- Extracted utilities that duplicate existing ones elsewhere
- Restructured code with missed efficiency opportunities
- Copy-paste remnants from the restructuring
```

**What the skill currently does:** Same as simplify analysis -- LLM inference on the diff.

**Fallow command:** `fallow check --changed-since $WAVE_START_SHA --format json` + `fallow dupes --format json`

**How output feeds in:** After refactoring, run Fallow to verify:
- No new dead code was introduced (common when moving code -- old location still exported but nobody imports it)
- No new duplicates were created (common when extracting shared utilities that overlap with existing ones)
- Circular dependencies were broken, not created

**Impact:** HIGH -- refactoring is the #1 source of accidentally introduced dead code. Fallow catches what LLMs miss.

---

### 4. build / spec-gate (HIGH impact)

**File:** `.claude/skills/build/SKILL.md` + `references/spec-gate-prompt.md`

#### Integration Point 1: Spec Gate Unwired Code Check

**Exact section (spec-gate-prompt.md lines 62-68):**
```
**Unwired code:**
- Files created but never imported
- Functions defined but never called
- State defined but never rendered
- API routes defined but never fetched from
```

**What the skill currently does:** The spec gate reviewer reads the wave diff and tries to identify unwired code by LLM inference. It cannot see the full codebase import graph.

**Fallow command:** `fallow check --changed-since $WAVE_START_SHA --format json`

**How output feeds in:** Run Fallow after each wave completes, before the spec gate agent. Include the unused-exports/files list in the spec gate prompt. The reviewer now has authoritative data: "These 3 exports were added in this wave but are not imported anywhere in the codebase." The reviewer can then check whether they are supposed to be consumed by a future wave (expected) or are genuinely unwired (BLOCKING).

**Impact:** HIGH -- the spec gate's unwired code detection is currently its weakest check (LLM inference on partial diff). Fallow makes it definitive.

#### Integration Point 2: Post-Build Simplify (Step 8)

**Exact section (build/SKILL.md lines 402-408):**
```
## Step 8: Simplify

After all tasks complete, invoke `skills/simplify/` on the implementation diff. This catches:
- Code reuse: newly written code that duplicates existing utilities
- Efficiency: redundant computations, missed concurrency, N+1 patterns
- Code hygiene: parameter sprawl, copy-paste with variation
```

Same integration as simplify skill above. Run `fallow dupes` + `fallow check --changed-since` before simplify agents.

**Impact:** HIGH (same rationale as simplify).

---

### 5. map-codebase (HIGH impact)

**File:** `.claude/skills/map-codebase/SKILL.md`

#### Integration Point 1: Architecture Mapper (Agent 2)

**Exact section (SKILL.md lines 116-131):**
```
**Agent 2: Architecture Focus**
prompt="Focus: arch
Analyze this codebase architecture and directory structure.
Write these documents to .planning/codebase/:
- ARCHITECTURE.md - Pattern, layers, data flow, abstractions, entry points
- STRUCTURE.md - Directory layout, key locations, naming conventions"
```

**What the skill currently does:** The mapper agent explores the codebase via file reads and grep to infer architecture. Entirely LLM-driven exploration.

**Fallow command:** `fallow check --format json` (dependency graph, circular dependencies, module boundaries)

**How output feeds in:** Include Fallow output in the architecture mapper's prompt. The agent now has:
- The full dependency graph -- which modules import which, enabling accurate layer diagrams
- Circular dependency chains -- architectural smells to document in ARCHITECTURE.md
- Unused files/exports -- dead code percentage, which informs the "health" narrative

The architecture mapper's ARCHITECTURE.md becomes data-driven: "Layer violations: `src/components/` imports from `src/api/` (3 files), creating a circular dependency between UI and data layers."

**Impact:** HIGH -- architecture mapping without dependency data is guesswork. Fallow provides the structural facts.

#### Integration Point 2: Concerns Mapper (Agent 4)

**Exact section (SKILL.md lines 155-170):**
```
**Agent 4: Concerns Focus**
prompt="Focus: concerns
Analyze this codebase for technical debt, known issues, and areas of concern.
Write this document to .planning/codebase/:
- CONCERNS.md - Tech debt, bugs, security, performance, fragile areas"
```

**What the skill currently does:** LLM explores files looking for TODO/FIXME, code smells, etc.

**Fallow commands:**
- `fallow check --format json` -- dead code count = tech debt metric
- `fallow dupes --format json` -- duplication hotspots = maintenance burden
- `fallow health --format json` -- complexity hotspots = fragility indicators

**How output feeds in:** The concerns mapper receives quantified tech debt:
- "42 unused exports across 15 files (dead code debt)"
- "8 duplicated code blocks averaging 35 lines each (duplication debt)"
- "5 functions with cyclomatic complexity >20 (fragility hotspots)"
- "3 circular dependency chains (architectural debt)"

CONCERNS.md becomes evidence-based rather than LLM-impression-based.

**Impact:** HIGH -- transforms subjective "this feels like tech debt" into quantified metrics.

#### Integration Point 3: Tech Mapper (Agent 1)

**Exact section (SKILL.md lines 94-112):**
```
**Agent 1: Tech Focus**
prompt="Focus: tech
Analyze this codebase for technology stack and external integrations.
Write these documents to .planning/codebase/:
- STACK.md - Languages, runtime, frameworks, dependencies, configuration"
```

**What the skill currently does:** Reads package.json, config files, etc. to enumerate the stack.

**Fallow command:** `fallow check --format json` (unused dependencies detection)

**How output feeds in:** Fallow identifies unused dependencies -- packages in `package.json` that are never imported. The tech mapper can flag these in STACK.md: "Dependencies: 45 total, 7 unused (candidates for removal)."

**Impact:** MEDIUM -- useful data point but not the core mission of the tech mapper.

---

### 6. plan-work (MEDIUM impact)

**File:** `.claude/skills/plan-work/SKILL.md`

#### Integration Point 1: Step 3 -- Codebase Scouting

**Exact section (SKILL.md lines 108-109):**
```
1. **Scout codebase** for reusable assets -- existing components, utilities, patterns
   that could be leveraged. Use LSP workspaceSymbol to find relevant abstractions
```

**What the skill currently does:** LSP workspace symbol search and findReferences to find existing code to reuse.

**Fallow command:** `fallow dupes --format json`

**How output feeds in:** During planning, Fallow's duplication report reveals which patterns are already duplicated in the codebase. If the plan involves building something similar to existing duplicated code, the planner can recommend extracting a shared abstraction first, then building on it -- rather than creating yet another duplicate.

**Impact:** MEDIUM -- informs better planning decisions but doesn't fundamentally change the workflow.

#### Integration Point 2: Step 6 -- Plan-Check (Scope Sanity)

**Exact section (SKILL.md line 271):**
```
4. **Scope sanity**: 2-3 tasks, 5-8 files in files_modified, plan body under 1500 words.
```

**What the skill currently does:** Checks task count and file count mechanically.

**Fallow command:** `fallow check --format json`

**How output feeds in:** Before finalizing the plan, run Fallow to check if any files in `files_modified` are already dead code (unused). If the plan modifies dead files, it should either remove them or question why they exist. Also flag if the plan creates files that would introduce circular dependencies based on the existing dependency graph.

**Impact:** LOW -- edge case but prevents wasted effort on dead code.

---

### 7. plan-review (MEDIUM impact)

**File:** `.claude/skills/plan-review/SKILL.md`

#### Integration Point 1: Architecture Review (Section 1)

**Exact section (plan-review/SKILL.md lines 161-170):**
```
### Section 1: Architecture Review
- Data flow -- all four paths.
- Coupling concerns. Which components are now coupled that weren't before?
- Single points of failure.
```

**What the skill currently does:** LLM reads the plan and codebase to assess coupling. Manual analysis.

**Fallow command:** `fallow check --format json` (dependency graph, circular dependencies)

**How output feeds in:** The plan reviewer receives the current dependency graph and can evaluate whether the plan's proposed changes would create new circular dependencies or increase coupling. "The plan proposes `src/services/billing.ts` importing from `src/components/PricingCard.tsx` -- this would create a service->component layer violation."

**Impact:** MEDIUM -- valuable for architectural review but the plan-review skill is already interactive and thorough.

#### Integration Point 2: Long-Term Trajectory (Section 6)

**Exact section (plan-review/SKILL.md lines 306-311):**
```
### Section 6: Long-Term Trajectory Review
- Technical debt introduced.
- Path dependency. Does this make future changes harder?
```

**What the skill currently does:** LLM assessment of debt trajectory.

**Fallow commands:** `fallow health --format json` + `fallow check --format json`

**How output feeds in:** Current complexity and dead code metrics provide a baseline. The reviewer can assess: "Current dead code: 5%. This plan adds 12 new exports -- if N of them go unwired, dead code rises to X%."

**Impact:** LOW -- nice context but doesn't fundamentally change the review.

---

### 8. fix (MEDIUM impact)

**File:** `.claude/skills/fix/SKILL.md`

#### Integration Point 1: Triage (Step 1)

**Exact section (SKILL.md lines 46-51):**
```
## Step 1: Triage
1. **Search** for error message or symptom in codebase. Use LSP first:
   - findReferences on the error site to see all callers
   - diagnostics to surface type errors
```

**What the skill currently does:** LSP-driven investigation starting from the error site.

**Fallow command:** `fallow check --format json` (circular dependencies)

**How output feeds in:** If the bug is caused by circular dependencies (a common source of "undefined is not a function" errors at import time), Fallow instantly identifies the cycle. The triage step can check: "Is the error site involved in any circular dependency chain?" If yes, the root cause is likely the cycle, not the code logic.

**Impact:** MEDIUM -- only relevant for a subset of bugs, but when relevant, it's a huge timesaver.

#### Integration Point 2: Post-Fix Review (Step 4)

**Exact section (SKILL.md lines 107-113):**
```
## Step 4: Post-Fix Review
**For MODERATE+ fixes:** Invoke `skills/simplify/` on the fix diff.
```

**What the skill currently does:** Simplify pass on the fix diff (LLM-only).

**Fallow command:** `fallow check --changed-since HEAD~1 --format json`

**How output feeds in:** After fixing a bug, verify no dead code was introduced (common when fixing by moving logic to a new location but forgetting to remove the old export).

**Impact:** LOW -- small incremental improvement.

---

### 9. extract (MEDIUM impact)

**File:** `.claude/skills/extract/SKILL.md`

#### Integration Point 1: Discover Phase

**Exact section (SKILL.md lines 21-28):**
```
2. **Identify patterns**: Look for:
   - **Repeated components**: Similar UI patterns used multiple times
   - **Hard-coded values**: Colors, spacing, typography, shadows
   - **Inconsistent variations**: Multiple implementations of the same concept
   - **Reusable patterns**: Layout patterns, composition patterns
```

**What the skill currently does:** LLM reads code and tries to identify repetition. Limited by context window.

**Fallow command:** `fallow dupes --mode semantic --format json`

**How output feeds in:** Fallow provides the exact list of duplicated code blocks. The extract skill receives: "These 4 button implementations across `src/components/` share 78% semantic similarity." The discover phase becomes data-driven rather than exploratory.

**Impact:** HIGH for the discover phase specifically -- this is duplication detection, which is Fallow's core strength.

#### Integration Point 2: Migrate Phase

**Exact section (SKILL.md lines 74-79):**
```
## Migrate
- **Find all instances**: Use LSP findReferences on each extracted symbol
- **Delete dead code**: Remove the old implementations
```

**What the skill currently does:** LSP findReferences + manual verification.

**Fallow command:** `fallow check --format json` (after extraction, verify old exports are now unused)

**How output feeds in:** After extracting a shared component and migrating consumers, run Fallow to verify the old implementations are genuinely dead (no remaining references). Confirms migration completeness.

**Impact:** MEDIUM -- safety net for migration completeness.

---

### 10. secure (LOW impact)

**File:** `.claude/skills/secure/SKILL.md`

#### Integration Point 1: Dependency Scanning

**Exact section (SKILL.md lines 50-55):**
```
### Agent 3: Data Exposure
Categories: ... unused dependencies
```

**What the skill currently does:** The data exposure scanner looks for hardcoded secrets, PII in logs, etc. Dependency auditing is not its primary focus.

**Fallow command:** `fallow check --format json` (unused dependencies)

**How output feeds in:** Fallow identifies unused dependencies. While not a security tool per se, unused dependencies increase attack surface -- they are in `node_modules`, can have vulnerabilities, and serve no purpose. The security scan could flag: "7 unused dependencies in `package.json` -- each increases attack surface with zero value."

**Impact:** MEDIUM for attack surface reduction, but this is not the secure skill's primary mission. Better suited as a separate check.

---

### 11. audit (MEDIUM impact)

**File:** `.claude/skills/audit/SKILL.md`

#### Integration Point 1: Performance -- Bundle Size

**Exact section (SKILL.md lines 27-28):**
```
- **Bundle size**: Unnecessary imports, unused dependencies
```

**What the skill currently does:** LLM reads code looking for unnecessary imports. No tooling.

**Fallow command:** `fallow check --format json` (unused exports, unused deps)

**How output feeds in:** Fallow quantifies unused code that contributes to bundle size. The audit reports: "23 unused exports across 8 files contribute to dead code in the bundle. 4 unused dependencies add X KB to `node_modules`."

**Impact:** MEDIUM -- provides quantified data for the performance section.

#### Integration Point 2: Patterns & Systemic Issues

**Exact section (SKILL.md lines 84-89):**
```
### Patterns & Systemic Issues
Identify recurring problems:
- "Hard-coded colors appear in 15+ components"
```

**What the skill currently does:** LLM tries to identify patterns across the codebase.

**Fallow command:** `fallow dupes --format json` + `fallow health --format json`

**How output feeds in:** Duplication patterns are systemic issues by definition. Fallow quantifies: "Duplicated code appears in N clusters, averaging M lines each." Complexity hotspots: "5 files exceed complexity threshold of 20."

**Impact:** MEDIUM -- adds quantitative backing to systemic issue detection.

---

### 12. optimize (LOW impact)

**File:** `.claude/skills/optimize/SKILL.md`

#### Integration Point 1: Bundle Size Reduction

**Exact section (SKILL.md lines 52-57):**
```
**Reduce JavaScript Bundle**:
- Tree shaking (remove unused code)
- Remove unused dependencies
- Lazy load non-critical code
```

**What the skill currently does:** Provides guidance but doesn't run analysis.

**Fallow command:** `fallow check --format json`

**How output feeds in:** Fallow identifies what tree shaking should catch but might not (barrel file re-exports, side-effect-ful modules). Also identifies unused deps to remove.

**Impact:** MEDIUM for the specific bundle-size task, but optimize is a broad skill and this is one small section.

---

### 13. health (NONE)

**File:** `.claude/skills/health/SKILL.md`

This skill validates `.planning/` directory integrity (GSD state health), not codebase health. It runs `gsd-tools.cjs validate health` to check PROJECT.md, ROADMAP.md, STATE.md, etc.

**No Fallow integration points.** The skill is about planning metadata, not code.

---

### 14. harden (NONE)

**File:** `.claude/skills/harden/SKILL.md`

This skill is about UI resilience -- text overflow, i18n, error handling, edge cases. It operates at the component/interaction level, not the module/dependency level.

**No Fallow integration points.** Fallow analyzes module-level structure; harden analyzes runtime behavior.

---

### 15. normalize (LOW impact)

**File:** `.claude/skills/normalize/SKILL.md`

#### Integration Point 1: Clean Up Phase

**Exact section (SKILL.md lines 57-59):**
```
## Clean Up
- **Remove orphaned code**: Delete unused implementations, styles, or files
```

**What the skill currently does:** LLM identifies orphaned code after normalization.

**Fallow command:** `fallow check --format json`

**How output feeds in:** After normalizing components to use design system equivalents, Fallow confirms which old implementations are now genuinely unused and safe to delete.

**Impact:** LOW -- small cleanup verification step.

---

## Cross-Cutting Integration Recommendations

### 1. Create a shared Fallow runner utility

Rather than embedding Fallow commands in every skill, create a shared utility that skills can reference:

```
skills/fallow-analysis/SKILL.md
```

This skill would:
- Accept a mode flag: `--full` (all checks) or `--changed` (incremental)
- Run the appropriate combination of `fallow check`, `fallow dupes`, `fallow health`
- Output a structured JSON summary
- Be invokable from other skills as `skills/fallow-analysis/`

### 2. Priority integration order

Based on impact and usage frequency:

1. **simplify** -- highest leverage because it's called by build, refactor, and fix
2. **review (spec-gate unwired-code check)** -- catches the most impactful class of bugs
3. **map-codebase** -- runs once but sets the foundation for all planning
4. **refactor (Step 0 analysis mode)** -- data-driven refactoring targets
5. **review (full review)** -- evidence-backed code quality findings
6. **extract (discover phase)** -- duplication detection is extract's core mission

### 3. Fallow availability check pattern

Every integration should gracefully degrade when Fallow is not installed:

```bash
if command -v fallow &>/dev/null; then
  FALLOW_OUTPUT=$(fallow check --format json 2>/dev/null)
  # ... use output
else
  # proceed without -- all current behavior preserved
fi
```

### 4. What NOT to integrate

- **health** -- wrong domain (planning state, not code)
- **harden** -- wrong level (runtime behavior, not module structure)
- **todos** -- task tracking, not analysis
- **onboard**, **delight**, **colorize**, **ui-animate**, **ui-critique**, **ui-redesign** -- UI/UX skills that don't analyze code structure
- **setup**, **settings**, **help**, **progress**, **resume-work**, **tracker** -- workflow/meta skills

---

## Fallow Command Reference for Implementers

| Command | What it returns | Skills that consume it |
|---------|----------------|----------------------|
| `fallow check --format json` | Unused exports, files, deps, types; circular deps | review, simplify, refactor, build/spec-gate, map-codebase, plan-work, extract, secure, audit, optimize, normalize |
| `fallow check --changed-since SHA --format json` | Same as above, scoped to changed files | review (incremental), build/spec-gate (per-wave), fix (post-fix) |
| `fallow dupes --format json` | Duplicated code blocks with locations | simplify, refactor, extract, map-codebase, audit |
| `fallow dupes --mode semantic --format json` | Semantic clones (renamed variables) | simplify, refactor, extract |
| `fallow health --format json` | Complexity metrics, hotspot files | review, simplify, refactor, map-codebase, plan-review, audit |

---

## Confidence Assessment

| Finding | Confidence | Rationale |
|---------|-----------|-----------|
| Fallow `check` fits review/spec-gate unwired code | HIGH | The current LLM-only approach is a known weakness; Fallow directly addresses it |
| Fallow `dupes` fits simplify/extract | HIGH | Duplication detection is Fallow's core feature and the skills explicitly ask for it |
| Fallow `health` fits map-codebase concerns | HIGH | Complexity metrics are standard tech debt indicators |
| Fallow circular dep detection fits review arch criteria | HIGH | LLM cannot trace full import graphs from diffs |
| Fallow `check` fits secure skill | LOW | Unused deps are a minor attack surface concern; not security-critical |
| Fallow JSON output format specifics | LOW | Based on web search; verify exact flags and output schema against Fallow docs |
