'use strict';
/**
 * Manifest Engine — check, remediate, discover, generate
 *
 * Absorbs logic from:
 *   - bin/global-reconcile.cjs (project discovery, remediation)
 *   - bin/post-update-reconcile.sh (claude-mem settings, env vars, tracker)
 *   - bin/lib/changelog.cjs runChecks() (check logic)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

// Import schema — may not exist yet during parallel task execution (mocked in tests)
let schema;
try {
  schema = require('./manifest-schema.cjs');
} catch {
  schema = {
    MANIFEST_VERSION: '1',
    defaultGlobalManifest: () => ({ version: '1', items: [] }),
    defaultProjectManifest: () => ({ version: '1', items: [] }),
    mergeManifests: (g, p) => Object.assign({}, g, p, { items: [...(g.items || []), ...(p.items || [])] }),
    validateInstallCommand: () => ({ valid: true }),
  };
}

const PLUGIN_VERSION = '1.61.4';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function expandHome(p) {
  if (typeof p === 'string' && p.startsWith('~')) {
    return path.join(os.homedir(), p.slice(1));
  }
  return p;
}

function safeReadJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return { data: JSON.parse(raw), error: null };
  } catch (e) {
    return { data: null, error: e.message };
  }
}

function withTimeout(fn, _ms = 5000) {
  try {
    return fn();
  } catch (e) {
    return { _error: e.message };
  }
}

// ─── readManifest ─────────────────────────────────────────────────────────────

/**
 * Reads global and project manifest files.
 * Falls back to defaults if missing or corrupt.
 * Returns { global, project, merged, warnings[] }
 */
function readManifest(globalPath, projectPath) {
  const warnings = [];
  let globalManifest = schema.defaultGlobalManifest();
  let projectManifest = schema.defaultProjectManifest();

  if (globalPath) {
    const { data, error } = safeReadJson(globalPath);
    if (error) {
      warnings.push(`Global manifest corrupt or missing (${globalPath}): ${error} — using defaults`);
    } else if (data) {
      globalManifest = data;
    }
  }

  if (projectPath) {
    const { data, error } = safeReadJson(projectPath);
    if (error) {
      warnings.push(`Project manifest corrupt or missing (${projectPath}): ${error} — using defaults`);
    } else if (data) {
      projectManifest = data;
    }
  }

  const merged = schema.mergeManifests(globalManifest, projectManifest);
  return { global: globalManifest, project: projectManifest, merged, warnings };
}

// ─── checkManifest ────────────────────────────────────────────────────────────

/** Validate tag identifiers against shell metacharacters. */
const SAFE_ID = /^[\w.@/:~-]+$/;

/**
 * Checks merged manifest items against actual system state.
 * Returns array of check results: { category, id, status, details, hint?, item }
 */
