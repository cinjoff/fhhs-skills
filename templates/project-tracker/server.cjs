'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

// Import parse functions from parser.
// Individual exports are added by the parser-v2 enhancement (parallel task).
// Fall back to parsePlanning-based wrappers if individual exports aren't available yet.
const parser = require('./parser.cjs');

const parseProject = parser.parseProject || ((dir) => parser.parsePlanning(dir).project);
const parseRoadmap = parser.parseRoadmap || ((dir) => {
  const d = parser.parsePlanning(dir);
  return { milestone: d.milestone, phases: d.stages || [] };
});
const parseState = parser.parseState || ((_dir) => {
  // Minimal state parse — parsePlanning doesn't expose raw state
  return { currentPhase: '', currentPlan: 1, status: 'active' };
});
const parsePhases = parser.parsePhases || ((_dir, _roadmapPhases, _state) => {
  // When individual exports aren't available, fall back to full parse
  const d = parser.parsePlanning(_dir);
  return { phases: d.stages || [], completionEvents: [] };
});
const parseRetros = parser.parseRetros || ((dir) => {
  const d = parser.parsePlanning(dir);
  return d.recentActivity ? d.recentActivity.filter(a => /retro/i.test(a.text)) : [];
});
const parseTodos = parser.parseTodos || ((dir) => {
  const d = parser.parsePlanning(dir);
  return d.todos || { pending: [] };
});
const parseQuickTasks = parser.parseQuickTasks || ((dir) => {
  const d = parser.parsePlanning(dir);
  return d.quickTasks || [];
});
const parseConcerns = parser.parseConcerns || (() => ({ categories: [], totalCount: 0 }));
const parseCodebaseFreshness = parser.parseCodebaseFreshness || (() => ({ lastUpdated: null, isStale: false }));

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const BASE_PORT = 4111;
const MAX_PORT_ATTEMPTS = 3;
const DEBOUNCE_MS = 300;
const CACHE_VERSION = 1;
const HOME = process.env.HOME || require('os').homedir() || '';

// Registry path — from TRACKER_REGISTRY env var or default location
const registryPath = process.env.TRACKER_REGISTRY
  ? path.resolve(process.env.TRACKER_REGISTRY.replace(/^~/, HOME))
  : path.join(HOME, '.claude', 'tracker', 'projects.json');

// Active project state (switches when user selects a project)
let activePlanningDir = null;
let activeProjectPath = null;
let cachePath = null;

// Per-project in-memory state
let cache = emptyCache();
let lastState = null;
let lastCompletionEvents = [];
let lastRetros = [];

// Projects list for sidebar
let projectsList = [];
let registryMtime = 0;

// ---------------------------------------------------------------------------
// Registry — read registered projects and build sidebar summaries
// ---------------------------------------------------------------------------

