#!/usr/bin/env bash
# Auto-improvement loop for fhhs-skills auto evals
#
# Runs micro-tier evals in a tight loop, analyzes failures,
# proposes skill edits, applies them, and re-runs.
#
# Usage:
#   ./auto-improve.sh [--max-iterations N] [--tier micro|smoke] [--target-rate 0.98] [--dry-run]
#
# Economics (micro tier):
#   ~6 evals × $0.24 = ~$1.50/iteration, ~3 min wall-clock
#   10 iterations = ~$15, ~30 min
#
# Economics (smoke tier):
#   ~21 evals × $0.24 = ~$5/iteration, ~13 min wall-clock
#   5 iterations = ~$25, ~65 min

set -euo pipefail
cd "$(dirname "$0")/.."

# Defaults
MAX_ITERATIONS=5
TIER="micro"
TARGET_RATE="0.98"
DRY_RUN=false
COMMANDS="auto"
WORKSPACE="fhhs-skills-workspace"
LOOP_DIR="$WORKSPACE/auto-improve"

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --max-iterations) MAX_ITERATIONS="$2"; shift 2 ;;
    --tier) TIER="$2"; shift 2 ;;
    --target-rate) TARGET_RATE="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --commands) COMMANDS="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

mkdir -p "$LOOP_DIR"

echo "=== Auto-Improvement Loop ==="
echo "Tier: $TIER | Commands: $COMMANDS | Target: ${TARGET_RATE} | Max iterations: $MAX_ITERATIONS"
echo ""

for i in $(seq 1 "$MAX_ITERATIONS"); do
  ITER_DIR="$LOOP_DIR/iteration-$i"
  mkdir -p "$ITER_DIR"

  echo "--- Iteration $i/$MAX_ITERATIONS ---"

  # Step 1: Run evals
  echo "[1/4] Running $TIER evals..."
  EVAL_OUTPUT=$(python3 "$WORKSPACE/run_all_evals.py" \
    --commands "$COMMANDS" \
    --tier "$TIER" \
    --output-dir "$ITER_DIR" \
    2>&1)

  # Extract pass rate
  PASS_RATE=$(echo "$EVAL_OUTPUT" | grep -oP 'Overall pass rate: \K[0-9.]+' || echo "0")
  if [ -z "$PASS_RATE" ]; then
    # Try alternate format
    PASS_RATE=$(python3 -c "
import json, sys
try:
    s = json.load(open('$ITER_DIR/summary.json'))
    print(f\"{s['overall_pass_rate']:.4f}\")
except: print('0')
")
  fi

  echo "    Pass rate: $PASS_RATE (target: $TARGET_RATE)"

  # Save iteration metadata
  python3 -c "
import json
meta = {
    'iteration': $i,
    'tier': '$TIER',
    'pass_rate': float('$PASS_RATE'),
    'target_rate': float('$TARGET_RATE'),
}
# Load summary if available
try:
    s = json.load(open('$ITER_DIR/summary.json'))
    meta['total_evals'] = s.get('total_evals', 0)
    meta['passed_assertions'] = s.get('passed_assertions', 0)
    meta['total_assertions'] = s.get('total_assertions', 0)
    meta['total_cost'] = s.get('token_usage', {}).get('total_cost_usd', 0)
    meta['check_failures'] = s.get('check_failures', 0)
except: pass
json.dump(meta, open('$ITER_DIR/meta.json', 'w'), indent=2)
"

  # Step 2: Check if target reached
  TARGET_MET=$(python3 -c "print('yes' if float('$PASS_RATE') >= float('$TARGET_RATE') else 'no')")
  if [ "$TARGET_MET" = "yes" ]; then
    echo "    Target rate reached! Stopping."
    break
  fi

  # Step 3: Analyze failures
  echo "[2/4] Analyzing failures..."
  FAILURES=$(python3 -c "
import json
try:
    results = json.load(open('$ITER_DIR/graded_results.json'))
    failures = []
    for r in results:
        failed_assertions = [a for a in r.get('assertion_grades', []) if not a.get('passed', True)]
        failed_checks = [c for c in r.get('check_results', []) if not c.get('passed', True)]
        if failed_assertions or failed_checks:
            failures.append({
                'eval_id': r['eval_id'],
                'failed_assertions': [a.get('text', '')[:80] for a in failed_assertions],
                'failed_checks': [str(c)[:80] for c in failed_checks],
            })
    print(json.dumps(failures, indent=2))
except Exception as e:
    print(f'Error: {e}')
")
  echo "$FAILURES" > "$ITER_DIR/failures.json"

  NUM_FAILURES=$(python3 -c "import json; print(len(json.load(open('$ITER_DIR/failures.json'))))" 2>/dev/null || echo "0")
  echo "    $NUM_FAILURES evals with failures"

  if [ "$NUM_FAILURES" = "0" ]; then
    echo "    No assertion failures (check failures may exist). Stopping."
    break
  fi

  if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN] Would analyze and propose fixes. Stopping."
    cat "$ITER_DIR/failures.json"
    break
  fi

  # Step 4: Propose and apply fixes using claude -p
  echo "[3/4] Proposing fixes via claude -p..."

  FAILURE_SUMMARY=$(python3 -c "
import json
failures = json.load(open('$ITER_DIR/failures.json'))
for f in failures:
    print(f\"Eval #{f['eval_id']}:\")
    for a in f.get('failed_assertions', []):
        print(f'  FAIL assertion: {a}')
    for c in f.get('failed_checks', []):
        print(f'  FAIL check: {c}')
")

  # Use claude -p to analyze and fix
  FIX_PROMPT="You are improving the /fh:auto skill evals. These evals failed:

$FAILURE_SUMMARY

The evals are in evals/evals.json. The auto skill is in .claude/skills/auto/SKILL.md.
The orchestrator is in .claude/skills/auto/auto-orchestrator.cjs.

Analyze why each eval failed. Determine if:
A) The assertion/check is too strict and should be relaxed
B) The skill text should be improved to better convey the tested behavior
C) The eval prompt is ambiguous and should be clarified

Make the MINIMUM changes needed. Prefer fixing evals over changing the skill.
After making changes, validate JSON: python3 -c \"import json; json.load(open('evals/evals.json')); print('VALID')\"

Output a brief summary of what you changed and why."

  claude -p "$FIX_PROMPT" \
    --permission-mode bypassPermissions \
    --output-format json \
    > "$ITER_DIR/fix-output.json" 2>&1 || true

  echo "[4/4] Applied fixes. Re-running in next iteration..."
  echo ""
done

# Final summary
echo ""
echo "=== Loop Complete ==="
echo "Iterations: $i"

# Trend report
python3 -c "
import json, os
loop_dir = '$LOOP_DIR'
iterations = sorted([d for d in os.listdir(loop_dir) if d.startswith('iteration-')])
print(f'{'Iter':<6} {'Rate':<8} {'Pass':<8} {'Total':<8} {'Cost':<8} {'ChkFail':<8}')
print('-' * 48)
for d in iterations:
    meta_path = os.path.join(loop_dir, d, 'meta.json')
    if os.path.exists(meta_path):
        m = json.load(open(meta_path))
        print(f\"{d:<6} {m.get('pass_rate',0):.1%}   {m.get('passed_assertions',0):<8} {m.get('total_assertions',0):<8} \${m.get('total_cost',0):<7.2f} {m.get('check_failures',0)}\")
"
