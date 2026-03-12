#!/usr/bin/env python3
"""LLM-based grader for fhhs-skills behavioral evals.

Reads raw_results.json and grades each eval's assertions semantically
using claude -p --model haiku. Much more accurate than keyword matching.

Usage:
    python3 llm_grader.py <path/to/raw_results.json>
    python3 llm_grader.py <path/to/raw_results.json> --compare  # compare with keyword grader
    python3 llm_grader.py <path/to/raw_results.json> --model sonnet  # use sonnet instead
"""

import json
import os
import re
import subprocess
import sys
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from datetime import datetime
from collections import defaultdict

sys.stdout.reconfigure(line_buffering=True)

MAX_WORKERS = 6
TIMEOUT = 90
GRADER_MODEL = "haiku"  # fast and cheap for classification tasks
MAX_RETRIES = 2


# ---------------------------------------------------------------------------
# Keyword grader (fallback)
# ---------------------------------------------------------------------------

def grade_assertion_keyword(assertion: dict, output: str) -> dict:
    """Grade a single assertion against output using keyword heuristics."""
    text = assertion["text"]
    text_lower = text.lower()
    atype = assertion.get("type", "behavioral")
    output_lower = output.lower()

    if not output.strip():
        return {"text": text, "passed": False, "evidence": "[kw] Empty output"}

    if atype == "guard":
        negation_patterns = [
            "do not", "don't", "will not", "won't", "should not", "shouldn't",
            "skip", "avoid", "refrain", "not proceed", "not invoke", "not call",
            "not dispatch", "not execute", "not use", "would not", "never",
            "explicitly avoid", "important not to", "must not",
        ]
        key_words = [
            w for w in re.findall(r"\b\w{4,}\b", text_lower)
            if w not in ("does", "invoke", "directly", "should", "guard",
                         "that", "this", "with", "from")
        ]
        for neg in negation_patterns:
            if neg in output_lower:
                for kw in key_words[:5]:
                    if kw in output_lower:
                        return {"text": text, "passed": True,
                                "evidence": f"[kw] negation '{neg}' + concept '{kw}'"}
        action_words = [w for w in key_words if len(w) > 5]
        if action_words and not any(w in output_lower for w in action_words[:3]):
            return {"text": text, "passed": True,
                    "evidence": "[kw] guarded concepts absent from output"}
        return {"text": text, "passed": False,
                "evidence": "[kw] could not confirm guard constraint"}

    if atype == "ordering":
        before_match = re.search(r"(\w+)\s+before\s+(\w+)", text_lower)
        if before_match:
            first, second = before_match.group(1), before_match.group(2)
            pos_first = output_lower.find(first)
            pos_second = output_lower.find(second)
            if pos_first >= 0 and pos_second >= 0:
                passed = pos_first < pos_second
                return {"text": text, "passed": passed,
                        "evidence": f"[kw] '{first}'@{pos_first} vs '{second}'@{pos_second}"}

    stop_words = {
        "the", "and", "for", "that", "this", "with", "from", "into",
        "does", "should", "will", "has", "have", "not", "are", "was",
        "been", "being", "than", "them", "then", "each", "when",
        "only", "also", "both", "just", "more", "most", "some",
        "after", "before", "during", "about", "between", "through",
    }
    words = [w for w in re.findall(r"\b\w{3,}\b", text_lower) if w not in stop_words]
    if not words:
        return {"text": text, "passed": True, "evidence": "[kw] no key concepts"}

    matches = sum(1 for w in words if w in output_lower)
    match_ratio = matches / len(words)
    threshold = 0.35 if len(words) > 6 else 0.45

    return {
        "text": text,
        "passed": match_ratio >= threshold,
        "evidence": f"[kw] {matches}/{len(words)} concepts ({match_ratio:.0%})",
    }


def grade_eval_keyword(eval_result: dict) -> dict:
    """Grade all assertions for an eval using keyword fallback."""
    if eval_result["status"] != "success":
        return {
            "eval_id": eval_result["eval_id"],
            "command": eval_result["command"],
            "status": eval_result["status"],
            "grades": [],
            "pass_rate": 0.0,
            "passed": 0,
            "total": len(eval_result.get("assertions", [])),
            "grader": "keyword",
        }

    output = eval_result["output"]
    assertions = eval_result.get("assertions", [])
    grades = [grade_assertion_keyword(a, output) for a in assertions]
    passed = sum(1 for g in grades if g["passed"])
    total = len(grades) if grades else 1

    return {
        "eval_id": eval_result["eval_id"],
        "command": eval_result["command"],
        "status": "graded",
        "grades": grades,
        "pass_rate": passed / total,
        "passed": passed,
        "total": total,
        "duration_ms": eval_result.get("duration_ms", 0),
        "grader": "keyword",
    }


