'use strict';

const { execFile } = require('child_process');

// ---------------------------------------------------------------------------
// In-memory cache for metrics results (30s TTL)
// ---------------------------------------------------------------------------
let metricsCache = null;
let metricsCacheExpiry = 0;
const METRICS_CACHE_TTL_MS = 30_000;

/**
 * Run `git log --since=midnight --format="%H" --shortstat` for a project path.
 * Returns { commits, files, lines } — all zeros on any failure.
 *
 * @param {string} projectPath - Absolute path to the git repository
 * @returns {Promise<{commits: number, files: number, lines: number}>}
 */
function getProjectMetrics(projectPath) {
  return new Promise((resolve) => {
    // --shortstat emits a summary line like:
    //   3 files changed, 42 insertions(+), 7 deletions(-)
    // We use %H as separator lines so we can count commits.
    execFile(
      'git',
      ['-C', projectPath, 'log', '--since=midnight', '--format=%H', '--shortstat'],
      { timeout: 8_000 },
      (err, stdout) => {
        if (err) {
          // Not a git repo, git not found, or other failure — return zeros
          resolve({ commits: 0, files: 0, lines: 0 });
          return;
        }

        let commits = 0;
        let files = 0;
        let lines = 0;

        // Each commit appears as:
        //   <sha>
        //
        //   N files changed, N insertions(+), N deletions(-)
        //
        // (shortstat line may be absent for empty commits)
        for (const line of stdout.split('\n')) {
          const trimmed = line.trim();

          // SHA line — 40 hex chars
          if (/^[0-9a-f]{40}$/.test(trimmed)) {
            commits++;
            continue;
          }

          // Shortstat summary line
          if (trimmed.includes('file') && trimmed.includes('changed')) {
            const filesMatch = trimmed.match(/(\d+)\s+file/);
            const insertMatch = trimmed.match(/(\d+)\s+insertion/);
            const deleteMatch = trimmed.match(/(\d+)\s+deletion/);
            if (filesMatch) files += parseInt(filesMatch[1], 10);
            if (insertMatch) lines += parseInt(insertMatch[1], 10);
            if (deleteMatch) lines += parseInt(deleteMatch[1], 10);
          }
        }

        resolve({ commits, files, lines });
      }
    );
  });
}

/**
 * Handle GET /api/metrics
 *
 * Accepts a `registeredProjects` array — each entry must have `{ name, path }`.
 * Returns JSON: { projects: [...], totals: { commits, files, lines }, cachedAt }
 *
 * @param {Array<{name: string, path: string}>} registeredProjects
 * @param {import('http').ServerResponse} res
 */
async function handleMetrics(registeredProjects, res) {
  try {
    const now = Date.now();

    // Serve from cache if fresh
    if (metricsCache && now < metricsCacheExpiry) {
      const json = JSON.stringify(metricsCache);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      });
      res.end(json);
      return;
    }

    // Filter to projects that have a path
    const validProjects = (registeredProjects || []).filter(
      (p) => p && typeof p.path === 'string' && p.path.length > 0
    );

    // Fetch metrics for all projects in parallel
    const results = await Promise.all(
      validProjects.map(async (project) => {
        const metrics = await getProjectMetrics(project.path);
        return {
          name: project.name || project.path,
          path: project.path,
          commits: metrics.commits,
          files: metrics.files,
          lines: metrics.lines,
        };
      })
    );

    // Aggregate totals
    const totals = results.reduce(
      (acc, r) => ({
        commits: acc.commits + r.commits,
        files: acc.files + r.files,
        lines: acc.lines + r.lines,
      }),
      { commits: 0, files: 0, lines: 0 }
    );

    const payload = {
      projects: results,
      totals,
      projectCount: results.length,
      cachedAt: now,
    };

    // Store in cache
    metricsCache = payload;
    metricsCacheExpiry = now + METRICS_CACHE_TTL_MS;

    const json = JSON.stringify(payload);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    });
    res.end(json);
  } catch (err) {
    console.error('  Error computing metrics:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

module.exports = { handleMetrics };
