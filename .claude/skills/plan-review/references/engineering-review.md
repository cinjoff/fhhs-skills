# Engineering Review Sections

These sections evaluate engineering rigor. They run in every review, after the business-alignment sections above.

## Section 7: Engineering Architecture Review
Evaluate the plan's technical architecture with production-grade rigor:
* System design and component boundaries — are responsibilities cleanly separated?
* Dependency graph and coupling concerns — draw the graph, flag tight coupling
* Data flow patterns and potential bottlenecks — where will throughput constrain?
* Scaling characteristics and single points of failure — what breaks at 10x load?
* Security architecture (auth, data access, API boundaries) — are trust boundaries explicit?
* For each new codepath: describe one realistic production failure scenario and whether the plan accounts for it
* ASCII diagrams for non-trivial flows (mandatory)

**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY. If no issues or fix is obvious, state what you'll do and move on — don't waste a question. Do NOT proceed until user responds.

## Section 8: Code Quality Review
Evaluate the plan's impact on code quality:
* DRY violations — flag aggressively. If the plan introduces logic that already exists elsewhere, call it out.
* Error handling patterns and missing edge cases — are errors handled specifically (named types) or generically?
* Over-engineered areas — abstractions without justification, premature generalization
* Under-engineered areas — shortcuts that will bite within 3 months
* Existing code/patterns that already solve sub-problems — reuse vs rebuild decision for each
* Existing ASCII diagrams in touched files — are they still accurate after this plan ships? If not, flag for update.

**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY. If no issues or fix is obvious, state what you'll do and move on — don't waste a question. Do NOT proceed until user responds.

## Section 9: Engineering Test Review
Diagram ALL new items this plan introduces and verify test coverage for each:
```
  NEW UX FLOWS:           [list] → test exists? [Y/N]
  NEW DATA FLOWS:         [list] → test exists? [Y/N]
  NEW CODEPATHS:          [list] → test exists? [Y/N]
  NEW BRANCHING LOGIC:    [list] → test exists? [Y/N]
```

For skill/prompt changes specifically: verify eval coverage exists. If the plan modifies a skill in `.claude/skills/`, check that a corresponding eval exists in `evals/`.

Produce the **test diagram** — ASCII art showing all new codepaths and their test coverage status:
```
  ┌──────────────────────────────────────────────┐
  │           TEST COVERAGE DIAGRAM              │
  ├──────────────────┬───────────┬───────────────┤
  │ CODEPATH         │ TEST TYPE │ STATUS        │
  ├──────────────────┼───────────┼───────────────┤
  │ [codepath name]  │ Unit      │ ✓ Covered     │
  │ [codepath name]  │ Eval      │ ✗ MISSING     │
  │ [codepath name]  │ Integ.    │ ✓ Covered     │
  └──────────────────┴───────────┴───────────────┘
```

**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY. If no issues or fix is obvious, state what you'll do and move on — don't waste a question. Do NOT proceed until user responds.

## Section 10: Performance Review
Evaluate performance implications of the plan:
* N+1 queries and database access patterns — trace every DB call path, flag repeated queries in loops
* Memory-usage concerns — large data structures, unbounded collections, retained references
* Caching opportunities — repeated computations or lookups that could be cached
* Slow or high-complexity code paths — O(n²) or worse algorithms, blocking I/O in hot paths

For each finding: describe the concern, estimate severity (High/Med/Low), and propose mitigation.

**STOP.** AskUserQuestion once per issue. Do NOT batch. Recommend + WHY. If no issues or fix is obvious, state what you'll do and move on — don't waste a question. Do NOT proceed until user responds.
