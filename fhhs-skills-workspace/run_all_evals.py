#!/usr/bin/env python3
"""
Full eval runner for fhhs-skills.

Runs all 130 behavioral evals by spawning `claude -p` with the skill content
injected into the prompt. Uses ThreadPoolExecutor for real-time progress output.
Results are graded against assertions and aggregated into a report.
"""

import json
import os
import subprocess
import sys
import tempfile
import time
import re
import threading
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

# --- Configuration ---
PROJECT_ROOT = Path(__file__).resolve().parent.parent
EVALS_FILE = PROJECT_ROOT / "evals" / "evals.json"
FIXTURE_DIR = PROJECT_ROOT / "evals" / "fixtures" / "nextjs-app-deep"
MAX_WORKERS = 6  # slightly conservative to avoid rate limits
TIMEOUT_SECONDS = 180  # 3 minutes per eval
LLM_GRADER_MODEL = "haiku"

# Command -> skill/command file path mapping
COMMAND_MAP = {
    "audit": ".claude/skills/audit/SKILL.md",
    "build": ".claude/skills/build/SKILL.md",
    "fix": ".claude/skills/fix/SKILL.md",
    "health": ".claude/skills/health/SKILL.md",
    "help": ".claude/skills/help/SKILL.md",
    "map-codebase": ".claude/skills/map-codebase/SKILL.md",
    "new-project": ".claude/skills/new-project/SKILL.md",
    "normalize": ".claude/skills/normalize/SKILL.md",
    "observability": ".claude/skills/observability/SKILL.md",
    "plan-review": ".claude/skills/plan-review/SKILL.md",
    "plan-work": ".claude/skills/plan-work/SKILL.md",
    "polish": ".claude/skills/polish/SKILL.md",
    "progress": ".claude/skills/progress/SKILL.md",
    "quick": ".claude/skills/quick/SKILL.md",
    "refactor": ".claude/skills/refactor/SKILL.md",
    "research": ".claude/skills/research/SKILL.md",
    "resume-work": ".claude/skills/resume-work/SKILL.md",
    "review": ".claude/skills/review/SKILL.md",
    "revise-claude-md": ".claude/skills/revise-claude-md/SKILL.md",
    "secure": ".claude/skills/secure/SKILL.md",
    "settings": ".claude/skills/settings/SKILL.md",
    "setup": ".claude/skills/setup/SKILL.md",
    "simplify": ".claude/skills/simplify/SKILL.md",
    "todos": ".claude/skills/todos/SKILL.md",
    "tracker": ".claude/skills/tracker/SKILL.md",
    "ui-animate": ".claude/skills/ui-animate/SKILL.md",
    "ui-critique": ".claude/skills/ui-critique/SKILL.md",
    "ui-redesign": ".claude/skills/ui-redesign/SKILL.md",
    "ui-test": ".claude/skills/ui-test/SKILL.md",
    "update": ".claude/skills/update/SKILL.md",
}

# Thread-safe progress tracking
progress_lock = threading.Lock()
completed_count = 0
_progress_file = None  # set by main()


def log(msg):
    """Print with flush."""
    print(msg, flush=True)


def load_skill_content(command: str) -> str:
    """Load the skill/command file content for a given eval command."""
    rel_path = COMMAND_MAP.get(command)
    if not rel_path:
        return f"[ERROR: No mapping for command '{command}']"
    full_path = PROJECT_ROOT / rel_path
    if not full_path.exists():
        return f"[ERROR: File not found: {full_path}]"
    return full_path.read_text()


def get_eval_cwd(eval_item: dict) -> str:
    """Determine the working directory for an eval based on scenario_requires."""
    scenario = eval_item.get("scenario_requires", [])
    if "no_gsd_project" in scenario:
        # Create a temp directory without .planning/ for evals that test the
        # "no GSD project" scenario (should trigger refusal / /new-project prompt)
        tmpdir = tempfile.mkdtemp(prefix=f"eval-no-gsd-{eval_item['id']}-")
        return tmpdir
    # Default: run from the fixture directory which has full GSD structure
    return str(FIXTURE_DIR)


