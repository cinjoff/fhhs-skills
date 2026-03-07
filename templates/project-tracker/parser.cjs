'use strict';

const fs = require('fs');
const path = require('path');

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
 * Parse YAML frontmatter from a markdown file.
 * Falls back to empty object if no frontmatter found.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w[\w_]*)\s*:\s*(.+)$/);
    if (m) {
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      fm[m[1]] = val;
    }
  }
  return fm;
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
    'code_complete': 'complete',
    'planned': 'up next',
    'not_started': 'up next',
    'deferred': 'deferred',
    'superseded': 'deferred',
  };
  return map[s] || raw.toLowerCase();
}

/**
 * Parse PROJECT.md - supports both YAML frontmatter and plain markdown.
 */
function parseProject(planningDir) {
  const content = safeRead(path.join(planningDir, 'PROJECT.md'));
  if (!content) return { name: 'Untitled Project', description: '' };

  const fm = parseFrontmatter(content);
  if (fm.name) {
    return { name: fm.name, description: fm.description || '' };
  }

  // Fall back to parsing markdown: name from # heading, description from > blockquote
  let name = 'Untitled Project';
  let description = '';

  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    name = headingMatch[1].replace(/\s*[—–-]\s+.*$/, '').trim();
  }

  const blockquoteMatch = content.match(/^>\s*(.+)$/m);
  if (blockquoteMatch) {
    description = blockquoteMatch[1].trim();
  }

  return { name, description };
}

/**
 * Parse ROADMAP.md - supports both YAML frontmatter and GSD-style markdown.
 *
 * GSD format has:
 * - Milestones as bullet list under ## Milestones
 * - Progress table: | Phase | Milestone | Plans Complete | Status | Completed |
 *   where Phase column is "1. Foundation" style
 */
function parseRoadmap(planningDir) {
  const content = safeRead(path.join(planningDir, 'ROADMAP.md'));
  if (!content) return { milestone: { name: '' }, phases: [] };

  const fm = parseFrontmatter(content);
  let milestoneName = fm.milestone || '';

  // If no frontmatter milestone, find the current/latest milestone from bullet list
  if (!milestoneName) {
    const lines = content.split('\n');
    let lastPlanned = '';
    for (const line of lines) {
      const trimmed = line.trim();
      const milestoneMatch = trimmed.match(/^-\s+(?:✅|📋|🚧|⬜)\s+\*\*(.+?)\*\*/);
      if (milestoneMatch) {
        const name = milestoneMatch[1];
        if (/planned|in.?progress/i.test(trimmed)) {
          lastPlanned = name;
        }
      }
    }
    milestoneName = lastPlanned || '';
  }

  const milestone = { name: milestoneName };

  // Parse progress table — detect column layout from header
  const phases = [];
  const lines = content.split('\n');
  let inTable = false;
  let headerCols = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!/^\|.*\|$/.test(trimmed)) {
      inTable = false;
      headerCols = [];
      continue;
    }

    // Separator row
    if (/^\|[\s-:|]+\|$/.test(trimmed)) {
      inTable = true;
      continue;
    }

    // Header row — detect column layout
    if (!inTable) {
      const cells = trimmed.split('|').map(c => c.trim()).filter(c => c !== '');
      headerCols = cells.map(c => c.toLowerCase());
      continue;
    }

    const cells = trimmed.split('|').map(c => c.trim()).filter(c => c !== '');
    if (cells.length < 3) continue;

    // Determine column indices based on header
    const phaseIdx = Math.max(0, headerCols.indexOf('phase'));
    const statusIdx = headerCols.indexOf('status');

    // GSD format: "1. Foundation" or "43. Route Rename & Quick Cleanup"
    const phaseCell = cells[phaseIdx] || '';
    const phaseMatch = phaseCell.match(/^(\d+)\.\s+(.+)$/);
    const number = phaseMatch ? parseInt(phaseMatch[1], 10) : (parseInt(phaseCell, 10) || phases.length + 1);
    const name = phaseMatch ? phaseMatch[2] : (cells[1] || '');

    // Status column
    const statusRaw = statusIdx >= 0 ? (cells[statusIdx] || '') : (cells[cells.length - 2] || '');

    // Goal: look for a dedicated goal column, or use milestone column as context
    const goalIdx = headerCols.indexOf('goal');
    const milestoneIdx = headerCols.indexOf('milestone');
    const goal = goalIdx >= 0 ? (cells[goalIdx] || '') : (milestoneIdx >= 0 ? (cells[milestoneIdx] || '') : '');

    phases.push({
      number,
      name,
      goal,
      status: mapStatus(statusRaw),
    });
  }

  return { milestone, phases };
}

/**
 * Parse STATE.md - supports both YAML frontmatter and GSD plain-markdown format.
 */