function readRegistry() {
  try {
    const raw = fs.readFileSync(registryPath, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Auto-register a project path into the registry file.
function autoRegisterProject(projectPath) {
  const registry = readRegistry();
  if (registry.some(e => e.path === projectPath)) return;

  const now = new Date().toISOString();

  // Detect Conductor workspace pattern: ~/conductor/workspaces/{repo}/{worktree}
  // Use the repo directory name as the project name for conductor workspaces
  const conductorMatch = projectPath.match(/\/conductor\/workspaces\/([^/]+)\//);
  const name = conductorMatch ? conductorMatch[1] : path.basename(projectPath);
  const entry = { path: projectPath, name, addedAt: now, lastSeen: now };

  if (conductorMatch) {
    entry.conductorWorkspace = conductorMatch[1];
  }

  registry.push(entry);

  try {
    const dir = path.dirname(registryPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf8');
  } catch (err) {
    console.error(`  Warning: Could not write registry: ${err.message}`);
  }
}

// Read .auto-state.json from a planning directory (atomic-write safe).
// If the state contains a project_dir pointing elsewhere (worktree), also check
// that location and use whichever has a newer started_at timestamp.
function readAutoState(planningDir) {
  let localState = null;
  try {
    const p = path.join(planningDir, '.auto-state.json');
    if (fs.existsSync(p)) localState = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch { /* half-written or invalid JSON — ignore */ }

  if (!localState) return null;

  // Check if auto-state references a different project_dir (worktree scenario)
  try {
    const projectDir = localState.project_dir;
    const localParent = path.dirname(planningDir);
    if (projectDir && projectDir !== localParent) {
      const worktreePlanningDir = path.join(projectDir, '.planning');
      const worktreePath = path.join(worktreePlanningDir, '.auto-state.json');
      if (fs.existsSync(worktreePath)) {
        const worktreeState = JSON.parse(fs.readFileSync(worktreePath, 'utf8'));
        // Use whichever has a newer started_at timestamp
        const localTime = localState.started_at ? new Date(localState.started_at).getTime() : 0;
        const worktreeTime = worktreeState.started_at ? new Date(worktreeState.started_at).getTime() : 0;
        if (worktreeTime > localTime) {
          return worktreeState;
        }
      }
    }
  } catch { /* worktree path missing or invalid — use local state */ }

  return localState;
}

// Build a lightweight summary for the sidebar from a registry entry.
function buildProjectSummary(entry) {
  const projectPath = entry.path;
  const planningDir = path.join(projectPath, '.planning');
  const hasPlanningDir = fs.existsSync(planningDir);

  const autoState = readAutoState(planningDir);

  const base = {
    id: projectPath,
    name: entry.name || path.basename(projectPath),
    path: projectPath,
    conductorWorkspace: entry.conductorWorkspace || null,
    autoState,
  };

  if (!hasPlanningDir) {
    return { ...base, status: 'pending', progressPct: 0, totalPhases: 0, completedPhases: 0 };
  }

  try {
    const project = parseProject(planningDir);
    const roadmapData = parseRoadmap(planningDir);
    const stateData = parseState(planningDir);
    const phaseResult = parsePhases(planningDir, roadmapData.phases, stateData);
    const phases = phaseResult.phases || [];

    const totalPhases = phases.length;
    let completedPhases = phases.filter(p => p.status === 'complete').length;
    let hasActive = phases.some(p => p.status === 'active');

    // Cross-reference autoState with parsed phase data
    if (autoState) {
      // Warn on mismatch between auto-state and ROADMAP parsing
      if (autoState.phases_completed > 0 && completedPhases === 0) {
        console.warn(`  Warning: auto-state reports ${autoState.phases_completed} phases completed but ROADMAP parsing found 0 — possible parsing mismatch`);
      }

      // Merge active phase info from auto-state phase_states
      if (autoState.phase_states && typeof autoState.phase_states === 'object') {
        for (const [phaseKey, phaseStatus] of Object.entries(autoState.phase_states)) {
          if (phaseStatus === 'building' || phaseStatus === 'planning' || phaseStatus === 'reviewing') {
            // Find matching phase by number (phaseKey may be "1", "2", etc.)
            const phaseNum = parseInt(phaseKey, 10);
            const matchedPhase = phases.find(p => p.number === phaseNum);
            if (matchedPhase && matchedPhase.status !== 'complete') {
              matchedPhase.status = 'active';
              hasActive = true;
            }
          }
        }
      }
    }

    let status = 'pending';
    if (completedPhases === totalPhases && totalPhases > 0) status = 'complete';
    else if (hasActive) status = 'active';
    else if (completedPhases > 0) status = 'active';

    // Always use the registry name (repo dirname) for sidebar consistency.
    // PROJECT.md name is available as projectTitle for the detail view.
    return {
      ...base,
      projectTitle: project.name || null,
      status,
      progressPct: totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0,
      totalPhases,
      completedPhases,
    };
  } catch (err) {
    console.error(`  Warning: Failed to parse ${projectPath}: ${err.message}`);
    return { ...base, status: 'error', progressPct: 0, totalPhases: 0, completedPhases: 0 };
  }
}

// Clean registry: remove entries with non-existent paths, fix malformed fields.
function cleanRegistry() {
  const entries = readRegistry();
  if (entries.length === 0) return;

  let changed = false;
  const cleaned = [];

  for (const entry of entries) {
    // Remove entries where the directory no longer exists
    if (!fs.existsSync(entry.path)) {
      console.log(`  [registry] Pruning dead entry: ${entry.name || entry.path}`);
      changed = true;
      continue;
    }

    // Fix malformed conductorWorkspace (boolean instead of string)
    if (typeof entry.conductorWorkspace !== 'string' && entry.conductorWorkspace != null) {
      const conductorMatch = entry.path.match(/\/conductor\/workspaces\/([^/]+)\//);
      if (conductorMatch) {
        entry.conductorWorkspace = conductorMatch[1];
      } else {
        delete entry.conductorWorkspace;
      }
      changed = true;
    }

    // Normalize conductor workspace names: use repo name, not worktree path
    if (entry.conductorWorkspace && entry.name) {
      // If name is a worktree dirname or workspace/worktree format, normalize to repo name
      const dirName = path.basename(entry.path);
      if (entry.name === dirName || entry.name === `${entry.conductorWorkspace}/${dirName}`) {
        if (entry.name !== entry.conductorWorkspace) {
          entry.name = entry.conductorWorkspace;
          changed = true;
        }
      }
    }

    cleaned.push(entry);
  }

  if (changed) {
    try {
      fs.writeFileSync(registryPath, JSON.stringify(cleaned, null, 2) + '\n', 'utf8');
      console.log(`  [registry] Cleaned: ${entries.length - cleaned.length} removed, ${cleaned.length} remaining`);
    } catch (err) {
      console.error(`  Warning: Could not write cleaned registry: ${err.message}`);
    }
  }
}

// De-duplicate conductor workspaces: when multiple worktrees exist for the
// same repo, keep only the most recently seen entry for the sidebar.
function deduplicateEntries(entries) {
  const deduped = [];
  const seenWorkspaces = new Map();
  for (const e of entries) {
    if (e.conductorWorkspace) {
      const existing = seenWorkspaces.get(e.conductorWorkspace);
      if (!existing || (e.lastSeen && (!existing.lastSeen || e.lastSeen > existing.lastSeen))) {
        seenWorkspaces.set(e.conductorWorkspace, e);
      }
    } else {
      deduped.push(e);
    }
  }
  deduped.push(...seenWorkspaces.values());
  return deduped;
}

// Refresh the projects list from the registry (only re-reads if file changed).
function refreshProjectsList() {
  let changed = false;
  try {
    const stat = fs.statSync(registryPath);
    if (stat.mtimeMs === registryMtime && projectsList.length > 0) {
      return false;
    }
    registryMtime = stat.mtimeMs;
    changed = true;
  } catch {
    if (projectsList.length > 0) {
      projectsList = [];
      return true;
    }
    return false;
  }

  if (changed) {
    const entries = readRegistry();
    // Filter: only show projects that have .planning/ (active work)
    const activeEntries = entries.filter(e => {
      const planDir = path.join(e.path, '.planning');
      return fs.existsSync(planDir);
    });

    projectsList = deduplicateEntries(activeEntries).map(e => buildProjectSummary(e));
    const skipped = entries.length - activeEntries.length;
    console.log(`  [registry] ${activeEntries.length} project(s) loaded${skipped > 0 ? ` (${skipped} without .planning/ hidden)` : ''}`);
  }
  return changed;
}

// Force-refresh summaries for all projects (e.g. when .planning/ files change)
function refreshAllSummaries() {
  const entries = readRegistry();
  const activeEntries = entries.filter(e => fs.existsSync(path.join(e.path, '.planning')));

  projectsList = deduplicateEntries(activeEntries).map(e => buildProjectSummary(e));
}

// ---------------------------------------------------------------------------
// Cache Management
// ---------------------------------------------------------------------------

function emptyCache() {
  return {
    version: CACHE_VERSION,
    mtimes: {},
    completedPhases: {},
    project: {},
    roadmap: {},
    concerns: {},
    codebaseFreshness: {},
  };
}

function loadCache() {
  if (!cachePath) return emptyCache();
  try {
    const raw = fs.readFileSync(cachePath, 'utf8');
    const data = JSON.parse(raw);
    if (data && data.version === CACHE_VERSION) {
      return data;
    }
  } catch {
    // Missing or corrupt — start fresh
  }
  return emptyCache();
}

function saveCache(c) {
  if (!cachePath) return;
  try {
    const dir = path.dirname(cachePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(cachePath, JSON.stringify(c, null, 2), 'utf8');
  } catch (err) {
    console.error('  Warning: Could not save cache:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Active Project Switching
// ---------------------------------------------------------------------------

function switchActiveProject(projectPath) {
  if (projectPath === activeProjectPath) return;

  activeProjectPath = projectPath;
  activePlanningDir = path.join(projectPath, '.planning');
  cachePath = path.join(projectPath, '.project-tracker', 'cache.json');

  // Reset state
  cache = loadCache();
  lastState = null;
  lastCompletionEvents = [];
  lastRetros = [];

  if (fs.existsSync(activePlanningDir)) {
    console.log(`  [switch] Active project: ${path.basename(projectPath)}`);
    cache.mtimes = scanMtimes(activePlanningDir);
    buildState(null);
  } else {
    console.log(`  [switch] Project ${path.basename(projectPath)} has no .planning/`);
  }
}

// ---------------------------------------------------------------------------
// Mtime Scanning
// ---------------------------------------------------------------------------

function scanMtimes(dir, baseDir) {
  if (!baseDir) baseDir = dir;
  const result = {};

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return result;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      Object.assign(result, scanMtimes(fullPath, baseDir));
    } else if (entry.isFile()) {
      try {
        const stat = fs.statSync(fullPath);
        result[relPath] = stat.mtimeMs;
      } catch {
        // File may have been deleted between readdir and stat
      }
    }
  }

  return result;
}

function getChangedFiles(oldMtimes, newMtimes) {
  const changed = new Set();

  for (const [filePath, mtime] of Object.entries(newMtimes)) {
    if (!oldMtimes[filePath] || oldMtimes[filePath] !== mtime) {
      changed.add(filePath);
    }
  }

  for (const filePath of Object.keys(oldMtimes)) {
    if (!(filePath in newMtimes)) {
      changed.add(filePath);
    }
  }

  return changed;
}

// ---------------------------------------------------------------------------
// Tiered State Builder
// ---------------------------------------------------------------------------

function categorizeChanges(changedFiles) {
  const needs = {
    state: false,
    project: false,
    roadmap: false,
    retros: false,
    todos: false,
    quickTasks: false,
    concerns: false,
    codebaseFreshness: false,
    changedPhaseDirs: new Set(),
  };

  for (const filePath of changedFiles) {
    const parts = filePath.split(path.sep);

    if (parts[0] === 'STATE.md') {
      needs.state = true;
    } else if (parts[0] === 'PROJECT.md') {
      needs.project = true;
    } else if (parts[0] === 'ROADMAP.md') {
      needs.roadmap = true;
    } else if (parts[0] === 'retros') {
      needs.retros = true;
    } else if (parts[0] === 'todos') {
      needs.todos = true;
    } else if (parts[0] === 'quick') {
      needs.quickTasks = true;
    } else if (parts[0] === 'codebase') {
      if (parts[1] === 'CONCERNS.md') {
        needs.concerns = true;
      }
      needs.codebaseFreshness = true;
    } else if (parts[0] === 'phases' && parts.length >= 2) {
      needs.changedPhaseDirs.add(parts[1]);
    } else if (parts[0] === 'milestones' && parts.length >= 3) {
      needs.changedPhaseDirs.add(parts[2]);
    } else if (parts[0] === 'plans') {
      needs.changedPhaseDirs.add('__ALL__');
    }
  }

  return needs;
}

function buildState(changedFiles) {
  if (!activePlanningDir || !fs.existsSync(activePlanningDir)) return null;

  const isFullParse = !lastState || !changedFiles;

  let needs;
  if (isFullParse) {
    needs = {
      state: true,
      project: true,
      roadmap: true,
      retros: true,
      todos: true,
      quickTasks: true,
      concerns: true,
      codebaseFreshness: true,
      changedPhaseDirs: new Set(['__ALL__']),
    };
  } else {
    needs = categorizeChanges(changedFiles);
  }

  let cacheChanged = false;

  const state = (needs.state || isFullParse)
    ? parseState(activePlanningDir)
    : (lastState ? { currentPhase: lastState.stages?.find(s => s.status === 'active')?.number, lastActivity: lastState.lastActivity } : parseState(activePlanningDir));

  const todos = (needs.todos || isFullParse)
    ? parseTodos(activePlanningDir)
    : (lastState ? lastState.todos : parseTodos(activePlanningDir));

  let retros;
  if (needs.retros || isFullParse) {
    retros = parseRetros(activePlanningDir);
    lastRetros = retros;
  } else {
    retros = lastRetros;
  }

  let project;
  if (needs.project || isFullParse) {
    project = parseProject(activePlanningDir);
    cache.project = project;
    cacheChanged = true;
    console.log('  [cache] Re-parsed PROJECT.md');
  } else {
    project = cache.project && Object.keys(cache.project).length > 0
      ? cache.project
      : parseProject(activePlanningDir);
  }

  let roadmapData;
  if (needs.roadmap || isFullParse) {
    roadmapData = parseRoadmap(activePlanningDir);
    cache.roadmap = roadmapData;
    cacheChanged = true;
    console.log('  [cache] Re-parsed ROADMAP.md');
  } else {
    roadmapData = cache.roadmap && cache.roadmap.phases
      ? cache.roadmap
      : parseRoadmap(activePlanningDir);
  }

  let concerns;
  if (needs.concerns || isFullParse) {
    try {
      concerns = parseConcerns(activePlanningDir);
    } catch {
      concerns = { categories: [], totalCount: 0 };
    }
    cache.concerns = concerns;
    cacheChanged = true;
    console.log('  [cache] Re-parsed CONCERNS.md');
  } else {
    concerns = cache.concerns && Object.keys(cache.concerns).length > 0
      ? cache.concerns
      : { categories: [], totalCount: 0 };
  }

  let codebaseFreshness;
  if (needs.codebaseFreshness || isFullParse) {
    try {
      codebaseFreshness = parseCodebaseFreshness(activePlanningDir) || { lastUpdated: null, isStale: false };
    } catch {
      codebaseFreshness = { lastUpdated: null, isStale: false };
    }
    cache.codebaseFreshness = codebaseFreshness;
    cacheChanged = true;
    console.log('  [cache] Re-parsed codebase freshness');
  } else {
    codebaseFreshness = cache.codebaseFreshness && Object.keys(cache.codebaseFreshness).length > 0
      ? cache.codebaseFreshness
      : { lastUpdated: null, isStale: false };
  }

  const phaseResult = buildPhases(roadmapData, state, needs, isFullParse);
  const stages = phaseResult.phases;
  const completionEvents = phaseResult.completionEvents;
  lastCompletionEvents = completionEvents;

  let quickTasks;
  if (needs.quickTasks || isFullParse) {
    quickTasks = parseQuickTasks(activePlanningDir);
    console.log('  [cache] Re-parsed quick tasks');
  } else {
    quickTasks = lastState ? lastState.quickTasks : parseQuickTasks(activePlanningDir);
  }

  const recentActivity = retros.concat(completionEvents);

  // Merge auto activity events from auto-state
  const autoState = readAutoState(activePlanningDir);
  if (autoState && Array.isArray(autoState.activity_events)) {
    for (const evt of autoState.activity_events) {
      recentActivity.push({
        type: evt.type || 'auto',
        text: evt.text || evt.msg || '',
        time: evt.timestamp || '',
        timestamp: evt.timestamp || '',
      });
    }
  }

  recentActivity.sort((a, b) => (b.time || b.timestamp || '').localeCompare(a.time || a.timestamp || ''));
  recentActivity.splice(20);

  const result = {
    project,
    milestone: roadmapData.milestone,
    stages,
    recentActivity,
    todos,
    quickTasks,
    concerns,
    codebaseFreshness,
    lastActivity: state.lastActivity || null,
    autoState,
  };

  lastState = result;

  if (cacheChanged) {
    saveCache(cache);
  }

  return result;
}

function buildPhases(roadmapData, state, needs, isFullParse) {
  const allPhaseDirsChanged = needs.changedPhaseDirs.has('__ALL__');

  if (isFullParse || allPhaseDirsChanged || needs.roadmap) {
    const result = parsePhases(activePlanningDir, roadmapData.phases, state);

    for (const phase of result.phases) {
      if (phase.status === 'complete' && phase.tasks) {
        cache.completedPhases[phase.number] = {
          tasks: phase.tasks,
          goal: phase.goal,
          name: phase.name,
          status: phase.status,
        };
      }
    }

    console.log('  [cache] Re-parsed all phases');
    return result;
  }

  if (needs.changedPhaseDirs.size === 0 && lastState) {
    console.log('  [cache] Phases unchanged, using cached data');
    return { phases: lastState.stages || [], completionEvents: lastCompletionEvents };
  }

  const result = parsePhases(activePlanningDir, roadmapData.phases, state);

  for (const phase of result.phases) {
    if (phase.status === 'complete' && phase.tasks) {
      cache.completedPhases[phase.number] = {
        tasks: phase.tasks,
        goal: phase.goal,
        name: phase.name,
        status: phase.status,
      };
    }
  }

  const changedList = Array.from(needs.changedPhaseDirs).join(', ');
  console.log(`  [cache] Re-parsed phases (changed: ${changedList})`);

  return result;
}

// ---------------------------------------------------------------------------
// Serve index.html
// ---------------------------------------------------------------------------
const indexPath = path.join(__dirname, 'index.html');

function serveIndex(res) {
  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error: index.html not found. Re-scaffold with /tracker.');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
}

// ---------------------------------------------------------------------------
// API: /api/state — returns { projects, active, autoJobs }
// ---------------------------------------------------------------------------
function serveState(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const projectParam = url.searchParams.get('project');

    // Refresh sidebar projects list
    refreshProjectsList();

    // Switch active project if requested
    if (projectParam && projectParam !== activeProjectPath) {
      switchActiveProject(projectParam);
    }

    // Build/refresh active project state
    let activeData = null;
    if (activePlanningDir && fs.existsSync(activePlanningDir)) {
      const newMtimes = scanMtimes(activePlanningDir);
      const changedFiles = getChangedFiles(cache.mtimes, newMtimes);
      cache.mtimes = newMtimes;

      if (changedFiles.size > 0 || !lastState) {
        activeData = buildState(changedFiles.size > 0 ? changedFiles : null);
      } else {
        activeData = lastState;
      }
    }

    const response = {
      projects: projectsList,
      active: activeData,
      autoJobs: projectsList.filter(p => p.autoState && p.autoState.active),
    };

    const json = JSON.stringify(response);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    });
    res.end(json);
  } catch (err) {
    console.error('  Error building state:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// ---------------------------------------------------------------------------
// API: /api/activity — returns recent activity (stub for now)
// ---------------------------------------------------------------------------
function serveActivity(res) {
  const activities = lastState ? (lastState.recentActivity || []) : [];
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  });
  res.end(JSON.stringify(activities));
}

// ---------------------------------------------------------------------------
// API: /api/events (SSE) — watches active project + registry for changes
// ---------------------------------------------------------------------------

// Track all active SSE connections for broadcasting
const sseClients = new Set();
const projectWatchers = new Map(); // path -> watcher

function setupProjectWatcher(projectPath) {
  const planDir = path.join(projectPath, '.planning');
  if (!fs.existsSync(planDir) || projectWatchers.has(projectPath)) return;

  let debounceTimer = null;
  try {
    const watcher = fs.watch(planDir, { recursive: true }, () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        // Refresh the changed project's summary
        refreshAllSummaries();

        // If this is the active project, rebuild its full state
        if (projectPath === activeProjectPath && activePlanningDir) {
          try {
            const newMtimes = scanMtimes(activePlanningDir);
            const changedFiles = getChangedFiles(cache.mtimes, newMtimes);
            if (changedFiles.size > 0) {
              cache.mtimes = newMtimes;
              console.log(`  [sse] ${changedFiles.size} file(s) changed in ${path.basename(projectPath)}`);
              buildState(changedFiles);
            }
          } catch {}
        }

        // Notify all SSE clients
        for (const client of sseClients) {
          try {
            client.write('event: refresh\ndata: {}\n\n');
          } catch {}
        }
      }, DEBOUNCE_MS);
    });
    projectWatchers.set(projectPath, { watcher, debounceTimer });

    // Also watch worktree .planning/ dirs if autoState references a different project_dir
    try {
      const autoState = readAutoState(planDir);
      if (autoState && autoState.project_dir && autoState.project_dir !== projectPath) {
        const worktreePath = autoState.project_dir;
        if (fs.existsSync(path.join(worktreePath, '.planning')) && !projectWatchers.has(worktreePath)) {
          setupProjectWatcher(worktreePath);
        }
      }
    } catch { /* worktree no longer exists — ignore */ }
  } catch (err) {
    console.error(`  Warning: Could not watch ${planDir}: ${err.message}`);
  }
}

function setupRegistryWatcher() {
  const registryDir = path.dirname(registryPath);
  if (!fs.existsSync(registryDir)) return;

  let debounceTimer = null;
  try {
    fs.watch(registryDir, (_eventType, filename) => {
      if (filename !== path.basename(registryPath)) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log('  [registry] Registry file changed, refreshing...');
        registryMtime = 0; // Force refresh
        refreshProjectsList();

        // Set up watchers for any new projects
        for (const p of projectsList) {
          setupProjectWatcher(p.path);
        }

        // Notify SSE clients
        for (const client of sseClients) {
          try {
            client.write('event: refresh\ndata: {}\n\n');
          } catch {}
        }
      }, DEBOUNCE_MS);
    });
  } catch (err) {
    console.error(`  Warning: Could not watch registry: ${err.message}`);
  }
}

function serveEvents(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  res.write(':connected\n\n');
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
}

// ---------------------------------------------------------------------------
// HTTP Server
// ---------------------------------------------------------------------------
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    return serveIndex(res);
  }

  if (req.method === 'GET' && pathname === '/api/state') {
    return serveState(req, res);
  }

  if (req.method === 'GET' && pathname === '/api/activity') {
    return serveActivity(res);
  }

  if (req.method === 'GET' && pathname === '/api/events') {
    return serveEvents(req, res);
  }

  // POST /api/register — register a project from auto skill or external tools
  if (req.method === 'POST' && pathname === '/api/register') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 8192) { req.destroy(); return; } // Prevent unbounded payloads
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        // Validate: path must be absolute and the directory must exist
        if (!data.path || !path.isAbsolute(data.path) || !fs.existsSync(data.path)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'path must be an absolute path to an existing directory' }));
          return;
        }
        autoRegisterProject(data.path);
        refreshProjectsList();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'invalid JSON' }));
      }
    });
    return;
  }

  // POST /api/kill — write .auto-kill sentinel to stop an active auto job
  if (req.method === 'POST' && pathname === '/api/kill') {
    if (!activePlanningDir) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No active project' }));
      return;
    }
    try {
      const killFile = path.join(activePlanningDir, '.auto-kill');
      fs.writeFileSync(killFile, new Date().toISOString(), 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

// ---------------------------------------------------------------------------
// Start with port fallback
// ---------------------------------------------------------------------------
function tryListen(port, attempt) {
  if (attempt > MAX_PORT_ATTEMPTS) {
    console.error(
      `\n  Error: Could not find an open port (tried ${BASE_PORT}-${BASE_PORT + MAX_PORT_ATTEMPTS - 1}).\n` +
      '  Close other services and try again.\n'
    );
    process.exit(1);
  }

  server.removeAllListeners('error');
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`  Port ${port} is busy, trying ${port + 1}...`);
      tryListen(port + 1, attempt + 1);
    } else {
      throw err;
    }
  });

  server.listen(port, '127.0.0.1', () => {
    // Clean dead entries before loading
    cleanRegistry();

    // Load registry and build projects list
    refreshProjectsList();

    // Auto-register CWD project if it has .planning/ but isn't in the registry
    const cwdPath = process.cwd();
    const cwdPlanningDir = path.resolve(cwdPath, '.planning');
    if (fs.existsSync(cwdPlanningDir)) {
      const inRegistry = projectsList.some(p => p.path === cwdPath);
      if (!inRegistry) {
        console.log(`  [startup] Auto-registering CWD project: ${path.basename(cwdPath)}`);
        autoRegisterProject(cwdPath);
        registryMtime = 0; // Force re-read
        refreshProjectsList();
      }
    }

    // Auto-discover conductor workspaces with .planning/ dirs
    const conductorBase = path.join(HOME, 'conductor', 'workspaces');
    if (fs.existsSync(conductorBase)) {
      try {
        const knownPaths = new Set(readRegistry().map(e => e.path));
        let discovered = 0;
        const repos = fs.readdirSync(conductorBase, { withFileTypes: true })
          .filter(d => d.isDirectory());
        for (const repo of repos) {
          const repoDir = path.join(conductorBase, repo.name);
          try {
            const worktrees = fs.readdirSync(repoDir, { withFileTypes: true })
              .filter(d => d.isDirectory());
            for (const wt of worktrees) {
              const wtPath = path.join(repoDir, wt.name);
              if (!knownPaths.has(wtPath) && fs.existsSync(path.join(wtPath, '.planning'))) {
                console.log(`  [startup] Auto-discovered conductor project: ${repo.name}/${wt.name}`);
                autoRegisterProject(wtPath);
                knownPaths.add(wtPath);
                discovered++;
              }
            }
          } catch { /* skip unreadable repo dirs */ }
        }
        if (discovered > 0) {
          registryMtime = 0;
          refreshProjectsList();
        }
      } catch { /* conductor dir unreadable — skip */ }
    }

    console.log(`  [startup] ${projectsList.length} registered project(s)`);

    // Auto-select CWD project if it has .planning/
    if (fs.existsSync(cwdPlanningDir)) {
      switchActiveProject(cwdPath);
    } else if (projectsList.length > 0) {
      // Auto-select first project that has .planning/
      const firstValid = projectsList.find(p => p.status !== 'pending' && p.status !== 'error');
      if (firstValid) {
        switchActiveProject(firstValid.path);
      }
    }

    // Set up file watchers for all registered projects
    for (const p of projectsList) {
      setupProjectWatcher(p.path);
    }
    setupRegistryWatcher();

    const watchingPaths = projectsList
      .filter(p => p.status !== 'pending')
      .map(p => `    ${p.name}: ${path.join(p.path, '.planning')}`);

    console.log(
      '\n  Project Tracker is running!\n\n' +
      `  Dashboard:  http://127.0.0.1:${port}\n` +
      `  API:        http://127.0.0.1:${port}/api/state\n` +
      `  Registry:   ${registryPath}\n` +
      `  Projects:   ${projectsList.length}\n` +
      (watchingPaths.length > 0
        ? `  Watching:\n${watchingPaths.join('\n')}\n`
        : '  Watching:   (no projects with .planning/ found)\n') +
      '\n  Press Ctrl+C to stop.\n'
    );
  });
}

tryListen(BASE_PORT, 1);
