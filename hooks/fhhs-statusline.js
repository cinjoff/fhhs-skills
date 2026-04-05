#!/usr/bin/env node
// fhhs-skills Statusline
// Shows: model | current task | directory | context usage
// Based on GSD statusline pattern

const fs = require('fs');
const path = require('path');
const os = require('os');

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const model = data.model?.display_name || 'Claude';
    const dir = data.workspace?.current_dir || process.cwd();
    const session = data.session_id || '';
    const remaining = data.context_window?.remaining_percentage;

    // Context window display (shows USED percentage scaled to usable context)
    // Claude Code reserves ~16.5% for autocompact buffer
    const AUTO_COMPACT_BUFFER_PCT = 16.5;
    let ctx = '';
    if (remaining != null) {
      const usableRemaining = Math.max(0, ((remaining - AUTO_COMPACT_BUFFER_PCT) / (100 - AUTO_COMPACT_BUFFER_PCT)) * 100);
      const used = Math.max(0, Math.min(100, Math.round(100 - usableRemaining)));

      // Write context metrics for the context-monitor PostToolUse hook
      if (session) {
        try {
          const bridgePath = path.join(os.tmpdir(), `claude-ctx-${session}.json`);
          const bridgeData = JSON.stringify({
            session_id: session,
            remaining_percentage: remaining,
            used_pct: used,
            timestamp: Math.floor(Date.now() / 1000)
          });
          fs.writeFileSync(bridgePath, bridgeData);
        } catch (e) {}
      }

      const filled = Math.floor(used / 10);
      const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);

      if (used < 50) {
        ctx = ` \x1b[32m${bar} ${used}%\x1b[0m`;
      } else if (used < 65) {
        ctx = ` \x1b[33m${bar} ${used}%\x1b[0m`;
      } else if (used < 80) {
        ctx = ` \x1b[38;5;208m${bar} ${used}%\x1b[0m`;
      } else {
        ctx = ` \x1b[5;31m\uD83D\uDC80 ${bar} ${used}%\x1b[0m`;
      }
    }

    // Current task — check native tasks first, then fall back to legacy todos
    let task = '';
    const homeDir = os.homedir();
    const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(homeDir, '.claude');

    // Native tasks: stored in ~/.claude/tasks/{TASK_LIST_ID}/ as numbered JSON files
    const taskListId = process.env.CLAUDE_CODE_TASK_LIST_ID;
    if (taskListId) {
      const tasksDir = path.join(claudeDir, 'tasks', taskListId);
      if (fs.existsSync(tasksDir)) {
        try {
          const files = fs.readdirSync(tasksDir)
            .filter(f => f.endsWith('.json'))
            .sort((a, b) => {
              const na = parseInt(a), nb = parseInt(b);
              return (isNaN(nb) ? 0 : nb) - (isNaN(na) ? 0 : na);
            });
          for (const f of files) {
            try {
              const t = JSON.parse(fs.readFileSync(path.join(tasksDir, f), 'utf8'));
              if (t.status === 'in_progress') {
                task = t.activeForm || t.subject || '';
                break;
              }
            } catch (e) {}
          }
        } catch (e) {}
      }
    }

    // Fallback: legacy todos (session-scoped agent todo files)
    if (!task) {
      const todosDir = path.join(claudeDir, 'todos');
      if (session && fs.existsSync(todosDir)) {
        try {
          const files = fs.readdirSync(todosDir)
            .filter(f => f.startsWith(session) && f.includes('-agent-') && f.endsWith('.json'))
            .map(f => ({ name: f, mtime: fs.statSync(path.join(todosDir, f)).mtime }))
            .sort((a, b) => b.mtime - a.mtime);

          if (files.length > 0) {
            try {
              const todos = JSON.parse(fs.readFileSync(path.join(todosDir, files[0].name), 'utf8'));
              const inProgress = todos.find(t => t.status === 'in_progress');
              if (inProgress) task = inProgress.activeForm || '';
            } catch (e) {}
          }
        } catch (e) {}
      }
    }

    // fhhs-skills update available?
    let updateIndicator = '';
    const cacheFile = path.join(claudeDir, 'cache', 'fhhs-update-check.json');
    if (fs.existsSync(cacheFile)) {
      try {
        const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        if (cache.update_available) {
          updateIndicator = '\x1b[33m\u2B06 /fh:update\x1b[0m \u2502 ';
        }
      } catch (e) {}
    }

    const dirname = path.basename(dir);
    if (task) {
      process.stdout.write(`${updateIndicator}\x1b[2m${model}\x1b[0m \u2502 \x1b[1m${task}\x1b[0m \u2502 \x1b[2m${dirname}\x1b[0m${ctx}`);
    } else {
      process.stdout.write(`${updateIndicator}\x1b[2m${model}\x1b[0m \u2502 \x1b[2m${dirname}\x1b[0m${ctx}`);
    }
  } catch (e) {
    // Silent fail
  }
});
