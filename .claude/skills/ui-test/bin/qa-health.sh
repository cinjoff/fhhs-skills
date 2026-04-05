#!/usr/bin/env bash
# qa-health.sh — Codebase health scorer for QA sessions
# Detects available tools, runs them, and outputs a weighted 0-10 health score.
# Output: JSON to stdout
#
# Weights:
#   Type errors  30%
#   Lint         20%
#   Unit tests   30%
#   E2E          20%

set -euo pipefail

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

run_with_timeout() {
  local timeout_secs="$1"
  shift
  if command -v timeout >/dev/null 2>&1; then
    timeout "$timeout_secs" "$@" 2>&1
  else
    # macOS gtimeout fallback
    if command -v gtimeout >/dev/null 2>&1; then
      gtimeout "$timeout_secs" "$@" 2>&1
    else
      "$@" 2>&1
    fi
  fi
}

# score_from_exit: returns 10 if exit_code=0, else 0
score_from_exit() {
  [ "$1" -eq 0 ] && echo "10" || echo "0"
}

# ---------------------------------------------------------------------------
# Detection
# ---------------------------------------------------------------------------

TOOLS_DETECTED=()

# Type checker
TSC_CMD=""
if command -v tsc >/dev/null 2>&1; then
  TSC_CMD="tsc"
  TOOLS_DETECTED+=("tsc")
elif [ -f "node_modules/.bin/tsc" ]; then
  TSC_CMD="node_modules/.bin/tsc"
  TOOLS_DETECTED+=("tsc")
fi

# Linter (prefer biome, fall back to eslint)
LINT_CMD=""
LINT_TOOL=""
if command -v biome >/dev/null 2>&1; then
  LINT_CMD="biome check ."
  LINT_TOOL="biome"
  TOOLS_DETECTED+=("biome")
elif [ -f "node_modules/.bin/biome" ]; then
  LINT_CMD="node_modules/.bin/biome check ."
  LINT_TOOL="biome"
  TOOLS_DETECTED+=("biome")
elif command -v eslint >/dev/null 2>&1; then
  LINT_CMD="eslint . --max-warnings 0"
  LINT_TOOL="eslint"
  TOOLS_DETECTED+=("eslint")
elif [ -f "node_modules/.bin/eslint" ]; then
  LINT_CMD="node_modules/.bin/eslint . --max-warnings 0"
  LINT_TOOL="eslint"
  TOOLS_DETECTED+=("eslint")
fi

# Unit test runner (prefer vitest, fall back to jest)
UNIT_CMD=""
UNIT_TOOL=""
if command -v vitest >/dev/null 2>&1; then
  UNIT_CMD="vitest run"
  UNIT_TOOL="vitest"
  TOOLS_DETECTED+=("vitest")
elif [ -f "node_modules/.bin/vitest" ]; then
  UNIT_CMD="node_modules/.bin/vitest run"
  UNIT_TOOL="vitest"
  TOOLS_DETECTED+=("vitest")
elif command -v jest >/dev/null 2>&1; then
  UNIT_CMD="jest --passWithNoTests"
  UNIT_TOOL="jest"
  TOOLS_DETECTED+=("jest")
elif [ -f "node_modules/.bin/jest" ]; then
  UNIT_CMD="node_modules/.bin/jest --passWithNoTests"
  UNIT_TOOL="jest"
  TOOLS_DETECTED+=("jest")
fi

# E2E runner (playwright)
E2E_CMD=""
E2E_TOOL=""
if command -v playwright >/dev/null 2>&1; then
  E2E_CMD="playwright test"
  E2E_TOOL="playwright"
  TOOLS_DETECTED+=("playwright")
elif [ -f "node_modules/.bin/playwright" ]; then
  E2E_CMD="node_modules/.bin/playwright test"
  E2E_TOOL="playwright"
  TOOLS_DETECTED+=("playwright")
fi

# ---------------------------------------------------------------------------
# Run each tool
# ---------------------------------------------------------------------------

# --- Type errors (30%) ---
TYPES_SCORE=10
TYPES_STATUS="skipped"
TYPES_OUTPUT=""
TYPES_EXIT=0

if [ -n "$TSC_CMD" ]; then
  # Only run tsc if tsconfig.json exists
  if [ -f "tsconfig.json" ]; then
    TYPES_OUTPUT=$(run_with_timeout 60 $TSC_CMD --noEmit 2>&1) || TYPES_EXIT=$?
    TYPES_SCORE=$(score_from_exit "$TYPES_EXIT")
    TYPES_STATUS="ran"
  else
    TYPES_STATUS="skipped_no_tsconfig"
  fi
fi

# --- Lint (20%) ---
LINT_SCORE=10
LINT_STATUS="skipped"
LINT_OUTPUT=""
LINT_EXIT=0

if [ -n "$LINT_CMD" ]; then
  LINT_OUTPUT=$(run_with_timeout 120 $LINT_CMD 2>&1) || LINT_EXIT=$?
  LINT_SCORE=$(score_from_exit "$LINT_EXIT")
  LINT_STATUS="ran"
fi

# --- Unit tests (30%) ---
UNIT_SCORE=10
UNIT_STATUS="skipped"
UNIT_OUTPUT=""
UNIT_EXIT=0

