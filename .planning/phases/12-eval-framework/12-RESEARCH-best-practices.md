# Phase 12: Eval Framework Best Practices - Research

**Researched:** 2026-03-29
**Domain:** AI agent skill evaluation, Claude Code plugin evals, observability testing
**Confidence:** HIGH (existing codebase analysis) / MEDIUM (external best practices)

## Summary

This research covers best practices for evaluating AI agent skills, synthesized from Anthropic's official skill-creator documentation, the fhhs-skills existing eval infrastructure (210+ evals, `run_all_evals.py`), community patterns from practitioners, and industry observability standards. The existing eval infrastructure is already well-engineered with keyword heuristics, LLM grading, deterministic checks, baselines, and regression detection. The primary gaps are: (1) no context-efficiency testing, (2) no observability-specific evals, (3) no A/B comparison framework, and (4) trigger-precision testing is absent since fhhs-skills uses explicit `/fh:` invocation rather than routing-based triggering.

**Primary recommendation:** Focus eval framework improvements on three areas: observability-specific evals that verify metrics/reporting output, context-efficiency evals that measure token waste, and deterministic check expansion to reduce LLM grading costs.

## Claude Code Eval Patterns

### Official Skill-Creator Eval Architecture (Anthropic, March 2026)

Anthropic's skill-creator operates in 4 modes: **Create**, **Eval**, **Improve**, **Benchmark**. The eval pipeline uses 4 composable sub-agents working in parallel (Confidence: HIGH - official Anthropic blog):

| Agent | Role | fhhs-skills Equivalent |
|-------|------|----------------------|
| Executor | Runs skill against test prompts | `run_single_eval()` in `run_all_evals.py` |
| Grader | Evaluates output against assertions with PASS/FAIL + evidence | `grade_assertion()` + `llm_grader.py` |
| Comparator | Blind A/B comparison between skill versions | NOT IMPLEMENTED |
| Analyzer | Surfaces patterns aggregate stats hide | NOT IMPLEMENTED |

### Eval JSON Format Comparison

**Anthropic's trigger eval format** (simple routing test):
```json
{
  "query": "Design a card component",
  "should_trigger": true,
  "note": "core use case"
}
```

**fhhs-skills format** (behavioral eval, more comprehensive):
```json
{
  "id": 1,
  "command": "build",
  "prompt": "...",
  "expected_output": "...",
  "assertions": [
    { "text": "Identifies 2 waves from dependencies", "type": "behavioral" },
    { "text": "Does NOT invoke X directly", "type": "guard" }
  ],
  "checks": [
    { "type": "required_terms", "terms": ["wave", "task"] },
    { "type": "forbidden_terms", "terms": ["skip testing"] }
  ],
  "fixture": "nextjs-app-deep",
  "tier": "smoke",
  "tags": ["guard", "happy-path"]
}
```

**Assessment:** fhhs-skills eval format is MORE sophisticated than Anthropic's official format. It supports behavioral assertions, guard rails, ordering checks, deterministic term checks, fixture selection, tiering, and tagging. No format changes needed.

### Two Types of Evals (Anthropic's Framework)

1. **Trigger evals** -- does the skill activate when it should? Uses `should_trigger` boolean.
2. **Quality evals** -- given the skill is active, does it produce good output? Uses assertions.

fhhs-skills only needs quality evals since skills are explicitly invoked via `/fh:{name}`. Trigger precision is irrelevant for this plugin architecture. However, the concept maps to **misrouting evals** -- does the skill correctly refuse or redirect when invoked for the wrong task?

### Benchmark Mode

Anthropic's benchmark mode tracks per-eval:
- **Pass rate** (percentage of assertions passed)
- **Elapsed time** (execution duration)
- **Token usage** (input + output + cache tokens)

fhhs-skills ALREADY tracks all three via `run_all_evals.py` token_info extraction and baselines.json comparison. The existing infrastructure is at parity with Anthropic's benchmark capabilities.

## Cost-Effective Eval Design

### Grading Strategy Hierarchy (Confidence: HIGH - based on existing codebase analysis)

| Strategy | Cost | Speed | Accuracy | When to Use |
|----------|------|-------|----------|-------------|
| **Deterministic checks** (required_terms, forbidden_terms, regex) | $0 | Instant | HIGH for presence/absence | Always run FIRST as gate |
| **Keyword heuristics** (concept matching, match_ratio threshold) | $0 | Instant | MEDIUM (60-75% agreement with human) | Default grader for most evals |
| **LLM grader** (Haiku via `claude -p`) | ~$0.002/eval | 2-5s | HIGH (85-95% agreement) | Nuanced behavioral assessment |
| **Human review** | $$$$ | Minutes | Highest | New eval validation, ambiguous cases |