function checkManifest(merged, projectRoot) {
  const items = merged.items || [];
  const results = [];
  const hasProject = projectRoot && fs.existsSync(path.join(projectRoot, '.planning'));

  for (const item of items) {
    const { type, check, id, required, deprecated, action: removeAction } = item;
    let status = 'ok';
    let details = '';
    let hint = item.hint || undefined;

    // Skip project-scoped checks when no project root
    if (type === 'project' && !hasProject) continue;

    // Validate ID safety
    if (!SAFE_ID.test(id)) {
      results.push({ category: check || type, id, status: 'error', details: 'ID contains unsafe characters', hint: 'Check manifest for invalid characters', item });
      continue;
    }

    try {
      const checkResult = withTimeout(() => {
        if (check === 'tool') {
          try {
            execFileSync('command', ['-v', id], { stdio: 'pipe', shell: '/bin/sh', timeout: 5000 });
            return { passed: true, details: 'Installed' };
          } catch {
            // Try which as fallback
            try {
              execFileSync('which', [id], { stdio: 'pipe', timeout: 5000 });
              return { passed: true, details: 'Installed' };
            } catch {
              return { passed: false, details: 'Not found', hint: hint || `Install ${id}` };
            }
          }
        } else if (check === 'plugin') {
          const pluginsPath = path.join(os.homedir(), '.claude', 'plugins', 'installed_plugins.json');
          const { data, error } = safeReadJson(pluginsPath);
          if (error || !data) return { passed: false, details: 'installed_plugins.json not found', hint: `Run: claude plugin install ${id}` };
          const installed = data.plugins && data.plugins[id] !== undefined;
          return { passed: installed, details: installed ? 'Installed' : 'Not installed', hint: installed ? undefined : `Run: claude plugin install ${id}` };
        } else if (check === 'hook') {
          const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
          const { data, error } = safeReadJson(settingsPath);
          if (error || !data) return { passed: false, details: 'settings.json not found' };
          let found = false;
          if (data.hooks) {
            outer: for (const eventKey of Object.keys(data.hooks)) {
              const matchers = data.hooks[eventKey];
              if (!Array.isArray(matchers)) continue;
              for (const matcher of matchers) {
                if (!matcher.hooks || !Array.isArray(matcher.hooks)) continue;
                for (const hook of matcher.hooks) {
                  if (hook.command && hook.command.includes(id)) { found = true; break outer; }
                }
              }
            }
          }
          // Also check statusLine
          if (!found && id.includes('statusline') && data.statusLine) found = true;
          return { passed: found, details: found ? 'Configured' : 'Not configured' };
        } else if (check === 'env') {
          const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
          const { data } = safeReadJson(settingsPath);
          const passed = !!(data && data.env && data.env[id] !== undefined);
          // Also check project settings
          if (!passed && projectRoot) {
            const projSettingsPath = path.join(projectRoot, '.claude', 'settings.json');
            const { data: pd } = safeReadJson(projSettingsPath);
            if (pd && pd.env && pd.env[id] !== undefined) {
              return { passed: true, details: `Set in project settings (${pd.env[id]})` };
            }
          }
          return { passed, details: passed ? `Set (${data.env[id]})` : 'Not set', hint: hint || `Set ${id} in ~/.claude/settings.json` };
        } else if (check === 'dir') {
          const expandedPath = type === 'project' && projectRoot
            ? path.join(projectRoot, id)
            : expandHome(id);
          const exists = fs.existsSync(expandedPath);
          return { passed: exists, details: exists ? 'Exists' : 'Not found', hint: exists ? undefined : `Create directory: ${expandedPath}` };
        } else if (check === 'file') {
          const filePath = type === 'project' && projectRoot
            ? path.join(projectRoot, id)
            : expandHome(id);
          const exists = fs.existsSync(filePath);
          return { passed: exists, details: exists ? 'Exists' : 'Not found' };
        } else {
          return { passed: true, details: 'Unknown check type — skipped' };
        }
      }, 5000);

      if (checkResult && checkResult._error) {
        status = 'error';
        details = `Check failed: ${checkResult._error}`;
      } else if (checkResult) {
        // Handle deprecated items — if deprecated and present, may need removal
        if (deprecated && removeAction) {
          status = checkResult.passed ? 'warn' : 'ok'; // present = needs removal; absent = already gone
          details = checkResult.passed ? `Deprecated — should be removed` : 'Not present (good)';
        } else {
          status = checkResult.passed ? 'ok' : (required === false ? 'warn' : 'missing');
          details = checkResult.details || '';
          if (!checkResult.passed && checkResult.hint) hint = checkResult.hint;
        }
      }
    } catch (e) {
      status = 'error';
      details = `Check threw: ${e.message}`;
    }

    const result = { category: check || type, id, status, details, item };
    if (hint && status !== 'ok') result.hint = hint;
    results.push(result);
  }

  return results;
}

// ─── remediate ────────────────────────────────────────────────────────────────

/**
 * For each failing check result, attempt remediation.
 * Returns { remediated[], failed[], removed[], skipped[] }
 */
