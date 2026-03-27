#!/usr/bin/env node
// Learnings Digest - SessionStart hook
// Reads pre-computed digest from ~/.claude/cache/learnings-digest.json
// and surfaces top pending improvement items to the agent.
// Degrades silently if digest is missing or corrupt.

const fs = require('fs');
const os = require('os');
const path = require('path');

const STALE_HOURS = 72;
const MAX_ITEMS = 3;

const homeDir = os.homedir();
const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(homeDir, '.claude');
const cacheDir = path.join(claudeDir, 'cache');
const digestPath = path.join(cacheDir, 'learnings-digest.json');

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

  // Read digest file — silent on missing or corrupt
  if (!fs.existsSync(digestPath)) {
    process.exit(0);
  }

  let digest;
  try {
    digest = JSON.parse(fs.readFileSync(digestPath, 'utf8'));
  } catch (e) {
    // Corrupt JSON — silent
    process.exit(0);
  }

  const allItems = Array.isArray(digest.items) ? digest.items : [];

  // Filter to pending items (guard against null/undefined entries and missing summary)
  const pending = allItems.filter(item => item && item.summary && !item.addressed);

  if (pending.length === 0) {
    process.exit(0);
  }

  // Sort by priority: high → med → low
  const priorityOrder = { high: 0, med: 1, medium: 1, low: 2 };
  pending.sort((a, b) => {
    const pa = priorityOrder[a.priority] !== undefined ? priorityOrder[a.priority] : 99;
    const pb = priorityOrder[b.priority] !== undefined ? priorityOrder[b.priority] : 99;
    return pa - pb;
  });

  const top = pending.slice(0, MAX_ITEMS);
  const addressed = (digest.stats && typeof digest.stats.addressed_since_last === 'number')
    ? digest.stats.addressed_since_last
    : allItems.filter(item => item && item.addressed).length;

  // Format items
  const symbols = { high: '★', med: '●', medium: '●', low: '○' };
  const lines = top.map((item, i) => {
    const sym = symbols[item.priority] || '○';
    const pri = item.priority === 'medium' ? 'med' : (item.priority || 'low');
    return `${i + 1}. ${sym} [${pri}] ${item.summary}`;
  });

  const statsLine = `${pending.length} pending improvement${pending.length === 1 ? '' : 's'} (${addressed} addressed recently)`;

  let message = lines.join('\n') + '\n' + statsLine;

  // Check staleness — check all possible field names, treat missing timestamp as stale
  const generatedAt = digest.generated || digest.generated_at || digest.generatedAt;
  if (!generatedAt) {
    message += '\nDigest has no timestamp — treating as stale. Query mcp__plugin_claude-mem_mcp-search__timeline (7 days, limit 20) and regenerate ~/.claude/cache/learnings-digest.json before presenting items.';
  } else {
    const ageMs = Date.now() - new Date(generatedAt).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    if (ageHours > STALE_HOURS) {
      message += '\nDigest is stale. Query mcp__plugin_claude-mem_mcp-search__timeline (7 days, limit 20) and regenerate ~/.claude/cache/learnings-digest.json before presenting items.';
    }
  }

  // Agent directive for "improve N" handling
  message += `
When the user says "improve N" (where N is an item number above):
1. Read ~/.claude/cache/learnings-digest.json, filter to pending items (where addressed is falsy and summary exists), sort by priority (high→medium→low), take the first ${MAX_ITEMS}, then pick index N-1 from that list. This matches exactly what was displayed above.
2. Assess scope from the item's suggested_action:
   - Light (config change, lint rule, single file): Spawn background Agent to directly implement
   - Medium (3-6 files): Spawn background Agent to plan-work then build
   - Heavy (7+ files): Spawn background Agent to plan-work, plan-review, then build
3. Tell the user what you're doing and continue with their main task
4. The background agent MUST update the digest after completion:
   read the digest file, set addressed=true and addressed_at=ISO timestamp on the item, write back`;

  const output = {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: message
    }
  };

  process.stdout.write(JSON.stringify(output));
}