function parseState(planningDir) {
  const content = safeRead(path.join(planningDir, 'STATE.md'));
  if (!content) return { currentPhase: '', currentPlan: 1, status: 'active' };

  const fm = parseFrontmatter(content);
  if (fm.current_phase) {
    return {
      currentPhase: fm.current_phase,
      currentPlan: parseInt(fm.current_plan, 10) || 1,
      status: mapStatus(fm.status),
    };
  }

  // Parse plain markdown format
  let currentPhase = '';
  let currentPlan = 1;
  let status = 'active';

  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();

    const phaseMatch = trimmed.match(/^Phase:\s*(\d+)/i);
    if (phaseMatch) {
      currentPhase = phaseMatch[1];
    }

    const statusMatch = trimmed.match(/^Status:\s*(.+)$/i);
    if (statusMatch) {
      const statusText = statusMatch[1].toLowerCase();
      if (/complete/i.test(statusText)) {
        status = 'complete';
      } else if (/progress|active|working/i.test(statusText)) {
        status = 'active';
      } else if (/planned|not.?started/i.test(statusText)) {
        status = 'up next';
      }
    }

    if (/^Next action:/i.test(trimmed) && /start/i.test(trimmed)) {
      status = 'up next';
    }
  }

  return { currentPhase, currentPlan, status };
}

/**
 * Parse plan files (XX-NN-PLAN.md) in a phase directory.
 * Extracts task names from XML <task>/<name> elements.
 */
function parsePlanFile(filePath) {
  const content = safeRead(filePath);
  if (!content) return [];

  const tasks = [];
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
 */
function parseSummaryFile(filePath) {
  const content = safeRead(filePath);
  if (!content) return null;

  const fm = parseFrontmatter(content);
  const completedAt = fm.completed_at || fm.completed || fm.date || '';

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
 */
function parsePhases(planningDir, roadmapPhases, state) {
  const phasesDir = path.join(planningDir, 'phases');
  if (!fs.existsSync(phasesDir)) return { phases: roadmapPhases, completionEvents: [] };

  let phaseDirs;
  try {
    phaseDirs = fs.readdirSync(phasesDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort();
  } catch {
    return { phases: roadmapPhases, completionEvents: [] };
  }

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

      if (completedPlans.has(planNum) && summaries[planNum] && summaries[planNum].completedAt) {
        completionEvents.push({
          time: summaries[planNum].completedAt,
          text: `Completed "${taskName}"`,
        });
      }
    }

    phaseTaskMap[phaseNum] = tasks;
  }

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
      .slice(0, 5);
  } catch {
    return [];
  }

  const activity = [];
  for (const file of files) {
    const match = file.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{4})-retro\.md$/);
    if (match) {
      const [, year, month, day, hhmm] = match;
      const hours = hhmm.slice(0, 2);
      const minutes = hhmm.slice(2, 4);
      const time = `${year}-${month}-${day}T${hours}:${minutes}:00Z`;
      activity.push({ time, text: 'Session retrospective recorded' });
    }
  }

  return activity;
}

/**
 * Parse todos/pending/ and todos/done/ directories.
 */
function parseTodos(planningDir) {
  const todosDir = path.join(planningDir, 'todos');
  const pending = [];

  const pendingDir = path.join(todosDir, 'pending');
  if (fs.existsSync(pendingDir)) {
    try {
      const files = fs.readdirSync(pendingDir).filter(f => f.endsWith('.md')).sort();
      for (const file of files) {
        const content = safeRead(path.join(pendingDir, file));
        const fm = parseFrontmatter(content);
        pending.push({
          title: fm.title || file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '').replace(/-/g, ' '),
          created: fm.created || '',
          area: fm.area || '',
        });
      }
    } catch { /* ignore */ }
  }

  return { pending };
}

/**
 * Parse quick/ directory for quick tasks.
 */
function parseQuickTasks(planningDir) {
  const quickDir = path.join(planningDir, 'quick');
  if (!fs.existsSync(quickDir)) return [];

  let dirs;
  try {
    dirs = fs.readdirSync(quickDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort();
  } catch {
    return [];
  }

  const tasks = [];
  for (const dir of dirs) {
    const fullDir = path.join(quickDir, dir);
    let files;
    try {
      files = fs.readdirSync(fullDir);
    } catch {
      continue;
    }

    const planFile = files.find(f => /-PLAN\.md$/i.test(f));
    const summaryFile = files.find(f => /-SUMMARY\.md$/i.test(f));

    let title = dir.replace(/^\d+-/, '').replace(/-/g, ' ');
    let status = 'pending';

    if (planFile) {
      const content = safeRead(path.join(fullDir, planFile));
      const headingMatch = content.match(/^#\s+(?:Quick Task \d+:\s*)?(.+)$/m);
      if (headingMatch) {
        title = headingMatch[1].trim();
      }
    }

    if (summaryFile) {
      status = 'complete';
    }

    const numMatch = dir.match(/^(\d+)/);
    const number = numMatch ? parseInt(numMatch[1], 10) : tasks.length + 1;

    tasks.push({ number, title, status });
  }

  return tasks;
}

/**
 * Main entry point: parse .planning/ directory into structured data.
 */
function parsePlanning(planningDir) {
  const project = parseProject(planningDir);
  const { milestone, phases: roadmapPhases } = parseRoadmap(planningDir);
  const state = parseState(planningDir);

  const { phases: stages, completionEvents } = parsePhases(planningDir, roadmapPhases, state);

  const recentActivity = parseRetros(planningDir).concat(completionEvents);
  recentActivity.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
  recentActivity.splice(10);

  const todos = parseTodos(planningDir);
  const quickTasks = parseQuickTasks(planningDir);

  return {
    project,
    milestone,
    stages,
    recentActivity,
    todos,
    quickTasks,
  };
}

module.exports = { parsePlanning };