# ---------------------------------------------------------------------------
# JSON extraction helpers
# ---------------------------------------------------------------------------

def extract_json_array(text: str) -> list | None:
    """Extract a JSON array from LLM output, handling markdown fences and preamble."""
    text = text.strip()

    # Strip markdown code fences
    if "```" in text:
        # Find content between first ``` and last ```
        parts = text.split("```")
        if len(parts) >= 3:
            inner = parts[1]
            # Remove optional language tag on first line
            if inner.startswith("json"):
                inner = inner[4:]
            text = inner.strip()

    # Try direct parse
    try:
        result = json.loads(text)
        if isinstance(result, list):
            return result
    except json.JSONDecodeError:
        pass

    # Find the first [ ... ] block
    bracket_start = text.find("[")
    if bracket_start >= 0:
        depth = 0
        for i in range(bracket_start, len(text)):
            if text[i] == "[":
                depth += 1
            elif text[i] == "]":
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(text[bracket_start : i + 1])
                    except json.JSONDecodeError:
                        break

    return None


# ---------------------------------------------------------------------------
# LLM grader
# ---------------------------------------------------------------------------

def grade_single_eval(eval_result: dict, model: str) -> dict | None:
    """Grade one eval's assertions using claude -p --model <model>."""
    if eval_result["status"] != "success":
        return {
            "eval_id": eval_result["eval_id"],
            "command": eval_result["command"],
            "status": eval_result["status"],
            "grades": [],
            "pass_rate": 0.0,
            "passed": 0,
            "total": len(eval_result.get("assertions", [])),
            "grader": "llm",
        }

    output = eval_result["output"]
    assertions = eval_result.get("assertions", [])

    if not assertions:
        return {
            "eval_id": eval_result["eval_id"],
            "command": eval_result["command"],
            "status": "graded",
            "grades": [],
            "pass_rate": 1.0,
            "passed": 0,
            "total": 0,
            "grader": "llm",
        }

    assertions_text = "\n".join(
        f'{i+1}. [{a.get("type", "behavioral")}] {a["text"]}'
        for i, a in enumerate(assertions)
    )

    # Truncate output to fit context — keep first and last portions
    max_output = 8000
    if len(output) > max_output:
        half = max_output // 2
        output_excerpt = output[:half] + "\n\n[... truncated ...]\n\n" + output[-half:]
    else:
        output_excerpt = output

    prompt = f"""You are grading an AI assistant's behavioral plan against a set of assertions.
The assistant was asked to describe how it would handle a request using a specific skill.
Your job: determine if the output satisfies each assertion.

ASSERTIONS:
{assertions_text}

OUTPUT:
{output_excerpt}

GRADING RULES:
- "behavioral": The output describes performing this action or considering this concern. Semantic match counts — the exact words don't need to appear. If the output describes equivalent behavior using different terminology, it PASSES.
- "output": The output mentions producing or creating this artifact/deliverable.
- "guard": The output confirms NOT doing the guarded action, OR the guarded action simply doesn't appear in the plan. Both count as PASS.
- "ordering": The output shows the first action happening before the second.
- "context_discipline": The output shows proper context management (e.g., delegating to subagents, not reading unnecessary files).

IMPORTANT: Be generous with semantic matching. If the concept is covered even with different words, mark it as passed. Only fail assertions where the behavior is genuinely missing or contradicted.

Respond with ONLY a JSON array (no markdown, no explanation):
[{{"i":1,"p":true,"r":"brief reason"}},{{"i":2,"p":false,"r":"brief reason"}}]"""

    for attempt in range(MAX_RETRIES + 1):
        try:
            env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}
            result = subprocess.run(
                ["claude", "-p", prompt, "--model", model, "--output-format", "text"],
                capture_output=True,
                text=True,
                timeout=TIMEOUT,
                env=env,
            )

            if result.returncode != 0:
                if attempt < MAX_RETRIES:
                    time.sleep(2 ** attempt)
                    continue
                return None

            grades_raw = extract_json_array(result.stdout)
            if grades_raw is None:
                if attempt < MAX_RETRIES:
                    time.sleep(2 ** attempt)
                    continue
                return None

            # Map grades back to assertions — use "i" field if available, fall back to position
            grades_by_index = {}
            for g in grades_raw:
                idx = g.get("i")
                if idx is not None:
                    grades_by_index[idx] = g

            grades = []
            for i, a in enumerate(assertions):
                # Try 1-based index lookup first, fall back to positional
                g = grades_by_index.get(i + 1) if grades_by_index else None
                if g is None and i < len(grades_raw):
                    g = grades_raw[i]
                if g is not None:
                    passed = g.get("p", g.get("passed", False))
                    reason = g.get("r", g.get("reason", ""))
                else:
                    passed = False
                    reason = "missing from grader response"
                grades.append({
                    "text": a["text"],
                    "passed": bool(passed),
                    "evidence": f"[llm] {reason}",
                })

            passed_count = sum(1 for g in grades if g["passed"])
            total = len(grades)

            return {
                "eval_id": eval_result["eval_id"],
                "command": eval_result["command"],
                "status": "graded",
                "grades": grades,
                "pass_rate": passed_count / total if total > 0 else 1.0,
                "passed": passed_count,
                "total": total,
                "duration_ms": eval_result.get("duration_ms", 0),
                "grader": "llm",
            }

        except subprocess.TimeoutExpired:
            if attempt < MAX_RETRIES:
                continue
            return None
        except Exception as e:
            if attempt < MAX_RETRIES:
                time.sleep(2 ** attempt)
                continue
            print(f"  ERROR eval #{eval_result['eval_id']}: {e}", flush=True)
            return None

    return None


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

