#!/usr/bin/env node
// Learnings Check - SessionStart hook
// Instructs the agent to query claude-mem directly for recent learnings
// and surface actionable improvements. Degrades silently if claude-mem
// is unavailable.

const fs = require('fs');
const os = require('os');
const path = require('path');

const homeDir = os.homedir();
const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(homeDir, '.claude');
const cacheDir = path.join(claudeDir, 'cache');

// Consume stdin with 3-second timeout to prevent pipe hangs
let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    // Parse but don't use — just drain the pipe
    JSON.parse(input);
  } catch (e) {}

  run();
});

function run() {
  // Ensure cache directory exists
  if (!fs.existsSync(cacheDir)) {
    try {
      fs.mkdirSync(cacheDir, { recursive: true });
    } catch (e) {}
  }

  // Instead of reading a pre-computed digest, instruct the agent to query
  // claude-mem directly for recent learnings and improvements.
  const message =
    'Session start: Check for recent learnings and improvements.\n' +
    'If claude-mem is available (mcp__plugin_claude-mem_mcp-search__smart_search),\n' +
    'query: smart_search({ query: "learnings improvements mistakes pitfalls", limit: 5 })\n' +
    'and timeline({ query: "recent session work", depth_before: 3, depth_after: 0 }).\n' +
    'Surface any actionable items as brief notes (max 3). If none found, continue silently.\n' +
    'This is a background check — do not block the user\'s main task.\n' +
    'If claude-mem is not available, skip silently.';

  const output = {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: message
    }
  };

  process.stdout.write(JSON.stringify(output));
}
