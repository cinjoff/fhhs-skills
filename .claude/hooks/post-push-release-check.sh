#!/bin/bash
# Post-push hook: checks if there are unreleased commits on main
# Fires after Bash tool use — exits silently unless git push was just run

TOOL_NAME="${CLAUDE_TOOL_NAME:-}"
TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"

# Only care about Bash tool calls that look like git push
if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

# Check if the command was a git push (rough match)
if ! echo "$TOOL_INPUT" | grep -q "git push"; then
  exit 0
fi

cd "$(dirname "$0")/../.." || exit 0

# Must be on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ "$BRANCH" != "main" ]; then
  exit 0
fi

# Check for commits since last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null)
if [ -z "$LAST_TAG" ]; then
  exit 0
fi

COMMITS_SINCE=$(git log "$LAST_TAG"..HEAD --oneline 2>/dev/null)
if [ -z "$COMMITS_SINCE" ]; then
  exit 0
fi

# Check if versions are in sync
PLUGIN_VER=$(python3 -c "import json; print(json.load(open('.claude-plugin/plugin.json'))['version'])" 2>/dev/null)
MARKET_VER=$(python3 -c "import json; print(json.load(open('.claude-plugin/marketplace.json'))['plugins'][0]['version'])" 2>/dev/null)
TAG_VER="${LAST_TAG#v}"

COMMIT_COUNT=$(echo "$COMMITS_SINCE" | wc -l | tr -d ' ')

echo "RELEASE REMINDER: $COMMIT_COUNT commit(s) on main since $LAST_TAG."
if [ "$PLUGIN_VER" != "$MARKET_VER" ]; then
  echo "WARNING: Version mismatch — plugin.json=$PLUGIN_VER, marketplace.json=$MARKET_VER"
fi
if [ "$PLUGIN_VER" = "$TAG_VER" ]; then
  echo "Version $PLUGIN_VER has not been bumped yet."
fi
echo "Run /fh:release to cut a release."
