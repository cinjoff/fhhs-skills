#!/usr/bin/env node
// Global Reconcile — Discover all projects using fhhs-skills and reconcile each.
//
// Usage:
//   node global-reconcile.cjs --from <version> --to <version> --changelog-file <path>
//
// Discovery sources (deduplicated):
//   1. Conductor DB (active workspaces only, state='ready')
//   2. ~/.claude/tracker/projects.json (tracker registry, non-Conductor projects)
//
// Projects are grouped by GitHub repo — multiple worktrees under the same repo
// are treated as instances of one project, not separate projects.
//
// For each discovered project:
//   - Run post-update-reconcile.sh (claude-mem patch, env var, tracker registration)
//   - Run changelog reconcile (env gap checks against fhhs-skills plugin changelog)
//   - Run gsd-tools validate health --repair (planning health)
//
// The --changelog-file is always the fhhs-skills plugin CHANGELOG.md (fetched
// from GitHub by the update skill). It contains reconciliation tags like
// [setup:tool:fallow] that verify whether each project's environment has the
// required tools, hooks, and env vars. It is NOT the project's own changelog.
//
// Output: JSON report with per-project results, grouped by repo.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

// ─── Argument parsing ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let fromVersion = '0.0.0';
let toVersion = '';
let changelogFile = '';
let scanOnly = false;
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--from': fromVersion = args[++i]; break;
    case '--to': toVersion = args[++i]; break;
    case '--changelog-file': changelogFile = args[++i]; break;
    case '--scan-only': scanOnly = true; break;
  }
}

if (!scanOnly && !toVersion) {
  console.error('Usage: global-reconcile.cjs --from <ver> --to <ver> --changelog-file <path>');
  console.error('       global-reconcile.cjs --scan-only');
  process.exit(1);
}

// Resolve changelog to absolute path so it works regardless of cwd changes
if (changelogFile) {
  changelogFile = path.resolve(changelogFile);
}

// ─── Conductor DB query ─────────────────────────────────────────────────────

/**
 * Query Conductor's SQLite DB to get only active (state='ready') workspaces.
 * Returns Map<repoName, { repoPath, workspaces: [{name, wsPath}] }>
 */
function getActiveConductorWorkspaces() {
  const dbPath = path.join(os.homedir(), 'Library', 'Application Support', 'com.conductor.app', 'conductor.db');
  if (!fs.existsSync(dbPath)) return new Map();

  try {
    // Query active workspaces joined with their repos
    const query = `
      SELECT w.directory_name, r.name as repo_name, r.root_path as repo_path
      FROM workspaces w
      JOIN repos r ON w.repository_id = r.id
      WHERE w.state = 'ready'
      ORDER BY r.name, w.directory_name;
    `;
    const out = execFileSync('sqlite3', ['-separator', '|', dbPath, query.replace(/\n/g, ' ')], {
      timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'],
    });
    const lines = out.toString().trim().split('\n').filter(Boolean);
    const repos = new Map();
    for (const line of lines) {
      const [wsName, repoName, repoPath] = line.split('|');
      if (!wsName || !repoName) continue;
      if (!repos.has(repoName)) {
        repos.set(repoName, { repoPath: repoPath || '', workspaces: [] });
      }
      // Resolve workspace path from Conductor's directory structure
      const conductorRoot = path.join(os.homedir(), 'conductor', 'workspaces');
      const wsPath = path.join(conductorRoot, repoName, wsName);
      repos.get(repoName).workspaces.push({ name: wsName, wsPath });
    }
    return repos;
  } catch {
    // DB not readable or sqlite3 not available — fall back to filesystem scan
    return new Map();
  }
}

// ─── Project discovery ───────────────────────────────────────────────────────

