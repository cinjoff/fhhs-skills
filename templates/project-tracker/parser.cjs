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
 * Extract body content from a markdown file (everything after frontmatter closing ---).
 * If no frontmatter, returns the entire content trimmed.
 */
function extractBody(content) {
  const fmMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (fmMatch) {
    return content.slice(fmMatch[0].length).trim();
  }
  return content.trim();
}

/**
 * Strip XML tags from content, returning plain text.
 */
function stripXml(content) {
  return content.replace(/<[^>]+>/g, '').trim();
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
 *
 * Each phase gets a milestoneName field when a Milestone column exists in the
 * progress table, or when milestone ranges can be inferred from the bullet list.
 */
function parseRoadmap(planningDir) {
  const content = safeRead(path.join(planningDir, 'ROADMAP.md'));
  if (!content) return { milestone: { name: '' }, phases: [] };

  const fm = parseFrontmatter(content);
  let milestoneName = fm.milestone || '';

  // Parse milestone bullet list: "- emoji **Name** - Phases X-Y (status)"
  // Build a map of milestone name → phase range for later assignment
  const milestoneRanges = []; // { name, startPhase, endPhase }
  const lines = content.split('\n');

  // Always parse bullet list for full milestone names and ranges
  let lastPlanned = '';
  for (const line of lines) {
    const trimmed = line.trim();
    const milestoneMatch = trimmed.match(/^-\s+(?:✅|📋|🚧|⬜)\s+\*\*(.+?)\*\*/);
    if (milestoneMatch) {
      const name = milestoneMatch[1];
      if (/planned|in.?progress/i.test(trimmed)) {
        lastPlanned = name;
      }
      // Extract phase range: "Phases X-Y" or "Phase X"
      const rangeMatch = trimmed.match(/Phases?\s+(\d+)\s*-\s*(\d+)/i);
      if (rangeMatch) {
        milestoneRanges.push({
          name,
          startPhase: parseInt(rangeMatch[1], 10),
          endPhase: parseInt(rangeMatch[2], 10),
        });
      }
    }
  }
  if (!milestoneName) {
    milestoneName = lastPlanned || '';
  }

  const milestone = { name: milestoneName };

  // Parse progress table — detect column layout from header
  const phases = [];
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

    // Milestone name: prefer full name from bullet list, fall back to table column
    let phaseMilestoneName = '';
    // First try phase range from bullet list (has full names like "v1.0 Local-First CRDT Storage")
    for (const mr of milestoneRanges) {
      if (number >= mr.startPhase && number <= mr.endPhase) {
        phaseMilestoneName = mr.name;
        break;
      }
    }
    // Fall back to Milestone column if no range matched
    if (!phaseMilestoneName && milestoneIdx >= 0) {
      const tableVal = cells[milestoneIdx] || '';
      // Try to find full name from bullet list that starts with the table value
      const fullName = milestoneRanges.find(mr => mr.name.startsWith(tableVal));
      phaseMilestoneName = fullName ? fullName.name : tableVal;
    }

    const phase = {
      number,
      name,
      goal,
      status: mapStatus(statusRaw),
    };

    if (phaseMilestoneName) {
      phase.milestoneName = phaseMilestoneName;
    }

    phases.push(phase);
  }

  // If no table-based phases found, try heading-based format:
  // ## Phase N: Title [STATUS]  or  ## Phase N — Title
  // **Goal:** ... on next line, **Status:** ... for status
  if (phases.length === 0) {
    let currentMilestoneName = '';

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      // Track milestone headings: "# Milestone: Name" or standalone "# Name"
      if (/^#\s+Milestone:\s+/i.test(trimmed)) {
        currentMilestoneName = trimmed.replace(/^#\s+Milestone:\s+/i, '').trim();
        continue;
      }

      // Match: ## Phase N: Title [STATUS]  or  ## Phase N — Title  or  ## Phase N.N: Title
      const headingMatch = trimmed.match(
        /^##\s+Phase\s+(\d+(?:\.\d+)?)\s*(?:[:—–-]\s*|\s+)(.+?)(?:\s*\[(\w[\w\s]*)\])?\s*$/i
      );
      if (!headingMatch) continue;

      const rawNum = headingMatch[1];
      const number = rawNum.includes('.') ? parseFloat(rawNum) : parseInt(rawNum, 10);
      const name = headingMatch[2].trim();
      let statusRaw = headingMatch[3] || '';

      // Look ahead for **Goal:** and **Status:** lines within next 5 lines
      let goal = '';
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const ahead = lines[j].trim();
        // Stop at next heading
        if (/^##\s/.test(ahead)) break;

        const goalMatch = ahead.match(/^\*\*Goal:\*\*\s*(.+)$/i);
        if (goalMatch) {
          goal = goalMatch[1].trim();
        }
        const statusMatch = ahead.match(/^\*\*Status:\*\*\s*(.+)$/i);
        if (statusMatch && !statusRaw) {
          statusRaw = statusMatch[1].trim();
        }
      }

      // Assign milestone from range or current heading
      let phaseMilestoneName = '';
      for (const mr of milestoneRanges) {
        if (number >= mr.startPhase && number <= mr.endPhase) {
          phaseMilestoneName = mr.name;
          break;
        }
      }
      if (!phaseMilestoneName && currentMilestoneName) {
        phaseMilestoneName = currentMilestoneName;
      }

      const phase = {
        number,
        name,
        goal,
        status: mapStatus(statusRaw),
      };

      if (phaseMilestoneName) {
        phase.milestoneName = phaseMilestoneName;
      }

      phases.push(phase);
    }
  }

  return { milestone, phases };
}