if [ -n "$UNIT_CMD" ]; then
  UNIT_OUTPUT=$(run_with_timeout 300 $UNIT_CMD 2>&1) || UNIT_EXIT=$?
  UNIT_SCORE=$(score_from_exit "$UNIT_EXIT")
  UNIT_STATUS="ran"
fi

# --- E2E tests (20%) ---
E2E_SCORE=10
E2E_STATUS="skipped"
E2E_OUTPUT=""
E2E_EXIT=0

if [ -n "$E2E_CMD" ]; then
  E2E_OUTPUT=$(run_with_timeout 600 $E2E_CMD 2>&1) || E2E_EXIT=$?
  E2E_SCORE=$(score_from_exit "$E2E_EXIT")
  E2E_STATUS="ran"
fi

# ---------------------------------------------------------------------------
# Weighted score calculation
# Weights: types=30%, lint=20%, unit=30%, e2e=20%
# Each category score is 0 or 10.
# Skipped categories don't penalize — their weight is redistributed.
# ---------------------------------------------------------------------------

WEIGHT_TYPES=30
WEIGHT_LINT=20
WEIGHT_UNIT=30
WEIGHT_E2E=20

TOTAL_WEIGHT=0
WEIGHTED_SUM=0

if [ "$TYPES_STATUS" != "skipped" ] && [ "$TYPES_STATUS" != "skipped_no_tsconfig" ]; then
  TOTAL_WEIGHT=$((TOTAL_WEIGHT + WEIGHT_TYPES))
  WEIGHTED_SUM=$((WEIGHTED_SUM + TYPES_SCORE * WEIGHT_TYPES))
fi

if [ "$LINT_STATUS" = "ran" ]; then
  TOTAL_WEIGHT=$((TOTAL_WEIGHT + WEIGHT_LINT))
  WEIGHTED_SUM=$((WEIGHTED_SUM + LINT_SCORE * WEIGHT_LINT))
fi

if [ "$UNIT_STATUS" = "ran" ]; then
  TOTAL_WEIGHT=$((TOTAL_WEIGHT + WEIGHT_UNIT))
  WEIGHTED_SUM=$((WEIGHTED_SUM + UNIT_SCORE * WEIGHT_UNIT))
fi

if [ "$E2E_STATUS" = "ran" ]; then
  TOTAL_WEIGHT=$((TOTAL_WEIGHT + WEIGHT_E2E))
  WEIGHTED_SUM=$((WEIGHTED_SUM + E2E_SCORE * WEIGHT_E2E))
fi

# If no tools ran at all, score is 10/10 (nothing to fail)
if [ "$TOTAL_WEIGHT" -eq 0 ]; then
  FINAL_SCORE="10"
else
  # Integer math: score = weighted_sum / total_weight
  # Use awk for float result
  FINAL_SCORE=$(awk "BEGIN { printf \"%.1f\", $WEIGHTED_SUM / $TOTAL_WEIGHT }")
fi

# ---------------------------------------------------------------------------
# Build JSON output
# ---------------------------------------------------------------------------

# Escape a string for JSON (basic: escape backslash and double-quote, strip newlines)
json_str() {
  printf '%s' "$1" | head -c 500 | tr '\n' ' ' | sed 's/\\/\\\\/g; s/"/\\"/g'
}

# Build tools_detected JSON array
TOOLS_JSON="["
FIRST=1
for t in "${TOOLS_DETECTED[@]+"${TOOLS_DETECTED[@]}"}"; do
  [ "$FIRST" -eq 1 ] && FIRST=0 || TOOLS_JSON="${TOOLS_JSON},"
  TOOLS_JSON="${TOOLS_JSON}\"${t}\""
done
TOOLS_JSON="${TOOLS_JSON}]"

cat <<EOF
{
  "score": ${FINAL_SCORE},
  "breakdown": {
    "type_errors": {
      "score": ${TYPES_SCORE},
      "weight": 0.30,
      "status": "$(json_str "$TYPES_STATUS")",
      "tool": "$(json_str "$TSC_CMD")",
      "exit_code": ${TYPES_EXIT},
      "output_preview": "$(json_str "$TYPES_OUTPUT")"
    },
    "lint": {
      "score": ${LINT_SCORE},
      "weight": 0.20,
      "status": "$(json_str "$LINT_STATUS")",
      "tool": "$(json_str "$LINT_TOOL")",
      "exit_code": ${LINT_EXIT},
      "output_preview": "$(json_str "$LINT_OUTPUT")"
    },
    "unit_tests": {
      "score": ${UNIT_SCORE},
      "weight": 0.30,
      "status": "$(json_str "$UNIT_STATUS")",
      "tool": "$(json_str "$UNIT_TOOL")",
      "exit_code": ${UNIT_EXIT},
      "output_preview": "$(json_str "$UNIT_OUTPUT")"
    },
    "e2e": {
      "score": ${E2E_SCORE},
      "weight": 0.20,
      "status": "$(json_str "$E2E_STATUS")",
      "tool": "$(json_str "$E2E_TOOL")",
      "exit_code": ${E2E_EXIT},
      "output_preview": "$(json_str "$E2E_OUTPUT")"
    }
  },
  "tools_detected": ${TOOLS_JSON}
}
EOF
