#!/usr/bin/env node
// Global Reconcile — Discover all projects using fhhs-skills and reconcile each.
//
// Usage:
//   node global-reconcile.cjs --from <version> --to <version> --changelog-file <path>
//
// Discovery sources (deduplicated):
//   1. ~/.claude/tracker/projects.json (tracker registry)
//   2. Conductor workspaces scan (~/conductor/workspaces)
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
// Output: JSON report with per-project results.

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

// ─── Project discovery ───────────────────────────────────────────────────────

function discoverProjects() {
  const seen = new Set();
  const projects = [];

  function addProject(projectPath, source) {
    const normalized = path.resolve(projectPath);
    if (seen.has(normalized)) return;
    if (!fs.existsSync(normalized)) return;
    seen.add(normalized);

    // Detect Conductor workspace
    const conductorMatch = normalized.match(/\/conductor\/workspaces\/([^/]+)\/([^/]+)/);
    const isConductor = !!conductorMatch;
    const conductorWorkspace = conductorMatch ? conductorMatch[1] : null;
    const hasPlanning = fs.existsSync(path.join(normalized, '.planning'));

    // Check for .claude/settings.json (indicates fhhs-skills was set up here)
    const hasClaudeSettings = fs.existsSync(path.join(normalized, '.claude', 'settings.json'));

    projects.push({
      path: normalized,
      name: path.basename(normalized),
      source,
      isConductor,
      conductorWorkspace,
      hasPlanning,
      hasClaudeSettings,
    });
  }

  // Source 1: Tracker registry
  const registryPath = path.join(os.homedir(), '.claude', 'tracker', 'projects.json');
  try {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    if (Array.isArray(registry)) {
      for (const entry of registry) {
        if (entry.path) addProject(entry.path, 'tracker');
      }
    }
  } catch {
    // No registry or parse error — continue with other sources
  }

  // Source 2: Conductor workspaces scan
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
              // Only add if it has .planning or .claude (evidence of fhhs-skills usage)
              if (fs.existsSync(path.join(wsDir, '.planning')) ||
                  fs.existsSync(path.join(wsDir, '.claude', 'settings.json'))) {
                addProject(wsDir, 'conductor-scan');
              }
            } catch {
              // Bad entry (symlink loop, permission error) — skip, continue scanning
            }
          }
        } catch {
          // Bad repo dir — skip, continue scanning
        }
      }
    }
  } catch {
    // Conductor dir doesn't exist or not readable — skip
  }

  return projects;
}

// ─── Per-project reconciliation ──────────────────────────────────────────────

function reconcileProject(project) {
  const result = {
    path: project.path,
    name: project.name,
    isConductor: project.isConductor,
    conductorWorkspace: project.conductorWorkspace,
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
    conductorWorkspace: project.conductorWorkspace,
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
        fromTracker: projects.filter(p => p.source === 'tracker').length,
        fromScan: projects.filter(p => p.source === 'conductor-scan').length,
        withPlanning: projects.filter(p => p.hasPlanning).length,
      },
      projects: scans,
    };
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  const results = [];
  for (const project of projects) {
    results.push(reconcileProject(project));
  }

  // Build summary
  const okCount = results.filter(r => r.status === 'ok').length;
  const partialCount = results.filter(r => r.status === 'partial').length;
  const totalRepairs = results.reduce((sum, r) => {
    const repairs = r.steps.healthRepair?.repairsPerformed?.length || 0;
    return sum + repairs;
  }, 0);
  const totalMissing = results.reduce((sum, r) => {
    return sum + (r.steps.changelogReconcile?.missingCount || 0);
  }, 0);

  const report = {
    discovery: {
      total: projects.length,
      fromTracker: projects.filter(p => p.source === 'tracker').length,
      fromScan: projects.filter(p => p.source === 'conductor-scan').length,
      withPlanning: projects.filter(p => p.hasPlanning).length,
    },
    results,
    summary: {
      total: results.length,
      ok: okCount,
      partial: partialCount,
      totalRepairs,
      totalEnvGaps: totalMissing,
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

main();
