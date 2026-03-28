# Testing Patterns

**Analysis Date:** 2026-03-27

## Test Framework

**Runner:**
- Custom eval suite (Python-based runner + JSON eval definitions)
- No unit test framework (no Jest, Vitest, or Mocha configured)
- Config: `evals/evals.json` (6456 lines, 220 evals)
- Runner: `python3 evals/run_all_evals.py`

**Assertion Library:**
- Custom assertion model defined in `evals/evals.json` — no standard assertion library

**Run Commands:**
```bash
python3 evals/run_all_evals.py   # Run all 220 evals
```

No watch mode. No coverage tool. Evals are behavioral, not code-coverage-based.

## Test File Organization

**Location:**
- All evals defined in a single JSON file: `evals/evals.json`
- Mock project fixtures in `evals/fixtures/` (e.g., `evals/fixtures/nextjs-app-deep/`)
- No co-located test files alongside source code
- Test files in `evals/fixtures/` are mock project structures, not test suites

**Naming:**
- Single eval definition file, not per-skill test files
- Fixture directories named after the mock project type: `nextjs-app-deep`

**Structure:**
```
evals/
├── evals.json                    # All 220 eval definitions
├── run_all_evals.py              # Python runner script
└── fixtures/
    └── nextjs-app-deep/          # Mock project for eval scenarios
        ├── .planning/            # Mock planning state
        ├── src/                  # Mock source files
        └── e2e/                  # Mock e2e test stubs
```

## Eval Structure

**Single eval definition:**
```json
{
  "id": 1,
  "command": "build",
  "prompt": "ok i just finished planning phase 13...",
  "expected_output": "Should detect GSD mode, find the plan...",
  "files": [],
  "assertions": [
    {
      "text": "Identifies 2 waves from task dependencies",
      "type": "behavioral"
    },
    {
      "text": "Dispatches general-purpose subagents",
      "type": "behavioral"
    },
    {
      "text": "Does NOT invoke finishing-a-development-branch directly",
      "type": "guard"
    }
  ],
  "scenario_requires": []
}
```

**Fields:**
- `id`: Unique numeric identifier (1-243, with gaps)
- `command`: Which skill/command is being tested (matches skill directory name)
- `prompt`: Natural language user input simulating real usage
- `expected_output`: Human-readable description of correct behavior
- `files`: Additional files to seed for the eval scenario
- `assertions`: Structured checks with type classification
- `scenario_requires`: Optional preconditions (e.g., `"gsd_project"`, `"no_gsd_project"`)

## Assertion Types

**Six assertion types used across all evals:**

| Type | Count | Purpose |
|------|-------|---------|
| `behavioral` | 498 | Verifies the skill follows the correct process/workflow |
| `output` | 306 | Checks for specific content in the output |
| `guard` | 159 | Ensures something does NOT happen (negative assertion) |
| `ordering` | 31 | Verifies steps happen in correct sequence |
| `context_discipline` | 9 | Checks context window management behavior |
| `routing` | 3 | Verifies correct skill/agent dispatch |

**Pattern examples:**

```json
// behavioral — checks process adherence
{ "text": "Detects research-first need from 'never used Stripe API'", "type": "behavioral" }

// output — checks visible result
{ "text": "Creates PLAN.md with must_haves frontmatter", "type": "output" }

// guard — checks for absence (negative test)
{ "text": "Does NOT proceed with execution", "type": "guard" }

// ordering — checks sequence
{ "text": "Runs research before brainstorming", "type": "ordering" }

// context_discipline — checks efficient context usage
{ "text": "Stays under 15% context usage", "type": "context_discipline" }
```

## Eval Coverage by Command

**High coverage (10+ evals):**
- `build`: 29 evals
- `plan-work`: 19 evals
- `review`: 18 evals
- `progress`: 12 evals
- `plan-review`: 12 evals
- `fix`: 10 evals

**Medium coverage (3-9 evals):**
- `map-codebase`: 9 evals
- `refactor`: 7 evals
- `new-project`: 7 evals
- `simplify`: 7 evals
- `secure`: 7 evals
- `health`: 6 evals
- `auto`: 6 evals
- `update`: 5 evals
- `research`: 5 evals
- `observability`: 5 evals
- `revise-claude-md`: 4 evals
- `todos`: 4 evals
- `learnings`: 4 evals

