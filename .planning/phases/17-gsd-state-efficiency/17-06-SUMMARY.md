---
phase: 17-gsd-state-efficiency
plan: 06
status: complete
started: "2026-04-01"
completed: "2026-04-01"
files_modified:
  - bin/gsd-tools.cjs
  - bin/gsd-tools.test.cjs
  - PATCHES.md
test_metrics:
  tests_passed: 4
  tests_failed: 0
  spec_tests_count: 0
---

# Plan 17-06 Summary: Lazy require in gsd-tools.cjs

## What Was Done

### Task 1: Convert eager requires to lazy requires in gsd-tools.cjs
- Removed 10 eager top-level `require()` calls for lib modules (state, phase, roadmap, verify, config, template, milestone, commands, init, frontmatter, changelog)
- Kept only `fs`, `path`, and `core.cjs` as eager top-level requires (needed before command dispatch)
- Added lazy `require()` inside each switch case — each command loads only the module(s) it needs
- Node's require cache ensures no double-loading when multiple cases share a module

### Task 2: Add regression test for lazy loading
- Created `bin/gsd-tools.test.cjs` with 4 tests using Node's built-in `assert` module:
  1. `generate-slug` returns correct output (behavioral smoke test)
  2. `NONEXISTENT` command exits with non-zero status (error handling)
  3. No top-level `require()` of lazy-loaded lib modules (static analysis)
  4. Only `fs`, `path`, and `core.cjs` are top-level requires (allowlist check)

### Task 3: Document in PATCHES.md
- Added `gsd-tools.cjs (fhhs-original)` section to PATCHES.md documenting the lazy require optimization with rationale

## Must-Haves Verification

| Must-Have | Status | Evidence |
|-----------|--------|----------|
| gsd-tools.cjs only requires the lib module needed for the invoked command | PASS | Static check: `head -155 bin/gsd-tools.cjs \| grep "require('./lib/" \| grep -v core` returns empty |
| All existing commands still work identically | PASS | Smoke tests: `current-timestamp`, `generate-slug`, `verify-path-exists`, `state json`, `frontmatter get` all produce correct output |
| Test verifies unknown commands exit non-zero and static analysis confirms no eager lib loads | PASS | `node bin/gsd-tools.test.cjs` — 4/4 passed |
| [review] The head -155 line-count check is fragile | NOTED | Test file uses content-based `async function main()` search as authoritative guard |

## Verification Results

- **Tests:** 4 passed, 0 failed (`node bin/gsd-tools.test.cjs`)
- **Static check:** No eager lib requires at top level (only core.cjs)
- **Smoke tests:** All common commands produce identical output
- **No build step** (CJS project)

## Issues Encountered

None.