progress_lock = threading.Lock()
completed_count = 0
fallback_count = 0


def grade_with_fallback(eval_result: dict, total: int, model: str) -> dict:
    """Try LLM grading; fall back to keyword grading on failure."""
    global completed_count, fallback_count

    result = grade_single_eval(eval_result, model)
    grader_used = "llm"

    if result is None:
        result = grade_eval_keyword(eval_result)
        grader_used = "keyword-fallback"

    with progress_lock:
        completed_count += 1
        if grader_used != "llm":
            fallback_count += 1
        icon = "OK" if result.get("pass_rate", 0) >= 0.5 else "!!"
        rate = result.get("pass_rate", 0)
        print(
            f"  [{completed_count}/{total}] {icon} eval #{result['eval_id']:>3} "
            f"({result['command']:<16}) {rate:>5.0%} [{grader_used}]",
            flush=True,
        )

    return result


def print_report(summary: dict, graded: list, compare_keyword: dict | None = None):
    """Print formatted report to stdout."""
    print(f"\n{'=' * 78}")
    print(f"LLM GRADER RESULTS")
    print(f"{'=' * 78}")
    print(f"Total evals:       {summary['total_evals']}")
    print(f"LLM graded:        {summary['llm_graded']}")
    print(f"Keyword fallback:  {summary['keyword_fallback']}")
    print(f"Successful runs:   {summary['successful']}")
    print(f"Errors/Timeouts:   {summary['errors']}/{summary['timeouts']}")
    print()
    print(f"Total assertions:  {summary['total_assertions']}")
    print(f"Passed assertions: {summary['passed_assertions']}")
    print(f"Overall pass rate: {summary['overall_pass_rate']:.1%}")

    if compare_keyword:
        kw_rate = compare_keyword["overall_pass_rate"]
        delta = summary["overall_pass_rate"] - kw_rate
        print(f"Keyword baseline:  {kw_rate:.1%}  (delta: +{delta:.1%})")

    print()
    header = f"{'Command':<20} {'Evals':>5} {'Assert':>6} {'Pass':>5} {'Rate':>6}"
    if compare_keyword:
        header += f" {'KW Rate':>7} {'Delta':>6}"
    header += f" {'Err':>4}"
    print(header)
    print("-" * len(header))

    for cmd, stats in sorted(
        summary["by_command"].items(), key=lambda x: x[1]["pass_rate"]
    ):
        line = (
            f"{cmd:<20} {stats['evals']:>5} {stats['assertions']:>6} "
            f"{stats['passed']:>5} {stats['pass_rate']:>5.0%}"
        )
        if compare_keyword and cmd in compare_keyword.get("by_command", {}):
            kw_stats = compare_keyword["by_command"][cmd]
            kw_rate = kw_stats["pass_rate"]
            delta = stats["pass_rate"] - kw_rate
            sign = "+" if delta >= 0 else ""
            line += f" {kw_rate:>6.0%} {sign}{delta:>5.0%}"
        elif compare_keyword:
            line += f" {'N/A':>7} {'':>6}"
        line += f" {stats['errors']:>4}"
        print(line)
    print("=" * len(header))

    # Failed assertions detail
    failed_evals = [g for g in graded if g["status"] == "graded"
                    and any(not gr["passed"] for gr in g["grades"])]
    non_graded = [g for g in graded if g["status"] != "graded"]

    if failed_evals or non_graded:
        print(f"\n{'=' * 78}")
        print(f"FAILED ASSERTIONS ({len(failed_evals)} evals with failures, "
              f"{len(non_graded)} non-graded)")
        print(f"{'=' * 78}")

        for g in non_graded[:10]:
            print(f"\n  Eval #{g['eval_id']} ({g['command']}): "
                  f"{g['status']} - {g.get('error', '')[:100]}")

        for g in sorted(failed_evals, key=lambda x: x["pass_rate"])[:30]:
            failed = [gr for gr in g["grades"] if not gr["passed"]]
            grader = g.get("grader", "?")
            print(f"\n  Eval #{g['eval_id']} ({g['command']}) "
                  f"- {g['passed']}/{g['total']} [{grader}]:")
            for fa in failed:
                print(f"    FAIL: {fa['text']}")
                if fa.get("evidence"):
                    print(f"          {fa['evidence'][:120]}")