/**
 * Parse STATE.md - supports both YAML frontmatter and GSD plain-markdown format.
 * Extracts lastActivity { date, description } from "Last activity:" line.
 */
function parseState(planningDir) {
  const content = safeRead(path.join(planningDir, 'STATE.md'));
  if (!content) return { currentPhase: '', currentPlan: 1, status: 'active', lastActivity: null };

  const fm = parseFrontmatter(content);

  let lastActivity = null;

  // Parse Last activity line regardless of frontmatter/markdown mode
  // Format: "Last activity: YYYY-MM-DD — description" or "Last activity: [YYYY-MM-DD] — [description]"
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const activityMatch = trimmed.match(/^Last activity:\s*\[?(\d{4}-\d{2}-\d{2})\]?\s*[—–-]+\s*\[?(.+?)\]?\s*$/i);
    if (activityMatch) {
      lastActivity = {
        date: activityMatch[1],
        description: activityMatch[2].trim(),
      };
    }
  }

  if (fm.current_phase) {
    return {
      currentPhase: fm.current_phase,
      currentPlan: parseInt(fm.current_plan, 10) || 1,
      status: mapStatus(fm.status),
      lastActivity,
    };
  }

  // Parse plain markdown format
  let currentPhase = '';
  let currentPlan = 1;
  let status = 'active';

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

  return { currentPhase, currentPlan, status, lastActivity };
}

/**
 * Extract objective text from a PLAN.md file.
 * Returns the first sentence or ~150 chars, trimmed.
 */
function extractObjective(content) {
  const match = content.match(/<objective>([\s\S]*?)<\/objective>/);
  if (!match) return '';
  const raw = match[1].trim();
  if (!raw) return '';
  // Take first sentence (up to period followed by space/end), or truncate at ~150 chars
  const sentenceMatch = raw.match(/^(.+?\.)\s/);
  if (sentenceMatch && sentenceMatch[1].length <= 150) {
    return sentenceMatch[1];
  }
  if (raw.length <= 150) return raw;
  // Truncate at word boundary near 150 chars
  const truncated = raw.slice(0, 150).replace(/\s+\S*$/, '');
  return truncated + '…';
}

/**
 * Parse plan files (XX-NN-PLAN.md) in a phase directory.
 * Extracts task names from XML <task>/<name> elements and objective text.
 */