**Low coverage (1-2 evals):**
- `setup`: 3, `ui-critique`: 3, `polish`: 3, `ui-animate`: 3, `tracker`: 3, `ui-redesign`: 3
- `audit`: 2, `ui-test`: 2, `help`: 2, `normalize`: 2, `playwright-testing`: 2, `nextjs-perf`: 2, `ui-branding`: 2
- `settings`: 1, `adapt`: 1, `bolder`: 1, `clarify`: 1, `colorize`: 1, `delight`: 1, `distill`: 1, `extract`: 1, `harden`: 1, `onboard`: 1, `optimize`: 1, `quieter`: 1

## Mocking

**Framework:** No mocking library. Evals use fixture directories to simulate project state.

**Patterns:**
- `evals/fixtures/nextjs-app-deep/` contains a complete mock Next.js project structure
- Mock `.planning/` directories with `PROJECT.md`, `STATE.md`, `ROADMAP.md`, phase directories
- Mock source files (`.ts`, `.tsx`) for realistic codebase scanning
- `scenario_requires` field controls which fixture state applies

**What to Mock:**
- Project directory structures (`.planning/`, `src/`, configs)
- Planning state files (STATE.md, ROADMAP.md, PLAN.md, SUMMARY.md)
- Source code files for codebase analysis evals

**What NOT to Mock:**
- The skills themselves are tested as-is (behavioral testing of skill instructions)
- No function-level mocking — evals test end-to-end skill behavior

## Fixtures

**Test Data:**
```
evals/fixtures/nextjs-app-deep/
├── .planning/
│   ├── codebase/         # Mock codebase analysis docs
│   ├── todos/            # Mock todo items
│   └── phases/
│       ├── 01-auth/      # Completed phase fixture
│       └── 02-dashboard/ # In-progress phase fixture
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utility libraries
│   ├── types/            # TypeScript types
│   └── __tests__/        # Mock test files
└── e2e/                  # Mock E2E test directory
```

**Location:** `evals/fixtures/`

## No Unit Tests for CLI

The `bin/gsd-tools.cjs` CLI (6466 lines across 13 modules) has **no unit tests**. There is one test file at `templates/project-tracker/parser.test.cjs` for the project tracker parser, but the core CLI modules (`core.cjs`, `state.cjs`, `frontmatter.cjs`, `verify.cjs`, etc.) have no dedicated test coverage.

Testing relies entirely on the behavioral eval suite which tests skills end-to-end rather than testing individual JavaScript functions.

## Test Types

**Behavioral Evals (primary):**
- Test skill behavior given natural language prompts
- Verify correct process adherence, output content, and guardrails
- 220 evals covering 43 commands/skills
- Assertion-based validation with 6 assertion types

**No Unit Tests:**
- No Jest/Vitest/Mocha for JavaScript modules
- No function-level testing of `bin/lib/*.cjs` utilities

**No Integration Tests:**
- No tests that exercise the CLI end-to-end with real filesystem operations

**No E2E Tests:**
- Eval fixtures contain mock E2E directories but no actual E2E test runner

## Adding New Evals

**When to add:**
- Every shipped skill needs at least 1 eval (per CLAUDE.md)
- After upstream changes, re-run the full eval suite

**How to add:**
1. Add a new entry to `evals/evals.json` with a unique `id`
2. Include `command` matching the skill directory name
3. Write a realistic `prompt` simulating user input
4. Describe `expected_output` in plain English
5. Add `assertions` with appropriate types:
   - `behavioral` for process checks
   - `output` for content checks
   - `guard` for negative checks (things that must NOT happen)
   - `ordering` for sequence checks
6. Add `scenario_requires` if the eval needs specific fixture state
7. Add fixture files to `evals/fixtures/` if needed

**Eval JSON schema:**
```json
{
  "id": <unique integer>,
  "command": "<skill-directory-name>",
  "prompt": "<natural language user input>",
  "expected_output": "<human-readable expected behavior>",
  "files": [],
  "assertions": [
    { "text": "<assertion description>", "type": "behavioral|output|guard|ordering|context_discipline|routing" }
  ],
  "scenario_requires": ["<optional precondition>"]
}
```

---

*Testing analysis: 2026-03-27*
