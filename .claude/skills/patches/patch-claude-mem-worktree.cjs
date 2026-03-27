#!/usr/bin/env node
/**
 * Patch claude-mem to use parent repo name for git worktrees.
 *
 * By default, claude-mem stores observations under the worktree directory
 * basename (e.g., "quito") instead of the parent repo name (e.g., "nerve-os").
 * This patch modifies gp() to check for worktrees first and use the parent
 * project name for both storage and queries.
 *
 * Re-run after every claude-mem update.
 *
 * Usage:
 *   node patch-claude-mem-worktree.cjs
 *   node patch-claude-mem-worktree.cjs --check   # exit 0 if patched, 1 if not
 */

const fs = require('fs');
const path = require('path');
const { homedir } = require('os');
const CHECK_ONLY = process.argv.includes('--check');

const OLD_GP =
  'function gp(t){if(!t||t.trim()==="")return y.warn("PROJECT_NAME",' +
  '"Empty cwd provided, using fallback",{cwd:t}),"unknown-project";' +
  'let e=mq.default.basename(t);if(e===""){if(process.platform==="win32")' +
  '{let n=t.match(/^([A-Z]):\\\\/i);if(n){let s=`drive-${n[1].toUpperCase()}`;' +
  'return y.info("PROJECT_NAME","Drive root detected",{cwd:t,projectName:s}),s}}' +
  'return y.warn("PROJECT_NAME","Root directory detected, using fallback",{cwd:t}),' +
  '"unknown-project"}return e}';

const NEW_GP =
  'function gp(t){if(!t||t.trim()==="")return y.warn("PROJECT_NAME",' +
  '"Empty cwd provided, using fallback",{cwd:t}),"unknown-project";' +
  'let wt=dq(t);if(wt.isWorktree&&wt.parentProjectName)return y.info("PROJECT_NAME",' +
  '"Worktree detected, using parent project",{cwd:t,parent:wt.parentProjectName,' +
  'worktree:wt.worktreeName}),wt.parentProjectName;' +
  'let e=mq.default.basename(t);if(e===""){if(process.platform==="win32")' +
  '{let n=t.match(/^([A-Z]):\\\\/i);if(n){let s=`drive-${n[1].toUpperCase()}`;' +
  'return y.info("PROJECT_NAME","Drive root detected",{cwd:t,projectName:s}),s}}' +
  'return y.warn("PROJECT_NAME","Root directory detected, using fallback",{cwd:t}),' +
  '"unknown-project"}return e}';

// Find all worker-service.cjs files
const home = homedir();
const targets = [];

// Marketplace source
const mpPath = path.join(home, '.claude', 'plugins', 'marketplaces', 'thedotmack', 'plugin', 'scripts', 'worker-service.cjs');
if (fs.existsSync(mpPath)) targets.push(mpPath);

// All cached versions
const cacheDir = path.join(home, '.claude', 'plugins', 'cache', 'thedotmack', 'claude-mem');
if (fs.existsSync(cacheDir)) {
  for (const ver of fs.readdirSync(cacheDir)) {
    const p = path.join(cacheDir, ver, 'scripts', 'worker-service.cjs');
    if (fs.existsSync(p)) targets.push(p);
  }
}

if (targets.length === 0) {
  console.log('claude-mem not installed — skipping worktree patch');
  process.exit(0);
}

let patched = 0;
let alreadyPatched = 0;
let signatureChanged = 0;

for (const filepath of targets) {
  const content = fs.readFileSync(filepath, 'utf-8');

  if (content.includes(NEW_GP)) {
    alreadyPatched++;
    if (!CHECK_ONLY) console.log(`SKIP (already patched): ${filepath}`);
    continue;
  }

  if (!content.includes(OLD_GP)) {
    signatureChanged++;
    if (!CHECK_ONLY) console.log(`WARNING: gp() signature changed — patch needs updating: ${filepath}`);
    continue;
  }

  if (CHECK_ONLY) {
    // Not patched
    process.exit(1);
  }

  const updated = content.replace(OLD_GP, NEW_GP);
  fs.writeFileSync(filepath, updated);
  patched++;
  console.log(`PATCHED: ${filepath}`);
}

if (CHECK_ONLY) {
  // All files were already patched
  process.exit(0);
}

console.log(`\nDone: ${patched} patched, ${alreadyPatched} already patched, ${signatureChanged} signature changed, ${targets.length} total`);
if (patched > 0) {
  console.log('\nRestart claude-mem: kill the bun worker-service.cjs process (it auto-restarts).');
}