function remediate(checkResults, projectRoot) {
  const remediated = [];
  const failed = [];
  const removed = [];
  const skipped = [];

  for (const result of checkResults) {
    if (result.status === 'ok') continue;

    const { category, id, item = {} } = result;
    const { deprecated, removeAction, type } = item;

    try {
      // Handle deprecated items that need removal
      if (deprecated && removeAction && result.status === 'warn') {
        try {
          if (removeAction === 'uninstall-plugin') {
            execFileSync('claude', ['plugin', 'uninstall', id], { timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] });
          } else if (removeAction === 'remove-hook') {
            _removeHook(id);
          } else if (removeAction === 'remove-env') {
            _removeEnvVar(id, projectRoot);
          }
          removed.push({ id, category, action: removeAction, details: `Deprecated item removed` });
        } catch (e) {
          failed.push({ id, category, error: `Remove failed: ${e.message}` });
        }
        continue;
      }

      if (result.status !== 'missing' && result.status !== 'error') {
        skipped.push({ id, category, reason: `status=${result.status}` });
        continue;
      }

      if (category === 'tool') {
        try {
          const pkg = id === 'typescript-language-server' ? ['typescript-language-server', 'typescript'] : [id];
          const mgr = id === 'typescript-language-server' ? 'npm' : 'pnpm';
          execFileSync(mgr, ['install', '-g', ...pkg], { timeout: 60000, stdio: ['pipe', 'pipe', 'pipe'] });
          remediated.push({ id, category, action: `installed via ${mgr}` });
        } catch (e) {
          failed.push({ id, category, error: `Tool install failed: ${e.message}` });
        }

      } else if (category === 'plugin') {
        try {
          const pluginOpts = { timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] };
          if (id.includes('claude-mem')) {
            try { execFileSync('claude', ['plugin', 'marketplace', 'add', 'thedotmack/claude-mem'], pluginOpts); } catch { /* ignore */ }
            execFileSync('claude', ['plugin', 'install', 'claude-mem'], pluginOpts);
          } else if (id.includes('context-mode')) {
            try { execFileSync('claude', ['plugin', 'marketplace', 'add', 'mksglu/context-mode'], pluginOpts); } catch { /* ignore */ }
            execFileSync('claude', ['plugin', 'install', 'context-mode@context-mode'], pluginOpts);
          } else {
            execFileSync('claude', ['plugin', 'install', id], pluginOpts);
          }
          remediated.push({ id, category, action: 'plugin installed' });
        } catch (e) {
          failed.push({ id, category, error: `Plugin install failed (may need interactive terminal): ${e.message}` });
        }

      } else if (category === 'hook') {
        try {
          _addHook(id);
          remediated.push({ id, category, action: 'hook added to global settings' });
        } catch (e) {
          failed.push({ id, category, error: `Hook add failed: ${e.message}` });
        }

      } else if (category === 'env') {
        try {
          _setEnvVar(id, projectRoot, item);
          remediated.push({ id, category, action: `env var set in ${id === 'FHHS_SKILLS_ROOT' ? 'global' : 'project'} settings.json` });
        } catch (e) {
          failed.push({ id, category, error: `Env var set failed: ${e.message}` });
        }

      } else if (category === 'dir') {
        try {
          const expandedPath = type === 'project' && projectRoot
            ? path.join(projectRoot, id)
            : expandHome(id);
          // Special case: shadcn directories
          if (id.includes('shadcn')) {
            try {
              execFileSync('npx', ['-y', 'skills', 'add', '-g', '-y', '--all', 'shadcn/ui'], {
                cwd: os.homedir(), timeout: 120000, stdio: ['pipe', 'pipe', 'pipe'],
              });
              remediated.push({ id, category, action: 'shadcn skills installed' });
            } catch (e) {
              failed.push({ id, category, error: `Shadcn install failed: ${e.message}` });
            }
          } else {
            fs.mkdirSync(expandedPath, { recursive: true });
            remediated.push({ id, category, action: 'directory created' });
          }
        } catch (e) {
          failed.push({ id, category, error: `Dir create failed: ${e.message}` });
        }

      } else {
        skipped.push({ id, category, reason: `unknown category: ${category}` });
      }
    } catch (e) {
      failed.push({ id, category, error: `Unexpected error: ${e.message}` });
    }
  }

  // Claude-mem settings enforcement (from post-update-reconcile.sh)
  try {
    _enforceClaudeMemSettings();
  } catch { /* silent */ }

  // Tracker registration (from post-update-reconcile.sh)
  if (projectRoot) {
    try {
      _registerInTracker(projectRoot);
    } catch { /* silent */ }
  }

  return { remediated, failed, removed, skipped };
}

