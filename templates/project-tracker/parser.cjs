'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Parse YAML frontmatter from a markdown file.
 * Splits on `---` delimiters and extracts key: value pairs.
 * Returns an object of frontmatter fields.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w[\w_]*)\s*:\s*(.+)$/);
    if (m) {
      let val = m[2].trim();
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      fm[m[1]] = val;
    }
  }
  return fm;
}

/**
 * Safely read a file, returning empty string if missing.
 */
function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

/**
 * Map technical status terms to product-friendly language.
 */
function mapStatus(raw) {
  if (!raw) return 'up next';
  const s = raw.toLowerCase().replace(/[\s_-]+/g, '_');
  const map = {
    'in_progress': 'active',
    'completed': 'complete',
    'complete': 'complete',
    'done': 'complete',
    'planned': 'up next',
    'not_started': 'up next',
  };
  return map[s] || raw.toLowerCase();
}

/**
 * Parse PROJECT.md → { name, description }
 */
function parseProject(planningDir) {
  const content = safeRead(path.join(planningDir, 'PROJECT.md'));
  if (!content) return { name: 'Untitled Project', description: '' };
  const fm = parseFrontmatter(content);
  return {
    name: fm.name || 'Untitled Project',
    description: fm.description || '',
  };
}

/**
 * Parse ROADMAP.md → milestone name + phases from markdown table.
 * Table format: | Phase | Name | Goal | Status |
 */
function parseRoadmap(planningDir) {
  const content = safeRead(path.join(planningDir, 'ROADMAP.md'));
  if (!content) return { milestone: { name: '' }, phases: [] };

  const fm = parseFrontmatter(content);
  const milestone = { name: fm.milestone || '' };

  const phases = [];
  // Match markdown table rows (skip header and separator)
  const lines = content.split('\n');
  let inTable = false;
  for (const line of lines) {
    const trimmed = line.trim();
    // Detect table rows with pipes
    if (/^\|.*\|$/.test(trimmed)) {
      // Skip separator rows like |---|---|---|---|
      if (/^\|[\s-|]+\|$/.test(trimmed)) {
        inTable = true;
        continue;
      }
      // Skip header row (contains "Phase" or "Name" as header)
      if (!inTable && /phase/i.test(trimmed) && /name/i.test(trimmed)) {
        continue;
      }
      if (inTable) {
        const cells = trimmed.split('|').map(c => c.trim()).filter(c => c !== '');
        if (cells.length >= 4) {
          phases.push({
            number: parseInt(cells[0], 10) || phases.length + 1,
            name: cells[1],
            goal: cells[2],
            status: mapStatus(cells[3]),
          });
        }
      }
    } else {
      inTable = false;
    }
  }

  return { milestone, phases };
}

/**
 * Parse STATE.md → { currentPhase, currentPlan, status }
 */
function parseState(planningDir) {
  const content = safeRead(path.join(planningDir, 'STATE.md'));
  if (!content) return { currentPhase: '', currentPlan: 1, status: 'active' };
  const fm = parseFrontmatter(content);
  return {
    currentPhase: fm.current_phase || '',
    currentPlan: parseInt(fm.current_plan, 10) || 1,
    status: mapStatus(fm.status),
  };
}

/**
 * Parse plan files (XX-NN-PLAN.md) in a phase directory.
 * Extracts task names from XML <task>/<name> elements.
 */
function parsePlanFile(filePath) {
  const content = safeRead(filePath);
  if (!content) return [];

  const tasks = [];
  // Match <task ...> blocks and extract <name> elements
  const taskRegex = /<task[^>]*>([\s\S]*?)<\/task>/g;
  let taskMatch;
  while ((taskMatch = taskRegex.exec(content)) !== null) {
    const taskBlock = taskMatch[1];
    const nameMatch = taskBlock.match(/<name>\s*(.*?)\s*<\/name>/);
    if (nameMatch) {
      tasks.push({ name: nameMatch[1] });
    }
  }
  return tasks;
}

/**
 * Parse summary files (XX-NN-SUMMARY.md) in a phase directory.
 * Extracts completion timestamp from frontmatter and "What Was Done" section.
 */