### Current fhhs-skills Grading Architecture

The existing architecture is well-designed with a layered approach:

1. **Deterministic checks run FIRST** -- `run_deterministic_checks()` gates eval before any assertion grading. If required_terms are missing or forbidden_terms are present, the eval fails immediately without LLM costs.

2. **Keyword heuristics as default** -- `grade_assertion()` uses concept extraction with stop-word filtering and match_ratio thresholds (0.35 for long assertions, 0.45 for short). Assertion types (behavioral, guard, ordering, output, context_discipline) each have specialized grading logic.

3. **LLM grading as opt-in** -- `--grader llm` flag switches to `llm_grader.py` which uses Haiku for semantic evaluation. Falls back to keyword grading on LLM failure.

### Recommendations for Cost Optimization

**Expand deterministic checks to reduce LLM dependency:**

| Current Check Types | Proposed Additions |
|--------------------|--------------------|
| `required_terms` | `required_sequence` -- ordered terms (replaces some ordering assertions) |
| `forbidden_terms` | `file_reference` -- checks that specific file paths appear in output |
| `regex` | `json_schema` -- validates JSON output structure |
| | `section_present` -- checks for markdown sections (## heading) |
| | `token_budget` -- fails if output exceeds token count (for efficiency evals) |

**Cost per full suite run (210+ evals):**
- Keyword only: ~$5-8 (just `claude -p` execution, no grading cost)
- LLM grading: ~$6-10 additional (Haiku at $0.002/eval)
- Deterministic-heavy: same $5-8, higher accuracy on structural checks

**Actionable:** For every new eval, write deterministic checks FIRST. Only add keyword/LLM assertions for genuinely semantic checks that cannot be reduced to term presence.

### When to Use LLM Grading

Use LLM grading for:
- Assertions about reasoning quality ("correctly identifies root cause")
- Guard assertions where negation detection is unreliable
- New evals during development (validate keyword grader accuracy)
- Regression investigation (when keyword grading disagrees with expectations)

Do NOT use LLM grading for:
- Structural output checks (file paths, section headers)
- Presence/absence of specific terms
- Ordering checks (already handled by positional matching)
- Routine CI runs (keyword grading is sufficient for regression detection)

## Fixture Design for Agent Evals

### Current Fixture Architecture (Confidence: HIGH)

fhhs-skills uses 3 fixture directories (plus 3 new auto-* fixtures from Plan 12-01):

| Fixture | Contents | Used By |
|---------|----------|---------|
| `nextjs-app-deep` | Full project: .planning/, src/, package.json, tsconfig, e2e/ | Default for most evals |
| `minimal-gsd` | .planning/ + CLAUDE.md + src/ | Lightweight GSD-only evals |
| `broken-project` | .planning/ + broken package.json + src/ | Error handling evals |
| `auto-corrupt-state` | .planning/ with corrupt .auto-state.json | Auto corrupt recovery eval |
| `auto-milestone-done` | .planning/ with all phases complete | Auto milestone detection eval |
| `auto-walk-away` | .planning/ with bare project, no phases started | Auto walk-away eval |

### Fixture Design Best Practices

**Principle 1: Fixture per scenario, not per skill.** Multiple skills can share the same fixture if they're testing behavior in the same project context. The `nextjs-app-deep` fixture is correctly used as a shared default.

**Principle 2: Fixtures should be self-consistent.** Every `.planning/STATE.md` must match the ROADMAP phases. Every `package.json` must have dependencies that match the source files referenced. Plan 12-01 Task 3 correctly specifies this.

**Principle 3: Minimal fixtures for edge cases.** Don't copy the full `nextjs-app-deep` for a test that only needs `.planning/` state. The `minimal-gsd` and `broken-project` fixtures follow this pattern correctly.

**Principle 4: Use `scenario_requires` for non-fixture scenarios.** The existing `no_gsd_project` scenario creates a temp directory without `.planning/` -- this is cleaner than maintaining a fixture that's just an empty directory.

### Recommended New Fixtures for Observability/Context Testing

| Fixture | Contents | Purpose |
|---------|----------|---------|
| `large-codebase` | 50+ source files across nested directories, realistic depth | Context-efficiency testing: does the agent use search over sequential reads? |
| `observability-project` | .planning/ with activity events, .auto-state.json with token metrics, cost data | Observability dashboard/tracker evals |
| `multi-phase-active` | .planning/ with 5+ phases, mixed statuses, complex dependencies | Progress/tracker complexity evals |

**Key insight for orchestration skill testing:** Orchestration skills (auto, build, plan-work) are the hardest to eval because they describe multi-step plans rather than producing concrete outputs. The existing approach (behavioral trace description via `claude -p`) is the right pattern. The eval asks "describe your step-by-step plan" rather than executing it, which keeps evals fast ($0.02-0.05 each) and deterministic.

## Observability Testing Patterns

### What to Test in Observability Skills (Confidence: MEDIUM)

Observability for AI agents differs from traditional APM. Key dimensions to eval:

| Dimension | What to Verify | Check Type |
|-----------|---------------|------------|
| **Activity feed** | Agent mentions reading/checking activity events | required_terms |
| **Cost tracking** | Output includes cost figures or cost analysis | regex for `\$\d+` patterns |
| **Token usage** | Output references token counts or efficiency | required_terms: ["token", "usage" or "cost"] |
| **Step duration** | Output includes timing data | regex for duration patterns |
| **Progress percentage** | Output calculates completion status | regex for `\d+%` or fraction patterns |
| **Error detection** | Agent identifies stuck/failed steps | behavioral assertion |
| **Trend analysis** | Agent compares current vs historical metrics | behavioral assertion |

### Industry Patterns (Confidence: MEDIUM - from web research)

From the State of Agent Engineering (LangChain, 2026):
- 89% of organizations have observability for agents
- 62% have detailed tracing (inspect individual steps and tool calls)
- Only 52% run systematic evals (observability adoption outpaces eval adoption)
- Hybrid approach is standard: LLM-as-judge for breadth, human review for depth

Key metrics that matter for AI agent observability:
1. **Cost per task** -- total API spend per completed unit of work
2. **Token efficiency** -- ratio of useful output tokens to total input tokens
3. **Step count** -- number of tool calls per task (fewer = more efficient)
4. **Cache hit rate** -- percentage of input tokens served from cache
5. **Error recovery rate** -- percentage of failures that auto-recover

### Proposed Observability Eval Structure

```json
{
  "id": "obs-01",
  "command": "tracker",
  "fixture": "observability-project",
  "prompt": "show me the auto run progress and cost breakdown",
  "assertions": [
    { "text": "Reads .auto-state.json for current progress", "type": "behavioral" },
    { "text": "Calculates total cost from step data", "type": "behavioral" },
    { "text": "Shows per-phase cost breakdown", "type": "output" },
    { "text": "Identifies most expensive phase", "type": "behavioral" }
  ],
  "checks": [
    { "type": "required_terms", "terms": ["cost", "phase"] },
    { "type": "regex", "pattern": "\\$\\d+\\.\\d{2}" }
  ]
}
```

## Context Caching and Efficiency Eval Patterns

### What "Context Efficiency" Means for fhhs-skills (Confidence: MEDIUM)

Context efficiency testing verifies that an agent uses tools wisely:
- Uses `ctx_search` instead of sequential `Read` calls for large files
- Uses `Grep`/`Glob` for discovery instead of reading entire directories
- Avoids reading the same file multiple times
- Uses context-mode batch operations when available

### Proposed Context-Efficiency Eval Approach

**Strategy: Behavioral trace analysis.** Since evals ask for step-by-step behavioral plans, check that the trace describes efficient tool usage.

| Anti-Pattern | Detection Check |
|-------------|-----------------|
| Reading all files in a directory | forbidden_terms: ["read every file", "read all files", "read each file one by one"] |
| Ignoring search capabilities | required_terms: ["grep", "glob", "search"] for discovery tasks |
| Sequential reads for known-location data | behavioral assertion: "Uses targeted reads for specific files" |
| Redundant reads | guard: "Does NOT re-read files already loaded" |

**New assertion type proposal:** `context_discipline`

This assertion type already exists in the grading system (line 398 of `run_all_evals.py` -- falls through to keyword matching). Formalize it:

```json
{
  "text": "Uses Grep/Glob for file discovery instead of reading directory contents",
  "type": "context_discipline"
}
```

**Context-discipline checks for auto/orchestration skills:**
```json
{
  "type": "forbidden_terms",
  "terms": ["read every file in", "cat all files", "read the entire"]
},
{
  "type": "required_terms",
  "terms": ["search", "grep"]
}
```

### Token Budget Enforcement

Propose a new deterministic check type for run_all_evals.py:

```python
# New check type: token_budget
elif check_type == "token_budget":
    max_tokens = check.get("max_output_tokens", 5000)
    actual = eval_result.get("tokens", {}).get("output_tokens", 0)
    passed = actual <= max_tokens
    results.append({
        "check_type": check_type,
        "passed": passed,
        "detail": f"Output tokens {actual} vs budget {max_tokens}",
    })
```

This enables cost-efficiency testing: if a skill is supposed to produce a concise report, enforce that it doesn't generate 10K tokens of verbose output.

## Architecture Patterns

### Eval Pyramid (Recommended Structure)

```
                    /\
                   /  \  LLM Grading (5-10% of evals)
                  /    \  Nuanced semantic checks
                 /------\
                /        \  Keyword Heuristics (60-70%)
               /          \  Concept matching, guard logic
              /------------\
             /              \  Deterministic Checks (100% of evals)
            /                \  required_terms, forbidden_terms, regex
           /------------------\
```

Every eval should have deterministic checks as a baseline. Keyword heuristics cover the majority of assertions. LLM grading is reserved for cases where semantic understanding is required.

### Eval Tiering Strategy

| Tier | Purpose | Run When | Time | Cost |
|------|---------|----------|------|------|
| `micro` | Smoke test, 1 eval per key skill | Every iteration of auto-improve | ~30s | ~$0.50 |
| `smoke` | Core paths, includes micro | Before committing skill changes | ~5min | ~$3 |
| `full` | All evals | Before release, after upstream sync | ~20min | ~$8-12 |

This tiering already exists in run_all_evals.py. The recommendation is to ensure every new eval gets a tier assignment and that `micro` tier covers at least one eval per skill in COMMAND_MAP.

### A/B Comparison (Not Yet Implemented)

Anthropic's comparator agent pattern for blind skill comparison:

1. Run eval set against **Version A** (current skill)
2. Run eval set against **Version B** (modified skill)
3. Comparator receives both outputs WITHOUT labels
4. Comparator judges which output is better, produces winner report

**Implementation path for fhhs-skills:**
- Add `--compare <baseline-run-dir>` flag to run_all_evals.py
- Load graded_results.json from baseline and current run
- Per eval: compare pass rates, token usage, duration
- Print comparison table with improvement/regression indicators

This is lower priority than observability evals and context-efficiency testing but aligns with Anthropic's direction.

## Common Pitfalls

### Pitfall 1: Over-Relying on Keyword Matching for Semantic Checks
**What goes wrong:** Keyword grader passes because the right words appear, but the output's reasoning is wrong. Example: "research before brainstorming" assertion passes because both words appear, but the output describes brainstorming before research.
**How to avoid:** Use `ordering` assertion type for sequence-dependent checks. Use deterministic `required_sequence` checks for strict ordering. Reserve keyword matching for presence/absence only.
**Warning signs:** High keyword pass rate but low LLM grader agreement.

### Pitfall 2: Assertion Text That's Too Specific
**What goes wrong:** Assertion text matches one specific phrasing, but the model uses synonyms. "Detects missing .planning/PROJECT.md" fails because the model says "notices no PROJECT.md file exists."
**How to avoid:** Write assertions using key concepts, not exact phrases. The keyword grader extracts concepts and checks for presence, so "Detects missing PROJECT.md" works better than "Identifies that .planning/PROJECT.md does not exist."
**Warning signs:** Assertions that pass on one model version but fail on another despite correct behavior.

### Pitfall 3: Fixtures That Drift from Reality
**What goes wrong:** Fixture `.planning/STATE.md` references phases that don't exist in the fixture's `ROADMAP.md`. The model detects the inconsistency and produces unexpected output.
**How to avoid:** Cross-validate fixture files when creating them. Every state reference must have a corresponding artifact. The Plan 12-01 Task 3 correctly specifies self-consistency.
**Warning signs:** Evals that fail with "inconsistent project state" or similar messages.

### Pitfall 4: Not Testing the Negative Case
**What goes wrong:** Only testing that skills DO the right thing, never testing that they DON'T do the wrong thing. Missing guard evals.
**How to avoid:** For every behavioral eval, consider what the skill should NOT do. Add `guard` assertions and `forbidden_terms` checks. The existing eval suite does this well (e.g., "Does NOT invoke requesting-code-review directly").
**Warning signs:** Skills pass evals but exhibit unwanted behavior in production.

### Pitfall 5: Eval Cost Spiraling from Full LLM Grading
**What goes wrong:** Using `--grader llm` for routine CI runs doubles the cost per suite run.
**How to avoid:** Use `--grader keyword` for CI, `--grader llm` for investigation and validation. The deterministic-first architecture already mitigates this.
**Warning signs:** Eval costs exceeding $15-20 per full run.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Eval JSON validation | Custom parser | `python3 -c "import json; json.load(open(...))"` | Standard JSON validation, already used |
| LLM-as-judge grading | Custom API integration | `claude -p` via subprocess | Already implemented in llm_grader.py |
| Baseline comparison | Custom metrics store | baselines.json + `print_regression_report()` | Already implemented in run_all_evals.py |
| Trigger precision testing | Custom routing simulator | N/A (explicit invocation) | Not needed for `/fh:` skill architecture |
| Output quality scoring | Custom rubric engine | promptfoo (if needed) | Battle-tested eval framework |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual skill testing | Automated eval suites | Oct 2025 (skills launch) | Systematic quality gates |
| Output-only evals | Trigger + quality evals | Mar 2026 (skill-creator 2.0) | Full coverage of skill lifecycle |
| Single-run evals | Multi-run benchmarks with variance | Mar 2026 | Statistical rigor |
| Human-only grading | Hybrid: deterministic + keyword + LLM | 2025 | 100x cost reduction |
| Individual eval runs | A/B blind comparison | Mar 2026 (comparator agent) | Objective version comparison |

## Open Questions

1. **Benchmark variance analysis**
   - What we know: Anthropic's benchmark mode runs multiple times to detect variance. High variance indicates ambiguous skill instructions.
   - What's unclear: Optimal number of runs per eval for statistical significance. Anthropic's run_eval.py uses 3 runs per query.
   - Recommendation: Start with 1 run for regression detection (current approach), add `--benchmark N` flag for variance analysis during skill development.

2. **Context-discipline grading accuracy**
   - What we know: The `context_discipline` assertion type exists in the grading enum but falls through to keyword matching.
   - What's unclear: Whether keyword matching is accurate enough for context-efficiency assertions, or if these need specialized grading logic.
   - Recommendation: Implement specialized grading for context_discipline that checks for anti-patterns (sequential reads, no search usage) rather than concept presence.

3. **Auto-improve convergence**
   - What we know: auto-improve iterates up to 5 times with target 0.98.
   - What's unclear: What percentage of failures are eval flaws vs genuine skill gaps. The classification system (A/B/C/D) in auto-improve.md addresses this but hasn't been validated.
   - Recommendation: Run auto-improve against current suite and measure classification distribution before building more infrastructure.

## Sources

### Primary (HIGH confidence)
- Anthropic blog: "Improving skill-creator: Test, measure, and refine Agent Skills" (March 3, 2026) -- official eval framework architecture
- `fhhs-skills-workspace/run_all_evals.py` (local codebase) -- existing eval runner implementation
- `fhhs-skills-workspace/llm_grader.py` (local codebase) -- existing LLM grading implementation
- `evals/evals.json` (local codebase) -- 210+ eval definitions
- `.claude/commands/auto-improve.md` (local codebase) -- iterative improvement workflow

### Secondary (MEDIUM confidence)
- Mager.co: "Claude Code: How to Write, Eval, and Iterate on a Skill" (March 8, 2026) -- practitioner eval workflow with promptfoo integration
- Pillitteri: "Claude Code Skills 2.0: Evals, Benchmarks and A/B Testing" (March 7, 2026) -- comprehensive skill-creator 2.0 guide
- LangChain: "State of Agent Engineering" (2026) -- industry observability adoption statistics

### Tertiary (LOW confidence)
- Various observability platform comparisons (Maxim, Braintrust, Arize) -- commercial platform features, not directly applicable to plugin evals

## Metadata

**Confidence breakdown:**
- Existing eval infrastructure: HIGH -- direct codebase analysis
- Anthropic skill-creator patterns: HIGH -- official documentation
- Observability testing patterns: MEDIUM -- synthesized from industry practices, not fhhs-specific
- Context-efficiency eval patterns: MEDIUM -- proposed approach, not yet validated
- Cost optimization recommendations: HIGH -- based on existing pricing and architecture

**Research date:** 2026-03-29
**Valid until:** 2026-04-30 (stable domain, skill-creator unlikely to change rapidly)