function parsePlanFile(filePath) {
  const content = safeRead(filePath);
  if (!content) return { tasks: [], objective: '' };

  const objective = extractObjective(content);

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
  return { tasks, objective };
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
 * Parse flat plan files from plans/ directory.
 * Pattern: NN-PLAN.md where NN maps to phase number.
 * Also checks for NN-SUMMARY.md for completion status.
 */
function parseFlatPlans(planningDir, state) {
  const plansDir = path.join(planningDir, 'plans');
  if (!fs.existsSync(plansDir)) return {};

  let files;
  try {
    files = fs.readdirSync(plansDir).sort();
  } catch {
    return {};
  }

  const planFiles = files.filter(f => /^\d{2}-PLAN\.md$/i.test(f));
  const summaryFiles = files.filter(f => /^\d{2}-SUMMARY\.md$/i.test(f));

  const completedPhases = new Set();
  for (const sf of summaryFiles) {
    completedPhases.add(parseInt(sf.split('-')[0], 10));
  }

  const phaseTaskMap = {};
  for (const pf of planFiles) {
    const phaseNum = parseInt(pf.split('-')[0], 10);
    const { tasks: subtasks, objective } = parsePlanFile(path.join(plansDir, pf));

    const isCurrentPhase = parseInt(state.currentPhase, 10) === phaseNum;
    let taskStatus;
    if (completedPhases.has(phaseNum)) {
      taskStatus = 'complete';
    } else if (isCurrentPhase) {
      taskStatus = 'active';
    } else {
      taskStatus = 'up next';
    }

    const firstSubtask = subtasks[0];
    const taskName = firstSubtask
      ? firstSubtask.name.replace(/^Task\s+\d+:\s*/i, '')
      : `Plan ${phaseNum}`;

    phaseTaskMap[phaseNum] = [{
      plan: 1,
      name: taskName,
      objective,
      status: taskStatus,
      subtasks: subtasks.map(st => ({
        name: st.name,
        status: completedPhases.has(phaseNum) ? 'done' : (isCurrentPhase ? 'in_progress' : 'pending'),
      })),
    }];
  }

  return phaseTaskMap;
}

/**
 * Parse phase directories under phases/.
 * Also scans plans/ for flat plan files (NN-PLAN.md).
 */
function parsePhases(planningDir, roadmapPhases, state) {
  const phaseTaskMap = {};
  const completionEvents = [];

  // 1. Scan flat plans/ directory (NN-PLAN.md)
  const flatPlans = parseFlatPlans(planningDir, state);
  Object.assign(phaseTaskMap, flatPlans);

  // 2. Scan milestone directories (milestones/{milestone}/XX-NN-PLAN.md)
  //    then phase directories (phases/{dir}/XX-NN-PLAN.md) — phases/ overrides milestones/
  const scanDirs = [];

  // Milestones first (lower priority — will be overwritten by phases/ if both exist)
  const milestonesDir = path.join(planningDir, 'milestones');
  if (fs.existsSync(milestonesDir)) {
    try {
      const msDirs = fs.readdirSync(milestonesDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => path.join(milestonesDir, d.name));
      for (const msDir of msDirs) {
        scanDirs.push(msDir);
      }
    } catch { /* ignore */ }
  }

  // phases/ dir last (higher priority)
  const phasesDir = path.join(planningDir, 'phases');
  if (fs.existsSync(phasesDir)) {
    scanDirs.push(phasesDir);
  }

  for (const parentDir of scanDirs) {
    let phaseDirs;
    try {
      phaseDirs = fs.readdirSync(parentDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)
        .sort();
    } catch {
      phaseDirs = [];
    }

    for (const dir of phaseDirs) {
      const phaseNum = parseInt(dir.split('-')[0], 10);
      if (isNaN(phaseNum)) continue;
      const fullDir = path.join(parentDir, dir);

      let files;
      try {
        files = fs.readdirSync(fullDir).sort();
      } catch {
        continue;
      }

      const planFiles = files.filter(f => /^\d{2}-\d{2}-PLAN\.md$/i.test(f));
      const summaryFiles = files.filter(f => /^\d{2}-\d{2}-SUMMARY\.md$/i.test(f));

      if (planFiles.length === 0) continue;

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
        const { tasks: subtasks, objective } = parsePlanFile(path.join(fullDir, pf));

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
          objective,
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
  }

  // Enrich roadmap phases with task data
  let enrichedPhases;
  if (roadmapPhases.length > 0) {
    enrichedPhases = roadmapPhases.map(phase => {
      const tasks = phaseTaskMap[phase.number];
      if (tasks && tasks.length > 0) {
        return { ...phase, tasks };
      }
      return phase;
    });
  } else {
    // No roadmap — build phases from discovered plans
    const phaseNums = Object.keys(phaseTaskMap).map(Number).sort((a, b) => a - b);
    enrichedPhases = phaseNums.map(num => ({
      number: num,
      name: `Phase ${num}`,
      goal: '',
      status: phaseTaskMap[num].every(t => t.status === 'complete') ? 'complete'
        : phaseTaskMap[num].some(t => t.status === 'active') ? 'active'
        : 'up next',
      tasks: phaseTaskMap[num],
    }));
  }

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
 * Returns body field — everything after frontmatter --- closing, trimmed.
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
        const body = extractBody(content);
        pending.push({
          title: fm.title || file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '').replace(/-/g, ' '),
          created: fm.created || '',
          area: fm.area || '',
          body,
        });
      }
    } catch { /* ignore */ }
  }

  return { pending };
}