def main():
    import argparse
    parser = argparse.ArgumentParser(description="LLM grader for fhhs-skills evals")
    parser.add_argument("raw_results", type=Path, help="Path to raw_results.json")
    parser.add_argument("--model", default=GRADER_MODEL,
                        help=f"Model for grading (default: {GRADER_MODEL})")
    parser.add_argument("--compare", action="store_true",
                        help="Compare LLM results with keyword grader")
    parser.add_argument("--workers", type=int, default=MAX_WORKERS,
                        help=f"Parallel workers (default: {MAX_WORKERS})")
    args = parser.parse_args()

    if not args.raw_results.exists():
        print(f"File not found: {args.raw_results}", file=sys.stderr)
        sys.exit(1)

    out_dir = args.raw_results.parent

    print(f"=== LLM Grader for fhhs-skills Evals ===")
    print(f"Started: {datetime.now().isoformat()}")
    print(f"Input:   {args.raw_results}")
    print(f"Model:   {args.model}")
    print(f"Workers: {args.workers}, Timeout: {TIMEOUT}s per eval")
    print()

    with open(args.raw_results) as f:
        results = json.load(f)

    success_count = sum(1 for r in results if r["status"] == "success")
    print(f"Loaded {len(results)} eval results ({success_count} successful)")
    print()

    # Grade in parallel
    graded = []
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        future_to_eval = {
            executor.submit(grade_with_fallback, r, len(results), args.model): r
            for r in results
        }
        for future in as_completed(future_to_eval):
            try:
                graded.append(future.result())
            except Exception as exc:
                r = future_to_eval[future]
                print(f"  EXCEPTION eval #{r['eval_id']}: {exc}", flush=True)
                graded.append(grade_eval_keyword(r))

    graded.sort(key=lambda g: g["eval_id"])

    # Save graded results
    graded_path = out_dir / "llm_graded_results.json"
    with open(graded_path, "w") as f:
        json.dump(graded, f, indent=2)
    print(f"\nSaved: {graded_path}")

    # Build summary
    by_command = defaultdict(list)
    for g in graded:
        by_command[g["command"]].append(g)

    graded_evals = [g for g in graded if g["status"] == "graded"]
    total_a = sum(g["total"] for g in graded_evals)
    passed_a = sum(g["passed"] for g in graded_evals)

    llm_graded = sum(1 for g in graded if g.get("grader") == "llm")
    kw_graded = sum(1 for g in graded if g.get("grader") != "llm")

    summary = {
        "run_date": datetime.now().isoformat(),
        "grader": f"llm ({args.model}) + keyword fallback",
        "model": args.model,
        "total_evals": len(results),
        "llm_graded": llm_graded,
        "keyword_fallback": kw_graded,
        "successful": success_count,
        "errors": sum(1 for r in results if r["status"] == "error"),
        "timeouts": sum(1 for r in results if r["status"] == "timeout"),
        "total_assertions": total_a,
        "passed_assertions": passed_a,
        "overall_pass_rate": passed_a / total_a if total_a > 0 else 0.0,
        "by_command": {},
    }

    for cmd, cmd_graded in sorted(by_command.items()):
        cmd_g = [g for g in cmd_graded if g["status"] == "graded"]
        cmd_total = sum(g["total"] for g in cmd_g)
        cmd_passed = sum(g["passed"] for g in cmd_g)
        cmd_errors = sum(1 for g in cmd_graded if g["status"] in ("error", "timeout"))
        avg_dur = sum(g.get("duration_ms", 0) for g in cmd_g) / max(len(cmd_g), 1)
        summary["by_command"][cmd] = {
            "evals": len(cmd_graded),
            "assertions": cmd_total,
            "passed": cmd_passed,
            "pass_rate": cmd_passed / cmd_total if cmd_total > 0 else 0.0,
            "errors": cmd_errors,
            "avg_duration_ms": int(avg_dur),
        }

    summary_path = out_dir / "llm_summary.json"
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"Saved: {summary_path}")

    # Optionally load keyword results for comparison
    compare_data = None
    if args.compare:
        kw_summary_path = out_dir / "summary.json"
        if kw_summary_path.exists():
            with open(kw_summary_path) as f:
                compare_data = json.load(f)
        else:
            print("WARNING: --compare requested but summary.json not found")

    print_report(summary, graded, compare_data)
    print(f"\nDone. Results in {out_dir}")


if __name__ == "__main__":
    main()
