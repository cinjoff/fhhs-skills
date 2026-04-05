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

## Step 0: Baseline Check

Before starting the loop, read `fhhs-skills-workspace/baselines.json` if it exists.

If the file exists, print current baselines per command:
```
Baselines (from baselines.json):
  auto:  pass_rate=96.2%  avg_tokens=1842  cost=$0.0031
  build: pass_rate=94.5%  avg_tokens=2103  cost=$0.0044
```

If the file does not exist:
```
No baselines found. First iteration will establish baseline.
```

Store these baseline pass rates in memory — they will be used in the completion trend table.

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

After the final iteration (max reached or target hit): if the final pass rate is strictly higher than the baseline pass rate AND `--dry-run` was NOT set, run:
```bash
python3 fhhs-skills-workspace/run_all_evals.py \
  --commands ${COMMANDS} \
  --tier ${TIER} \
  --update-baselines
```

This saves the improved pass rates as the new baselines.

---

## Completion

After the loop ends (target reached or max iterations):

Print a trend table with a "vs baseline" column showing the delta from the baseline pass rate recorded in Step 0:

```
Iter  Rate    vs baseline  Cost    Changes
1     95.2%   -1.0%        $2.46   3 eval fixes
2     97.4%   +1.2%        $2.51   1 eval fix
3     98.7%   +2.5%        $2.48   0 (target reached)
```

If no baseline was available, omit the "vs baseline" column and note "no baseline — run `--update-baselines` after this session to set one."

And a summary of total cost across all iterations.

If `--dry-run` was set, only run Step 1 and Step 3 (analyze) without applying fixes.

---

## Measurement Workflow

Use this 3-step process to measure the impact of skill changes:

**Step 1: Save the before state**
```bash
python3 fhhs-skills-workspace/run_all_evals.py --update-baselines
```
Run this before making any skill edits. This saves current pass rates, token usage, and cost to `baselines.json`.

**Step 2: Make skill changes**

Edit `.claude/skills/{command}/SKILL.md` or `evals/evals.json` as needed.

**Step 3: Compare against baselines**
```bash
python3 fhhs-skills-workspace/run_all_evals.py
```
Run without `--update-baselines` to compare current results against the saved baselines. The report will show deltas vs the Step 1 snapshot.
