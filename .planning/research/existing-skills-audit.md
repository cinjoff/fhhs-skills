# Existing Skills Audit: Code Analysis Capabilities

**Audited:** 2026-03-25
**Scope:** All skills in `.claude/skills/` that perform code analysis, exploration, or understanding
**Total skills examined:** 44
**Skills with code analysis capabilities:** 18

---

## Executive Summary

The fhhs-skills plugin has **no static analysis tooling**. Every skill that analyzes code relies on one or more of these mechanisms:

1. **LLM pattern matching on raw text** -- Claude reads source code and applies judgment (the dominant approach)
2. **grep/Glob text search** -- finding patterns by string matching (file names, content patterns)
3. **git diff** -- scoping analysis to changed code
4. **LSP calls** -- `findReferences`, `goToDefinition`, `hover`, `documentSymbol`, `workspaceSymbol`, `rename` (used by fix, refactor, extract, plan-work, build subagents)
5. **Runtime commands** -- `npm test`, `npm run build`, `npm run lint`, `tsc` (evidence collection, not analysis)
6. **Sentry local store** -- querying runtime errors from SQLite

**LSP is the closest thing to semantic analysis**, but it is used opportunistically ("use LSP first" appears in fix, refactor, extract, plan-work, and the implementer-prompt template). It provides type info and reference resolution but NOT:
- Call graph analysis beyond direct callers/callees
- Dead code detection
- Complexity metrics
- Dependency cycle detection
- Data flow analysis
- Impact analysis across transitive dependencies

---

## Skills with Code Analysis Capabilities

### Tier 1: Primary Code Analysis Skills

These skills exist specifically to analyze code quality, structure, or correctness.

| Skill | Purpose | Analysis Method | LSP? | Grep? | Diff? | Runtime? |
|-------|---------|----------------|------|-------|-------|----------|
| **review** | Code review (quality, security, gaps) | LLM reads diff + subagents | No | Yes (TS `any`/`as` patterns) | Yes (branch diff) | Yes (test/build/lint) |
| **secure** | OWASP security scan | 4 parallel LLM agents read files | No | No | Yes (changed files) | No |
| **audit** | UI quality audit (a11y, perf, theming) | LLM reads component files | No | No | No | No |
| **simplify** | Code reuse/quality/efficiency review | 3 parallel LLM agents read diff | No | No | Yes | No |
| **plan-review** | Plan stress-testing | LLM reads plan + codebase | No | Yes (FIXME/TODO) | Yes (branch diff) | No |

### Tier 2: Skills That Analyze Code as Part of a Larger Workflow

These skills include code analysis as a step within a broader operation.

| Skill | Purpose | Analysis Method | LSP? | Grep? | Diff? | Runtime? |
|-------|---------|----------------|------|-------|-------|----------|
| **fix** | Bug triage and fix | LLM + LSP for triage, TDD for fix | **Yes** (findReferences, hover, goToDefinition, diagnostics) | Yes (error search) | No | Yes (test suite) |
| **refactor** | Code restructuring | LLM + LSP for scope analysis | **Yes** (findReferences, incomingCalls, outgoingCalls, documentSymbol, rename) | No | No | Yes (test suite) |
| **build** | Plan execution | Subagents use LSP per implementer-prompt | **Yes** (via subagent template) | No | Yes (per-wave) | Yes (test/build) |
| **build (spec-gate)** | Post-wave verification | Code-reviewer agent reads wave diff | No | No | Yes (wave diff) | No |
| **map-codebase** | Codebase documentation | 4 mapper agents explore files | No | Yes (file discovery) | No | No |
| **plan-work** | Feature planning | LLM scouts codebase for reuse | **Yes** (workspaceSymbol, findReferences) | No | No | No |
| **extract** | Design system extraction | LLM finds patterns + LSP for migration | **Yes** (workspaceSymbol, findReferences, rename) | Yes (pattern discovery) | No | No |

### Tier 3: Skills With Incidental Code Reading

These skills read code but don't perform structured analysis.