// ─── Remediation helpers ──────────────────────────────────────────────────────

function _addHook(hookId) {
  const globalSettingsPath = path.join(os.homedir(), '.claude', 'settings.json');
  let globalSettings = {};
  try { globalSettings = JSON.parse(fs.readFileSync(globalSettingsPath, 'utf-8')); } catch { /* new file */ }

  if (hookId.includes('statusline')) {
    if (!globalSettings.statusLine) {
      globalSettings.statusLine = { command: `node "$HOME/.claude/get-shit-done/hooks/fhhs-statusline.js"` };
      fs.mkdirSync(path.join(os.homedir(), '.claude'), { recursive: true });
      fs.writeFileSync(globalSettingsPath, JSON.stringify(globalSettings, null, 2) + '\n');
    }
    return;
  }

  let event = 'PreToolUse';
  let cmd = '';
  if (hookId.includes('check-update')) { event = 'SessionStart'; cmd = `node "$HOME/.claude/get-shit-done/hooks/fhhs-check-update.js"`; }
  else if (hookId.includes('learnings')) { event = 'SessionStart'; cmd = `node "$HOME/.claude/get-shit-done/hooks/fhhs-learnings.js"`; }
  else if (hookId.includes('context-monitor')) { event = 'PostToolUse'; cmd = `node "$HOME/.claude/get-shit-done/hooks/fhhs-context-monitor.js"`; }

  if (!cmd) throw new Error(`Unknown hook type: ${hookId}`);

  if (!globalSettings.hooks) globalSettings.hooks = {};
  if (!globalSettings.hooks[event]) globalSettings.hooks[event] = [];
  const existing = globalSettings.hooks[event].some(h =>
    (h.hooks && h.hooks.some(hh => hh.command && hh.command.includes(hookId))) ||
    (h.command && h.command.includes(hookId))
  );
  if (!existing) {
    globalSettings.hooks[event].push({ hooks: [{ type: 'command', command: cmd }] });
    fs.mkdirSync(path.join(os.homedir(), '.claude'), { recursive: true });
    fs.writeFileSync(globalSettingsPath, JSON.stringify(globalSettings, null, 2) + '\n');
  }
}

function _removeHook(hookId) {
  const globalSettingsPath = path.join(os.homedir(), '.claude', 'settings.json');
  let settings = {};
  try { settings = JSON.parse(fs.readFileSync(globalSettingsPath, 'utf-8')); } catch { return; }

  if (hookId.includes('statusline') && settings.statusLine) {
    delete settings.statusLine;
    fs.writeFileSync(globalSettingsPath, JSON.stringify(settings, null, 2) + '\n');
    return;
  }

  if (settings.hooks) {
    for (const event of Object.keys(settings.hooks)) {
      if (Array.isArray(settings.hooks[event])) {
        settings.hooks[event] = settings.hooks[event].filter(h =>
          !(h.hooks && h.hooks.some(hh => hh.command && hh.command.includes(hookId))) &&
          !(h.command && h.command.includes(hookId))
        );
      }
    }
    fs.writeFileSync(globalSettingsPath, JSON.stringify(settings, null, 2) + '\n');
  }
}

