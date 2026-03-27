'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import parse functions from parser.
// Individual exports are added by the parser-v2 enhancement (parallel task).
// Fall back to parsePlanning-based wrappers if individual exports aren't available yet.
const parser = require('./parser.cjs');
const { handleMetrics } = require('./metrics.cjs');

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
const parseAutoState = parser.parseAutoState || (() => null);
const parseDecisions = parser.parseDecisions || (() => []);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const BASE_PORT = 3847;
const MAX_PORT_ATTEMPTS = 3;
const DEBOUNCE_MS = 300;
const CACHE_VERSION = 1;
const INACTIVE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------
const REGISTRY_PATH = path.join(os.homedir(), '.claude', 'tracker', 'projects.json');
const REGISTRY_LOCK_PATH = REGISTRY_PATH + '.lock';

/**
 * Load registry from disk, filter to entries whose paths exist, return array.
 */
function loadRegistry() {
  try {
    const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(entry => entry && entry.path && fs.existsSync(entry.path));
  } catch {
    return [];
  }
}

/**
 * Atomic write: write to .tmp, rename to final path.
 */
function saveRegistry(projects) {
  try {
    const dir = path.dirname(REGISTRY_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = REGISTRY_PATH + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(projects, null, 2), 'utf8');
    fs.renameSync(tmpPath, REGISTRY_PATH);
  } catch (err) {
    console.error('  Warning: Could not save registry:', err.message);
  }
}

/**
 * Save registry with simple .lock file pattern — retry once after 500ms if locked,
 * proceed without lock on second failure (graceful degradation).
 */
function saveRegistryWithLock(projects) {
  function tryWrite() {
    try {
      // Try to create lock (exclusive)
      fs.writeFileSync(REGISTRY_LOCK_PATH, String(process.pid), { flag: 'wx' });
    } catch {
      // Lock exists — return false to signal we should retry
      return false;
    }
    try {
      saveRegistry(projects);
    } finally {
      try { fs.unlinkSync(REGISTRY_LOCK_PATH); } catch { /* ignore */ }
    }
    return true;
  }

  if (!tryWrite()) {
    // Retry once after 500ms
    setTimeout(() => {
      if (!tryWrite()) {
        // Graceful degradation: proceed without lock
        saveRegistry(projects);
      }
    }, 500);
  }
}

/**
 * Register a project. Add if not present; update lastSeen if present.
 * Returns updated registry array.
 */
function registerProject(projectPath, name, extra) {
  const projects = loadRegistry();
  const now = new Date().toISOString();
  const existing = projects.find(p => p.path === projectPath);
  if (existing) {
    existing.lastSeen = now;
    if (name) existing.name = name;
    if (extra) Object.assign(existing, extra);
  } else {
    const entry = { path: projectPath, name: name || path.basename(projectPath), lastSeen: now };
    if (extra) Object.assign(entry, extra);
    projects.push(entry);
  }
  saveRegistryWithLock(projects);
  return projects;
}

// ---------------------------------------------------------------------------
// Conductor Auto-Discovery
// ---------------------------------------------------------------------------

/**
 * Discover projects under ~/conductor/workspaces/{repo}/{worktree}/.planning/
 * Auto-register each with conductorWorkspace: repoName.
 */