| Skill | Purpose | How it reads code |
|-------|---------|-------------------|
| **normalize** | Design system alignment | Reads components to find deviations from tokens |
| **optimize** | Performance improvement | Reads code for perf anti-patterns |
| **harden** | Edge case resilience | Reads code for error handling gaps |
| **nextjs-perf** | Next.js patterns reference | Reference doc, not active analyzer |
| **observability** | Runtime error inspection | Queries Sentry SQLite store |
| **progress** | State integrity check | Compares STATE.md claims vs disk files |

---

## Detailed Analysis by Skill Category

### Code Review: `review`

**How it analyzes code:**
- Step 1: `git diff --stat` to scope the diff
- Step 1.5: Sentry local store query for runtime errors in changed files
- Step 2: Dispatches 3 parallel subagents that **read the raw diff text**:
  - Agent 1 (code-reviewer): Reads diff, applies review-prompt.md criteria
  - Agent 2 (security): 4 sub-scanners read changed files against OWASP checklist
  - Agent 3 (gap analysis): Reads diff for untested paths, unhandled errors
- Step 3: Goal verification via grep/file-exists checks against must_haves
- Step 4: Runs `npm test`, `npm run build`, `npm run lint`
- Step 5: `grep` for `any` and `as` keywords in diff added lines

**What it catches:** Naming issues, structural problems, error handling gaps, DRY violations, security patterns, TypeScript strictness violations, missing tests.

**Gaps where static analysis would help:**
- **Circular dependency detection** -- review checks "dependency direction" but relies on LLM reading imports. A tool like `madge` or `dpdm` would catch cycles definitively.
- **Dead code detection** -- review checks for "unwired code" but the LLM can only see what's in the diff. Static analysis (e.g., `ts-prune`, `knip`) catches unused exports project-wide.
- **Complexity metrics** -- review evaluates "complexity" subjectively. Cyclomatic complexity scores would give objective thresholds.
- **Type coverage** -- grep for `any` catches explicit `any` but misses implicit `any` from missing annotations. `typescript-coverage-report` or `type-coverage` would catch both.
- **Bundle size impact** -- no analysis of import cost. `import-cost` or bundle analyzer integration would surface this.

**Priority for static analysis improvement: HIGH** -- review is the quality gate. False negatives here propagate.

---

### Security Scan: `secure`

**How it analyzes code:**
- Scopes to changed files via `git diff --name-only`
- 4 parallel LLM agents each read the full file contents
- Each agent has a category assignment (injection, auth, data exposure, access control)
- Agents pattern-match against their OWASP checklist categories

**What it catches:** SQL injection, XSS, hardcoded secrets, missing auth, IDOR, CSRF, verbose errors, permissive CORS.

**Gaps where static analysis would help:**
- **Secret detection** -- LLM-based secret scanning has false negatives. Tools like `gitleaks`, `trufflehog`, or `detect-secrets` use entropy analysis and known patterns more reliably.
- **Dependency vulnerability scanning** -- `npm audit`, `snyk`, or `osv-scanner` catch known CVEs in dependencies. The skill doesn't check this at all.
- **SQL injection detection** -- taint analysis tools can trace user input to query construction paths more reliably than LLM pattern matching.
- **Regex-based pattern scanning** -- `semgrep` with OWASP rules would catch patterns the LLM misses when reading large diffs.

**Priority for static analysis improvement: HIGH** -- security findings must not have false negatives.

---

### Bug Fixing: `fix`

**How it analyzes code:**
- Step 0: Sentry local store for runtime errors
- Step 1 (Triage): **Uses LSP extensively** -- `findReferences` on error site, `hover` for type info, `goToDefinition` to trace imports, `diagnostics` for type/lint errors
- Dispatches debugger agents for PARALLEL/COMPLEX bugs
- Step 2: TDD fix cycle (run tests)

**What it catches:** Bugs via symptom tracing, type mismatches, import chains, caller relationships.

