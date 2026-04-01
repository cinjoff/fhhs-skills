/**
 * Changelog — Parse CHANGELOG.md and extract version entries
 *
 * Note: reconciliation check logic (runChecks, extractReconciliationTags,
 * cmdChangelogReconcile) has been absorbed into bin/lib/manifest.cjs.
 */

// ─── Semver comparison ───────────────────────────────────────────────────────

function compareSemver(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// ─── Changelog parsing ──────────────────────────────────────────────────────

function parseChangelog(content) {
  const entries = [];
  const lines = content.split('\n');
  let current = null;
  let currentSection = null;

  for (const line of lines) {
    // Match version headers: ## [X.Y.Z] - YYYY-MM-DD
    const versionMatch = line.match(/^## \[(\d+\.\d+\.\d+)\]\s*-\s*(\d{4}-\d{2}-\d{2})/);
    if (versionMatch) {
      current = { version: versionMatch[1], date: versionMatch[2], sections: {} };
      entries.push(current);
      currentSection = null;
      continue;
    }

    if (!current) continue;

    // Match section headers: ### Added/Changed/Fixed/Removed
    const sectionMatch = line.match(/^### (Added|Changed|Fixed|Removed|Deprecated|Security)/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      if (!current.sections[currentSection]) {
        current.sections[currentSection] = [];
      }
      continue;
    }

    // Skip non-bullet lines or lines without a current section
    if (!currentSection || !line.match(/^- /)) continue;

    // Parse bullet: - **bold** — description [tag:type:id]
    const bullet = line.replace(/^- /, '');
    const tags = [];
    const tagPattern = /\[(setup|project):[^\]]+\]/g;
    let tagMatch;
    while ((tagMatch = tagPattern.exec(bullet)) !== null) {
      tags.push(tagMatch[0].slice(1, -1)); // strip brackets
    }
    const text = bullet.replace(/\s*\[(setup|project):[^\]]+\]/g, '').trim();

    current.sections[currentSection].push({ text, tags });
  }

  return entries;
}

// ─── Version range filtering ─────────────────────────────────────────────────

function getEntriesBetween(parsed, fromVersion, toVersion) {
  return parsed.filter(entry => {
    return compareSemver(entry.version, fromVersion) > 0 &&
           compareSemver(entry.version, toVersion) <= 0;
  });
}

module.exports = {
  parseChangelog,
  compareSemver,
  getEntriesBetween,
};
