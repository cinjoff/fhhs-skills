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
FIXTURES_DIR = PROJECT_ROOT / "evals" / "fixtures"
DEFAULT_FIXTURE = FIXTURES_DIR / "nextjs-app-deep"
# Keep backward-compat alias
FIXTURE_DIR = DEFAULT_FIXTURE
MAX_WORKERS = 6  # slightly conservative to avoid rate limits
TIMEOUT_SECONDS = 180  # 3 minutes per eval
LLM_GRADER_MODEL = "haiku"

# Command -> skill/command file path mapping
COMMAND_MAP = {
    "auto": ".claude/skills/auto/SKILL.md",
    "build": ".claude/skills/build/SKILL.md",
    "fix": ".claude/skills/fix/SKILL.md",
    "health": ".claude/skills/health/SKILL.md",
    "learnings": ".claude/skills/learnings/SKILL.md",
    "help": ".claude/skills/help/SKILL.md",
    "map-codebase": ".claude/skills/map-codebase/SKILL.md",
    "new-project": ".claude/skills/new-project/SKILL.md",
    "nextjs-perf": ".claude/skills/nextjs-perf/PROMPT.md",
    "observability": ".claude/skills/observability/SKILL.md",
    "plan-review": ".claude/skills/plan-review/SKILL.md",
    "plan-work": ".claude/skills/plan-work/SKILL.md",
    "playwright-testing": ".claude/skills/playwright-testing/PROMPT.md",
    "progress": ".claude/skills/progress/SKILL.md",
    "quick": ".claude/skills/quick/SKILL.md",
    "refactor": ".claude/skills/refactor/SKILL.md",
    "research": ".claude/skills/research/SKILL.md",
    "review": ".claude/skills/review/SKILL.md",
    "revise-claude-md": ".claude/skills/revise-claude-md/SKILL.md",
    "settings": ".claude/skills/settings/SKILL.md",
    "setup": ".claude/skills/setup/SKILL.md",
    # Design agents (formerly design skills — now dispatched as agents)
    "design-adapt": "agents/design-adapt.md",
    "design-audit": "agents/design-audit.md",
    "design-bolder": "agents/design-bolder.md",
    "design-clarify": "agents/design-clarify.md",
    "design-colorize": "agents/design-colorize.md",
    "design-delight": "agents/design-delight.md",
    "design-distill": "agents/design-distill.md",
    "design-extract": "agents/design-extract.md",
    "design-harden": "agents/design-harden.md",
    "design-normalize": "agents/design-normalize.md",
    "design-onboard": "agents/design-onboard.md",
    "design-optimize": "agents/design-optimize.md",
    "design-polish": "agents/design-polish.md",
    "design-quieter": "agents/design-quieter.md",
    "design-secure": "agents/design-secure.md",
    "design-simplify": "agents/design-simplify.md",
    "todos": ".claude/skills/todos/SKILL.md",
    "tracker": ".claude/skills/tracker/SKILL.md",
    "startup-advisor": ".claude/skills/startup-advisor/SKILL.md",
    "startup-competitors": ".claude/skills/startup-competitors/SKILL.md",
    "startup-design": ".claude/skills/startup-design/SKILL.md",
    "startup-pitch": ".claude/skills/startup-pitch/SKILL.md",
    "startup-positioning": ".claude/skills/startup-positioning/SKILL.md",
    "ui-animate": ".claude/skills/ui-animate/SKILL.md",
    "ui-branding": ".claude/skills/ui-branding/SKILL.md",
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
    """Determine the working directory for an eval based on scenario_requires and fixture."""
    scenario = eval_item.get("scenario_requires", [])
    if "no_gsd_project" in scenario:
        # Create a temp directory without .planning/ for evals that test the
        # "no GSD project" scenario (should trigger refusal / /new-project prompt)
        tmpdir = tempfile.mkdtemp(prefix=f"eval-no-gsd-{eval_item['id']}-")
        return tmpdir

    # Support per-eval fixture selection via "fixture" field
    fixture_name = eval_item.get("fixture")
    if fixture_name:
        fixture_path = FIXTURES_DIR / fixture_name
        if fixture_path.exists():
            return str(fixture_path)
        # Warn but fall back to default rather than crashing
        log(f"  WARNING: fixture '{fixture_name}' not found at {fixture_path}, using default")

    # Default: run from the fixture directory which has full GSD structure
    return str(DEFAULT_FIXTURE)


def run_deterministic_checks(eval_item: dict, output: str) -> list:
    """Run deterministic checks from the eval's checks array.

    Returns list of {"check_type": str, "passed": bool, "detail": str}.
    Returns empty list if no checks defined (backward compatible).
    """
    checks = eval_item.get("checks", [])
    if not checks:
        return []

    results = []
    output_lower = output.lower()

    for check in checks:
        check_type = check.get("type", "")

        if check_type == "regex":
            pattern = check.get("pattern", "")
            try:
                matched = bool(re.search(pattern, output, re.IGNORECASE))
            except re.error as e:
                matched = False
                results.append({
                    "check_type": check_type,
                    "passed": False,
                    "detail": f"Invalid regex pattern '{pattern}': {e}",
                })
                continue
            results.append({
                "check_type": check_type,
                "passed": matched,
                "detail": f"Pattern '{pattern}' {'found' if matched else 'not found'} in output",
            })

        elif check_type == "required_terms":
            terms = check.get("terms", [])
            missing = [t for t in terms if t.lower() not in output_lower]
            passed = len(missing) == 0
            results.append({
                "check_type": check_type,
                "passed": passed,
                "detail": f"All {len(terms)} terms present" if passed
                          else f"Missing terms: {missing}",
            })

        elif check_type == "forbidden_terms":
            terms = check.get("terms", [])
            found = [t for t in terms if t.lower() in output_lower]
            passed = len(found) == 0
            results.append({
                "check_type": check_type,
                "passed": passed,
                "detail": f"No forbidden terms found" if passed
                          else f"Forbidden terms present: {found}",
            })

        else:
            # Unknown check type — skip with a warning entry
            results.append({
                "check_type": check_type,
                "passed": True,
                "detail": f"Unknown check type '{check_type}' — skipped",
            })

    return results


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
        env = {k: v for k, v in os.environ.items()
               if not k.startswith("CLAUDE") and not k.startswith("CONDUCTOR")
               and k != "__CFBundleIdentifier"}
        result = subprocess.run(
            ["claude", "-p", full_prompt, "--output-format", "stream-json", "--verbose"],
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
            # Parse NDJSON stream to extract assistant text and result metadata
            output_text = ""
            output_data = {}
            for line in result.stdout.strip().split("\n"):
                if not line.strip():
                    continue
                try:
                    event = json.loads(line)
                except json.JSONDecodeError:
                    continue
                etype = event.get("type", "")
                if etype == "assistant":
                    msg = event.get("message", {})
                    for block in msg.get("content", []):
                        if block.get("type") == "text":
                            output_text += block.get("text", "")
                elif etype == "result":
                    output_data = event
                    # Also grab any result text (may be populated in future CLI versions)
                    if not output_text and event.get("result"):
                        output_text = event["result"]

            # Extract token usage from result event
            usage = output_data.get("usage", {})
            token_info = {
                "input_tokens": usage.get("input_tokens", 0),
                "output_tokens": usage.get("output_tokens", 0),
                "cache_creation_tokens": usage.get("cache_creation_input_tokens", 0),
                "cache_read_tokens": usage.get("cache_read_input_tokens", 0),
                "cost_usd": output_data.get("total_cost_usd", 0),
            }
            token_info["total_tokens"] = (
                token_info["input_tokens"] + token_info["output_tokens"]
                + token_info["cache_creation_tokens"] + token_info["cache_read_tokens"]
            )

            res = {
                "eval_id": eval_id, "command": command, "status": "success",
                "output": output_text[:8000], "duration_ms": duration_ms,
                "assertions": assertions, "expected": expected,
                "tokens": token_info,
                # Store checks for grading later
                "checks": eval_item.get("checks", []),
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
            progress_entry = {
                "eval_id": eval_id, "command": command,
                "status": res["status"], "duration_ms": res.get("duration_ms", 0),
            }
            if "tokens" in res:
                progress_entry["tokens"] = res["tokens"]
            with open(_progress_file, "a") as pf:
                pf.write(json.dumps(progress_entry) + "\n")

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
            "deterministic_grades": [],
            "pass_rate": 0.0,
            "passed": 0,
            "total": len(eval_result.get("assertions", [])),
            "grader": "keyword",
        }

    output = eval_result["output"]
    assertions = eval_result.get("assertions", [])

    # Run deterministic checks FIRST — if any fail, short-circuit
    # eval_result carries checks[] forwarded from run_single_eval
    det_checks = run_deterministic_checks(eval_result, output)
    det_failures = [c for c in det_checks if not c["passed"]]
    if det_failures:
        return {
            "eval_id": eval_result["eval_id"],
            "command": eval_result["command"],
            "status": "check_failed",
            "grades": [],
            "deterministic_grades": det_checks,
            "pass_rate": 0.0,
            "passed": 0,
            "total": len(assertions),
            "duration_ms": eval_result.get("duration_ms", 0),
            "grader": "deterministic",
        }

    grades = [grade_assertion(a, output) for a in assertions]
    passed = sum(1 for g in grades if g["passed"])
    total = len(grades) if grades else 1

    return {
        "eval_id": eval_result["eval_id"],
        "command": eval_result["command"],
        "status": "graded",
        "grades": grades,
        "deterministic_grades": det_checks,
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

    # Run deterministic checks FIRST — same gate as keyword path
    output = eval_result.get("output", "")
    det_checks = run_deterministic_checks(eval_result, output)
    det_failures = [c for c in det_checks if not c["passed"]]
    if det_failures:
        return {
            "eval_id": eval_result["eval_id"],
            "command": eval_result["command"],
            "status": "check_failed",
            "grades": [],
            "deterministic_grades": det_checks,
            "pass_rate": 0.0,
            "passed": 0,
            "total": len(eval_result.get("assertions", [])),
            "duration_ms": eval_result.get("duration_ms", 0),
            "grader": "deterministic",
        }

    result = grade_single_eval(eval_result, model)
    if result is None:
        result = grade_eval_keyword(eval_result)

    # Attach deterministic grades to LLM result too
    result.setdefault("deterministic_grades", det_checks)
    return result


# ---------------------------------------------------------------------------
# Baselines helpers
# ---------------------------------------------------------------------------

BASELINES_PATH = Path(__file__).resolve().parent / "baselines.json"


def load_baselines() -> dict:
    """Load baselines.json if it exists; return empty dict otherwise."""
    if BASELINES_PATH.exists():
        try:
            return json.loads(BASELINES_PATH.read_text())
        except (json.JSONDecodeError, OSError):
            return {}
    return {}


def write_baselines(by_command_stats: dict, grader: str) -> None:
    """Write current per-command metrics to baselines.json."""
    commands = {}
    for cmd, stats in by_command_stats.items():
        commands[cmd] = {
            "pass_rate": stats.get("pass_rate", 0.0),
            "avg_tokens": stats.get("avg_tokens", 0),
            "avg_duration_ms": stats.get("avg_duration_ms", 0),
        }
    baselines = {
        "created": datetime.now().isoformat(),
        "grader": grader,
        "thresholds": {
            "pass_rate_drop": 0.05,
            "token_increase": 0.20,
            "duration_increase": 0.30,
        },
        "commands": commands,
    }
    BASELINES_PATH.write_text(json.dumps(baselines, indent=2))
    log(f"Baselines written to {BASELINES_PATH}")


def print_regression_report(by_command_stats: dict, baselines: dict) -> None:
    """Compare current metrics against baselines and print regression report."""
    if not baselines or "commands" not in baselines:
        return

    thresholds = baselines.get("thresholds", {
        "pass_rate_drop": 0.05,
        "token_increase": 0.20,
        "duration_increase": 0.30,
    })
    baseline_cmds = baselines["commands"]

    regressions = []
    ok_cmds = []

    for cmd, stats in sorted(by_command_stats.items()):
        if cmd not in baseline_cmds:
            continue
        b = baseline_cmds[cmd]
        issues = []

        cur_rate = stats.get("pass_rate", 0.0)
        base_rate = b.get("pass_rate", 0.0)
        if base_rate > 0 and (base_rate - cur_rate) > thresholds["pass_rate_drop"]:
            issues.append(f"pass_rate {base_rate:.1%} -> {cur_rate:.1%} (drop {base_rate - cur_rate:.1%})")

        cur_tok = stats.get("avg_tokens", 0)
        base_tok = b.get("avg_tokens", 0)
        if base_tok > 0 and (cur_tok - base_tok) / base_tok > thresholds["token_increase"]:
            issues.append(f"avg_tokens {base_tok:,} -> {cur_tok:,} (+{(cur_tok - base_tok) / base_tok:.0%})")

        cur_dur = stats.get("avg_duration_ms", 0)
        base_dur = b.get("avg_duration_ms", 0)
        if base_dur > 0 and (cur_dur - base_dur) / base_dur > thresholds["duration_increase"]:
            issues.append(f"avg_duration {base_dur}ms -> {cur_dur}ms (+{(cur_dur - base_dur) / base_dur:.0%})")

        if issues:
            regressions.append((cmd, issues))
        else:
            ok_cmds.append(cmd)

    log(f"\n{'='*90}")
    log(f"BASELINE COMPARISON (vs {baselines.get('created', 'unknown')})")
    log(f"{'='*90}")
    if regressions:
        log(f"REGRESSIONS ({len(regressions)}):")
        for cmd, issues in regressions:
            log(f"  REGRESSION  {cmd}")
            for iss in issues:
                log(f"              {iss}")
    else:
        log("  No regressions detected.")

    if ok_cmds:
        log(f"\nOK ({len(ok_cmds)}): {', '.join(ok_cmds)}")

    skipped = [cmd for cmd in by_command_stats if cmd not in baseline_cmds]
    if skipped:
        log(f"NEW (no baseline): {', '.join(sorted(skipped))}")
    log(f"{'='*90}")


def print_coverage_report() -> None:
    """Scan shipped skills and compare against COMMAND_MAP and evals.json."""
    skills_dir = PROJECT_ROOT / ".claude" / "skills"

    # Collect all shipped skills (dirs with a SKILL.md or PROMPT.md)
    shipped_skills = []
    for child in sorted(skills_dir.iterdir()):
        if child.is_dir() and child.name != "__pycache__":
            if (child / "SKILL.md").exists() or (child / "PROMPT.md").exists():
                shipped_skills.append(child.name)

    # Count evals per command from evals.json
    with open(EVALS_FILE) as f:
        data = json.load(f)
    evals = data["evals"]
    eval_counts: dict = defaultdict(int)
    for e in evals:
        eval_counts[e["command"]] += 1

    # Build report rows
    covered = []
    uncovered = []
    rows = []
    for skill in shipped_skills:
        in_map = skill in COMMAND_MAP
        count = eval_counts.get(skill, 0)
        status = "covered" if count > 0 else "uncovered"
        map_flag = "yes" if in_map else "NO"
        rows.append((skill, count, status, map_flag))
        if count > 0:
            covered.append(skill)
        else:
            uncovered.append(skill)

    total = len(shipped_skills)
    n_covered = len(covered)
    pct = int(n_covered / total * 100) if total else 0

    log(f"\n{'='*70}")
    log("EVAL COVERAGE REPORT")
    log(f"{'='*70}")
    log(f"{'Skill':<28} {'Evals':>6}  {'Status':<12} {'In COMMAND_MAP':>14}")
    log(f"{'-'*28} {'-'*6}  {'-'*12} {'-'*14}")
    for skill, count, status, map_flag in rows:
        log(f"{skill:<28} {count:>6}  {status:<12} {map_flag:>14}")
    log(f"{'='*70}")
    log(f"Summary: {n_covered}/{total} skills covered ({pct}%)")
    if uncovered:
        log(f"\nUncovered skills ({len(uncovered)}):")
        for s in uncovered:
            log(f"  - {s}")
    log(f"{'='*70}\n")


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
    parser.add_argument("--tier", choices=["micro", "smoke", "full", "all"], default="all",
                        help="Eval tier to run: micro (micro only), smoke (smoke+micro), full/all (all evals, default: all)")
    parser.add_argument("--tags", type=str, default=None,
                        help="Comma-separated tags — only run evals that have ALL specified tags (AND logic)")
    parser.add_argument("--update-baselines", action="store_true", default=False,
                        help="After grading, write current per-command metrics to baselines.json")
    parser.add_argument("--coverage", action="store_true", default=False,
                        help="Print eval coverage report (shipped skills vs evals) and exit")
    args = parser.parse_args()

    # Handle --coverage before anything else
    if args.coverage:
        print_coverage_report()
        sys.exit(0)

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
    log(f"Tier:    {args.tier}")
    log(f"Output:  {workspace_dir}")
    log("")

    # Load evals
    with open(EVALS_FILE) as f:
        data = json.load(f)
    evals = data["evals"]
    log(f"Loaded {len(evals)} evals across {len(set(e['command'] for e in evals))} commands")

    # Filter by --tier
    if args.tier == "micro":
        evals = [e for e in evals if e.get("tier") == "micro"]
        log(f"Filtered to {len(evals)} micro-tier evals")
    elif args.tier == "smoke":
        evals = [e for e in evals if e.get("tier") in ("smoke", "micro")]
        log(f"Filtered to {len(evals)} smoke-tier evals (includes micro)")
    # tier == "full" or "all" => keep all (same as current behavior)

    # Filter by --tags if provided (AND logic — eval must have ALL tags)
    if args.tags:
        tags_filter = {t.strip() for t in args.tags.split(",")}
        evals = [e for e in evals if tags_filter.issubset(set(e.get("tags", [])))]
        log(f"Filtered to {len(evals)} evals matching tags: {', '.join(sorted(tags_filter))}")
        if not evals:
            log("WARNING: No evals match the specified tags. Exiting.")
            sys.exit(0)

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

        def llm_grade_with_det_gate(r, total, model):
            """Run deterministic checks before LLM grading — same gate as keyword path."""
            if r["status"] == "success":
                output = r.get("output", "")
                det_checks = run_deterministic_checks(r, output)
                det_failures = [c for c in det_checks if not c["passed"]]
                if det_failures:
                    return {
                        "eval_id": r["eval_id"], "command": r["command"],
                        "status": "check_failed", "grades": [],
                        "deterministic_grades": det_checks,
                        "pass_rate": 0.0, "passed": 0,
                        "total": len(r.get("assertions", [])),
                        "duration_ms": r.get("duration_ms", 0),
                        "grader": "deterministic",
                    }
            return llm_grade(r, total, model)

        with ThreadPoolExecutor(max_workers=min(args.workers, 6)) as grade_executor:
            futures = {
                grade_executor.submit(llm_grade_with_det_gate, r, len(results), args.grader_model): r
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
    check_failed_count = sum(1 for g in graded if g["status"] == "check_failed")

    # Aggregate token usage from raw results
    token_results = [r for r in results if r.get("tokens")]
    total_input = sum(r["tokens"]["input_tokens"] for r in token_results)
    total_output = sum(r["tokens"]["output_tokens"] for r in token_results)
    total_cache_create = sum(r["tokens"]["cache_creation_tokens"] for r in token_results)
    total_cache_read = sum(r["tokens"]["cache_read_tokens"] for r in token_results)
    total_cost = sum(r["tokens"]["cost_usd"] for r in token_results)
    total_all_tokens = sum(r["tokens"]["total_tokens"] for r in token_results)

    summary = {
        "run_date": datetime.now().isoformat(),
        "total_evals": len(evals),
        "successful": sum(1 for r in results if r["status"] == "success"),
        "errors": sum(1 for r in results if r["status"] == "error"),
        "timeouts": sum(1 for r in results if r["status"] == "timeout"),
        "check_failures": check_failed_count,
        "total_assertions": total_a,
        "passed_assertions": passed_a,
        "overall_pass_rate": passed_a / total_a if total_a > 0 else 0.0,
        "token_usage": {
            "total_tokens": total_all_tokens,
            "input_tokens": total_input,
            "output_tokens": total_output,
            "cache_creation_tokens": total_cache_create,
            "cache_read_tokens": total_cache_read,
            "total_cost_usd": round(total_cost, 4),
            "avg_tokens_per_eval": int(total_all_tokens / max(len(token_results), 1)),
            "avg_cost_per_eval": round(total_cost / max(len(token_results), 1), 4),
        },
        "by_command": {},
    }

    # Build a lookup from eval_id -> raw result for token data
    result_by_id = {r["eval_id"]: r for r in results}

    for cmd, cmd_graded in sorted(by_command.items()):
        cmd_g = [g for g in cmd_graded if g["status"] == "graded"]
        cmd_total = sum(g["total"] for g in cmd_g)
        cmd_passed = sum(g["passed"] for g in cmd_g)
        cmd_errors = sum(1 for g in cmd_graded if g["status"] in ("error", "timeout"))
        cmd_check_failed = sum(1 for g in cmd_graded if g["status"] == "check_failed")
        avg_dur = sum(g.get("duration_ms", 0) for g in cmd_g) / max(len(cmd_g), 1)

        # Per-command token aggregation
        cmd_token_results = [result_by_id[g["eval_id"]] for g in cmd_g if result_by_id.get(g["eval_id"], {}).get("tokens")]
        cmd_tokens = sum(r["tokens"]["total_tokens"] for r in cmd_token_results) if cmd_token_results else 0
        cmd_cost = sum(r["tokens"]["cost_usd"] for r in cmd_token_results) if cmd_token_results else 0

        summary["by_command"][cmd] = {
            "evals": len(cmd_graded),
            "assertions": cmd_total,
            "passed": cmd_passed,
            "pass_rate": cmd_passed / cmd_total if cmd_total > 0 else 0.0,
            "errors": cmd_errors,
            "check_failures": cmd_check_failed,
            "avg_duration_ms": int(avg_dur),
            "total_tokens": cmd_tokens,
            "avg_tokens": int(cmd_tokens / max(len(cmd_token_results), 1)),
            "total_cost_usd": round(cmd_cost, 4),
        }

    summary_path = workspace_dir / "summary.json"
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)

    # Print report
    tu = summary["token_usage"]
    log(f"\n{'='*90}")
    log(f"EVAL RESULTS SUMMARY")
    log(f"{'='*90}")
    log(f"Total evals:     {summary['total_evals']}")
    log(f"Successful runs: {summary['successful']}")
    log(f"Errors:          {summary['errors']}")
    log(f"Timeouts:        {summary['timeouts']}")
    log(f"Check failures:  {summary['check_failures']}")
    log(f"")
    log(f"Total assertions:  {summary['total_assertions']}")
    log(f"Passed assertions: {summary['passed_assertions']}")
    log(f"Overall pass rate: {summary['overall_pass_rate']:.1%}")
    log(f"")
    log(f"TOKEN USAGE:")
    log(f"  Total tokens:      {tu['total_tokens']:>12,}")
    log(f"  Input tokens:      {tu['input_tokens']:>12,}")
    log(f"  Output tokens:     {tu['output_tokens']:>12,}")
    log(f"  Cache creation:    {tu['cache_creation_tokens']:>12,}")
    log(f"  Cache read:        {tu['cache_read_tokens']:>12,}")
    log(f"  Total cost:        ${tu['total_cost_usd']:>11,.4f}")
    log(f"  Avg tokens/eval:   {tu['avg_tokens_per_eval']:>12,}")
    log(f"  Avg cost/eval:     ${tu['avg_cost_per_eval']:>11,.4f}")
    log(f"")
    log(f"{'Command':<20} {'Evals':>5} {'Assert':>6} {'Pass':>5} {'Rate':>6} {'Err':>3} {'ChkF':>4} {'Avg(s)':>6} {'AvgTok':>7} {'Cost$':>7}")
    log(f"{'-'*20} {'-'*5} {'-'*6} {'-'*5} {'-'*6} {'-'*3} {'-'*4} {'-'*6} {'-'*7} {'-'*7}")
    for cmd, stats in sorted(summary["by_command"].items(), key=lambda x: x[1]["pass_rate"]):
        avg_s = stats['avg_duration_ms'] / 1000
        avg_tok = stats.get('avg_tokens', 0)
        cost = stats.get('total_cost_usd', 0)
        chkf = stats.get('check_failures', 0)
        log(f"{cmd:<20} {stats['evals']:>5} {stats['assertions']:>6} {stats['passed']:>5} {stats['pass_rate']:>5.0%} {stats['errors']:>3} {chkf:>4} {avg_s:>5.1f} {avg_tok:>7,} {cost:>6.2f}")
    log(f"{'='*90}")

    # Failed assertions detail
    log(f"\n{'='*75}")
    log(f"FAILED ASSERTIONS DETAIL (showing first 50)")
    log(f"{'='*75}")
    fail_count = 0
    for g in graded:
        if fail_count >= 50:
            break
        if g["status"] == "check_failed":
            det = g.get("deterministic_grades", [])
            failed_det = [c for c in det if not c["passed"]]
            log(f"\n  Eval #{g['eval_id']} ({g['command']}): check_failed")
            for fd in failed_det:
                log(f"    CHECK FAIL [{fd['check_type']}]: {fd['detail']}")
            fail_count += 1
            continue
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

    # Baselines comparison
    baselines = load_baselines()
    if baselines:
        print_regression_report(summary["by_command"], baselines)
    elif args.update_baselines:
        log("\nNo existing baselines found — creating initial baselines.")

    # Write baselines if requested
    if args.update_baselines:
        write_baselines(summary["by_command"], args.grader)

    log(f"\nDone. Results in {workspace_dir}")


if __name__ == "__main__":
    main()