**Gaps where static analysis would help:**
- **Call graph visualization** -- LSP gives immediate callers/callees but not the full transitive graph. For COMPLEX bugs spanning multiple subsystems, a full call graph would help triage faster.
- **Data flow tracing** -- "where does this value come from?" requires manual LSP-hopping through multiple goToDefinition calls. Static taint/data-flow analysis would surface the full chain.
- **Change impact analysis** -- "what breaks if I change this function signature?" requires findReferences + reading each site. Static impact analysis tools handle this systematically.

**Priority for static analysis improvement: MEDIUM** -- LSP already provides good coverage. Improvements would help COMPLEX-tier bugs most.

---

### Refactoring: `refactor`

**How it analyzes code:**
- Step 0: Delegates to `simplify` to find candidates (LLM reads code)
- Step 1 (Scope): **Uses LSP heavily** -- `findReferences`, `incomingCalls`/`outgoingCalls` for call graph, `documentSymbol` for file structure, `rename` for atomic multi-file renames
- Step 2: Characterization tests via test suite
- Step 4: Uses `findReferences` before each modification, LSP `rename` for symbol renames

**What it catches:** Blast radius of changes, all usage sites, call relationships.

**Gaps where static analysis would help:**
- **Dependency graph visualization** -- LSP gives call relationships, but a full module dependency graph (like `dependency-cruiser` output) would help plan large refactors across subsystems.
- **Code duplication detection** -- `simplify` uses LLM agents to find duplicates, but tools like `jscpd` can detect copy-paste patterns with exact line ranges more systematically.
- **Unused exports/dead code** -- after refactoring, some exports may become unused. `knip` or `ts-prune` would catch these.
- **Complexity before/after** -- no metrics to prove the refactoring actually reduced complexity.

**Priority for static analysis improvement: MEDIUM** -- LSP is well-leveraged here. Static analysis would add metrics and systematic detection.

---

### Codebase Mapping: `map-codebase`

**How it analyzes code:**
- 4 parallel mapper agents explore the codebase by reading files
- Tech mapper: reads config files, package.json, dependency files
- Architecture mapper: reads directory structure, entry points, data flow
- Quality mapper: reads conventions, test patterns
- Concerns mapper: reads for tech debt, fragile areas

**What it catches:** Project structure, tech stack, conventions, known concerns.

**Gaps where static analysis would help:**
- **Dependency graph** -- mappers describe architecture textually. An actual dependency graph (module-level) would be authoritative rather than inferred.
- **Code metrics** -- lines of code, complexity per module, test coverage percentages would ground the mapping in data.
- **Hotspot analysis** -- `git log` + churn metrics identify which files change most frequently (fragility indicators).
- **Architecture boundary enforcement** -- tools like `dependency-cruiser` with rules can verify architectural layers aren't violated.

**Priority for static analysis improvement: HIGH** -- codebase mapping produces reference documents used by all other skills. Grounding them in data rather than LLM inference would improve everything downstream.

---

### Plan Work: `plan-work`

**How it analyzes code:**
- Step 3 (Discuss Implementation): Uses LSP `workspaceSymbol` to find reusable abstractions, `findReferences` to see usage patterns
- Checks for `playwright.config.*` existence

**Gaps where static analysis would help:**
- **Reusable asset discovery** -- `workspaceSymbol` searches by name, but doesn't surface similar implementations or duplicate patterns. AST-level similarity analysis would find reuse candidates more reliably.
- **Impact estimation** -- "how many files will this touch?" requires LSP reference-hopping. A dependency graph would answer this immediately.

**Priority for static analysis improvement: MEDIUM** -- LSP provides basic scouting. Better tooling would improve estimation accuracy.

---

### Build (Spec Gate): `build/spec-gate-prompt`

**How it analyzes code:**
- Reads `git diff` for the wave
- LLM compares implementation against task specifications
- Checks for stubs, placeholders, unwired code, TypeScript strictness
- Lightweight security scan (string concatenation in SQL, hardcoded secrets, auth bypass, XSS)

**Gaps where static analysis would help:**
- **Stub/placeholder detection** -- currently LLM-based. AST analysis could definitively identify functions that return hardcoded values, empty catch blocks, or TODO comments.
- **Unwired code detection** -- "files created but never imported" could be caught by `knip` or dead-code analysis rather than LLM inference.
- **TypeScript strictness** -- `tsc --noImplicitAny` output would be more reliable than LLM grep.