function discoverProjects() {
  const seen = new Set();
  const projects = [];

  function addProject(projectPath, source, repoName) {
    const normalized = path.resolve(projectPath);
    if (seen.has(normalized)) return;
    if (!fs.existsSync(normalized)) return;
    seen.add(normalized);

    // Detect Conductor workspace
    const conductorMatch = normalized.match(/\/conductor\/workspaces\/([^/]+)\/([^/]+)/);
    const isConductor = !!conductorMatch;
    const hasPlanning = fs.existsSync(path.join(normalized, '.planning'));

    // Check for .claude/settings.json (indicates fhhs-skills was set up here)
    const hasClaudeSettings = fs.existsSync(path.join(normalized, '.claude', 'settings.json'));

    // Resolve repo name: explicit > Conductor match > git > directory name
    let resolvedRepo = repoName || null;
    if (!resolvedRepo && isConductor) {
      resolvedRepo = conductorMatch[1];
    }
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

  // Source 1: Conductor DB — only active workspaces (state='ready')
  const activeRepos = getActiveConductorWorkspaces();
  const conductorPaths = new Set();
  for (const [repoName, repoInfo] of activeRepos) {
    for (const ws of repoInfo.workspaces) {
      if (fs.existsSync(ws.wsPath)) {
        addProject(ws.wsPath, 'conductor-db', repoName);
        conductorPaths.add(path.resolve(ws.wsPath));
      }
    }
  }

  // Source 2: Tracker registry — only non-Conductor projects
  // (Conductor projects are already covered by the DB query above,
  //  and this prevents archived Conductor workspaces from sneaking in)
  const registryPath = path.join(os.homedir(), '.claude', 'tracker', 'projects.json');
  try {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    if (Array.isArray(registry)) {
      for (const entry of registry) {
        if (!entry.path) continue;
        const normalized = path.resolve(entry.path);
        // Skip Conductor paths — they're handled by DB query above
        const isConductorPath = normalized.includes('/conductor/workspaces/');
        if (isConductorPath) continue;
        addProject(entry.path, 'tracker');
      }
    }
  } catch {
    // No registry or parse error — continue
  }

  // Fallback: If Conductor DB query failed, scan filesystem but only for
  // directories that exist (no archived workspace dirs exist on disk)
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
    } catch { /* skip if not readable */ }
  }

  return projects;
}

// ─── Per-project reconciliation ──────────────────────────────────────────────