function parseSummaryFile(filePath) {
  const content = safeRead(filePath);
  if (!content) return null;

  const fm = parseFrontmatter(content);
  const completedAt = fm.completed_at || fm.completed || fm.date || '';

  // Extract "What Was Done" section
  let whatWasDone = '';
  const sectionMatch = content.match(/##\s*What Was Done\s*\n([\s\S]*?)(?=\n##|\n---|$)/i);
  if (sectionMatch) {
    whatWasDone = sectionMatch[1].trim();
  }

  return {
    completedAt,
    whatWasDone,
    plan: parseInt(fm.plan, 10) || 0,
  };
}

/**
 * Parse phase directories under phases/.
 * Each phase dir contains XX-NN-PLAN.md and XX-NN-SUMMARY.md files.
 */
function parsePhases(planningDir, roadmapPhases, state) {
  const phasesDir = path.join(planningDir, 'phases');
  if (!fs.existsSync(phasesDir)) return roadmapPhases;

  let phaseDirs;
  try {
    phaseDirs = fs.readdirSync(phasesDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort();
  } catch {
    return roadmapPhases;
  }

  // Build a map from phase number/name to tasks
  const phaseTaskMap = {};
  const completionEvents = [];

  for (const dir of phaseDirs) {
    const phaseNum = parseInt(dir.split('-')[0], 10);
    const fullDir = path.join(phasesDir, dir);

    let files;
    try {
      files = fs.readdirSync(fullDir).sort();
    } catch {
      continue;
    }

    const planFiles = files.filter(f => /^\d{2}-\d{2}-PLAN\.md$/i.test(f));
    const summaryFiles = files.filter(f => /^\d{2}-\d{2}-SUMMARY\.md$/i.test(f));

    // Track which plans have summaries (completed)
    const completedPlans = new Set();
    const summaries = {};
    for (const sf of summaryFiles) {
      const planNum = parseInt(sf.split('-')[1], 10);
      const summary = parseSummaryFile(path.join(fullDir, sf));
      if (summary) {
        completedPlans.add(planNum);
        summaries[planNum] = summary;
      }
    }

    const tasks = [];
    for (const pf of planFiles) {
      const planNum = parseInt(pf.split('-')[1], 10);
      const subtasks = parsePlanFile(path.join(fullDir, pf));

      // Determine task status
      const isCurrentPhase = state.currentPhase === dir || parseInt(state.currentPhase, 10) === phaseNum;
      const isCurrentPlan = state.currentPlan === planNum;
      let taskStatus;
      if (completedPlans.has(planNum)) {
        taskStatus = 'complete';
      } else if (isCurrentPhase && isCurrentPlan) {
        taskStatus = 'active';
      } else {
        taskStatus = 'up next';
      }

      // Derive task name from first subtask or plan file name
      const firstSubtask = subtasks[0];
      const taskName = firstSubtask
        ? firstSubtask.name.replace(/^Task\s+\d+:\s*/i, '')
        : `Plan ${planNum}`;

      tasks.push({
        plan: planNum,
        name: taskName,
        status: taskStatus,
        subtasks: subtasks.map(st => ({
          name: st.name,
          status: completedPlans.has(planNum) ? 'done' : (isCurrentPhase && isCurrentPlan ? 'in_progress' : 'pending'),
        })),
      });

      // Collect completion events from summaries for recentActivity
      if (completedPlans.has(planNum) && summaries[planNum] && summaries[planNum].completedAt) {
        completionEvents.push({
          time: summaries[planNum].completedAt,
          text: `Completed "${taskName}"`,
        });
      }
    }

    phaseTaskMap[phaseNum] = tasks;
  }

  // Merge tasks into roadmap phases
  const enrichedPhases = roadmapPhases.map(phase => {
    const tasks = phaseTaskMap[phase.number];
    if (tasks && tasks.length > 0) {
      return { ...phase, tasks };
    }
    return phase;
  });

  return { phases: enrichedPhases, completionEvents };
}

/**
 * Parse retros/ directory for recent activity timestamps.
 */
function parseRetros(planningDir) {
  const retrosDir = path.join(planningDir, 'retros');
  if (!fs.existsSync(retrosDir)) return [];

  let files;
  try {
    files = fs.readdirSync(retrosDir)
      .filter(f => f.endsWith('-retro.md'))
      .sort()
      .reverse()
      .slice(0, 5); // Last 5 retros
  } catch {
    return [];
  }

  const activity = [];
  for (const file of files) {
    // Extract timestamp from filename: YYYY-MM-DD-HHMM-retro.md
    const match = file.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{4})-retro\.md$/);
    if (match) {
      const [, year, month, day, hhmm] = match;
      const hours = hhmm.slice(0, 2);
      const minutes = hhmm.slice(2, 4);
      const time = `${year}-${month}-${day}T${hours}:${minutes}:00Z`;
      activity.push({
        time,
        text: `Session retrospective recorded`,
      });
    }
  }

  return activity;
}

/**
 * Parse a .planning/ directory and return structured JSON
 * for the project tracker dashboard.
 *
 * @param {string} planningDir - Absolute path to the .planning/ directory
 * @returns {object} Structured project data
 */
function parsePlanning(planningDir) {
  const project = parseProject(planningDir);
  const { milestone, phases: roadmapPhases } = parseRoadmap(planningDir);
  const state = parseState(planningDir);

  // Enrich phases with task data from phase directories
  const { phases: stages, completionEvents } = parsePhases(planningDir, roadmapPhases, state);

  // Gather recent activity from retros and summary completion events
  const recentActivity = parseRetros(planningDir).concat(completionEvents);

  // Sort recent activity by time descending and keep latest 10
  recentActivity.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
  recentActivity.splice(10);

  return {
    project,
    milestone,
    stages,
    recentActivity,
  };
}

module.exports = { parsePlanning };
