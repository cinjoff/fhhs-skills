export function relativeTime(dateStr) {
  if (!dateStr) return '';
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return '';
  const diff = Math.floor((Date.now() - then) / 1000);
  if (diff < 10) return 'now';
  if (diff < 60) return diff + 's';
  if (diff < 3600) return Math.floor(diff / 60) + 'm';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h';
  const days = Math.floor(diff / 86400);
  if (days === 1) return '1d';
  if (days < 30) return days + 'd';
  return new Date(dateStr).toLocaleDateString();
}

export function daysBetween(dateStr) {
  if (!dateStr) return Infinity;
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return Infinity;
  return Math.floor((Date.now() - then) / 86400000);
}

export function mapStatus(s) {
  if (!s) return 'n';
  const l = s.toLowerCase();
  if (l === 'complete' || l === 'completed' || l === 'done' || l === 'code_complete' || l === 'code-complete') return 'c';
  if (l === 'active' || l === 'in_progress') return 'a';
  if (l === 'deferred' || l === 'superseded') return 'd';
  return 'n';
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
    showToast('Copied!');
  }).catch(() => {
    showToast('Copy failed');
  });
}
