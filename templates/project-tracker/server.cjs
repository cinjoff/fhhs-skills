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

// Resolve .planning/ relative to CWD (user's project root)
const planningDir = path.resolve(process.cwd(), '.planning');
const cacheDir = path.resolve(process.cwd(), '.project-tracker');
const cachePath = path.join(cacheDir, 'cache.json');

// ---------------------------------------------------------------------------
// Startup validation
// ---------------------------------------------------------------------------
if (!fs.existsSync(planningDir)) {
  console.error(
    '\n  Error: No .planning/ directory found in the current directory.\n\n' +
    '  The project tracker needs a .planning/ directory to read project data.\n' +
    '  Make sure you run this server from your project root.\n\n' +
    '  Expected: ' + planningDir + '\n'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Cache Management
// ---------------------------------------------------------------------------

/**
 * Create an empty cache structure.
 */
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

/**
 * Load cache from disk, returning empty cache if missing or invalid.
 */
function loadCache() {
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

/**
 * Save cache to disk.
 */
function saveCache(cache) {
  try {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
  } catch (err) {
    console.error('  Warning: Could not save cache:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Mtime Scanning
// ---------------------------------------------------------------------------

/**
 * Walk a directory recursively, returning a map of relative paths → mtimeMs.
 */
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

/**
 * Compare old and new mtime maps.
 * Returns a Set of relative paths that are new, changed, or deleted.
 */
function getChangedFiles(oldMtimes, newMtimes) {
  const changed = new Set();

  // Check new/changed files
  for (const [filePath, mtime] of Object.entries(newMtimes)) {
    if (!oldMtimes[filePath] || oldMtimes[filePath] !== mtime) {
      changed.add(filePath);
    }
  }

  // Check deleted files
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

/**
 * Determine which data categories need re-parsing based on changed files.
 */
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
    changedPhaseDirs: new Set(), // Set of phase dir names that need re-parse
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
      // milestones/{milestone-name}/{phase-dir}/... → treat as phase change
      needs.changedPhaseDirs.add(parts[2]);
    }
  }

  return needs;
}

// In-memory state cache (latest computed result)
let cache = loadCache();
let lastState = null;
let lastCompletionEvents = []; // Stored separately to avoid heuristic reconstruction
let lastRetros = [];

/**
 * Build the full state, using tiered re-parsing based on changed files.
 * On first call (no previous state), parses everything.
 * On subsequent calls, only re-parses what changed.
 *
 * @param {Set|null} changedFiles - Set of changed file paths, or null for full parse
 * @returns {object} The full state object
 */
function buildState(changedFiles) {
  const isFullParse = !lastState || !changedFiles;

  let needs;
  if (isFullParse) {
    // Parse everything on first call
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

  // --- STATE.md, pending todos, retros: re-parse only when changed ---
  const state = (needs.state || isFullParse)
    ? parseState(planningDir)
    : (lastState ? { currentPhase: lastState.stages?.find(s => s.status === 'active')?.number, lastActivity: lastState.lastActivity } : parseState(planningDir));

  const todos = (needs.todos || isFullParse)
    ? parseTodos(planningDir)
    : (lastState ? lastState.todos : parseTodos(planningDir));

  let retros;
  if (needs.retros || isFullParse) {
    retros = parseRetros(planningDir);
    lastRetros = retros;
  } else {
    retros = lastRetros;
  }

  // --- Re-parse if mtime changed: PROJECT.md ---
  let project;
  if (needs.project || isFullParse) {
    project = parseProject(planningDir);
    cache.project = project;
    cacheChanged = true;
    console.log('  [cache] Re-parsed PROJECT.md');
  } else {
    project = cache.project && Object.keys(cache.project).length > 0
      ? cache.project
      : parseProject(planningDir);
  }

  // --- Re-parse if mtime changed: ROADMAP.md ---
  let roadmapData;
  if (needs.roadmap || isFullParse) {
    roadmapData = parseRoadmap(planningDir);
    cache.roadmap = roadmapData;
    cacheChanged = true;
    console.log('  [cache] Re-parsed ROADMAP.md');
  } else {
    roadmapData = cache.roadmap && cache.roadmap.phases
      ? cache.roadmap
      : parseRoadmap(planningDir);
  }

  // --- Re-parse if mtime changed: codebase/CONCERNS.md ---
  let concerns;
  if (needs.concerns || isFullParse) {
    try {
      concerns = parseConcerns(planningDir);
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

  // --- Re-parse if mtime changed: codebase freshness ---
  let codebaseFreshness;
  if (needs.codebaseFreshness || isFullParse) {
    try {
      codebaseFreshness = parseCodebaseFreshness(planningDir) || { lastUpdated: null, isStale: false };
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

  // --- Phases: cache completed, re-parse only changed ---
  const phaseResult = buildPhases(
    planningDir, roadmapData, state, needs, isFullParse
  );
  const stages = phaseResult.phases;
  const completionEvents = phaseResult.completionEvents;
  lastCompletionEvents = completionEvents;

  // Quick tasks
  let quickTasks;
  if (needs.quickTasks || isFullParse) {
    quickTasks = parseQuickTasks(planningDir);
    console.log('  [cache] Re-parsed quick tasks');
  } else {
    quickTasks = lastState ? lastState.quickTasks : parseQuickTasks(planningDir);
  }

  // Recent activity: retros + completion events
  const recentActivity = retros.concat(completionEvents);
  recentActivity.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
  recentActivity.splice(10);

  // Assemble final state
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
  };

  // Update caches
  lastState = result;

  if (cacheChanged) {
    saveCache(cache);
  }

  return result;
}

/**
 * Build phases with caching for completed phases.
 * Only re-parses phases whose directories have changed files.
 */
function buildPhases(planningDir, roadmapData, state, needs, isFullParse) {
  const allPhaseDirsChanged = needs.changedPhaseDirs.has('__ALL__');

  // Get the full phases result from parsePhases
  // But we can optimize: if no phase dirs changed and we have cached completed phases,
  // we can potentially skip re-parsing completed phases.

  if (isFullParse || allPhaseDirsChanged || needs.roadmap) {
    // Full parse of all phases
    const result = parsePhases(planningDir, roadmapData.phases, state);

    // Cache completed phases
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

  // No phase files changed — reuse last state's phases
  if (needs.changedPhaseDirs.size === 0 && lastState) {
    console.log('  [cache] Phases unchanged, using cached data');
    return { phases: lastState.stages || [], completionEvents: lastCompletionEvents };
  }

  // Some phases changed — do a full re-parse but cache the results
  // (A partial re-parse would require splitting parsePhases, which adds complexity
  //  for marginal benefit since phase parsing is already fast)
  const result = parsePhases(planningDir, roadmapData.phases, state);

  // Update completed phases cache
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
// API: /api/state
// ---------------------------------------------------------------------------
function serveState(res) {
  try {
    const newMtimes = scanMtimes(planningDir);
    const changedFiles = getChangedFiles(cache.mtimes, newMtimes);
    cache.mtimes = newMtimes;

    let data;
    if (changedFiles.size > 0 || !lastState) {
      // Files changed or no previous state — rebuild
      data = buildState(changedFiles.size > 0 ? changedFiles : null);
    } else {
      // No changes — serve cached state
      data = lastState;
    }

    const json = JSON.stringify(data);
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

  let debounceTimer = null;

  // NOTE: { recursive: true } only works on macOS and Windows.
  // On Linux, only top-level .planning/ changes will trigger updates.
  const watcher = fs.watch(planningDir, { recursive: true }, () => {
    // Debounce rapid file changes
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try {
        // Scan for changes and selectively rebuild
        const newMtimes = scanMtimes(planningDir);
        const changedFiles = getChangedFiles(cache.mtimes, newMtimes);

        if (changedFiles.size === 0) {
          return; // No actual file content changes
        }

        cache.mtimes = newMtimes;
        console.log(`  [sse] ${changedFiles.size} file(s) changed: ${Array.from(changedFiles).slice(0, 5).join(', ')}`);

        // Rebuild state selectively
        buildState(changedFiles);

        // Push refresh event to client
        res.write('event: refresh\ndata: {}\n\n');
      } catch {
        // Connection may have closed
      }
    }, DEBOUNCE_MS);
  });

  // Clean up on connection close
  req.on('close', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    watcher.close();
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
    return serveState(res);
  }

  if (req.method === 'GET' && pathname === '/api/events') {
    return serveEvents(req, res);
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
    // Do initial mtime scan and state build on startup
    console.log('  [cache] Initial state build...');
    cache.mtimes = scanMtimes(planningDir);
    buildState(null); // Full parse on startup

    console.log(
      '\n  Project Tracker is running!\n\n' +
      `  Dashboard:  http://127.0.0.1:${port}\n` +
      `  API:        http://127.0.0.1:${port}/api/state\n` +
      `  Watching:   ${planningDir}\n` +
      `  Cache:      ${cachePath}\n\n` +
      '  Press Ctrl+C to stop.\n'
    );
  });
}

tryListen(BASE_PORT, 1);