def run_single_eval(eval_item: dict, skill_content: str, total: int) -> dict:
    """Run a single eval by invoking claude -p with the skill content."""
    global completed_count
    eval_id = eval_item["id"]
    command = eval_item["command"]
    prompt = eval_item["prompt"]
    expected = eval_item.get("expected_output", "")
    assertions = eval_item.get("assertions", [])
    eval_cwd = get_eval_cwd(eval_item)

    scenario = eval_item.get("scenario_requires", [])
    if "no_gsd_project" in scenario:
        context_block = """- Next.js 15 + React 19 + Tailwind CSS + shadcn/ui + Prisma + TypeScript
- NO .planning/ directory exists — this project has not been initialized with GSD
- Standard Claude Code tools available: Read, Write, Edit, Bash, Grep, Glob, Agent"""
    else:
        context_block = """- Next.js 15 + React 19 + Tailwind CSS + shadcn/ui + Prisma + TypeScript
- .planning/ directory with full GSD project structure:
  - PROJECT.md, ROADMAP.md, STATE.md, DESIGN.md
  - phases/ with phase directories containing PLAN.md and SUMMARY.md files
  - todos/ with structured todo files
- Source files include API routes (auth, users, comments, data) with known vulnerabilities
- Components include sidebar, metric-card, chart-widget, data-table, etc.
- Standard Claude Code tools available: Read, Write, Edit, Bash, Grep, Glob, Agent"""

    full_prompt = f"""You are Claude Code with the fhhs-skills plugin installed. A skill/command has been triggered by the user's request.

## SKILL INSTRUCTIONS:

{skill_content}

## PROJECT CONTEXT:
{context_block}

## USER REQUEST:
{prompt}

## TASK:
Describe your step-by-step behavioral plan for handling this request according to the skill instructions. Be specific about:
1. How you interpret and triage the request
2. What you read/check first (files, state, prerequisites)
3. What actions you take and in what order
4. What guards, checks, or validations you apply
5. What outputs and artifacts you produce
6. What you explicitly do NOT do (guard rails)

Provide a detailed behavioral trace, not actual tool execution."""

    start_time = time.time()

    try:
        env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}
        result = subprocess.run(
            ["claude", "-p", full_prompt, "--output-format", "json"],
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS,
            env=env,
            cwd=eval_cwd,
        )
        duration_ms = int((time.time() - start_time) * 1000)

        if result.returncode != 0:
            res = {
                "eval_id": eval_id, "command": command, "status": "error",
                "error": result.stderr[:500], "duration_ms": duration_ms,
                "output": "", "assertions": assertions,
            }
        else:
            try:
                output_data = json.loads(result.stdout)
                output_text = output_data.get("result", result.stdout)
            except json.JSONDecodeError:
                output_text = result.stdout

            res = {
                "eval_id": eval_id, "command": command, "status": "success",
                "output": output_text[:8000], "duration_ms": duration_ms,
                "assertions": assertions, "expected": expected,
            }
    except subprocess.TimeoutExpired:
        res = {
            "eval_id": eval_id, "command": command, "status": "timeout",
            "error": f"Timed out after {TIMEOUT_SECONDS}s",
            "duration_ms": TIMEOUT_SECONDS * 1000, "output": "", "assertions": assertions,
        }
    except Exception as e:
        res = {
            "eval_id": eval_id, "command": command, "status": "error",
            "error": str(e)[:500],
            "duration_ms": int((time.time() - start_time) * 1000),
            "output": "", "assertions": assertions,
        }

    # Thread-safe progress update
    with progress_lock:
        completed_count += 1
        icon = "OK" if res["status"] == "success" else "FAIL"
        dur = res.get("duration_ms", 0) / 1000
        log(f"  [{completed_count}/{total}] {icon} eval #{eval_id} ({command}) - {dur:.1f}s")

        # Append to progress file
        if _progress_file:
            with open(_progress_file, "a") as pf:
                pf.write(json.dumps({"eval_id": eval_id, "command": command,
                                      "status": res["status"], "duration_ms": res.get("duration_ms", 0)}) + "\n")

    return res


