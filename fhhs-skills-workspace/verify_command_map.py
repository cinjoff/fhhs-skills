#!/usr/bin/env python3
"""Verify COMMAND_MAP paths resolve to real files and all eval commands have mappings."""

import json
import re
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
EVALS_FILE = PROJECT_ROOT / "evals" / "evals.json"
RUNNER_FILE = Path(__file__).resolve().parent / "run_all_evals.py"


def extract_command_map():
    """Extract COMMAND_MAP dict from run_all_evals.py source."""
    source = RUNNER_FILE.read_text()
    match = re.search(r'COMMAND_MAP\s*=\s*\{([^}]+)\}', source, re.DOTALL)
    if not match:
        print("ERROR: Could not find COMMAND_MAP in run_all_evals.py")
        sys.exit(1)
    pairs = re.findall(r'"([^"]+)":\s*"([^"]+)"', match.group(1))
    return dict(pairs)


def main():
    errors = []

    # 1. Extract and validate COMMAND_MAP paths
    command_map = extract_command_map()
    print(f"Found {len(command_map)} commands in COMMAND_MAP")

    for cmd, path in sorted(command_map.items()):
        full_path = PROJECT_ROOT / path
        if not full_path.exists():
            errors.append(f"MISSING FILE: {cmd} -> {path}")

    # 2. Check all eval commands have COMMAND_MAP entries
    with open(EVALS_FILE) as f:
        evals = json.load(f)["evals"]

    eval_commands = set(e["command"] for e in evals)
    map_commands = set(command_map.keys())

    orphans = eval_commands - map_commands
    for cmd in sorted(orphans):
        errors.append(f"ORPHAN EVAL COMMAND: '{cmd}' has evals but no COMMAND_MAP entry")

    unused = map_commands - eval_commands
    for cmd in sorted(unused):
        print(f"  INFO: '{cmd}' in COMMAND_MAP but has no evals")

    # Report
    if errors:
        print(f"\n{len(errors)} ERROR(S):")
        for e in errors:
            print(f"  {e}")
        sys.exit(1)
    else:
        print("All checks passed.")
        sys.exit(0)


if __name__ == "__main__":
    main()
