---
description: "Run auto-improvement loop on skill evals. Analyzes failures, proposes fixes, re-runs. Use: /auto-improve [--tier micro|smoke] [--max N] [--target 0.98] [--commands auto]"
---

Run the auto-improvement loop on skill evals. Iterates: run evals → analyze failures → fix → re-run.

$ARGUMENTS

---

## Parse Arguments

Defaults:
- `--tier micro` (cheapest, ~$3/iteration)
- `--max 5` iterations
- `--target 0.98` pass rate to stop early
- `--commands auto` (which skill's evals to run)
- `--dry-run` show what would change without applying

Parse `$ARGUMENTS` to override any of these.

---

## Loop

For each iteration (1 to max):

### Step 1: Run evals

```bash
python3 fhhs-skills-workspace/run_all_evals.py \
  --commands ${COMMANDS} \
  --tier ${TIER} \
  --output-dir fhhs-skills-workspace/auto-improve/iteration-${I}
```

Record: pass rate, failed assertions, failed checks, cost.

### Step 2: Check target

If pass rate >= target, stop. Print summary and exit.

### Step 3: Analyze failures

Read `graded_results.json` from the iteration directory. For each eval with failures:
- Extract the eval ID, failed assertion text, and failed check details
- Read the actual model output from `raw_results.json`
- Classify the failure:
  - **A) Assertion too strict** — model output is correct but grader keyword matching misses it
  - **B) Check too literal** — required_terms or regex doesn't match model's phrasing
  - **C) Skill gap** — the skill text doesn't convey the tested behavior well enough
  - **D) Eval prompt ambiguous** — the prompt doesn't clearly ask for what the assertion expects

### Step 4: Apply fixes

Based on classification:
- **A/B**: Edit `evals/evals.json` — relax the assertion text or broaden the check regex
- **C**: Edit the relevant skill file (`.claude/skills/{command}/SKILL.md`) — add or clarify the relevant instruction
- **D**: Edit the eval prompt in `evals/evals.json` to be more specific

Prefer the minimum change. Prefer fixing evals (A/B/D) over changing skills (C). Only change skills when the model genuinely doesn't know the answer.

Validate after each edit:
```bash
python3 -c "import json; json.load(open('evals/evals.json')); print('VALID')"
```

### Step 5: Log iteration

Write a brief summary to `fhhs-skills-workspace/auto-improve/iteration-${I}/changes.md`:
```
## Iteration N
Pass rate: X% → target Y%
Failures: N evals
Changes:
- eval #ID: relaxed check regex for X
- eval #ID: broadened assertion text
```

### Step 6: Continue

Print iteration summary (pass rate, cost, changes made) and proceed to next iteration.

---

## Completion

After the loop ends (target reached or max iterations):

Print a trend table:

```
Iter  Rate    Cost    Changes
1     95.2%   $2.46   3 eval fixes
2     97.4%   $2.51   1 eval fix
3     98.7%   $2.48   0 (target reached)
```

And a summary of total cost across all iterations.

If `--dry-run` was set, only run Step 1 and Step 3 (analyze) without applying fixes.