function _setEnvVar(id, projectRoot) {
  const isGlobal = id === 'FHHS_SKILLS_ROOT';
  const settingsPath = isGlobal
    ? path.join(os.homedir(), '.claude', 'settings.json')
    : path.join(projectRoot || os.homedir(), '.claude', 'settings.json');

  let settings = {};
  try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')); } catch { /* new file */ }
  if (!settings.env) settings.env = {};

  if (id in settings.env) return; // already set

  if (id === 'FHHS_SKILLS_ROOT') {
    const cacheDir = path.join(os.homedir(), '.claude', 'plugins', 'cache', 'fhhs-skills', 'fh');
    let pluginRoot = '';
    if (fs.existsSync(cacheDir)) {
      const versions = fs.readdirSync(cacheDir).filter(d =>
        fs.statSync(path.join(cacheDir, d)).isDirectory()
      ).sort();
      if (versions.length > 0) pluginRoot = path.join(cacheDir, versions[versions.length - 1]);
    }
    if (!pluginRoot) throw new Error('plugin cache not found — run /fh:setup');
    settings.env[id] = pluginRoot;
  } else if (id === 'CLAUDE_CWD') {
    settings.env[id] = projectRoot || process.cwd();
  } else if (id === 'CLAUDE_MEM_PROJECT') {
    let projectName = '';
    try {
      const gitDir = execFileSync('git', ['rev-parse', '--git-common-dir'], {
        cwd: projectRoot, timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'],
      }).toString().trim();
      const gitRoot = path.resolve(projectRoot, gitDir, '..');
      projectName = path.basename(gitRoot);
    } catch {
      projectName = path.basename(projectRoot || process.cwd());
    }
    settings.env[id] = projectName;
  } else {
    settings.env[id] = id === 'CLAUDE_CODE_ENABLE_TASKS' ? 'true' : '1';
  }

  const settingsDir = path.dirname(settingsPath);
  fs.mkdirSync(settingsDir, { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}

function _removeEnvVar(id, projectRoot) {
  const settingsPaths = [
    path.join(os.homedir(), '.claude', 'settings.json'),
    projectRoot ? path.join(projectRoot, '.claude', 'settings.json') : null,
  ].filter(Boolean);

  for (const sp of settingsPaths) {
    try {
      const settings = JSON.parse(fs.readFileSync(sp, 'utf-8'));
      if (settings.env && id in settings.env) {
        delete settings.env[id];
        fs.writeFileSync(sp, JSON.stringify(settings, null, 2) + '\n');
      }
    } catch { /* skip */ }
  }
}

function _enforceClaudeMemSettings() {
  const cmemSettingsPath = path.join(os.homedir(), '.claude-mem', 'settings.json');
  if (!fs.existsSync(cmemSettingsPath)) return;

  let settings = {};
  try { settings = JSON.parse(fs.readFileSync(cmemSettingsPath, 'utf-8')); } catch { settings = {}; }

  const required = { CLAUDE_MEM_FOLDER_CLAUDEMD_ENABLED: 'false' };
  let changed = false;
  for (const [k, v] of Object.entries(required)) {
    if (settings[k] !== v) { settings[k] = v; changed = true; }
  }
  if (changed) {
    fs.writeFileSync(cmemSettingsPath, JSON.stringify(settings, null, 2) + '\n');
  }
}

function _registerInTracker(projectRoot) {
  if (!fs.existsSync(path.join(projectRoot, '.planning'))) return;

  const trackerDir = path.join(os.homedir(), '.claude', 'tracker');
  fs.mkdirSync(trackerDir, { recursive: true });

  const registryFile = path.join(trackerDir, 'projects.json');
  let registry = [];
  try {
    const r = JSON.parse(fs.readFileSync(registryFile, 'utf-8'));
    if (Array.isArray(r)) registry = r;
  } catch { /* new file */ }

  // Derive project name from git
  let projectName = '';
  try {
    const gitDir = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      cwd: projectRoot, timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'],
    }).toString().trim();
    const gitRoot = path.resolve(projectRoot, gitDir, '..');
    projectName = path.basename(gitRoot);
  } catch {
    projectName = path.basename(projectRoot);
  }

  const conductorMatch = projectRoot.match(/\/conductor\/workspaces\/([^/]+)\/[^/]+/);
  const isConductor = !!conductorMatch;
  const conductorWs = conductorMatch ? conductorMatch[1] : undefined;

  const now = new Date().toISOString();
  const existing = registry.find(e => e.path === projectRoot);
  if (existing) {
    existing.name = projectName;
    existing.lastSeen = now;
    if (isConductor) existing.conductorWorkspace = conductorWs;
  } else {
    const entry = { path: projectRoot, name: projectName, addedAt: now, lastSeen: now };
    if (isConductor) entry.conductorWorkspace = conductorWs;
    registry.push(entry);
  }

  fs.writeFileSync(registryFile, JSON.stringify(registry, null, 2) + '\n');
}

