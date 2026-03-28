#!/bin/sh
# Post-update reconciliation — runs from bin/ which is re-linked BEFORE this executes,
# so it always uses the NEW version's logic (fixes chicken-and-egg stale prompt issue).
#
# Usage: post-update-reconcile.sh [--project-root <path>]
#
# Handles:
#   - claude-mem project-env patch (5a½)
#   - CLAUDE_MEM_PROJECT env var in project settings (5a¾)
#   - Global tracker refresh (5a⅞)

set -e

PROJECT_ROOT="$PWD"
while [ $# -gt 0 ]; do
  case "$1" in
    --project-root) PROJECT_ROOT="$2"; shift 2 ;;
    *) shift ;;
  esac
done

# --- 5a½: Re-apply claude-mem project-env patch ---

PATCH=$(find "$HOME/.claude/plugins/cache/fhhs-skills" -name patch-claude-mem-project-env.cjs -print -quit 2>/dev/null)
if [ -n "$PATCH" ]; then
  node "$PATCH" 2>&1
else
  echo "⚠ Project-env patch not found (expected in fhhs-skills plugin cache)"
fi

# --- 5a¾: Set CLAUDE_MEM_PROJECT env var ---
# Derive project name from git common dir (worktree-safe)
# --git-common-dir returns .git (regular) or /abs/path/to/repo/.git/worktrees/name (worktree)
# Resolve relative to cwd, then strip /.git* suffix to get the real repo root

COMMON_DIR=$(git -C "$PROJECT_ROOT" rev-parse --git-common-dir 2>/dev/null)
if [ -n "$COMMON_DIR" ]; then
  # Resolve to absolute path (handles relative ".git" case)
  RESOLVED=$(cd "$PROJECT_ROOT" && cd "$COMMON_DIR" 2>/dev/null && pwd)
  # Strip /.git/worktrees/xxx or /.git to get repo root
  REPO_ROOT=$(echo "$RESOLVED" | sed 's|/\.git/worktrees/[^/]*$||; s|/\.git$||')
  PROJECT_NAME=$(basename "$REPO_ROOT")
else
  PROJECT_NAME=""
fi

if [ -n "$PROJECT_NAME" ]; then
  SETTINGS="$PROJECT_ROOT/.claude/settings.json"
  if [ -f "$SETTINGS" ]; then
    CURRENT=$(python3 -c "
import json, sys
try:
    s = json.load(open('$SETTINGS'))
    print(s.get('env', {}).get('CLAUDE_MEM_PROJECT', ''))
except: pass
" 2>/dev/null)
    if [ "$CURRENT" = "$PROJECT_NAME" ]; then
      echo "✓ CLAUDE_MEM_PROJECT already set to $PROJECT_NAME"
    else
      python3 -c "
import json
f = '$SETTINGS'
try:
    s = json.load(open(f))
except: s = {}
s.setdefault('env', {})['CLAUDE_MEM_PROJECT'] = '$PROJECT_NAME'
with open(f, 'w') as fh: json.dump(s, fh, indent=2); fh.write('\n')
print('✓ CLAUDE_MEM_PROJECT set to $PROJECT_NAME')
" 2>/dev/null
    fi
  else
    echo "⚠ No .claude/settings.json — skipping CLAUDE_MEM_PROJECT (run /fh:new-project first)"
  fi
else
  echo "⚠ Not a git repo — skipping CLAUDE_MEM_PROJECT"
fi

# --- 5a⅞: Register project in tracker + refresh global tracker ---

TRACKER_DIR="$HOME/.claude/tracker"
mkdir -p "$TRACKER_DIR"

# Register current project in the global tracker registry
REGISTRY_FILE="$TRACKER_DIR/projects.json"
if [ -d "$PROJECT_ROOT/.planning" ]; then
  # Use the same worktree-safe resolution as CLAUDE_MEM_PROJECT above
  PROJ_NAME="${PROJECT_NAME:-$(basename "$PROJECT_ROOT")}"
  # Detect Conductor workspace pattern
  IS_CONDUCTOR="false"
  CONDUCTOR_WS=""
  case "$PROJECT_ROOT" in
    */conductor/workspaces/*/*)
      IS_CONDUCTOR="true"
      CONDUCTOR_WS=$(echo "$PROJECT_ROOT" | sed 's|.*/conductor/workspaces/\([^/]*\)/.*|\1|')
      ;;
  esac

  python3 -c "
import json, os, sys
from datetime import datetime

registry_file = '$REGISTRY_FILE'
project_root = '$PROJECT_ROOT'
proj_name = '$PROJ_NAME'
is_conductor = '$IS_CONDUCTOR' == 'true'
conductor_ws = '$CONDUCTOR_WS'

# Read existing registry
try:
    with open(registry_file) as f:
        registry = json.load(f)
    if not isinstance(registry, list):
        registry = []
except:
    registry = []

now = datetime.utcnow().isoformat() + 'Z'

# Find existing entry
found = False
for entry in registry:
    if entry.get('path') == project_root:
        entry['name'] = proj_name
        entry['lastSeen'] = now
        if is_conductor:
            entry['conductorWorkspace'] = conductor_ws
        found = True
        break

if not found:
    entry = {'path': project_root, 'name': proj_name, 'addedAt': now, 'lastSeen': now}
    if is_conductor:
        entry['conductorWorkspace'] = conductor_ws
    registry.append(entry)

with open(registry_file, 'w') as f:
    json.dump(registry, f, indent=2)
    f.write('\n')

print('✓ Project registered in tracker: ' + proj_name + (' (conductor: ' + conductor_ws + ')' if is_conductor else ''))
" 2>/dev/null || echo "⚠ Could not register project in tracker"
else
  echo "⊘ No .planning/ — skipping tracker registration (run /fh:new-project first)"
fi

PLUGIN_ROOT=""
LATEST="$(ls -d "$HOME/.claude/plugins/cache/fhhs-skills/fh"/*/ 2>/dev/null | sort | tail -1)"
LATEST="${LATEST%/}"
if [ -n "$LATEST" ] && [ -d "$LATEST/templates/project-tracker" ]; then
  PLUGIN_ROOT="$LATEST"
fi

if [ -n "$PLUGIN_ROOT" ]; then
  PLUGIN_VER=$(python3 -c "import json; print(json.load(open('$PLUGIN_ROOT/.claude-plugin/plugin.json'))['version'])" 2>/dev/null)
  CURRENT_VER=$(cat "$TRACKER_DIR/.version" 2>/dev/null)

  if [ "$PLUGIN_VER" = "$CURRENT_VER" ]; then
    echo "✓ Tracker already at v$PLUGIN_VER"
  else
    for f in "$PLUGIN_ROOT/templates/project-tracker"/*; do
      [ -f "$f" ] && cp "$f" "$TRACKER_DIR/$(basename "$f")"
    done
    echo "$PLUGIN_VER" > "$TRACKER_DIR/.version"
    echo "✓ Tracker refreshed to v$PLUGIN_VER (was: ${CURRENT_VER:-none})"
  fi
else
  echo "⚠ Could not find plugin templates for tracker refresh"
fi