/**
 * Parse quick/ directory for quick tasks.
 * Returns body field from plan file content (stripped of frontmatter/XML).
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
    let body = '';

    if (planFile) {
      const content = safeRead(path.join(fullDir, planFile));
      const headingMatch = content.match(/^#\s+(?:Quick Task \d+:\s*)?(.+)$/m);
      if (headingMatch) {
        title = headingMatch[1].trim();
      }
      // Extract body: strip frontmatter then strip XML tags
      const rawBody = extractBody(content);
      body = stripXml(rawBody);
    }

    if (summaryFile) {
      status = 'complete';
    }

    const numMatch = dir.match(/^(\d+)/);
    const number = numMatch ? parseInt(numMatch[1], 10) : tasks.length + 1;

    tasks.push({ number, title, status, body });
  }

  return tasks;
}

/**
 * Parse .planning/codebase/CONCERNS.md.
 * Extract each ## Section heading, count items under each (lines starting with **[).
 * Returns { categories: [{ name, count }], totalCount }.
 * Empty object with empty categories and 0 totalCount if file missing.
 */
function parseConcerns(planningDir) {
  const content = safeRead(path.join(planningDir, 'codebase', 'CONCERNS.md'));
  if (!content) return { categories: [], totalCount: 0 };

  const lines = content.split('\n');
  const categories = [];
  let currentCategory = null;
  let currentItem = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Match ## heading (but not # top-level heading)
    const headingMatch = trimmed.match(/^##\s+(.+)$/);
    if (headingMatch) {
      // Save current item to category
      if (currentItem && currentCategory) {
        currentCategory.items.push(currentItem);
        currentItem = null;
      }
      // Save previous category
      if (currentCategory) {
        currentCategory.count = currentCategory.items.length;
        categories.push(currentCategory);
      }
      currentCategory = { name: headingMatch[1].trim(), count: 0, items: [] };
      continue;
    }

    // Match bold items (**Title:**) — skip **Analysis Date:**
    if (currentCategory && /^\*\*[^*]/.test(trimmed) && !/^\*\*Analysis Date/i.test(trimmed)) {
      // Save previous item
      if (currentItem) {
        currentCategory.items.push(currentItem);
      }
      // Extract title from **Title:** or **Title**
      const titleMatch = trimmed.match(/^\*\*(.+?)(?::)?\*\*\s*(.*)$/);
      currentItem = {
        title: titleMatch ? titleMatch[1].trim() : trimmed.replace(/\*\*/g, '').trim(),
        details: [],
      };
      // If there's inline text after the bold title, capture it
      if (titleMatch && titleMatch[2]) {
        currentItem.details.push(titleMatch[2].trim());
      }
      continue;
    }

    // Collect detail lines under current item (- Key: Value format or plain lines)
    if (currentItem && trimmed && !trimmed.startsWith('#')) {
      currentItem.details.push(trimmed);
    }
  }

  // Save final item and category
  if (currentItem && currentCategory) {
    currentCategory.items.push(currentItem);
  }
  if (currentCategory) {
    currentCategory.count = currentCategory.items.length;
    categories.push(currentCategory);
  }

  // Filter out empty categories
  const nonEmpty = categories.filter(cat => cat.count > 0);
  const totalCount = nonEmpty.reduce((sum, cat) => sum + cat.count, 0);

  return { categories: nonEmpty, totalCount };
}

/**
 * Scan .planning/codebase/ directory. For each .md file, get stat mtimeMs.
 * Returns { lastUpdated: ISO string of newest mtime, isStale: boolean (>7 days from now) }.
 * Returns null if directory missing.
 */
function parseCodebaseFreshness(planningDir) {
  const codebaseDir = path.join(planningDir, 'codebase');
  if (!fs.existsSync(codebaseDir)) return null;

  let files;
  try {
    files = fs.readdirSync(codebaseDir).filter(f => f.endsWith('.md'));
  } catch {
    return null;
  }

  if (files.length === 0) return null;

  let newestMtime = 0;

  for (const file of files) {
    try {
      const stat = fs.statSync(path.join(codebaseDir, file));
      if (stat.mtimeMs > newestMtime) {
        newestMtime = stat.mtimeMs;
      }
    } catch {
      // skip unreadable files
    }
  }

  if (newestMtime === 0) return null;

  const lastUpdated = new Date(newestMtime).toISOString();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const isStale = (Date.now() - newestMtime) > sevenDaysMs;

  return { lastUpdated, isStale };
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
  const concerns = parseConcerns(planningDir);
  const codebaseFreshness = parseCodebaseFreshness(planningDir);

  return {
    project,
    milestone,
    stages,
    recentActivity,
    todos,
    quickTasks,
    concerns,
    codebaseFreshness,
    lastActivity: state.lastActivity,
  };
}

module.exports = {
  parsePlanning,
  parseProject,
  parseRoadmap,
  parseState,
  parsePhases,
  parseRetros,
  parseTodos,
  parseQuickTasks,
  parseConcerns,
  parseCodebaseFreshness,
  parsePlanFile,
  parseSummaryFile,
  parseFrontmatter,
  mapStatus,
  extractObjective,
  extractBody,
  stripXml,
};