**Priority for static analysis improvement: HIGH** -- the spec gate is the build pipeline's quality checkpoint. Automated checks would be faster and more reliable than LLM inference.

---

### Simplify: `simplify` (internal skill)

**How it analyzes code:**
- 3 parallel LLM review agents read the git diff
- Agent 1: Code reuse (finds duplicates of existing utilities)
- Agent 2: Code quality (parameter sprawl, copy-paste, nesting)
- Agent 3: Efficiency (redundant computations, N+1, concurrency)

**Gaps where static analysis would help:**
- **Duplicate detection** -- `jscpd` would find exact/near-exact copy-paste patterns more reliably.
- **Complexity metrics** -- objective numbers instead of subjective "this feels complex."
- **Unused import detection** -- `eslint` with `no-unused-imports` would catch this automatically.

**Priority for static analysis improvement: MEDIUM** -- simplify runs as a pipeline step in build/refactor/fix. Faster automated checks could replace some LLM agent work.

---

### Extract (Design System): `extract`

**How it analyzes code:**
- Uses LSP `workspaceSymbol` to find existing components/utilities
- Falls back to grep for pattern discovery
- Uses `findReferences` during migration to find all usage sites
- Uses LSP `rename` for atomic updates

**Gaps where static analysis would help:**
- **Component similarity detection** -- finding "similar UI patterns used multiple times" currently relies on LLM reading code. AST-based component structure comparison would be more systematic.
- **Design token extraction** -- finding "hard-coded values that should be tokens" requires reading CSS/JSX. A tool that parses all color/spacing/font values and clusters them would be more complete.

**Priority for static analysis improvement: LOW** -- extract is a specialized UI skill used infrequently.

---

## Summary: Where Static Analysis Would Help Most

### Priority Rankings

| Rank | Skill | Current Gap | Static Analysis Opportunity | Impact |
|------|-------|-------------|----------------------------|--------|
| 1 | **review** | Circular deps, dead code, complexity, type coverage, bundle size -- all LLM-guessed | `dependency-cruiser`, `knip`, complexity metrics, `type-coverage` | HIGH -- quality gate for all code |
| 2 | **build (spec-gate)** | Stubs, unwired code, TS strictness -- LLM-inferred from diff | Dead code analysis, `tsc --noImplicitAny`, stub detection | HIGH -- build pipeline checkpoint |
| 3 | **map-codebase** | Architecture described textually, no metrics | Dependency graph, code metrics, churn analysis | HIGH -- reference docs for all skills |
| 4 | **secure** | Secret detection, dependency vulns, injection tracing -- LLM pattern match | `gitleaks`, `npm audit`, `semgrep` | HIGH -- security false negatives are dangerous |
| 5 | **fix** | Full call graph, data flow tracing for complex bugs | Call graph analysis, taint analysis | MEDIUM -- LSP covers simple/moderate cases |
| 6 | **refactor** | Dependency graph, duplication detection, complexity metrics | `dependency-cruiser`, `jscpd`, complexity tools | MEDIUM -- LSP well-leveraged already |
| 7 | **simplify** | Duplicate detection, complexity metrics | `jscpd`, complexity metrics | MEDIUM -- pipeline step, speed matters |
| 8 | **plan-work** | Reusable asset discovery, impact estimation | Similarity analysis, dependency graph | MEDIUM -- planning accuracy |
| 9 | **extract** | Component similarity, token extraction | AST component comparison | LOW -- specialized, infrequent |

---

## Current Analysis Approach Patterns

### What Works Well

1. **LSP integration in fix/refactor/extract/plan-work** -- provides real semantic understanding (type info, references, definitions). These skills are meaningfully better than grep-only approaches.

2. **Parallel subagent architecture** -- review, secure, simplify, and map-codebase all dispatch multiple agents in parallel, each with fresh context and focused scope. This scales analysis without context exhaustion.

