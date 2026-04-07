'use strict';

/**
 * task-dispatch.cjs — Per-task claude -p spawning
 *
 * Provides dispatchTask(taskConfig, opts) for spawning isolated claude -p
 * sessions per task. Extracted from auto-orchestrator.cjs (D2).
 *
 * taskConfig: { prompt, taskId, phaseId, planPath, cwd }
 * opts: { timeout, silenceTimeout, onToolCall, onOutput }
 *
 * Returns: { success, stdout, stderr, metrics: { tokens_in, tokens_out, elapsed_ms }, error? }
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;       // 15 minutes wall-clock
const DEFAULT_SILENCE_MS = 5 * 60 * 1000;         // 5 minutes silence
const SIGKILL_GRACE_MS = 5000;                     // time between SIGTERM and SIGKILL

const CLAUDE_MEM_SKIP_TOOLS = 'ListMcpResourcesTool,ReadMcpResourceTool,SlashCommand,Skill,TodoWrite,AskUserQuestion,ToolSearch,TaskCreate,TaskUpdate,TaskGet,TaskList,TaskOutput,TaskStop,SendMessage,EnterPlanMode,ExitPlanMode,EnterWorktree,ExitWorktree,LSP,CronCreate,CronDelete,CronList,TeamCreate,TeamDelete,NotebookEdit';

// ─── Orphan Process Registry (D11) ────────────────────────────────────────────

// Set of active child PIDs — iterated by handleShutdown to kill orphans on exit
const _activeTaskChildren = new Set();

// ─── Tool Readiness Hint ──────────────────────────────────────────────────────

// ToolSearch preamble for downstream skills (D-265)
const TOOL_READINESS_HINT = `\n## Tool Readiness (auto-injected)\n\nclaude-mem MCP tools are deferred. At session start, fetch them:\nToolSearch("+mcp-search", max_results: 10)\n\nIf ToolSearch returns empty, fall back to Read-based approach.\n`;

// ─── Project Name Resolution ──────────────────────────────────────────────────

function resolveProjectName(cwd) {
  // Project name: git-based resolution (aligned with SKILL.md — D-261)
  try {
    const { execFileSync } = require('child_process');

    // Tier 1: Check for CLAUDE_MEM_PROJECT already set (e.g., via .claude/settings.json)
    if (process.env.CLAUDE_MEM_PROJECT && process.env.CLAUDE_MEM_PROJECT.trim()) {
      return process.env.CLAUDE_MEM_PROJECT.trim();
    }

    // Tier 2: GitHub remote nameWithOwner (e.g., "cinjoff/fhhs-skills")
    try {
      const nameWithOwner = execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], {
        cwd,
        timeout: 5000,
        stdio: ['ignore', 'pipe', 'ignore'],
      }).toString().trim();
      if (nameWithOwner && nameWithOwner.includes('/')) {
        return nameWithOwner;
      }
    } catch {
      // gh not installed or not in a GitHub repo — fall through
    }

    // Tier 3: Git toplevel basename (last resort)
    const toplevel = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd,
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    return path.basename(toplevel);
  } catch {
    return path.basename(cwd);
  }
}

// ─── Real-time JSON Line Parser ───────────────────────────────────────────────

function createJsonLineParser(onLine) {
  let buffer = '';
  return function feed(chunk) {
    buffer += chunk;
    // Buffer cap at 1MB to prevent OOM on non-newline output
    if (buffer.length > 1024 * 1024) {
      buffer = '';
      return;
    }
    let nlIdx;
    while ((nlIdx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nlIdx).trim();
      buffer = buffer.slice(nlIdx + 1);
      if (!line) continue;
      try {
        const obj = JSON.parse(line);
        onLine(obj);
      } catch { /* non-JSON line — ignore */ }
    }
  };
}

// ─── Task Dispatch ────────────────────────────────────────────────────────────

