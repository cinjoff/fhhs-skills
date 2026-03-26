#!/usr/bin/env node

/**
 * Auto-Orchestrator — Headless autonomous execution via claude -p
 *
 * Orchestrates the plan-work → plan-review → build → review loop
 * for each phase, using process-isolated claude -p sessions.
 *
 * Usage: node bin/auto-orchestrator.cjs [options]
 *
 *   --project-dir <path>    Project root (default: cwd)
 *   --start-phase <N>       First phase to execute (default: current from STATE.md)
 *   --end-phase <N>         Last phase to execute (default: last in ROADMAP.md)
 *   --budget <dollars>      Cost ceiling in dollars (optional)
 *   --dry-run               Show plan without executing
 *   --resume                Resume from last crash point
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ─── Argument Parsing ─────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    projectDir: process.cwd(),
    startPhase: null,
    endPhase: null,
    budget: null,
    dryRun: false,
    resume: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--project-dir':
        opts.projectDir = path.resolve(args[++i]);
        break;
      case '--start-phase':
        opts.startPhase = args[++i];
        break;
      case '--end-phase':
        opts.endPhase = args[++i];
        break;
      case '--budget':
        opts.budget = parseFloat(args[++i]);
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--resume':
        opts.resume = true;
        break;
      default:
        fatal(`Unknown argument: ${args[i]}`);
    }
  }

  if (!fs.existsSync(opts.projectDir) || !fs.statSync(opts.projectDir).isDirectory()) {
    fatal(`Invalid project directory: ${opts.projectDir}`);
  }

  return opts;
}

// ─── Logging ──────────────────────────────────────────────────────────────────

function timestamp() {
  return new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, 'Z');
}

function log(msg) {
  process.stdout.write(`[${timestamp()}] ${msg}\n`);
}

function fatal(msg) {
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(1);
}

// ─── STATE.md Parsing ─────────────────────────────────────────────────────────

function parseCurrentPhase(projectDir) {
  const statePath = path.join(projectDir, '.planning', 'STATE.md');
  if (!fs.existsSync(statePath)) return null;

  const content = fs.readFileSync(statePath, 'utf-8');
  const match = content.match(/current_phase:\s*Phase\s+(\S+)/i);
  if (match) return match[1];

  // Fallback: look in body
  const bodyMatch = content.match(/\*\*Current phase:\*\*\s*Phase\s+(\S+)/i);
  return bodyMatch ? bodyMatch[1] : null;
}

// ─── ROADMAP.md Parsing ──────────────────────────────────────────────────────

function parseRoadmapPhases(projectDir) {
  const roadmapPath = path.join(projectDir, '.planning', 'ROADMAP.md');
  if (!fs.existsSync(roadmapPath)) return [];

  const content = fs.readFileSync(roadmapPath, 'utf-8');
  const phases = [];
  const pattern = /#{2,4}\s*Phase\s+(\S+?):\s*([^\n]+)/gi;
  let m;
  while ((m = pattern.exec(content)) !== null) {
    phases.push({
      id: m[1],
      name: m[2].trim(),
    });
  }
  return phases;
}

function comparePhaseNum(a, b) {
  const pa = String(a).match(/^(\d+)([A-Z]?)((?:\.\d+)*)/i);
  const pb = String(b).match(/^(\d+)([A-Z]?)((?:\.\d+)*)/i);
  if (!pa || !pb) return String(a).localeCompare(String(b));

  const intDiff = parseInt(pa[1], 10) - parseInt(pb[1], 10);
  if (intDiff !== 0) return intDiff;

  const la = (pa[2] || '').toUpperCase();
  const lb = (pb[2] || '').toUpperCase();
  if (la !== lb) {
    if (!la) return -1;
    if (!lb) return 1;
    return la < lb ? -1 : 1;
  }

  const aDecParts = pa[3] ? pa[3].slice(1).split('.').map(Number) : [];
  const bDecParts = pb[3] ? pb[3].slice(1).split('.').map(Number) : [];
  const maxLen = Math.max(aDecParts.length, bDecParts.length);
  if (aDecParts.length === 0 && bDecParts.length > 0) return -1;
  if (bDecParts.length === 0 && aDecParts.length > 0) return 1;
  for (let i = 0; i < maxLen; i++) {
    const av = Number.isFinite(aDecParts[i]) ? aDecParts[i] : 0;
    const bv = Number.isFinite(bDecParts[i]) ? bDecParts[i] : 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

// ─── Phase Directory Discovery ────────────────────────────────────────────────

function normalizePhaseName(phase) {
  const match = String(phase).match(/^(\d+)([A-Z])?((?:\.\d+)*)/i);
  if (!match) return phase;
  return match[1].padStart(2, '0') + (match[2] ? match[2].toUpperCase() : '') + (match[3] || '');
}

function findPhaseDir(projectDir, phaseId) {
  const phasesDir = path.join(projectDir, '.planning', 'phases');
  if (!fs.existsSync(phasesDir)) return null;

  const normalized = normalizePhaseName(phaseId);
  const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
  const match = entries.find(e => e.isDirectory() && e.name.startsWith(normalized));
  return match ? path.join(phasesDir, match.name) : null;
}

function findLatestPlan(projectDir, phaseId) {
  const phaseDir = findPhaseDir(projectDir, phaseId);
  if (!phaseDir) return null;

  const files = fs.readdirSync(phaseDir);
  const plans = files.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').sort();
  if (plans.length === 0) return null;

  return path.join(phaseDir, plans[plans.length - 1]);
}

function summaryExists(planPath) {
  if (!planPath) return false;
  const summaryPath = planPath.replace('-PLAN.md', '-SUMMARY.md').replace('PLAN.md', 'SUMMARY.md');
  return fs.existsSync(summaryPath);
}

// ─── Auto-State (Crash Recovery) ──────────────────────────────────────────────

function autoStatePath(projectDir) {
  return path.join(projectDir, '.planning', '.auto-state.json');
}

function loadAutoState(projectDir) {
  const p = autoStatePath(projectDir);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

function saveAutoState(projectDir, state) {
  const p = autoStatePath(projectDir);
  fs.writeFileSync(p, JSON.stringify(state, null, 2), 'utf-8');
}

function clearAutoState(projectDir) {
  const p = autoStatePath(projectDir);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

// ─── Claude Session Runner ───────────────────────────────────────────────────

function runClaudeSession(prompt, opts) {
  return new Promise((resolve, reject) => {
    const args = ['-p', prompt, '--cwd', opts.cwd];
    log(`  Running: claude -p "${prompt}"`);

    const child = spawn('claude', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: opts.cwd,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('error', (err) => {
      reject(new Error(`Failed to spawn claude: ${err.message}`));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        const errMsg = `claude -p exited with code ${code}\nstderr: ${stderr.slice(0, 500)}`;
        reject(new Error(errMsg));
      } else {
        resolve({ stdout, stderr, exitCode: code });
      }
    });
  });
}

// ─── State Update via gsd-tools ──────────────────────────────────────────────

function updateStateViaGsd(projectDir, phaseId) {
  const gsdPath = path.join(__dirname, 'gsd-tools.cjs');
  const { execSync } = require('child_process');
  try {
    execSync(`node "${gsdPath}" phase complete ${phaseId} --cwd "${projectDir}"`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    log(`  STATE.md updated: phase ${phaseId} marked complete`);
  } catch (err) {
    log(`  Warning: gsd-tools phase complete failed: ${(err.stderr || err.message).slice(0, 200)}`);
  }
}

// ─── DECISIONS.md Counting ───────────────────────────────────────────────────

function countDecisions(projectDir) {
  const decisionsPath = path.join(projectDir, '.planning', 'DECISIONS.md');
  if (!fs.existsSync(decisionsPath)) return 0;
  const content = fs.readFileSync(decisionsPath, 'utf-8');
  const matches = content.match(/^## DEC-/gm);
  return matches ? matches.length : 0;
}

// ─── Phase Steps ──────────────────────────────────────────────────────────────

const PHASE_STEPS = ['plan-work', 'plan-review', 'build', 'review'];

async function executeStep(projectDir, phaseId, step, planPath) {
  switch (step) {
    case 'plan-work':
      await runClaudeSession(
        `/fh:plan-work plan next for phase ${phaseId}`,
        { cwd: projectDir }
      );
      break;

    case 'plan-review': {
      const latestPlan = planPath || findLatestPlan(projectDir, phaseId);
      if (!latestPlan) {
        throw new Error(`plan-work did not produce a PLAN.md for phase ${phaseId}`);
      }
      const relPlan = path.relative(projectDir, latestPlan);
      await runClaudeSession(
        `/fh:plan-review ${relPlan} --mode hold`,
        { cwd: projectDir }
      );
      break;
    }

    case 'build': {
      const latestPlan = planPath || findLatestPlan(projectDir, phaseId);
      if (!latestPlan) {
        throw new Error(`No PLAN.md found for phase ${phaseId}`);
      }
      const relPlan = path.relative(projectDir, latestPlan);
      await runClaudeSession(
        `/fh:build ${relPlan}`,
        { cwd: projectDir }
      );
      break;
    }

    case 'review':
      await runClaudeSession(
        `/fh:review --quick`,
        { cwd: projectDir }
      );
      break;

    default:
      throw new Error(`Unknown step: ${step}`);
  }
}

// ─── Main Orchestration Loop ──────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);
  const projectDir = opts.projectDir;

  // Validate .planning/ exists
  const planningDir = path.join(projectDir, '.planning');
  if (!fs.existsSync(planningDir)) {
    fatal('.planning/ directory not found. Is this a GSD project?');
  }

  // Parse phases from ROADMAP.md
  const allPhases = parseRoadmapPhases(projectDir);
  if (allPhases.length === 0) {
    fatal('No phases found in ROADMAP.md');
  }

  // Determine start/end phase range
  const currentPhase = parseCurrentPhase(projectDir);
  const startPhase = opts.startPhase || currentPhase || allPhases[0].id;
  const endPhase = opts.endPhase || allPhases[allPhases.length - 1].id;

  // Filter phases to run
  const phasesToRun = allPhases.filter(p => {
    return comparePhaseNum(p.id, startPhase) >= 0 && comparePhaseNum(p.id, endPhase) <= 0;
  });

  if (phasesToRun.length === 0) {
    fatal(`No phases in range ${startPhase}–${endPhase}`);
  }

  // Handle --dry-run
  if (opts.dryRun) {
    log('DRY RUN — showing execution plan:');
    log(`  Project: ${projectDir}`);
    log(`  Phases: ${startPhase}–${endPhase} (${phasesToRun.length} phases)`);
    if (opts.budget) log(`  Budget: $${opts.budget}`);
    log('');
    for (const phase of phasesToRun) {
      log(`  Phase ${phase.id}: ${phase.name}`);
      for (const step of PHASE_STEPS) {
        log(`    → ${step}`);
      }
    }
    log('');
    log('No sessions executed (dry run).');
    process.exit(0);
  }

  // Handle --resume
  let resumeState = null;
  if (opts.resume) {
    resumeState = loadAutoState(projectDir);
    if (!resumeState) {
      fatal('No .auto-state.json found — nothing to resume');
    }
    log(`Resuming from phase ${resumeState.phase}, step ${resumeState.step}`);
  }

  // Track execution stats
  const startTime = Date.now();
  let plansExecuted = 0;
  const decisionsAtStart = countDecisions(projectDir);
  let totalCostEstimate = resumeState ? (resumeState.total_cost_estimate || 0) : 0;

  log('Auto-execution starting');
  log(`  Project: ${projectDir}`);
  log(`  Phases: ${startPhase}–${endPhase} (${phasesToRun.length} phases)`);
  if (opts.budget) log(`  Budget: $${opts.budget}`);
  log('');

  for (const phase of phasesToRun) {
    // If resuming, skip phases before the saved phase
    if (resumeState && comparePhaseNum(phase.id, resumeState.phase) < 0) {
      log(`Skipping phase ${phase.id} (already completed)`);
      continue;
    }

    log(`═══ Phase ${phase.id}: ${phase.name} ═══`);

    // Determine which steps to run for this phase
    let stepsToRun = [...PHASE_STEPS];
    if (resumeState && phase.id === resumeState.phase) {
      const completedSteps = resumeState.steps_completed || [];
      stepsToRun = PHASE_STEPS.filter(s => !completedSteps.includes(s));
      resumeState = null; // Only apply resume logic to the first matching phase
    }

    const completedSteps = [];
    let currentPlanPath = null;

    for (const step of stepsToRun) {
      // Budget check
      if (opts.budget && totalCostEstimate >= opts.budget) {
        log(`Budget ceiling reached ($${totalCostEstimate.toFixed(2)} >= $${opts.budget})`);
        saveAutoState(projectDir, {
          phase: phase.id,
          step,
          plan: currentPlanPath ? path.relative(projectDir, currentPlanPath) : null,
          started_at: new Date().toISOString(),
          steps_completed: completedSteps,
          total_cost_estimate: totalCostEstimate,
        });
        log('State saved for resume. Exiting.');
        process.exit(0);
      }

      // Save state before each step
      saveAutoState(projectDir, {
        phase: phase.id,
        step,
        plan: currentPlanPath ? path.relative(projectDir, currentPlanPath) : null,
        started_at: new Date().toISOString(),
        steps_completed: completedSteps,
        total_cost_estimate: totalCostEstimate,
      });

      log(`  ▸ ${step}`);

      try {
        await executeStep(projectDir, phase.id, step, currentPlanPath);
      } catch (err) {
        log(`  ✗ ${step} failed: ${err.message}`);
        saveAutoState(projectDir, {
          phase: phase.id,
          step,
          plan: currentPlanPath ? path.relative(projectDir, currentPlanPath) : null,
          started_at: new Date().toISOString(),
          steps_completed: completedSteps,
          total_cost_estimate: totalCostEstimate,
          error: err.message,
        });
        fatal(`Step "${step}" failed in phase ${phase.id}. Use --resume to retry.`);
      }

      completedSteps.push(step);

      // Post-step verification
      if (step === 'plan-work') {
        currentPlanPath = findLatestPlan(projectDir, phase.id);
        if (!currentPlanPath) {
          fatal(`plan-work did not produce a PLAN.md for phase ${phase.id}`);
        }
        log(`    Plan created: ${path.relative(projectDir, currentPlanPath)}`);
      }

      if (step === 'build') {
        if (!summaryExists(currentPlanPath)) {
          fatal(`build did not produce SUMMARY.md for phase ${phase.id}`);
        }
        plansExecuted++;
        log('    SUMMARY.md verified');
      }

      log(`  ✓ ${step} complete`);
    }

    // Phase complete — update STATE.md
    updateStateViaGsd(projectDir, phase.id);
    log(`Phase ${phase.id} complete\n`);
  }

  // Clear auto-state on successful completion
  clearAutoState(projectDir);

  // Print summary
  const durationMs = Date.now() - startTime;
  const durationMin = Math.round(durationMs / 60000);
  const decisionsLogged = countDecisions(projectDir) - decisionsAtStart;

  log('');
  log('Auto-execution complete:');
  log(`  Phases: ${startPhase}–${endPhase} (${phasesToRun.length} phases)`);
  log(`  Plans executed: ${plansExecuted}`);
  log(`  Decisions logged: ${decisionsLogged}`);
  log(`  Duration: ${durationMin}m`);
}

main().catch((err) => {
  fatal(err.message);
});