def grade_assertion(assertion: dict, output: str) -> dict:
    """Grade a single assertion against output using LLM-aware heuristics."""
    text = assertion["text"]
    text_lower = text.lower()
    atype = assertion.get("type", "behavioral")
    output_lower = output.lower()

    if not output.strip():
        return {"text": text, "passed": False, "evidence": "Empty output"}

    # Guard assertions: check the output confirms NOT doing something
    if atype == "guard":
        # Look for negation of the action described
        negation_patterns = [
            "do not", "don't", "will not", "won't", "should not", "shouldn't",
            "skip", "avoid", "refrain", "not proceed", "not invoke", "not call",
            "not dispatch", "not execute", "not use", "would not", "never",
            "explicitly avoid", "important not to", "must not"
        ]
        # Check if output explicitly negates the guarded action
        key_words = [w for w in re.findall(r'\b\w{4,}\b', text_lower)
                     if w not in ("does", "invoke", "directly", "should", "guard", "that", "this", "with", "from")]
        for neg in negation_patterns:
            if neg in output_lower:
                for kw in key_words[:5]:
                    if kw in output_lower:
                        return {"text": text, "passed": True,
                                "evidence": f"Found negation '{neg}' near concept '{kw}'"}
        # Also check if the guarded action simply doesn't appear
        action_words = [w for w in key_words if len(w) > 5]
        if action_words and not any(w in output_lower for w in action_words[:3]):
            return {"text": text, "passed": True,
                    "evidence": f"Guarded concepts absent from output"}
        return {"text": text, "passed": False,
                "evidence": "Could not confirm guard constraint"}

    # Ordering assertions: check sequence
    if atype == "ordering":
        # Look for "before" pattern in assertion: "X before Y"
        before_match = re.search(r'(\w+)\s+before\s+(\w+)', text_lower)
        if before_match:
            first, second = before_match.group(1), before_match.group(2)
            pos_first = output_lower.find(first)
            pos_second = output_lower.find(second)
            if pos_first >= 0 and pos_second >= 0:
                passed = pos_first < pos_second
                return {"text": text, "passed": passed,
                        "evidence": f"'{first}' at pos {pos_first}, '{second}' at pos {pos_second}"}

    # Behavioral/output/context_discipline assertions: semantic keyword matching
    # Extract meaningful words from assertion (skip common words)
    stop_words = {"the", "and", "for", "that", "this", "with", "from", "into",
                  "does", "should", "will", "has", "have", "not", "are", "was",
                  "been", "being", "than", "them", "then", "each", "when",
                  "only", "also", "both", "just", "more", "most", "some",
                  "after", "before", "during", "about", "between", "through"}

    words = [w for w in re.findall(r'\b\w{3,}\b', text_lower) if w not in stop_words]
    if not words:
        return {"text": text, "passed": True, "evidence": "No key concepts to check"}

    matches = sum(1 for w in words if w in output_lower)
    match_ratio = matches / len(words)

    # More lenient threshold for longer assertions (more words = harder to match all)
    threshold = 0.35 if len(words) > 6 else 0.45

    return {
        "text": text,
        "passed": match_ratio >= threshold,
        "evidence": f"Matched {matches}/{len(words)} concepts ({match_ratio:.0%})",
    }


def grade_eval(eval_result: dict) -> dict:
    """Grade all assertions for an eval result using keyword heuristics."""
    if eval_result["status"] != "success":
        return {
            "eval_id": eval_result["eval_id"],
            "command": eval_result["command"],
            "status": eval_result["status"],
            "error": eval_result.get("error", ""),
            "grades": [],
            "pass_rate": 0.0,
            "passed": 0,
            "total": len(eval_result.get("assertions", [])),
            "grader": "keyword",
        }

    output = eval_result["output"]
    assertions = eval_result.get("assertions", [])
    grades = [grade_assertion(a, output) for a in assertions]

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
        "duration_ms": eval_result["duration_ms"],
        "grader": "keyword",
    }


# ---------------------------------------------------------------------------
# LLM grading (imported from llm_grader.py when --grader llm is used)
# ---------------------------------------------------------------------------

