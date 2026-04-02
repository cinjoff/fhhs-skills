#!/usr/bin/env node
// Learnings Nudge - SessionStart hook
// Checks when /fh:learnings last ran and nudges the user if it's been too long.
// Lightweight: reads one tiny timestamp file, no MCP calls, no digest cache.
// The $CMEM SessionStart hook (from claude-mem plugin) handles memory surfacing.

const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const NUDGE_AFTER_DAYS = 7;

// Consume stdin with 3-second timeout to prevent pipe hangs
let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try { JSON.parse(input); } catch (e) {}
  run();
});

function run() {
  const tsPath = path.join(cwd, '.planning', '.learnings-last-run');

  let daysSince = null;
  try {
    if (fs.existsSync(tsPath)) {
      const lastRun = new Date(fs.readFileSync(tsPath, 'utf8').trim());
      daysSince = Math.floor((Date.now() - lastRun.getTime()) / (1000 * 60 * 60 * 24));
    }
  } catch (e) {}

  // No .planning directory = no GSD project = nothing to nudge about
  if (!fs.existsSync(path.join(cwd, '.planning', 'PROJECT.md'))) {
    process.exit(0);
  }

  // Recently ran or timestamp exists and is fresh — stay silent
  if (daysSince !== null && daysSince < NUDGE_AFTER_DAYS) {
    process.exit(0);
  }

  // Build nudge message
  let message;
  if (daysSince === null) {
    message =
      '/fh:learnings has never been run on this project. ' +
      'It analyzes claude-mem observations to surface improvement patterns, ' +
      'file GitHub issues, and update CLAUDE.md. Consider running it when convenient.';
  } else {
    message =
      `It's been ${daysSince} days since the last /fh:learnings run. ` +
      'Run it to review accumulated observations and surface improvement patterns.';
  }

  const output = {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: message
    }
  };

  process.stdout.write(JSON.stringify(output));
}