// ─── discoverProjects ────────────────────────────────────────────────────────

/**
 * Discover all fhhs-skills projects.
 * Sources: Conductor DB → tracker registry → filesystem fallback
 */
function discoverProjects() {
  const seen = new Set();
  const projects = [];

  function addProject(projectPath, source, repoName) {
    const normalized = path.resolve(projectPath);
    if (seen.has(normalized)) return;
    if (!fs.existsSync(normalized)) return;
    seen.add(normalized);

    const conductorMatch = normalized.match(/\/conductor\/workspaces\/([^/]+)\/([^/]+)/);
    const isConductor = !!conductorMatch;
    const hasPlanning = fs.existsSync(path.join(normalized, '.planning'));
    const hasClaudeSettings = fs.existsSync(path.join(normalized, '.claude', 'settings.json'));

    let resolvedRepo = repoName || null;
    if (!resolvedRepo && isConductor) resolvedRepo = conductorMatch[1];
    if (!resolvedRepo) {
      try {
        const gitCommonDir = execFileSync('git', ['rev-parse', '--git-common-dir'], {
          cwd: normalized, timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'],
        }).toString().trim();
        const gitRoot = path.resolve(normalized, gitCommonDir, '..');
        resolvedRepo = path.basename(gitRoot);
      } catch {
        resolvedRepo = path.basename(normalized);
      }
    }

    projects.push({
      path: normalized,
      name: path.basename(normalized),
      source,
      isConductor,
      repo: resolvedRepo,
      hasPlanning,
      hasClaudeSettings,
    });
  }

  // Source 1: Conductor DB
  const activeRepos = _getActiveConductorWorkspaces();
  const conductorPaths = new Set();
  for (const [repoName, repoInfo] of activeRepos) {
    for (const ws of repoInfo.workspaces) {
      if (fs.existsSync(ws.wsPath)) {
        addProject(ws.wsPath, 'conductor-db', repoName);
        conductorPaths.add(path.resolve(ws.wsPath));
      }
    }
  }

  // Source 2: Tracker registry — non-Conductor only
  const registryPath = path.join(os.homedir(), '.claude', 'tracker', 'projects.json');
  try {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    if (Array.isArray(registry)) {
      for (const entry of registry) {
        if (!entry.path) continue;
        const normalized = path.resolve(entry.path);
        if (normalized.includes('/conductor/workspaces/')) continue;
        addProject(entry.path, 'tracker');
      }
    }
  } catch { /* no registry or parse error */ }

  // Fallback: Scan filesystem if DB query yielded nothing
  if (activeRepos.size === 0) {
    const conductorRoot = path.join(os.homedir(), 'conductor', 'workspaces');
    try {
      if (fs.existsSync(conductorRoot)) {
        for (const repo of fs.readdirSync(conductorRoot)) {
          try {
            const repoDir = path.join(conductorRoot, repo);
            if (!fs.lstatSync(repoDir).isDirectory()) continue;
            for (const workspace of fs.readdirSync(repoDir)) {
              try {
                const wsDir = path.join(repoDir, workspace);
                if (!fs.lstatSync(wsDir).isDirectory()) continue;
                if (fs.existsSync(path.join(wsDir, '.planning')) ||
                    fs.existsSync(path.join(wsDir, '.claude', 'settings.json'))) {
                  addProject(wsDir, 'conductor-scan', repo);
                }
              } catch { /* skip bad entries */ }
            }
          } catch { /* skip bad repo dirs */ }
        }
      }
    } catch { /* not readable */ }
  }

  return projects;
}

