#!/usr/bin/env node
/**
 * Unified patch: CLAUDE_MEM_PROJECT env var + worktree detection for claude-mem.
 *
 * This patch SUBSUMES patch-claude-mem-worktree.cjs. The worktree-only patch
 * is now redundant — its logic is included here. Run this one instead.
 *
 * Adds three-tier detection to gp():
 *   1. CLAUDE_MEM_PROJECT env var (highest priority) — orchestrators can override
 *      the project name by setting this env var when spawning `claude -p`.
 *   2. Worktree detection (from worktree patch) — uses parent repo name for
 *      git worktrees instead of the worktree basename.
 *   3. basename fallback (original behaviour).
 *
 * Handles four input states:
 *   a. Original unpatched — just basename logic
 *   b. Worktree-patched only — has dq() but no env var check
 *   c. Env-var-patched only — has env var check but no dq() (defensive)
 *   d. Both already applied — SKIP
 *
 * Re-run after every claude-mem update.
 *
 * Usage:
 *   node patch-claude-mem-project-env.cjs
 *   node patch-claude-mem-project-env.cjs --check   # exit 0 if patched, 1 if not
 */

const fs = require('fs');
const path = require('path');
const { homedir } = require('os');
const CHECK_ONLY = process.argv.includes('--check');

// ── Canonical gp() bodies ────────────────────────────────────────────────────

// State (a): original unpatched
const ORIG_GP =
  'function gp(t){if(!t||t.trim()==="")return y.warn("PROJECT_NAME",' +
  '"Empty cwd provided, using fallback",{cwd:t}),"unknown-project";' +
  'let e=mq.default.basename(t);if(e===""){if(process.platform==="win32")' +
  '{let n=t.match(/^([A-Z]):\\\\/i);if(n){let s=`drive-${n[1].toUpperCase()}`;' +
  'return y.info("PROJECT_NAME","Drive root detected",{cwd:t,projectName:s}),s}}' +
  'return y.warn("PROJECT_NAME","Root directory detected, using fallback",{cwd:t}),' +
  '"unknown-project"}return e}';

// State (b): worktree-patched only (dq() present, no env var)
const WORKTREE_GP =
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

// State (c): env-var-patched only (env var check present, no dq())
// This state is unlikely but handled defensively.
const ENV_ONLY_GP =
  'function gp(t){if(!t||t.trim()==="")return y.warn("PROJECT_NAME",' +
  '"Empty cwd provided, using fallback",{cwd:t}),"unknown-project";' +
  'let ep=typeof process!=="undefined"&&process.env&&process.env.CLAUDE_MEM_PROJECT;' +
  'if(ep&&ep.trim()!=="")return ep.trim();' +
  'let e=mq.default.basename(t);if(e===""){if(process.platform==="win32")' +
  '{let n=t.match(/^([A-Z]):\\\\/i);if(n){let s=`drive-${n[1].toUpperCase()}`;' +
  'return y.info("PROJECT_NAME","Drive root detected",{cwd:t,projectName:s}),s}}' +
  'return y.warn("PROJECT_NAME","Root directory detected, using fallback",{cwd:t}),' +
  '"unknown-project"}return e}';

// State (d): fully patched (env var + worktree + basename) — target state
const FULL_GP =
  'function gp(t){if(!t||t.trim()==="")return y.warn("PROJECT_NAME",' +
  '"Empty cwd provided, using fallback",{cwd:t}),"unknown-project";' +
  'let ep=typeof process!=="undefined"&&process.env&&process.env.CLAUDE_MEM_PROJECT;' +
  'if(ep&&ep.trim()!=="")return ep.trim();' +
  'let wt=dq(t);if(wt.isWorktree&&wt.parentProjectName)return y.info("PROJECT_NAME",' +
  '"Worktree detected, using parent project",{cwd:t,parent:wt.parentProjectName,' +
  'worktree:wt.worktreeName}),wt.parentProjectName;' +
  'let e=mq.default.basename(t);if(e===""){if(process.platform==="win32")' +
  '{let n=t.match(/^([A-Z]):\\\\/i);if(n){let s=`drive-${n[1].toUpperCase()}`;' +
  'return y.info("PROJECT_NAME","Drive root detected",{cwd:t,projectName:s}),s}}' +
  'return y.warn("PROJECT_NAME","Root directory detected, using fallback",{cwd:t}),' +
  '"unknown-project"}return e}';

// ── Target discovery (same as worktree patch) ────────────────────────────────

const home = homedir();
const targets = [];

const mpPath = path.join(home, '.claude', 'plugins', 'marketplaces', 'thedotmack', 'plugin', 'scripts', 'worker-service.cjs');
if (fs.existsSync(mpPath)) targets.push(mpPath);

const cacheDir = path.join(home, '.claude', 'plugins', 'cache', 'thedotmack', 'claude-mem');
if (fs.existsSync(cacheDir)) {
  for (const ver of fs.readdirSync(cacheDir)) {
    const p = path.join(cacheDir, ver, 'scripts', 'worker-service.cjs');
    if (fs.existsSync(p)) targets.push(p);
  }
}

if (targets.length === 0) {
  console.log('claude-mem not installed — skipping patch');
  process.exit(0);
}

// ── Process each target ───────────────────────────────────────────────────────

let patched = 0;
let alreadyPatched = 0;
let signatureChanged = 0;

for (const filepath of targets) {
  const content = fs.readFileSync(filepath, 'utf-8');

  // State (d): already fully patched — skip
  if (content.includes(FULL_GP)) {
    alreadyPatched++;
    if (!CHECK_ONLY) console.log(`SKIP (already patched): ${filepath}`);
    continue;
  }

  // Determine input state and pick the right old string
  let inputState = null;
  let oldGp = null;

  if (content.includes(ORIG_GP)) {
    inputState = 'a (original unpatched)';
    oldGp = ORIG_GP;
  } else if (content.includes(WORKTREE_GP)) {
    inputState = 'b (worktree-patched only)';
    oldGp = WORKTREE_GP;
  } else if (content.includes(ENV_ONLY_GP)) {
    inputState = 'c (env-var-patched only)';
    oldGp = ENV_ONLY_GP;
  } else {
    signatureChanged++;
    if (!CHECK_ONLY) console.log(`WARNING: gp() signature changed — patch needs updating: ${filepath}`);
    continue;
  }

  if (CHECK_ONLY) {
    // Not fully patched
    process.exit(1);
  }

  // Use function form of replace to avoid $& corruption in minified JS
  const updated = content.replace(oldGp, () => FULL_GP);
  fs.writeFileSync(filepath, updated);
  patched++;
  console.log(`PATCHED [state ${inputState}]: ${filepath}`);
}

if (CHECK_ONLY) {
  // All files were already fully patched
  process.exit(0);
}

console.log(`\nDone: ${patched} patched, ${alreadyPatched} already patched, ${signatureChanged} signature changed, ${targets.length} total`);
if (patched > 0) {
  console.log('\nRestart claude-mem: kill the bun worker-service.cjs process (it auto-restarts).');
}