/**
 * Spawn an isolated claude -p session for a single task.
 *
 * @param {object} taskConfig
 * @param {string} taskConfig.prompt      Full task prompt (built by context-injection.cjs)
 * @param {string} taskConfig.taskId      e.g. "task-01-02" (plan-task)
 * @param {string} taskConfig.phaseId     e.g. "23"
 * @param {string} taskConfig.planPath    Path to PLAN.md
 * @param {string} taskConfig.cwd         Project directory
 *
 * @param {object} [opts]
 * @param {number}   [opts.timeout]          Wall-clock timeout in ms (default: 15min)
 * @param {number}   [opts.silenceTimeout]   Stdout silence timeout in ms (default: 5min)
 * @param {function} [opts.onToolCall]       Optional callback for tool activity: (toolName, ts) => void
 * @param {function} [opts.onOutput]         Optional callback for stdout chunks: (chunk) => void
 *
 * @returns {Promise<{success: boolean, stdout: string, stderr: string, metrics: {tokens_in: number, tokens_out: number, elapsed_ms: number}, error?: string}>}
 */
function dispatchTask(taskConfig, opts) {
  const { prompt, taskId, cwd } = taskConfig;
  const timeoutMs = (opts && opts.timeout != null) ? opts.timeout : DEFAULT_TIMEOUT_MS;
  const silenceMs = (opts && opts.silenceTimeout != null) ? opts.silenceTimeout : DEFAULT_SILENCE_MS;
  const userOnToolCall = opts && opts.onToolCall;
  const userOnOutput = opts && opts.onOutput;

  return new Promise((resolve) => {
    // Resolve plugin dir: this file lives at <plugin-root>/.claude/skills/auto/lib/
    // so ../../../../ = plugin root where skills/SKILL.md etc. live
    const pluginDir = path.resolve(__dirname, '..', '..', '..', '..');

    const args = [
      '-p', prompt,
      '--permission-mode', 'bypassPermissions',
      '--output-format', 'stream-json',
      '--verbose',
      '--plugin-dir', pluginDir,
    ];

    // Resolve MCP plugin directories for claude-mem
    const homeDir = os.homedir();
    const pluginCacheDir = path.join(homeDir, '.claude', 'plugins', 'cache');

    // Find claude-mem
    const claudeMemDirs = [
      path.join(pluginCacheDir, 'thedotmack', 'claude-mem'),
      path.join(pluginCacheDir, 'thedotmack'),
    ];
    const claudeMemDir = claudeMemDirs.find(function(d) { return fs.existsSync(d); });

    if (claudeMemDir) {
      args.push('--plugin-dir', claudeMemDir);
    }

    // Inject project conventions so the session has full context
    const claudeMdPath = path.join(cwd, 'CLAUDE.md');
    if (fs.existsSync(claudeMdPath)) {
      const claudeMd = fs.readFileSync(claudeMdPath, 'utf-8').slice(0, 4000);
      args.push('--append-system-prompt', 'Project conventions:\n' + claudeMd + TOOL_READINESS_HINT);
    } else {
      args.push('--append-system-prompt', TOOL_READINESS_HINT);
    }

    const projectName = resolveProjectName(cwd);

    const child = spawn('claude', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: cwd,
      detached: true,
      env: Object.assign({}, process.env, {
        CLAUDE_SESSION_ID: taskId,
        CLAUDE_MEM_PROJECT: projectName,
        CLAUDE_MEM_CONTEXT_OBSERVATIONS: '0',
        CLAUDE_MEM_SKIP_TOOLS: CLAUDE_MEM_SKIP_TOOLS,
      }),
    });

    // Register in orphan process registry (D11)
    if (child.pid != null) {
      _activeTaskChildren.add(child.pid);
    }

    let stdout = '';
    let stderr = '';
    const sessionStart = Date.now();
    let lastActivityAt = Date.now();
    let stuckWarned = false;

    // Token usage tracking
    let tokensIn = 0;
    let tokensOut = 0;

    // Real-time JSON line parser — feeds parsed objects to onToolCall and usage tracking
    const feedJsonLine = createJsonLineParser(function(obj) {
      // stream-json format: tool calls are nested in assistant messages
      // as content items with type "tool_use" and a "name" field
      if (obj.type === 'assistant' && obj.message && Array.isArray(obj.message.content)) {
        for (const item of obj.message.content) {
          if (item.type === 'tool_use' && item.name) {
            const ts = Date.now();
            lastActivityAt = ts; // reset silence timer on tool call
            if (userOnToolCall) {
              userOnToolCall(item.name, ts);
            }
          }
        }
        // Usage nested in the message object
        if (obj.message.usage) {
          tokensIn += (obj.message.usage.input_tokens || 0);
          tokensOut += (obj.message.usage.output_tokens || 0);
        }
      }
      // Top-level usage (some events emit it at root)
      if (obj.usage) {
        tokensIn += (obj.usage.input_tokens || 0);
        tokensOut += (obj.usage.output_tokens || 0);
      }
    });

    child.stdout.on('data', function(data) {
      const chunk = data.toString();
      stdout += chunk;
      lastActivityAt = Date.now();
      stuckWarned = false; // reset warning on new output
      feedJsonLine(chunk);
      if (userOnOutput) {
        userOnOutput(chunk);
      }
    });

    child.stderr.on('data', function(data) {
      stderr += data.toString();
      lastActivityAt = Date.now();
    });

    // Stuck detection: silence timeout with SIGTERM escalation
    const activityCheck = setInterval(function() {
      const silenceElapsed = Date.now() - lastActivityAt;

      if (silenceElapsed >= silenceMs) {
        if (!stuckWarned) {
          stuckWarned = true;
          // Will be killed on next interval if still silent — log once
          process.stderr.write(
            '[task-dispatch] SILENT: task ' + taskId + ' no output for ' +
            Math.round(silenceElapsed / 1000) + 's — sending SIGTERM\n'
          );
        }
        try { process.kill(-child.pid, 'SIGTERM'); } catch { /* already dead */ }
        setTimeout(function() {
          try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already dead */ }
        }, SIGKILL_GRACE_MS);
      }
    }, 30000); // check every 30s

    // Wall-clock hard timeout
    const hardTimer = setTimeout(function() {
      const elapsedMin = Math.round((Date.now() - sessionStart) / 60000);
      process.stderr.write(
        '[task-dispatch] HARD TIMEOUT: task ' + taskId + ' killed after ' + elapsedMin + 'min\n'
      );
      try { process.kill(-child.pid, 'SIGTERM'); } catch { /* already dead */ }
      setTimeout(function() {
        try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already dead */ }
      }, SIGKILL_GRACE_MS);
    }, timeoutMs);

    function cleanup() {
      clearInterval(activityCheck);
      clearTimeout(hardTimer);
    }

    child.on('error', function(err) {
      cleanup();
      if (child.pid != null) _activeTaskChildren.delete(child.pid);
      resolve({
        success: false,
        stdout: stdout,
        stderr: stderr,
        metrics: {
          tokens_in: tokensIn,
          tokens_out: tokensOut,
          elapsed_ms: Date.now() - sessionStart,
        },
        error: 'Failed to spawn claude: ' + err.message,
      });
    });

    child.on('close', function(code, signal) {
      cleanup();
      if (child.pid != null) _activeTaskChildren.delete(child.pid);
      const elapsedMs = Date.now() - sessionStart;

      if (signal === 'SIGTERM' || signal === 'SIGKILL') {
        const silenceElapsed = Date.now() - lastActivityAt;
        const reason = silenceElapsed >= silenceMs
          ? 'stuck (no output for ' + Math.round(silenceElapsed / 60000) + 'min)'
          : 'hard timeout (' + Math.round(elapsedMs / 60000) + 'min)';
        resolve({
          success: false,
          stdout: stdout,
          stderr: stderr,
          metrics: { tokens_in: tokensIn, tokens_out: tokensOut, elapsed_ms: elapsedMs },
          error: 'Session killed: ' + reason,
        });
      } else if (code !== 0) {
        resolve({
          success: false,
          stdout: stdout,
          stderr: stderr,
          metrics: { tokens_in: tokensIn, tokens_out: tokensOut, elapsed_ms: elapsedMs },
          error: 'claude -p exited with code ' + code + '\nstderr: ' + stderr.slice(0, 500),
        });
      } else {
        resolve({
          success: true,
          stdout: stdout,
          stderr: stderr,
          metrics: { tokens_in: tokensIn, tokens_out: tokensOut, elapsed_ms: elapsedMs },
        });
      }
    });
  });
}

// ─── Shutdown Handler ─────────────────────────────────────────────────────────

/**
 * Kill all active task children. Call this from the orchestrator's SIGTERM/SIGINT handler.
 */
function handleShutdown() {
  for (const pid of _activeTaskChildren) {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch { /* already dead */ }
  }
  _activeTaskChildren.clear();
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  dispatchTask,
  createJsonLineParser,
  TOOL_READINESS_HINT,
  _activeTaskChildren,
  handleShutdown,
};