function _getActiveConductorWorkspaces() {
  const dbPath = path.join(os.homedir(), 'Library', 'Application Support', 'com.conductor.app', 'conductor.db');
  if (!fs.existsSync(dbPath)) return new Map();

  try {
    const query = `SELECT w.directory_name, r.name as repo_name, r.root_path as repo_path FROM workspaces w JOIN repos r ON w.repository_id = r.id WHERE w.state = 'ready' ORDER BY r.name, w.directory_name;`;
    const out = execFileSync('sqlite3', ['-separator', '|', dbPath, query.replace(/\n/g, ' ')], {
      timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'],
    });
    const lines = out.toString().trim().split('\n').filter(Boolean);
    const repos = new Map();
    for (const line of lines) {
      const [wsName, repoName, repoPath] = line.split('|');
      if (!wsName || !repoName) continue;
      if (!repos.has(repoName)) repos.set(repoName, { repoPath: repoPath || '', workspaces: [] });
      const conductorRoot = path.join(os.homedir(), 'conductor', 'workspaces');
      const wsPath = path.join(conductorRoot, repoName, wsName);
      repos.get(repoName).workspaces.push({ name: wsName, wsPath });
    }
    return repos;
  } catch {
    return new Map();
  }
}

// ─── generateManifest ────────────────────────────────────────────────────────

/**
 * Auto-detect project state and generate a manifest.
 */
function generateManifest(projectRoot) {
  const profile = {};

  // Framework detection from package.json deps
  const pkgPath = path.join(projectRoot, 'package.json');
  const { data: pkg } = safeReadJson(pkgPath);
  if (pkg) {
    const deps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
    if ('next' in deps) profile.framework = 'nextjs';
    else if ('react-scripts' in deps) profile.framework = 'react';
    else if ('express' in deps) profile.framework = 'node';
    else if ('react' in deps) profile.framework = 'react';

    // Database
    if ('supabase' in deps || '@supabase/supabase-js' in deps) profile.database = 'supabase';
    else if ('pg' in deps || 'postgres' in deps) profile.database = 'postgres';
    else if ('prisma' in deps || '@prisma/client' in deps) profile.database = 'prisma';
    else if ('drizzle-orm' in deps) profile.database = 'drizzle';

    // Auth
    if ('better-auth' in deps) profile.auth = 'better-auth';

    // Testing
    if ('vitest' in deps || fs.existsSync(path.join(projectRoot, 'vitest.config.ts')) || fs.existsSync(path.join(projectRoot, 'vitest.config.js'))) {
      profile.testing = 'vitest';
    } else if ('jest' in deps || fs.existsSync(path.join(projectRoot, 'jest.config.ts')) || fs.existsSync(path.join(projectRoot, 'jest.config.js'))) {
      profile.testing = 'jest';
    }
    if (fs.existsSync(path.join(projectRoot, 'playwright.config.ts')) || fs.existsSync(path.join(projectRoot, 'playwright.config.js'))) {
      profile.e2e = 'playwright';
    }
  }

  // Package manager from lock files
  if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) profile.packageManager = 'pnpm';
  else if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) profile.packageManager = 'yarn';
  else if (fs.existsSync(path.join(projectRoot, 'package-lock.json'))) profile.packageManager = 'npm';

  // Planning
  profile.hasPlanning = fs.existsSync(path.join(projectRoot, '.planning'));
  profile.hasClaude = fs.existsSync(path.join(projectRoot, 'CLAUDE.md'));
  profile.hasConductor = fs.existsSync(path.join(projectRoot, 'conductor.json'));

  const projectManifest = schema.defaultProjectManifest();
  return Object.assign({}, projectManifest, { profile, generatedAt: new Date().toISOString() });
}

// ─── Output formatting ────────────────────────────────────────────────────────

