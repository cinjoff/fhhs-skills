#!/usr/bin/env node
/**
 * DEPRECATED: Use patch-claude-mem-project-env.cjs instead.
 *
 * This shim redirects to the unified patch which handles both worktree detection
 * AND CLAUDE_MEM_PROJECT env var injection for headless sessions.
 */
const path = require('path');
const { execFileSync } = require('child_process');
const newPatch = path.join(__dirname, 'patch-claude-mem-project-env.cjs');
console.log('NOTE: patch-claude-mem-worktree.cjs is deprecated — redirecting to unified patch');
try {
  execFileSync(process.execPath, [newPatch, ...process.argv.slice(2)], { stdio: 'inherit' });
} catch (e) {
  process.exit(e.status || 1);
}
