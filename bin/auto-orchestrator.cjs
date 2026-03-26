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
 *   --check-corrections     Run decision correction cascade instead of normal loop
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ─── Timeout & Retry Constants ───────────────────────────────────────────────

const SOFT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const HARD_TIMEOUT_MS = 45 * 60 * 1000; // 45 minutes
const MAX_RETRIES = 2;

// ─── Cost Estimation Constants ───────────────────────────────────────────────
// Rough heuristic: ~4 chars per token. Pricing approximate (Opus-class model).
// Input: ~$0.015/1K tokens. Output: ~$0.075/1K tokens.
// These are estimates — actual costs depend on model and context size.

const CHARS_PER_TOKEN = 4;
const INPUT_COST_PER_1K = 0.015;
const OUTPUT_COST_PER_1K = 0.075;

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
    checkCorrections: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--project-dir':
        if (++i >= args.length) fatal('--project-dir requires a value');
        opts.projectDir = path.resolve(args[i]);
        break;
      case '--start-phase':
        if (++i >= args.length) fatal('--start-phase requires a value');
        opts.startPhase = args[i];
        break;
      case '--end-phase':
        if (++i >= args.length) fatal('--end-phase requires a value');
        opts.endPhase = args[i];
        break;
      case '--budget':
        if (++i >= args.length) fatal('--budget requires a value');
        opts.budget = parseFloat(args[i]);
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--resume':
        opts.resume = true;
        break;
      case '--check-corrections':
        opts.checkCorrections = true;
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
  const dir = path.dirname(planPath);
  const base = path.basename(planPath);
  const summaryBase = base.includes('-PLAN.md')
    ? base.replace('-PLAN.md', '-SUMMARY.md')
    : base.replace('PLAN.md', 'SUMMARY.md');
  return fs.existsSync(path.join(dir, summaryBase));
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

// ─── Cost Estimation ─────────────────────────────────────────────────────────

/**
 * Estimate session cost from prompt and response text lengths.
 * This is a rough heuristic — actual costs vary by model, context window usage,
 * and pricing tier. Uses ~4 chars/token and approximate Opus-class rates.
 */
function estimateSessionCost(promptText, responseText) {
  const inputTokens = Math.ceil(promptText.length / CHARS_PER_TOKEN);
  const outputTokens = Math.ceil(responseText.length / CHARS_PER_TOKEN);
  const inputCost = (inputTokens / 1000) * INPUT_COST_PER_1K;
  const outputCost = (outputTokens / 1000) * OUTPUT_COST_PER_1K;
  return inputCost + outputCost;
}

// ─── DECISIONS.md Helpers ────────────────────────────────────────────────────

function decisionsPath(projectDir) {
  return path.join(projectDir, '.planning', 'DECISIONS.md');
}