def grade_eval_llm(eval_result: dict, model: str = "haiku") -> dict:
    """Grade assertions using LLM with keyword fallback."""
    from llm_grader import grade_single_eval, grade_eval_keyword
    result = grade_single_eval(eval_result, model)
    if result is None:
        result = grade_eval_keyword(eval_result)
    return result


def main():
    parser = argparse.ArgumentParser(description="Run fhhs-skills evals")
    parser.add_argument("--grader", choices=["keyword", "llm"], default="keyword",
                        help="Grading method (default: keyword)")
    parser.add_argument("--grader-model", default=LLM_GRADER_MODEL,
                        help=f"LLM model for grading (default: {LLM_GRADER_MODEL})")
    parser.add_argument("--workers", type=int, default=MAX_WORKERS,
                        help=f"Parallel workers (default: {MAX_WORKERS})")
    parser.add_argument("--output-dir", type=str, default=None,
                        help="Output directory (default: full-run-N)")
    parser.add_argument("--commands", type=str, default=None,
                        help="Comma-separated list of commands to filter evals (e.g., 'build,review,fix')")
    args = parser.parse_args()

    # Determine output dir
    if args.output_dir:
        workspace_dir = Path(args.output_dir)
    else:
        base = Path(__file__).resolve().parent
        # Find next run number
        existing = sorted(base.glob("full-run-*"))
        next_num = 1
        if existing:
            try:
                next_num = max(int(d.name.split("-")[-1]) for d in existing) + 1
            except ValueError:
                pass
        workspace_dir = base / f"full-run-{next_num}"

    global _progress_file
    _progress_file = workspace_dir / "progress.jsonl"
    progress_file = _progress_file

    log(f"=== fhhs-skills Full Eval Run ===")
    log(f"Started: {datetime.now().isoformat()}")
    log(f"Workers: {args.workers}, Timeout: {TIMEOUT_SECONDS}s")
    log(f"Grader:  {args.grader}" + (f" ({args.grader_model})" if args.grader == "llm" else ""))
    log(f"Output:  {workspace_dir}")
    log("")

    # Load evals
    with open(EVALS_FILE) as f:
        data = json.load(f)
    evals = data["evals"]
    log(f"Loaded {len(evals)} evals across {len(set(e['command'] for e in evals))} commands")

    # Filter by --commands if provided
    if args.commands:
        commands_filter = {c.strip() for c in args.commands.split(",")}
        evals = [e for e in evals if e["command"] in commands_filter]
        log(f"Filtered to {len(evals)} evals for commands: {', '.join(sorted(commands_filter))}")
        if not evals:
            log("WARNING: No evals match the specified commands. Exiting.")
            sys.exit(0)

    # Pre-load all skill contents
    skill_cache = {}
    for e in evals:
        cmd = e["command"]
        if cmd not in skill_cache:
            skill_cache[cmd] = load_skill_content(cmd)

    errors = {k: v for k, v in skill_cache.items() if v.startswith("[ERROR")}
    if errors:
        log(f"WARNING: {len(errors)} commands missing:")
        for k, v in errors.items():
            log(f"  {k}: {v}")

    # Create workspace
    workspace_dir.mkdir(parents=True, exist_ok=True)
    progress_file.write_text("")

    log(f"\nRunning {len(evals)} evals...")
    log(f"Progress file: {progress_file}")
    log("")

    results = []

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        future_to_eval = {}
        for e in evals:
            future = executor.submit(run_single_eval, e, skill_cache[e["command"]], len(evals))
            future_to_eval[future] = e

        for future in as_completed(future_to_eval):
            try:
                result = future.result()
                results.append(result)
            except Exception as exc:
                e = future_to_eval[future]
                log(f"  EXCEPTION eval #{e['id']}: {exc}")
                results.append({
                    "eval_id": e["id"], "command": e["command"],
                    "status": "error", "error": str(exc)[:500],
                    "duration_ms": 0, "output": "", "assertions": e.get("assertions", []),
                })

    # Sort by eval_id
    results.sort(key=lambda r: r["eval_id"])

    # Save raw results
    raw_path = workspace_dir / "raw_results.json"
    with open(raw_path, "w") as f:
        json.dump(results, f, indent=2)
    log(f"\nRaw results saved to {raw_path}")

    # Grade all results
    if args.grader == "llm":
        log(f"Grading with LLM ({args.grader_model})...")
        graded = []
        from llm_grader import grade_with_fallback as llm_grade
        # Reset llm_grader counters
        import llm_grader as _lg
        _lg.completed_count = 0
        _lg.fallback_count = 0
        with ThreadPoolExecutor(max_workers=min(args.workers, 6)) as grade_executor:
            futures = {
                grade_executor.submit(llm_grade, r, len(results), args.grader_model): r
                for r in results
            }
            for future in as_completed(futures):
                try:
                    graded.append(future.result())
                except Exception as exc:
                    r = futures[future]
                    log(f"  GRADE EXCEPTION eval #{r['eval_id']}: {exc}")
                    graded.append(grade_eval(r))
        graded.sort(key=lambda g: g["eval_id"])
    else:
        log("Grading with keyword heuristics...")
        graded = [grade_eval(r) for r in results]

    graded_path = workspace_dir / "graded_results.json"
    with open(graded_path, "w") as f:
        json.dump(graded, f, indent=2)

    # Aggregate by command
    by_command = defaultdict(list)
    for g in graded:
        by_command[g["command"]].append(g)

    # Build summary
    graded_evals = [g for g in graded if g["status"] == "graded"]
    total_a = sum(g["total"] for g in graded_evals)
    passed_a = sum(g["passed"] for g in graded_evals)

    summary = {
        "run_date": datetime.now().isoformat(),
        "total_evals": len(evals),
        "successful": sum(1 for r in results if r["status"] == "success"),
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

    summary_path = workspace_dir / "summary.json"
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)

    # Print report
    log(f"\n{'='*75}")
    log(f"EVAL RESULTS SUMMARY")
    log(f"{'='*75}")
    log(f"Total evals:     {summary['total_evals']}")
    log(f"Successful runs: {summary['successful']}")
    log(f"Errors:          {summary['errors']}")
    log(f"Timeouts:        {summary['timeouts']}")
    log(f"")
    log(f"Total assertions:  {summary['total_assertions']}")
    log(f"Passed assertions: {summary['passed_assertions']}")
    log(f"Overall pass rate: {summary['overall_pass_rate']:.1%}")
    log(f"")
    log(f"{'Command':<20} {'Evals':>6} {'Assert':>7} {'Pass':>5} {'Rate':>7} {'Err':>4} {'Avg(s)':>7}")
    log(f"{'-'*20} {'-'*6} {'-'*7} {'-'*5} {'-'*7} {'-'*4} {'-'*7}")
    for cmd, stats in sorted(summary["by_command"].items(), key=lambda x: x[1]["pass_rate"]):
        avg_s = stats['avg_duration_ms'] / 1000
        log(f"{cmd:<20} {stats['evals']:>6} {stats['assertions']:>7} {stats['passed']:>5} {stats['pass_rate']:>6.0%} {stats['errors']:>4} {avg_s:>6.1f}")
    log(f"{'='*75}")

    # Failed assertions detail
    log(f"\n{'='*75}")
    log(f"FAILED ASSERTIONS DETAIL (showing first 50)")
    log(f"{'='*75}")
    fail_count = 0
    for g in graded:
        if fail_count >= 50:
            break
        if g["status"] != "graded":
            log(f"\n  Eval #{g['eval_id']} ({g['command']}): {g['status']} - {g.get('error', '')[:100]}")
            fail_count += 1
            continue
        failed = [grade for grade in g["grades"] if not grade["passed"]]
        if failed:
            log(f"\n  Eval #{g['eval_id']} ({g['command']}) - {g['passed']}/{g['total']} passed:")
            for fa in failed:
                log(f"    FAIL: {fa['text']}")
                log(f"          {fa['evidence']}")
            fail_count += 1

    log(f"\nDone. Results in {workspace_dir}")


if __name__ == "__main__":
    main()