function reconcileProject(project) {
  const result = {
    path: project.path,
    name: project.name,
    isConductor: project.isConductor,
    repo: project.repo,
    steps: {},
    errors: [],
    status: 'ok',
  };

  const execOpts = { cwd: project.path, timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] };

  // Step 1: Run post-update-reconcile.sh
  const reconcileScript = path.join(os.homedir(), '.claude', 'get-shit-done', 'bin', 'post-update-reconcile.sh');
  if (fs.existsSync(reconcileScript)) {
    try {
      const out = execFileSync('sh', [reconcileScript, '--project-root', project.path], {
        ...execOpts,
        env: { ...process.env, HOME: os.homedir() },
      });
      result.steps.postUpdateReconcile = {
        status: 'ok',
        output: out.toString().trim().split('\n'),
      };
    } catch (e) {
      result.steps.postUpdateReconcile = {
        status: 'error',
        error: (e.stderr || e.message || '').toString().trim(),
      };
      result.errors.push('post-update-reconcile failed');
    }
  } else {
    result.steps.postUpdateReconcile = { status: 'skipped', reason: 'script not found' };
  }

  // Step 2: Run changelog reconcile (env gap checks)
  if (changelogFile && fs.existsSync(changelogFile)) {
    const gsdTools = path.join(os.homedir(), '.claude', 'get-shit-done', 'bin', 'gsd-tools.cjs');
    if (fs.existsSync(gsdTools)) {
      try {
        const out = execFileSync('node', [
          gsdTools, 'changelog', 'reconcile',
          '--from', fromVersion,
          '--to', toVersion,
          '--changelog-file', changelogFile,
          '--project-root', project.path,
        ], execOpts);
        const parsed = JSON.parse(out.toString().trim());
        result.steps.changelogReconcile = {
          status: 'ok',
          missingCount: parsed.missing ? parsed.missing.length : 0,
          okCount: parsed.ok ? parsed.ok.length : 0,
          missing: parsed.missing || [],
        };
      } catch (e) {
        result.steps.changelogReconcile = {
          status: 'error',
          error: (e.stderr || e.message || '').toString().trim(),
        };
        result.errors.push('changelog reconcile failed');
      }
    }
  }

  // Step 2.5: Auto-remediate env gaps
  const missingItems = result.steps.changelogReconcile?.missing || [];
  if (missingItems.length > 0) {
    const remediated = [];
    const failed = [];
    for (const item of missingItems) {
      const check = item.check || '';
      const id = item.id || '';
      try {
        if (check.startsWith('setup:tool:')) {
          // Install CLI tools
          const pkg = id === 'typescript-language-server' ? 'typescript-language-server typescript' : id;
          const mgr = id === 'typescript-language-server' ? 'npm' : 'pnpm';
          execFileSync(mgr, ['install', '-g', ...pkg.split(' ')], {
            timeout: 60000, stdio: ['pipe', 'pipe', 'pipe'],
          });
          remediated.push({ ...item, action: `installed via ${mgr}` });
        } else if (check.startsWith('setup:env:')) {
          // FHHS_SKILLS_ROOT is global (same plugin root for all projects) — write to ~/.claude/settings.json
          // All other env vars are per-project — write to project/.claude/settings.json
          const isGlobal = id === 'FHHS_SKILLS_ROOT';
          const settingsPath = isGlobal
            ? path.join(os.homedir(), '.claude', 'settings.json')
            : path.join(project.path, '.claude', 'settings.json');
          let settings = {};
          try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch { /* new file */ }
          if (!settings.env) settings.env = {};
          // Only set if not already present
          if (!(id in settings.env)) {
            if (id === 'FHHS_SKILLS_ROOT') {
              // Discover the plugin root from cache (same logic as setup/update)
              const cacheDir = path.join(os.homedir(), '.claude', 'plugins', 'cache', 'fhhs-skills', 'fh');
              let pluginRoot = '';
              if (fs.existsSync(cacheDir)) {
                const versions = fs.readdirSync(cacheDir).filter(d =>
                  fs.statSync(path.join(cacheDir, d)).isDirectory()
                ).sort();
                if (versions.length > 0) {
                  pluginRoot = path.join(cacheDir, versions[versions.length - 1]);
                }
              }
              if (pluginRoot) {
                settings.env[id] = pluginRoot;
              } else {
                failed.push({ ...item, error: 'plugin cache not found — run /fh:setup' });
                continue;
              }
            } else if (id === 'CLAUDE_CWD') {
              settings.env[id] = project.path;
            } else if (id === 'CLAUDE_MEM_PROJECT') {
              // Derive from git common dir (worktree-safe)
              try {
                const gitDir = execFileSync('git', ['rev-parse', '--git-common-dir'], {
                  cwd: project.path, timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'],
                }).toString().trim();
                const gitRoot = path.resolve(project.path, gitDir, '..');
                settings.env[id] = path.basename(gitRoot);
              } catch {
                settings.env[id] = project.repo || path.basename(project.path);
              }
            } else {
              settings.env[id] = id === 'CLAUDE_CODE_ENABLE_TASKS' ? 'true' : '1';
            }
            if (isGlobal) {
              fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
            } else {
              fs.mkdirSync(path.join(project.path, '.claude'), { recursive: true });
              fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
            }
            remediated.push({ ...item, action: `set in ${isGlobal ? 'global' : 'project'} settings.json` });
          } else {
            remediated.push({ ...item, action: 'already set' });
          }
        } else if (check.startsWith('setup:hook:')) {
          // Add hooks to global ~/.claude/settings.json (shared across all projects)
          const globalSettingsPath = path.join(os.homedir(), '.claude', 'settings.json');
          let globalSettings = {};
          try { globalSettings = JSON.parse(fs.readFileSync(globalSettingsPath, 'utf8')); } catch { /* new */ }
          const hookId = id;
          if (hookId.includes('statusline')) {
            // statusLine is a top-level field, not in hooks array
            if (!globalSettings.statusLine) {
              globalSettings.statusLine = {
                command: `node "$HOME/.claude/get-shit-done/hooks/fhhs-statusline.js"`,
              };
              fs.writeFileSync(globalSettingsPath, JSON.stringify(globalSettings, null, 2) + '\n');
              remediated.push({ ...item, action: 'statusLine added to global settings' });
            } else {
              remediated.push({ ...item, action: 'already configured' });
            }
          } else {
            // Map hook IDs to event types and commands
            let event = 'PreToolUse';
            let cmd = '';
            if (hookId.includes('check-update')) { event = 'SessionStart'; cmd = `node "$HOME/.claude/get-shit-done/hooks/fhhs-check-update.js"`; }
            else if (hookId.includes('learnings')) { event = 'SessionStart'; cmd = `node "$HOME/.claude/get-shit-done/hooks/fhhs-learnings.js"`; }
            else if (hookId.includes('context-monitor')) { event = 'PostToolUse'; cmd = `node "$HOME/.claude/get-shit-done/hooks/fhhs-context-monitor.js"`; }
            if (cmd) {
              if (!globalSettings.hooks) globalSettings.hooks = {};
              if (!globalSettings.hooks[event]) globalSettings.hooks[event] = [];
              const existing = globalSettings.hooks[event].some(h =>
                (h.hooks && h.hooks.some(hh => hh.command && hh.command.includes(hookId))) ||
                (h.command && h.command.includes(hookId))
              );
              if (!existing) {
                globalSettings.hooks[event].push({ hooks: [{ type: 'command', command: cmd }] });
                fs.writeFileSync(globalSettingsPath, JSON.stringify(globalSettings, null, 2) + '\n');
                remediated.push({ ...item, action: `hook added to ${event}` });
              } else {
                remediated.push({ ...item, action: 'already configured' });
              }
            } else {
              failed.push({ ...item, reason: 'unknown hook type' });
            }
          }
        } else if (check.startsWith('setup:dir:')) {
          // Create missing directories or install tools that create them
          const expandedPath = id.replace(/^~/, os.homedir());
          if (id.includes('shadcn') || id.includes('skills/shadcn')) {
            try {
              execFileSync('npx', ['-y', 'skills', 'add', '-g', '-y', '--all', 'shadcn/ui'], {
                cwd: os.homedir(), timeout: 120000, stdio: ['pipe', 'pipe', 'pipe'],
              });
              remediated.push({ ...item, action: 'shadcn skills installed' });
            } catch {
              failed.push({ ...item, reason: 'shadcn install failed' });
            }
          } else {
            fs.mkdirSync(expandedPath, { recursive: true });
            remediated.push({ ...item, action: 'directory created' });
          }
        } else if (check.startsWith('setup:plugin:')) {
          // Attempt plugin install — use execFileSync to avoid shell injection
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
            remediated.push({ ...item, action: 'plugin installed' });
          } catch {
            failed.push({ ...item, reason: 'plugin install failed (may need interactive terminal)' });
          }
        } else {
          // Unknown check type — skip
          failed.push({ ...item, reason: `unknown check type: ${check}` });
        }
      } catch (e) {
        failed.push({ ...item, reason: (e.message || '').slice(0, 200) });
      }
    }
    result.steps.envRemediation = {
      status: failed.length > 0 ? 'partial' : 'ok',
      remediated,
      failed,
    };
  }

  // Step 3: Run health --repair (only if project has .planning/)
  if (project.hasPlanning) {
    const gsdTools = path.join(os.homedir(), '.claude', 'get-shit-done', 'bin', 'gsd-tools.cjs');
    if (fs.existsSync(gsdTools)) {
      try {
        const out = execFileSync('node', [gsdTools, 'validate', 'health', '--repair'], execOpts);
        const parsed = JSON.parse(out.toString().trim());
        result.steps.healthRepair = {
          status: parsed.status || 'unknown',
          errors: (parsed.errors || []).length,
          warnings: (parsed.warnings || []).length,
          repairsPerformed: parsed.repairs_performed || [],
          errorDetails: (parsed.errors || []).map(e => ({ code: e.code, message: e.message })),
          warningDetails: (parsed.warnings || []).map(w => ({ code: w.code, message: w.message })),
        };
      } catch (e) {
        // Health check may output non-JSON on some errors
        result.steps.healthRepair = {
          status: 'error',
          error: (e.stderr || e.stdout || e.message || '').toString().trim().slice(0, 500),
        };
        result.errors.push('health repair failed');
      }
    }
  } else {
    result.steps.healthRepair = { status: 'skipped', reason: 'no .planning/ directory' };
  }

  // Step 4: Check git-tracked files that may be stale
  // These files live in the repo and are shared across worktrees via git.
  // We can't auto-modify them (user content), but we can flag staleness.
  const staleFiles = [];

  // Check conductor.json setup script for outdated patterns
  const conductorJson = path.join(project.path, 'conductor.json');
  if (fs.existsSync(conductorJson)) {
    try {
      const content = fs.readFileSync(conductorJson, 'utf8');
      // Check if setup script includes post-update-reconcile
      if (!content.includes('post-update-reconcile') && !content.includes('patch-claude-mem')) {
        staleFiles.push({
          file: 'conductor.json',
          reason: 'setup script missing post-update-reconcile step',
          fix: 'Re-run /fh:new-project setup or manually add the reconcile step',
        });
      }
    } catch { /* ignore read errors */ }
  }

  // Check CLAUDE.md exists (projects created before CLAUDE.md was standard)
  const claudeMd = path.join(project.path, 'CLAUDE.md');
  if (project.hasPlanning && !fs.existsSync(claudeMd)) {
    staleFiles.push({
      file: 'CLAUDE.md',
      reason: 'missing — project may have been created with an older plugin version',
      fix: 'Run /fh:learnings --update-claude-md to generate',
    });
  }

  if (staleFiles.length > 0) {
    result.steps.staleFileCheck = {
      status: 'warn',
      files: staleFiles,
    };
  } else {
    result.steps.staleFileCheck = { status: 'ok' };
  }

  // Determine overall status
  if (result.errors.length > 0) {
    result.status = 'partial';
  }

  return result;
}