function countDecisions(projectDir) {
  const dp = decisionsPath(projectDir);
  if (!fs.existsSync(dp)) return 0;
  const content = fs.readFileSync(dp, 'utf-8');
  const matches = content.match(/^## DEC-/gm);
  return matches ? matches.length : 0;
}

function nextDecisionId(projectDir) {
  return `DEC-${String(countDecisions(projectDir) + 1).padStart(3, '0')}`;
}

function appendDecision(projectDir, { id, title, status, confidence, context, decision, affects }) {
  const dp = decisionsPath(projectDir);
  let content = '';
  if (fs.existsSync(dp)) {
    content = fs.readFileSync(dp, 'utf-8');
  } else {
    content = '# Decisions\n\nAuto-generated decision log.\n';
  }

  const entry = [
    '',
    `## ${id}: ${title}`,
    `- **Status:** ${status}`,
    `- **Confidence:** ${confidence}`,
    `- **Context:** ${context}`,
    `- **Decision:** ${decision}`,
    `- **Affects:** ${affects}`,
    '',
  ].join('\n');

  fs.writeFileSync(dp, content.trimEnd() + '\n' + entry, 'utf-8');
}

// ─── Claude Session Runner (with stuck detection) ────────────────────────────

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
    const sessionStart = Date.now();

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    // Soft timeout: warn but continue
    const softTimer = setTimeout(() => {
      const elapsedMin = Math.round((Date.now() - sessionStart) / 60000);
      log(`  ⚠ SOFT TIMEOUT: session running for ${elapsedMin}min (threshold: ${SOFT_TIMEOUT_MS / 60000}min)`);
    }, SOFT_TIMEOUT_MS);

    // Hard timeout: kill process
    const hardTimer = setTimeout(() => {
      const elapsedMin = Math.round((Date.now() - sessionStart) / 60000);
      log(`  ✗ HARD TIMEOUT: killing session after ${elapsedMin}min`);
      child.kill('SIGTERM');
      // Give SIGTERM 5s to take effect, then SIGKILL
      setTimeout(() => {
        try { child.kill('SIGKILL'); } catch { /* already dead */ }
      }, 5000);
    }, HARD_TIMEOUT_MS);

    function cleanup() {
      clearTimeout(softTimer);
      clearTimeout(hardTimer);
    }

    child.on('error', (err) => {
      cleanup();
      reject(new Error(`Failed to spawn claude: ${err.message}`));
    });

    child.on('close', (code, signal) => {
      cleanup();
      const elapsedMs = Date.now() - sessionStart;

      if (signal === 'SIGTERM' || signal === 'SIGKILL') {
        const err = new Error(`Session killed after hard timeout (${Math.round(elapsedMs / 60000)}min)`);
        err.timeout = true;
        err.elapsedMs = elapsedMs;
        err.stdout = stdout;
        reject(err);
      } else if (code !== 0) {
        const errMsg = `claude -p exited with code ${code}\nstderr: ${stderr.slice(0, 500)}`;
        reject(new Error(errMsg));
      } else {
        resolve({ stdout, stderr, exitCode: code, elapsedMs, promptText: prompt });
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

// ─── Phase Steps ──────────────────────────────────────────────────────────────

const PHASE_STEPS = ['plan-work', 'plan-review', 'build', 'review'];

async function executeStep(projectDir, phaseId, step, planPath) {
  switch (step) {
    case 'plan-work':
      return await runClaudeSession(
        `/fh:plan-work plan next for phase ${phaseId}`,
        { cwd: projectDir }
      );

    case 'plan-review': {
      const latestPlan = planPath || findLatestPlan(projectDir, phaseId);
      if (!latestPlan) {
        throw new Error(`plan-work did not produce a PLAN.md for phase ${phaseId}`);
      }
      const relPlan = path.relative(projectDir, latestPlan);
      return await runClaudeSession(
        `/fh:plan-review ${relPlan} --mode hold`,
        { cwd: projectDir }
      );
    }

    case 'build': {
      const latestPlan = planPath || findLatestPlan(projectDir, phaseId);
      if (!latestPlan) {
        throw new Error(`No PLAN.md found for phase ${phaseId}`);
      }
      const relPlan = path.relative(projectDir, latestPlan);
      return await runClaudeSession(
        `/fh:build ${relPlan}`,
        { cwd: projectDir }
      );
    }

    case 'review':
      return await runClaudeSession(
        `/fh:review --quick`,
        { cwd: projectDir }
      );

    default:
      throw new Error(`Unknown step: ${step}`);
  }
}

// ─── Decision Correction Cascade ─────────────────────────────────────────────

/**
 * Parse DECISIONS.md and return entries with Status=CORRECTED.
 * Each entry includes id, title, affects, and the original decision text.
 */
function parseCorrectedDecisions(projectDir) {
  const dp = decisionsPath(projectDir);
  if (!fs.existsSync(dp)) return [];

  const content = fs.readFileSync(dp, 'utf-8');
  const entries = [];

  // Split on ## DEC- boundaries
  const sections = content.split(/(?=^## DEC-)/gm);
  for (const section of sections) {
    const headerMatch = section.match(/^## (DEC-\d+):\s*(.+)/m);
    if (!headerMatch) continue;

    const statusMatch = section.match(/\*\*Status:\*\*\s*(.+)/i);
    if (!statusMatch) continue;
    const status = statusMatch[1].trim();
    if (!status.toUpperCase().includes('CORRECTED')) continue;

    const affectsMatch = section.match(/\*\*Affects:\*\*\s*(.+)/i);
    const decisionMatch = section.match(/\*\*Decision:\*\*\s*(.+)/i);

    entries.push({
      id: headerMatch[1],
      title: headerMatch[2].trim(),
      affects: affectsMatch ? affectsMatch[1].trim() : '',
      decision: decisionMatch ? decisionMatch[1].trim() : '',
      rawSection: section,
    });
  }

  return entries;
}

/**
 * Classify a correction as Mechanical or Architectural based on the
 * nature of the affects field and decision content.
 */
function classifyCorrection(entry) {
  const affects = entry.affects.toLowerCase();
  const decision = entry.decision.toLowerCase();
  const combined = affects + ' ' + decision;

  // Architectural indicators
  const architecturalPatterns = [
    'architecture', 'redesign', 'refactor', 'restructure',
    'new approach', 'fundamental', 'pattern change', 'migration',
  ];

  for (const pattern of architecturalPatterns) {
    if (combined.includes(pattern)) return 'architectural';
  }

  // Default: mechanical (config, string, naming, path changes)
  return 'mechanical';
}

/**
 * Parse the Affects field into individual artifact paths/references.
 */
function parseAffectsField(affects) {
  // Split on commas, semicolons, or "and"
  return affects
    .split(/[,;]|\band\b/i)
    .map(s => s.trim().replace(/^`|`$/g, ''))
    .filter(s => s.length > 0);
}

/**
 * Check if an artifact file exists and might still contain effects
 * of the original decision.
 */
function checkArtifact(projectDir, artifactRef) {
  // Try as a direct path
  const fullPath = path.resolve(projectDir, artifactRef);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return { path: fullPath, exists: true };
  }
  return { path: fullPath, exists: false };
}

async function runCorrectionCascade(projectDir) {
  log('Decision Correction Cascade');
  log(`  Project: ${projectDir}`);
  log('');

  const corrected = parseCorrectedDecisions(projectDir);
  if (corrected.length === 0) {
    log('No CORRECTED decisions found in DECISIONS.md');
    return;
  }

  log(`Found ${corrected.length} CORRECTED decision(s):`);
  const mechanicalFixes = [];
  const architecturalPlans = [];

  for (const entry of corrected) {
    log(`  ${entry.id}: ${entry.title}`);
    const classification = classifyCorrection(entry);
    const artifacts = parseAffectsField(entry.affects);
    log(`    Classification: ${classification}`);
    log(`    Artifacts: ${artifacts.join(', ') || '(none specified)'}`);

    const existingArtifacts = [];
    for (const ref of artifacts) {
      const check = checkArtifact(projectDir, ref);
      if (check.exists) {
        existingArtifacts.push(check.path);
        log(`      ✓ ${ref} — exists, may need update`);
      } else {
        log(`      – ${ref} — not found, skipping`);
      }
    }

    if (classification === 'mechanical' && existingArtifacts.length > 0) {
      mechanicalFixes.push({ entry, artifacts: existingArtifacts });
    } else if (classification === 'architectural') {
      architecturalPlans.push({ entry, artifacts: existingArtifacts });
    }
  }

  log('');

  // Handle mechanical fixes via claude -p
  if (mechanicalFixes.length > 0) {
    log(`Applying ${mechanicalFixes.length} mechanical correction(s) via claude -p...`);
    for (const fix of mechanicalFixes) {
      const artifactList = fix.artifacts.map(a => path.relative(projectDir, a)).join(', ');
      const prompt = `Decision ${fix.entry.id} was CORRECTED. Original decision: "${fix.entry.decision}". ` +
        `Update these files to reflect the correction: ${artifactList}. ` +
        `Make minimal targeted changes only.`;
      try {
        await runClaudeSession(prompt, { cwd: projectDir });
        log(`  ✓ ${fix.entry.id} — mechanical fix applied`);
      } catch (err) {
        log(`  ✗ ${fix.entry.id} — fix failed: ${err.message}`);
      }
    }
  }

  // Handle architectural changes by producing a correction plan
  if (architecturalPlans.length > 0) {
    log(`${architecturalPlans.length} architectural correction(s) need manual planning:`);
    const planLines = ['# Correction Plan', '', `Generated: ${new Date().toISOString()}`, ''];
    for (const plan of architecturalPlans) {
      planLines.push(`## ${plan.entry.id}: ${plan.entry.title}`);
      planLines.push(`- **Original decision:** ${plan.entry.decision}`);
      planLines.push(`- **Affects:** ${plan.entry.affects}`);
      planLines.push(`- **Classification:** Architectural — requires manual review`);
      if (plan.artifacts.length > 0) {
        planLines.push(`- **Existing artifacts to review:**`);
        for (const a of plan.artifacts) {
          planLines.push(`  - \`${path.relative(projectDir, a)}\``);
        }
      }
      planLines.push('');
    }
    const correctionPlanPath = path.join(projectDir, '.planning', 'CORRECTION-PLAN.md');
    fs.writeFileSync(correctionPlanPath, planLines.join('\n'), 'utf-8');
    log(`  Written: ${path.relative(projectDir, correctionPlanPath)}`);
  }

  // Log cascade analysis as a new decision
  const cascadeId = nextDecisionId(projectDir);
  appendDecision(projectDir, {
    id: cascadeId,
    title: 'Correction cascade analysis',
    status: 'ACTIVE',
    confidence: 'HIGH',
    context: `Ran --check-corrections on ${corrected.length} CORRECTED decision(s)`,
    decision: `Mechanical: ${mechanicalFixes.length} auto-fixed. Architectural: ${architecturalPlans.length} need manual plan.`,
    affects: corrected.map(e => e.id).join(', '),
  });

  log('');
  log('Cascade complete:');
  log(`  CORRECTED decisions processed: ${corrected.length}`);
  log(`  Mechanical fixes applied: ${mechanicalFixes.length}`);
  log(`  Architectural plans generated: ${architecturalPlans.length}`);
  log(`  Cascade decision logged: ${cascadeId}`);
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

  // Handle --check-corrections mode (separate from normal loop)
  if (opts.checkCorrections) {
    await runCorrectionCascade(projectDir);
    return;
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

  // Preflight: verify claude CLI is available
  try {
    require('child_process').execSync('claude --version', { stdio: 'pipe' });
  } catch {
    fatal('claude CLI not found on PATH. Install Claude Code first.');
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

  // Load retry state from auto-state if resuming
  let retryCount = resumeState ? (resumeState.retry_count || {}) : {};

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
      const stepKey = `${phase.id}:${step}`;

      // Budget check (with cost estimate)
      if (opts.budget && totalCostEstimate >= opts.budget) {
        log(`Budget ceiling reached ($${totalCostEstimate.toFixed(2)} >= $${opts.budget})`);

        // Log budget decision
        const budgetDecId = nextDecisionId(projectDir);
        appendDecision(projectDir, {
          id: budgetDecId,
          title: 'Budget ceiling reached — stopping execution',
          status: 'ACTIVE',
          confidence: 'HIGH',
          context: `Budget: $${opts.budget}, spent: $${totalCostEstimate.toFixed(2)}`,
          decision: `Stopped at phase ${phase.id}, step ${step}. Remaining phases need manual execution or increased budget.`,
          affects: phasesToRun.filter(p => comparePhaseNum(p.id, phase.id) >= 0).map(p => `Phase ${p.id}`).join(', '),
        });

        saveAutoState(projectDir, {
          phase: phase.id,
          step,
          plan: currentPlanPath ? path.relative(projectDir, currentPlanPath) : null,
          started_at: new Date().toISOString(),
          steps_completed: completedSteps,
          total_cost_estimate: totalCostEstimate,
          retry_count: retryCount,
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
        retry_count: retryCount,
      });

      log(`  ▸ ${step}`);

      // Retry loop with stuck detection
      const maxAttempts = MAX_RETRIES;
      let attempts = retryCount[stepKey] || 0;
      let stepResult = null;
      let stepSucceeded = false;

      while (attempts < maxAttempts && !stepSucceeded) {
        if (attempts > 0) {
          log(`  ↻ Retry ${attempts}/${maxAttempts - 1} for ${step}`);
        }

        try {
          stepResult = await executeStep(projectDir, phase.id, step, currentPlanPath);
          stepSucceeded = true;
        } catch (err) {
          attempts++;
          retryCount[stepKey] = attempts;

          // Save retry state
          saveAutoState(projectDir, {
            phase: phase.id,
            step,
            plan: currentPlanPath ? path.relative(projectDir, currentPlanPath) : null,
            started_at: new Date().toISOString(),
            steps_completed: completedSteps,
            total_cost_estimate: totalCostEstimate,
            retry_count: retryCount,
          });

          if (err.timeout) {
            log(`  ✗ ${step} timed out (attempt ${attempts}/${maxAttempts})`);
          } else {
            log(`  ✗ ${step} failed (attempt ${attempts}/${maxAttempts}): ${err.message}`);
          }

          if (attempts >= maxAttempts) {
            // Max retries exhausted — skip step with logged decision
            const skipDecId = nextDecisionId(projectDir);
            const reason = err.timeout ? 'hard timeout' : 'repeated failure';
            appendDecision(projectDir, {
              id: skipDecId,
              title: `Skipped ${step} in phase ${phase.id} after ${reason}`,
              status: 'ACTIVE ⚠ NEEDS REVIEW',
              confidence: 'LOW',
              context: `Step "${step}" failed ${attempts} time(s). Last error: ${err.message.slice(0, 200)}`,
              decision: `Skipping step and continuing to next. Manual intervention required.`,
              affects: `Phase ${phase.id}, step ${step}`,
            });
            log(`  ⚠ Skipping ${step} after ${attempts} attempts — decision logged as ${skipDecId}`);
            break;
          }
        }
      }

      // Cost tracking: estimate cost from session I/O
      if (stepResult) {
        const sessionCost = estimateSessionCost(
          stepResult.promptText || '',
          stepResult.stdout || ''
        );
        totalCostEstimate += sessionCost;
        log(`    Cost estimate: ~$${sessionCost.toFixed(4)} (running total: ~$${totalCostEstimate.toFixed(2)} — minimum estimate, actual cost higher)`);
      }

      if (stepSucceeded) {
        completedSteps.push(step);
      }

      // Post-step verification — treat missing artifacts as step failure, not fatal
      if (step === 'plan-work' && stepSucceeded) {
        currentPlanPath = findLatestPlan(projectDir, phase.id);
        if (!currentPlanPath) {
          log(`  ✗ plan-work succeeded but no PLAN.md found — treating as failure`);
          stepSucceeded = false;
          completedSteps.pop(); // remove plan-work from completed
          const decId = nextDecisionId(projectDir);
          appendDecision(projectDir, {
            id: decId,
            title: `plan-work produced no PLAN.md for phase ${phase.id}`,
            status: 'ACTIVE ⚠ NEEDS REVIEW',
            confidence: 'LOW',
            context: `plan-work exited 0 but no PLAN.md was created in the phase directory`,
            decision: `Phase ${phase.id} cannot continue without a plan. Stopping phase.`,
            affects: `Phase ${phase.id}`,
          });
          break; // exit steps loop — phase is incomplete
        }
        log(`    Plan created: ${path.relative(projectDir, currentPlanPath)}`);
      }

      if (step === 'build' && stepSucceeded) {
        if (!summaryExists(currentPlanPath)) {
          log(`  ✗ build succeeded but no SUMMARY.md found — treating as failure`);
          stepSucceeded = false;
          completedSteps.pop(); // remove build from completed
          const decId = nextDecisionId(projectDir);
          appendDecision(projectDir, {
            id: decId,
            title: `build produced no SUMMARY.md for phase ${phase.id}`,
            status: 'ACTIVE ⚠ NEEDS REVIEW',
            confidence: 'LOW',
            context: `build exited 0 but no SUMMARY.md was created`,
            decision: `Phase ${phase.id} build incomplete. Stopping phase.`,
            affects: `Phase ${phase.id}`,
          });
          break; // exit steps loop — phase is incomplete
        }
        plansExecuted++;
        log('    SUMMARY.md verified');
      }

      if (stepSucceeded) {
        log(`  ✓ ${step} complete`);
      }
    }

    // Only mark phase complete if critical steps succeeded
    const criticalSteps = ['plan-work', 'plan-review', 'build'];
    const criticalsMissing = criticalSteps.filter(s => !completedSteps.includes(s));
    if (criticalsMissing.length > 0) {
      log(`Phase ${phase.id} INCOMPLETE — missing critical steps: ${criticalsMissing.join(', ')}`);
      log(`  Saving state for --resume. Run again to retry.`);
      saveAutoState(projectDir, {
        phase: phase.id,
        step: criticalsMissing[0],
        plan: currentPlanPath ? path.relative(projectDir, currentPlanPath) : null,
        started_at: new Date().toISOString(),
        steps_completed: completedSteps,
        total_cost_estimate: totalCostEstimate,
        retry_count: retryCount,
      });
      break; // exit phases loop — don't continue to next phase
    }

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
  log(`  Cost estimate: $${totalCostEstimate.toFixed(2)}${opts.budget ? ` / $${opts.budget} budget` : ''}`);
  log(`  Duration: ${durationMin}m`);
}

main().catch((err) => {
  fatal(err.message);
});
