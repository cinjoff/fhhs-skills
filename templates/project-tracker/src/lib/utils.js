export function relativeTime(dateStr) {
  if (!dateStr) return '';
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return '';
  const diff = Math.floor((Date.now() - then) / 1000);
  if (diff < 10) return 'just now';
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  const days = Math.floor(diff / 86400);
  if (days === 1) return '1d ago';
  if (days < 30) return days + 'd ago';
  return new Date(dateStr).toLocaleDateString();
}

export function daysBetween(dateStr) {
  if (!dateStr) return Infinity;
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return Infinity;
  return Math.floor((Date.now() - then) / 86400000);
}

export function mapStatus(s) {
  if (!s) return 'pending';
  const l = s.toLowerCase();
  if (l === 'complete' || l === 'completed' || l === 'done' || l === 'code_complete' || l === 'code-complete') return 'done';
  if (l === 'active' || l === 'in_progress') return 'active';
  if (l === 'deferred' || l === 'superseded') return 'deferred';
  if (l === 'failed' || l === 'blocked') return 'failed';
  return 'pending';
}

/** Get status color token name */
export function statusColor(status) {
  const s = mapStatus(status);
  if (s === 'done') return 'var(--color-status-done)';
  if (s === 'active') return 'var(--color-status-active)';
  if (s === 'failed') return 'var(--color-status-error)';
  return 'var(--color-status-pending)';
}

/** Get status icon */
export function statusIcon(status) {
  const s = mapStatus(status);
  if (s === 'done') return '\u2713'; // ✓
  if (s === 'active') return '\u25CF'; // ●
  if (s === 'failed') return '\u2717'; // ✗
  return '\u25CB'; // ○
}

export function extractProblemSection(body) {
  if (!body) return '';
  const match = body.match(/##\s*Problem\s*\n([\s\S]*?)(?=\n##\s|\n---|\s*$)/i);
  return match ? match[1].trim() : '';
}

export function extractFirstParagraph(body) {
  if (!body) return '';
  const trimmed = body.trim();
  const idx = trimmed.indexOf('\n\n');
  return idx > 0 ? trimmed.slice(0, idx).trim() : trimmed;
}

export function groupByMilestone(stages) {
  const groups = [];
  const map = {};
  for (const s of stages) {
    const key = s.milestoneName || s.goal || 'Phases';
    if (!map[key]) {
      map[key] = { name: key, phases: [] };
      groups.push(map[key]);
    }
    map[key].phases.push(s);
  }
  return groups;
}

export function copyToClipboard(text, showToast) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied');
  }).catch(() => {
    showToast('Copy failed');
  });
}

/**
 * Group projects by project name (not worktree).
 * Projects with the same repo root are grouped together.
 */
export function groupProjectsByRepo(projects) {
  if (!Array.isArray(projects)) return [];
  const map = {};
  const groups = [];

  for (const p of projects) {
    // Use project name (from git) as grouping key
    const key = p.projectName || p.name || p.id;
    if (!map[key]) {
      map[key] = { name: key, worktrees: [], hasAuto: false };
      groups.push(map[key]);
    }
    map[key].worktrees.push(p);
    if (p.autoState && p.autoState.active) {
      map[key].hasAuto = true;
    }
  }

  return groups;
}

/**
 * Calculate aggregate completion across all phases.
 */
export function aggregateCompletion(phases) {
  if (!Array.isArray(phases) || phases.length === 0) return { done: 0, total: 0, pct: 0 };
  let done = 0;
  const total = phases.length;
  for (const p of phases) {
    const s = mapStatus(p.status);
    if (s === 'done') done++;
  }
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

/**
 * Format a cost value as dollars.
 */
export function formatCost(val) {
  if (val == null || isNaN(val)) return '$0.00';
  return '$' + Number(val).toFixed(2);
}

/**
 * Format duration in ms to human-readable.
 */
export function formatDuration(ms) {
  if (!ms || ms < 0) return '0s';
  if (ms < 60000) return Math.round(ms / 1000) + 's';
  const min = Math.floor(ms / 60000);
  const sec = Math.round((ms % 60000) / 1000);
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}