// ─── Scan (pre-update preview) ───────────────────────────────────────────────

function scanProject(project) {
  const scan = {
    path: project.path,
    name: project.name,
    isConductor: project.isConductor,
    repo: project.repo,
    hasPlanning: project.hasPlanning,
    hasClaudeSettings: project.hasClaudeSettings,
    health: null,
    envGaps: 0,
  };

  // Check health status (read-only, no --repair)
  if (project.hasPlanning) {
    const gsdTools = path.join(os.homedir(), '.claude', 'get-shit-done', 'bin', 'gsd-tools.cjs');
    if (fs.existsSync(gsdTools)) {
      try {
        const out = execFileSync('node', [gsdTools, 'validate', 'health'], {
          cwd: project.path, timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'],
        });
        const parsed = JSON.parse(out.toString().trim());
        scan.health = {
          status: parsed.status || 'unknown',
          errors: (parsed.errors || []).length,
          warnings: (parsed.warnings || []).length,
          repairable: parsed.repairable_count || 0,
        };
      } catch {
        scan.health = { status: 'error', errors: 0, warnings: 0, repairable: 0 };
      }
    }
  }

  // Check env gaps (read-only)
  if (changelogFile && fs.existsSync(changelogFile)) {
    const gsdTools = path.join(os.homedir(), '.claude', 'get-shit-done', 'bin', 'gsd-tools.cjs');
    if (fs.existsSync(gsdTools)) {
      try {
        const out = execFileSync('node', [
          gsdTools, 'changelog', 'reconcile',
          '--from', fromVersion, '--to', toVersion || '99.99.99',
          '--changelog-file', changelogFile,
          '--project-root', project.path,
        ], { cwd: project.path, timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'] });
        const parsed = JSON.parse(out.toString().trim());
        scan.envGaps = parsed.missing ? parsed.missing.length : 0;
      } catch {
        // ignore
      }
    }
  }

  // Check if .claude/settings.json is missing
  scan.missingSettings = !project.hasClaudeSettings;

  return scan;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const projects = discoverProjects();

  if (projects.length === 0) {
    const report = { projects: [], summary: 'No projects found' };
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  // Scan-only mode: preview without changes
  if (scanOnly) {
    const scans = projects.map(p => scanProject(p));
    const report = {
      mode: 'scan',
      discovery: {
        total: projects.length,
        repos: [...new Set(projects.map(p => p.repo))].length,
        fromConductorDb: projects.filter(p => p.source === 'conductor-db').length,
        fromTracker: projects.filter(p => p.source === 'tracker').length,
        fromScan: projects.filter(p => p.source === 'conductor-scan').length,
        withPlanning: projects.filter(p => p.hasPlanning).length,
      },
      repos: groupByRepo(scans),
      projects: scans,
    };
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  const results = [];
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    // Progress to stderr (not captured in JSON stdout)
    process.stderr.write(`[${i + 1}/${projects.length}] ${project.name}...`);
    const result = reconcileProject(project);
    const healthStatus = result.steps.healthRepair?.status || 'skip';
    const repairs = result.steps.healthRepair?.repairsPerformed?.length || 0;
    const stale = result.steps.staleFileCheck?.files?.length || 0;
    process.stderr.write(` ${result.status === 'ok' ? 'ok' : 'partial'} (health: ${healthStatus}${repairs > 0 ? `, ${repairs} repaired` : ''}${stale > 0 ? `, ${stale} stale` : ''})\n`);
    results.push(result);
  }

  // Build summary
  const okCount = results.filter(r => r.status === 'ok').length;
  const partialCount = results.filter(r => r.status === 'partial').length;
  const totalRepairs = results.reduce((sum, r) => {
    const repairs = r.steps.healthRepair?.repairsPerformed?.length || 0;
    return sum + repairs;
  }, 0);
  const totalEnvRemediated = results.reduce((sum, r) => {
    return sum + (r.steps.envRemediation?.remediated?.length || 0);
  }, 0);
  const totalEnvFailed = results.reduce((sum, r) => {
    return sum + (r.steps.envRemediation?.failed?.length || 0);
  }, 0);
  const totalMissing = results.reduce((sum, r) => {
    return sum + (r.steps.changelogReconcile?.missingCount || 0);
  }, 0);

  const report = {
    discovery: {
      total: projects.length,
      repos: [...new Set(projects.map(p => p.repo))].length,
      fromConductorDb: projects.filter(p => p.source === 'conductor-db').length,
      fromTracker: projects.filter(p => p.source === 'tracker').length,
      fromScan: projects.filter(p => p.source === 'conductor-scan').length,
      withPlanning: projects.filter(p => p.hasPlanning).length,
    },
    repos: groupByRepo(results),
    results,
    summary: {
      total: results.length,
      ok: okCount,
      partial: partialCount,
      totalRepairs,
      totalEnvRemediated,
      totalEnvFailed,
      totalEnvGaps: totalMissing,
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

// ─── Group results by repo ──────────────────────────────────────────────────

function groupByRepo(items) {
  const groups = {};
  for (const item of items) {
    const repo = item.repo || '(standalone)';
    if (!groups[repo]) groups[repo] = [];
    groups[repo].push(item);
  }
  return groups;
}

main();