function discoverConductorProjects() {
  const conductorBase = path.join(os.homedir(), 'conductor', 'workspaces');
  if (!fs.existsSync(conductorBase)) return;

  let repos;
  try {
    repos = fs.readdirSync(conductorBase, { withFileTypes: true });
  } catch {
    return;
  }

  for (const repoEntry of repos) {
    if (!repoEntry.isDirectory()) continue;
    const repoName = repoEntry.name;
    const repoDir = path.join(conductorBase, repoName);

    let worktrees;
    try {
      worktrees = fs.readdirSync(repoDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const worktreeEntry of worktrees) {
      if (!worktreeEntry.isDirectory()) continue;
      const worktreeName = worktreeEntry.name;
      const projectPath = path.join(repoDir, worktreeName);
      const planningPath = path.join(projectPath, '.planning');

      if (fs.existsSync(planningPath)) {
        const name = `${repoName}/${worktreeName}`;
        registerProject(projectPath, name, { conductorWorkspace: repoName });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Per-project state
// ---------------------------------------------------------------------------

/**
 * Create per-project state container.
 */
function createProjectState(projectPath) {
  const planningDir = path.join(projectPath, '.planning');
  const cacheDir = path.join(projectPath, '.project-tracker');
  const cachePath = path.join(cacheDir, 'cache.json');

  return {
    projectPath,
    planningDir,
    cacheDir,
    cachePath,
    cache: null,       // loaded lazily
    lastState: null,
    lastCompletionEvents: [],
    lastRetros: [],
    debounceTimer: null,
  };
}

// Map of projectPath → projectState
const projectStates = new Map();
// Map of projectPath → fs.FSWatcher
const watchers = new Map();

/**
 * Get or create project state for a path.
 */
function getProjectState(projectPath) {
  if (!projectStates.has(projectPath)) {
    projectStates.set(projectPath, createProjectState(projectPath));
  }
  return projectStates.get(projectPath);
}

// ---------------------------------------------------------------------------
// Cache Management (per-project)
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

function loadCache(ps) {
  try {
    const raw = fs.readFileSync(ps.cachePath, 'utf8');
    const data = JSON.parse(raw);
    if (data && data.version === CACHE_VERSION) {
      return data;
    }
  } catch {
    // Missing or corrupt — start fresh
  }
  return emptyCache();
}

function saveCache(ps) {
  try {
    if (!fs.existsSync(ps.cacheDir)) {
      fs.mkdirSync(ps.cacheDir, { recursive: true });
    }
    fs.writeFileSync(ps.cachePath, JSON.stringify(ps.cache, null, 2), 'utf8');
  } catch (err) {
    console.error('  Warning: Could not save cache:', err.message);
  }
}

function ensureCache(ps) {
  if (!ps.cache) {
    ps.cache = loadCache(ps);
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
    autoState: false,
    decisions: false,
    changedPhaseDirs: new Set(),
  };

  for (const filePath of changedFiles) {
    const parts = filePath.split(path.sep);

    if (parts[0] === '.auto-state.json') {
      needs.autoState = true;
    } else if (parts[0] === 'DECISIONS.md') {
      needs.decisions = true;
    } else if (parts[0] === 'STATE.md') {
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
    }
  }

  return needs;
}

/**
 * Build the full state for a project, using tiered re-parsing based on changed files.
 */
function buildState(ps, changedFiles) {
  ensureCache(ps);
  const { planningDir } = ps;
  const isFullParse = !ps.lastState || !changedFiles;

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
    ? parseState(planningDir)
    : (ps.lastState ? { currentPhase: ps.lastState.stages?.find(s => s.status === 'active')?.number, lastActivity: ps.lastState.lastActivity } : parseState(planningDir));

  const todos = (needs.todos || isFullParse)
    ? parseTodos(planningDir)
    : (ps.lastState ? ps.lastState.todos : parseTodos(planningDir));

  let retros;
  if (needs.retros || isFullParse) {
    retros = parseRetros(planningDir);
    ps.lastRetros = retros;
  } else {
    retros = ps.lastRetros;
  }

  let project;
  if (needs.project || isFullParse) {
    project = parseProject(planningDir);
    ps.cache.project = project;
    cacheChanged = true;
    console.log('  [cache] Re-parsed PROJECT.md');
  } else {
    project = ps.cache.project && Object.keys(ps.cache.project).length > 0
      ? ps.cache.project
      : parseProject(planningDir);
  }

  let roadmapData;
  if (needs.roadmap || isFullParse) {
    roadmapData = parseRoadmap(planningDir);
    ps.cache.roadmap = roadmapData;
    cacheChanged = true;
    console.log('  [cache] Re-parsed ROADMAP.md');
  } else {
    roadmapData = ps.cache.roadmap && ps.cache.roadmap.phases
      ? ps.cache.roadmap
      : parseRoadmap(planningDir);
  }

  let concerns;
  if (needs.concerns || isFullParse) {
    try {
      concerns = parseConcerns(planningDir);
    } catch {
      concerns = { categories: [], totalCount: 0 };
    }
    ps.cache.concerns = concerns;
    cacheChanged = true;
    console.log('  [cache] Re-parsed CONCERNS.md');
  } else {
    concerns = ps.cache.concerns && Object.keys(ps.cache.concerns).length > 0
      ? ps.cache.concerns
      : { categories: [], totalCount: 0 };
  }

  let codebaseFreshness;
  if (needs.codebaseFreshness || isFullParse) {
    try {
      codebaseFreshness = parseCodebaseFreshness(planningDir) || { lastUpdated: null, isStale: false };
    } catch {
      codebaseFreshness = { lastUpdated: null, isStale: false };
    }
    ps.cache.codebaseFreshness = codebaseFreshness;
    cacheChanged = true;
    console.log('  [cache] Re-parsed codebase freshness');
  } else {
    codebaseFreshness = ps.cache.codebaseFreshness && Object.keys(ps.cache.codebaseFreshness).length > 0
      ? ps.cache.codebaseFreshness
      : { lastUpdated: null, isStale: false };
  }

  const phaseResult = buildPhases(ps, planningDir, roadmapData, state, needs, isFullParse);
  const stages = phaseResult.phases;
  const completionEvents = phaseResult.completionEvents;
  ps.lastCompletionEvents = completionEvents;

  const autoState = parseAutoState(planningDir);

  let decisions;
  if (needs.decisions || isFullParse) {
    decisions = parseDecisions(planningDir);
    console.log('  [cache] Re-parsed DECISIONS.md');
  } else {
    decisions = ps.lastState ? ps.lastState.decisions : parseDecisions(planningDir);
  }

  let quickTasks;
  if (needs.quickTasks || isFullParse) {
    quickTasks = parseQuickTasks(planningDir);
    console.log('  [cache] Re-parsed quick tasks');
  } else {
    quickTasks = ps.lastState ? ps.lastState.quickTasks : parseQuickTasks(planningDir);
  }

  const recentActivity = retros.concat(completionEvents);
  recentActivity.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
  recentActivity.splice(10);

  const result = {
    project,
    milestone: roadmapData.milestone,
    stages,
    recentActivity,
    todos,
    quickTasks,
    concerns,
    codebaseFreshness,
    autoState,
    decisions,
    lastActivity: state.lastActivity || null,
  };

  ps.lastState = result;

  if (cacheChanged) {
    saveCache(ps);
  }

  return result;
}

function buildPhases(ps, planningDir, roadmapData, state, needs, isFullParse) {
  const allPhaseDirsChanged = needs.changedPhaseDirs.has('__ALL__');

  if (isFullParse || allPhaseDirsChanged || needs.roadmap) {
    const result = parsePhases(planningDir, roadmapData.phases, state);

    for (const phase of result.phases) {
      if (phase.status === 'complete' && phase.tasks) {
        ps.cache.completedPhases[phase.number] = {
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

  if (needs.changedPhaseDirs.size === 0 && ps.lastState) {
    console.log('  [cache] Phases unchanged, using cached data');
    return { phases: ps.lastState.stages || [], completionEvents: ps.lastCompletionEvents };
  }

  const result = parsePhases(planningDir, roadmapData.phases, state);

  for (const phase of result.phases) {
    if (phase.status === 'complete' && phase.tasks) {
      ps.cache.completedPhases[phase.number] = {
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
// Project summary (for /api/state projects array)
// ---------------------------------------------------------------------------

function buildProjectSummary(entry, ps) {
  const state = ps.lastState;
  const stages = state ? (state.stages || []) : [];
  const activeStage = stages.find(s => s.status === 'active');
  const completedStages = stages.filter(s => s.status === 'complete');
  const nextStage = activeStage || stages.find(s => s.status === 'up next');
  const totalPhases = stages.length;
  const completedPhases = completedStages.length;
  const progressPct = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;
  const nextItem = nextStage ? nextStage.goal || nextStage.name || null : null;
  const lastActivity = state ? (state.lastActivity || entry.lastSeen) : entry.lastSeen;

  return {
    id: entry.path,
    path: entry.path,
    name: state ? (state.project?.name || entry.name) : entry.name,
    lastSeen: entry.lastSeen,
    lastActivity: typeof lastActivity === 'object' ? lastActivity.date : lastActivity,
    conductorWorkspace: entry.conductorWorkspace || null,
    currentPhase: activeStage ? (activeStage.name || `Phase ${activeStage.number}`) : null,
    totalPhases,
    completedPhases,
    progressPct,
    nextItem,
    status: activeStage ? 'active' : (completedPhases === totalPhases && totalPhases > 0 ? 'complete' : 'unknown'),
  };
}

// ---------------------------------------------------------------------------
// Watcher setup
// ---------------------------------------------------------------------------

/**
 * Check if a project has had recent git activity (uses .planning/STATE.md mtime as proxy).
 */
function hasRecentActivity(projectPath) {
  const statePath = path.join(projectPath, '.planning', 'STATE.md');
  try {
    const stat = fs.statSync(statePath);
    return (Date.now() - stat.mtimeMs) < INACTIVE_THRESHOLD_MS;
  } catch {
    // If STATE.md doesn't exist, treat as active (new project)
    return true;
  }
}

/**
 * Set up a per-project watcher on its .planning/ directory.
 */
function setupWatcher(entry) {
  const { path: projectPath } = entry;
  if (watchers.has(projectPath)) return; // already watching

  const planDir = path.join(projectPath, '.planning');
  if (!fs.existsSync(planDir)) return;

  const ps = getProjectState(projectPath);

  let debounceTimer = null;
  let watcher;
  try {
    watcher = fs.watch(planDir, { recursive: true }, () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        try {
          ensureCache(ps);
          const newMtimes = scanMtimes(planDir);
          const changedFiles = getChangedFiles(ps.cache.mtimes, newMtimes);

          if (changedFiles.size === 0) return;

          ps.cache.mtimes = newMtimes;
          console.log(`  [sse] ${entry.name}: ${changedFiles.size} file(s) changed`);

          buildState(ps, changedFiles);

          // Broadcast to all SSE clients
          broadcastRefresh(projectPath);
        } catch {
          // Ignore watcher errors
        }
      }, DEBOUNCE_MS);
    });
  } catch (err) {
    console.error(`  Warning: Could not watch ${planDir}:`, err.message);
    return;
  }

  watchers.set(projectPath, { watcher, debounceTimer: null });
  console.log(`  [watch] Watching ${entry.name}`);
}

/**
 * Initialize watchers for all registered projects.
 * Skips projects with no git activity in 7 days (lazy optimization).
 */
function initializeWatchers() {
  const projects = loadRegistry();
  for (const entry of projects) {
    if (!fs.existsSync(entry.path)) continue;
    if (!hasRecentActivity(entry.path)) {
      console.log(`  [watch] Skipping inactive project: ${entry.name}`);
      continue;
    }
    setupWatcher(entry);
  }
}

/**
 * Initialize per-project state (cache + initial parse) for active watchers.
 */
function initializeProjectStates() {
  const projects = loadRegistry();
  for (const entry of projects) {
    if (!watchers.has(entry.path)) continue;
    const ps = getProjectState(entry.path);
    ensureCache(ps);
    ps.cache.mtimes = scanMtimes(ps.planningDir);
    try {
      buildState(ps, null);
      console.log(`  [cache] Initial state built for: ${entry.name}`);
    } catch (err) {
      console.error(`  Warning: Could not build initial state for ${entry.name}:`, err.message);
    }
  }
}

// ---------------------------------------------------------------------------
// SSE clients
// ---------------------------------------------------------------------------
const sseClients = new Set();

function broadcastRefresh(projectId) {
  const payload = `event: refresh\ndata: ${JSON.stringify({ projectId })}\n\n`;
  for (const res of sseClients) {
    try { res.write(payload); } catch { /* client disconnected */ }
  }
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
// API: /api/state  (dual-shape)
// ---------------------------------------------------------------------------
function serveState(res, requestedProjectId) {
  try {
    const projects = loadRegistry();

    // Build summaries for all registered projects
    const summaries = projects.map(entry => {
      const ps = projectStates.get(entry.path);
      return buildProjectSummary(entry, ps || { lastState: null });
    });

    // Active project: requested project, or first with a watcher, or first in registry
    let activeState = null;
    const targetEntries = requestedProjectId
      ? projects.filter(e => e.path === requestedProjectId)
      : projects;

    for (const entry of targetEntries) {
      const ps = projectStates.get(entry.path);
      if (ps && ps.lastState) {
        activeState = ps.lastState;
        break;
      }
    }

    const json = JSON.stringify({ projects: summaries, active: activeState });
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
// API: /api/register
// ---------------------------------------------------------------------------
function serveRegister(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const { path: projectPath, name } = JSON.parse(body);
      if (!projectPath) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'path is required' }));
        return;
      }
      registerProject(projectPath, name);
      // Set up watcher for the new project if path exists
      const projects = loadRegistry();
      const entry = projects.find(p => p.path === projectPath);
      if (entry && fs.existsSync(projectPath)) {
        setupWatcher(entry);
        const ps = getProjectState(projectPath);
        ensureCache(ps);
        ps.cache.mtimes = scanMtimes(ps.planningDir);
        try { buildState(ps, null); } catch { /* ignore parse errors for new project */ }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

// ---------------------------------------------------------------------------
// API: /api/metrics  (delegates to metrics.cjs)
// ---------------------------------------------------------------------------
function serveMetrics(res) {
  const projects = loadRegistry();
  handleMetrics(projects, res);
}

// ---------------------------------------------------------------------------
// API: /api/events (SSE)
// ---------------------------------------------------------------------------
function serveEvents(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send initial comment to establish connection
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
    return serveState(res, url.searchParams.get('project') || null);
  }

  if (req.method === 'POST' && pathname === '/api/register') {
    return serveRegister(req, res);
  }

  if (req.method === 'GET' && pathname === '/api/metrics') {
    return serveMetrics(res);
  }

  if (req.method === 'GET' && pathname === '/api/events') {
    return serveEvents(req, res);
  }

  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

// ---------------------------------------------------------------------------
// Start with port fallback + EADDRINUSE graceful handling
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
      // Check if an existing tracker server is already running on this port
      const existingUrl = `http://127.0.0.1:${port}/api/state`;
      http.get(existingUrl, (probeRes) => {
        if (probeRes.statusCode === 200) {
          console.log(`\n  Project Tracker is already running at http://127.0.0.1:${port}\n`);
          process.exit(0);
        } else {
          console.log(`  Port ${port} is busy, trying ${port + 1}...`);
          tryListen(port + 1, attempt + 1);
        }
        probeRes.resume(); // drain response
      }).on('error', () => {
        // Port is busy but not our server — try next port
        console.log(`  Port ${port} is busy, trying ${port + 1}...`);
        tryListen(port + 1, attempt + 1);
      });
    } else {
      throw err;
    }
  });

  server.listen(port, '127.0.0.1', () => {
    console.log('  [startup] Discovering Conductor worktrees...');
    discoverConductorProjects();

    const projects = loadRegistry();
    console.log(`  [startup] Registry: ${projects.length} project(s) registered`);

    console.log('  [startup] Initializing watchers...');
    initializeWatchers();

    console.log('  [startup] Building initial project states...');
    initializeProjectStates();

    console.log(
      '\n  Project Tracker is running!\n\n' +
      `  Dashboard:  http://127.0.0.1:${port}\n` +
      `  API:        http://127.0.0.1:${port}/api/state\n` +
      `  Registry:   ${REGISTRY_PATH}\n\n` +
      '  Press Ctrl+C to stop.\n'
    );
  });
}

tryListen(BASE_PORT, 1);