3. **Git diff scoping** -- most analysis skills scope to changed code via `git diff`, avoiding the "analyze everything" trap.

4. **Runtime evidence collection** -- review runs `npm test/build/lint` for ground-truth evidence. Sentry local store integration in fix/review/build provides runtime error context.

### What Is Missing

1. **No persistent code model** -- every skill re-reads and re-analyzes from scratch. There is no shared understanding of the codebase's dependency graph, complexity profile, or coverage map that persists across skills or sessions.

2. **No quantitative metrics** -- all quality assessments are qualitative (LLM judgment). No cyclomatic complexity, no test coverage percentages, no bundle size numbers, no dependency depth counts.

3. **No architectural rule enforcement** -- the architecture is described in text (via map-codebase) but never enforced. There are no dependency rules preventing layer violations.

4. **No differential impact analysis** -- "what will this change break?" requires manual LSP-hopping. A precomputed dependency graph would answer this instantly.

5. **No dead code detection** -- multiple skills look for "unwired code" or "unused exports" but always via LLM inference rather than definitive tooling.

6. **No automated security scanning beyond LLM** -- the `secure` skill is LLM-only. No integration with `npm audit`, `gitleaks`, `semgrep`, or similar tools that have deterministic rulesets.

---

## Concrete Opportunities for Static Analysis Integration

### Quick Wins (could be added to existing skills with minimal restructuring)

| Tool/Check | Where to Add | What It Provides | Effort |
|------------|-------------|------------------|--------|
| `tsc --noEmit --strict` output | review Step 5, spec-gate | Definitive TS strictness violations | Low |
| `npm audit --json` | secure Step 2 | Known dependency vulnerabilities | Low |
| `npx knip --reporter json` | review, spec-gate | Unused exports, files, dependencies | Low |
| `git log --format="%H" --diff-filter=M -- {file} \| wc -l` | map-codebase (concerns agent) | File churn/hotspot data | Low |
| `npx jscpd --reporters json` | simplify Agent 1 | Exact duplicate detection | Low |

### Medium Effort (new tooling integration)

| Tool/Check | Where to Add | What It Provides | Effort |
|------------|-------------|------------------|--------|
| `dependency-cruiser` with rules | review (architecture), map-codebase | Module dependency graph, cycle detection, layer violation detection | Medium |
| `semgrep` with OWASP rules | secure Step 2 (alongside LLM agents) | Deterministic pattern-based security scanning | Medium |
| `gitleaks` | secure Step 2 or pre-commit | Secret detection with entropy analysis | Medium |
| Complexity metrics (e.g., `es-complexity`) | review, simplify | Cyclomatic/cognitive complexity per function | Medium |

### Larger Investments (new infrastructure)

| Investment | Benefits | Skills Affected |
|------------|---------|-----------------|
| Persistent dependency graph (build once, query many times) | Instant impact analysis, architectural enforcement, dead code detection | review, fix, refactor, plan-work, map-codebase, build |
| Test coverage integration (`c8`/`istanbul` JSON output) | Coverage-aware review, TDD verification, gap detection | review, fix, build (spec-gate) |
| AST-based code analysis service | Component similarity, pattern detection, structural metrics | extract, simplify, map-codebase, normalize |

---

## Key Insight

The plugin's strength is its **orchestration architecture** -- parallel subagents, lean orchestrators, fresh context per domain. Static analysis tools would slot naturally into this architecture as **pre-computed inputs** to existing LLM agents rather than replacing them. For example:

- The `review` skill's code-reviewer agent would become more effective if it received a dependency graph and complexity report alongside the diff
- The `secure` skill's 4 scanner agents would be more reliable if they received `npm audit` and `gitleaks` output as pre-filtered findings to verify
- The `spec-gate` would be faster and more reliable if `knip` output (unused exports) and `tsc --strict` output replaced the LLM's grep-based TS checks

The LLM agents would still provide the judgment layer (is this finding actually a problem? what's the right fix?). Static analysis provides the **ground truth layer** (these are definitively the unused exports, these are the exact cyclomatic complexity scores, these are the known CVEs).