function formatOutput(checkResults, remediateResults, profile, warnings) {
  try {
    const items = (checkResults || []).map(r => {
      const entry = { category: r.category, id: r.id, status: r.status, details: r.details };
      if (r.hint) entry.hint = r.hint;
      // Map 'missing' to a more user-friendly status in output
      if (entry.status === 'missing') entry.status = 'error';
      return entry;
    });

    // Merge remediation results into items
    if (remediateResults) {
      for (const fixed of (remediateResults.remediated || [])) {
        const item = items.find(i => i.id === fixed.id);
        if (item) { item.status = 'fixed'; item.details = fixed.action; }
      }
      for (const rem of (remediateResults.removed || [])) {
        const item = items.find(i => i.id === rem.id);
        if (item) { item.status = 'removed'; item.details = rem.details; }
      }
    }

    const summary = { ok: 0, fixed: 0, removed: 0, errors: 0, skipped: 0 };
    const errors = [];
    for (const item of items) {
      if (item.status === 'ok') summary.ok++;
      else if (item.status === 'fixed') summary.fixed++;
      else if (item.status === 'removed') summary.removed++;
      else if (item.status === 'error') { summary.errors++; errors.push({ code: `${item.category.toUpperCase()}_ERROR`, message: item.details, hint: item.hint }); }
      else if (item.status === 'skipped' || item.status === 'warn') summary.skipped++;
    }

    let status = 'ok';
    if (summary.errors > 0) status = 'errors';
    else if (summary.fixed > 0 || summary.removed > 0) status = 'fixed';

    const result = { status, version: PLUGIN_VERSION, items, summary };
    if (profile && Object.keys(profile).length > 0) result.profile = profile;
    if (errors.length > 0) result.errors = errors;
    if (warnings && warnings.length > 0) result.warnings = warnings;

    return result;
  } catch (e) {
    // Always return valid JSON
    return { status: 'errors', version: PLUGIN_VERSION, items: [], summary: { ok: 0, fixed: 0, removed: 0, errors: 1, skipped: 0 }, errors: [{ code: 'OUTPUT_ERROR', message: e.message }] };
  }
}

// ─── Orchestrators ────────────────────────────────────────────────────────────

/**
 * Single-project check and optional remediation.
 * opts: { noRemediate: bool }
 */
function checkAndRemediate(globalPath, projectPath, projectRoot, opts = {}) {
  try {
    const { merged, warnings } = readManifest(globalPath, projectPath);
    const checkResults = checkManifest(merged, projectRoot);

    let remediateResults = null;
    if (opts.remediate !== false && !opts.noRemediate) {
      remediateResults = remediate(checkResults, projectRoot);
      // Re-run checks after remediation to get updated statuses
      const recheckResults = checkManifest(merged, projectRoot);
      return formatOutput(recheckResults, remediateResults, merged.profile || {}, warnings);
    }

    return formatOutput(checkResults, null, merged.profile || {}, warnings);
  } catch (e) {
    return { status: 'errors', version: PLUGIN_VERSION, items: [], summary: { ok: 0, fixed: 0, removed: 0, errors: 1, skipped: 0 }, errors: [{ code: 'ENGINE_ERROR', message: e.message }] };
  }
}

/**
 * Multi-project check — discovers all projects, checks each, groups by repo.
 * opts: { noRemediate: bool, globalManifestPath: string }
 */
function checkAll(globalPath, opts = {}) {
  try {
    const projects = discoverProjects();
    const byRepo = {};
    const results = [];

    for (const project of projects) {
      try {
        const projectManifestPath = path.join(project.path, '.claude', 'manifest.json');
        const result = checkAndRemediate(globalPath, projectManifestPath, project.path, opts);
        const entry = { project: project.path, name: project.name, repo: project.repo, ...result };
        results.push(entry);

        if (!byRepo[project.repo]) byRepo[project.repo] = [];
        byRepo[project.repo].push(entry);
      } catch (e) {
        results.push({ project: project.path, name: project.name, repo: project.repo, status: 'errors', errors: [{ code: 'PROJECT_ERROR', message: e.message }] });
      }
    }

    const totalStatus = results.some(r => r.status === 'errors') ? 'errors'
      : results.some(r => r.status === 'fixed') ? 'fixed' : 'ok';

    return { status: totalStatus, version: PLUGIN_VERSION, projectCount: projects.length, byRepo, results };
  } catch (e) {
    return { status: 'errors', version: PLUGIN_VERSION, projectCount: 0, byRepo: {}, results: [], errors: [{ code: 'DISCOVER_ERROR', message: e.message }] };
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  readManifest,
  checkManifest,
  remediate,
  discoverProjects,
  generateManifest,
  checkAndRemediate,
  checkAll,
  formatOutput,
  // Export helpers for testing
  _getActiveConductorWorkspaces,
  _enforceClaudeMemSettings,
  _registerInTracker,
};
