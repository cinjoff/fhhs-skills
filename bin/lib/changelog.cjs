/**
 * Changelog — Parse CHANGELOG.md and check reconciliation tags
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { output, error, safeReadFile } = require('./core.cjs');

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

// ─── Tag extraction ──────────────────────────────────────────────────────────

function extractReconciliationTags(entries) {
  const seen = new Set();
  const result = [];

  for (const entry of entries) {
    for (const sectionName of Object.keys(entry.sections)) {
      for (const item of entry.sections[sectionName]) {
        for (const tag of item.tags) {
          if (seen.has(tag)) continue;
          seen.add(tag);

          const parts = tag.split(':');
          if (parts.length < 3 || !parts[2]) continue; // malformed tag
          result.push({
            tag,
            type: parts[0],
            check: parts[1],
            id: parts.slice(2).join(':'), // rejoin in case id contains colons
            description: item.text,
            version: entry.version,
          });
        }
      }
    }
  }

  return result;
}

// ─── Check runners ───────────────────────────────────────────────────────────

function expandHome(p) {
  if (p.startsWith('~')) return path.join(os.homedir(), p.slice(1));
  return p;
}

/** Validate tag identifiers against shell metacharacters. */
const SAFE_ID = /^[\w.@\/:~-]+$/;

function runChecks(tags, projectRoot) {
  const missing = [];
  const ok = [];
  const hasProject = projectRoot && fs.existsSync(path.join(projectRoot, '.planning'));

  for (const tag of tags) {
    const { type, check, id } = tag;
    let passed = false;

    if (type === 'project' && !hasProject) continue;

    // Reject identifiers with shell metacharacters
    if (!SAFE_ID.test(id)) {
      missing.push(tag);
      continue;
    }

    try {
      if (type === 'setup' && check === 'tool') {
        try {
          execSync('command -v ' + id, { stdio: 'pipe', shell: '/bin/sh' });
          passed = true;
        } catch {
          passed = false;
        }
      } else if (type === 'setup' && check === 'dir') {
        passed = fs.existsSync(expandHome(id));
      } else if (type === 'setup' && check === 'env') {
        const settingsContent = safeReadFile(path.join(os.homedir(), '.claude', 'settings.json'));
        if (settingsContent) {
          const parsed = JSON.parse(settingsContent);
          passed = parsed.env && parsed.env[id] !== undefined;
        }
      } else if (type === 'setup' && check === 'hook') {
        const settingsContent = safeReadFile(path.join(os.homedir(), '.claude', 'settings.json'));
        if (settingsContent) {
          const parsed = JSON.parse(settingsContent);
          if (parsed.hooks) {
            outer:
            for (const eventKey of Object.keys(parsed.hooks)) {
              const matchers = parsed.hooks[eventKey];
              if (!Array.isArray(matchers)) continue;
              for (const matcher of matchers) {
                if (!matcher.hooks || !Array.isArray(matcher.hooks)) continue;
                for (const hook of matcher.hooks) {
                  if (hook.command && hook.command.includes(id)) {
                    passed = true;
                    break outer;
                  }
                }
              }
            }
          }
        }
      } else if (type === 'setup' && check === 'plugin') {
        const pluginsContent = safeReadFile(path.join(os.homedir(), '.claude', 'plugins', 'installed_plugins.json'));
        if (pluginsContent) {
          const parsed = JSON.parse(pluginsContent);
          passed = parsed.plugins && parsed.plugins[id] !== undefined;
        }
      } else if (type === 'project' && check === 'file') {
        passed = fs.existsSync(path.join(projectRoot, id));
      } else if (type === 'project' && check === 'dir') {
        passed = fs.existsSync(path.join(projectRoot, id));
      }
    } catch {
      passed = false;
    }

    if (passed) {
      ok.push(tag);
    } else {
      missing.push(tag);
    }
  }

  return { missing, ok };
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

function cmdChangelogReconcile(changelogPath, fromVersion, toVersion, projectRoot, raw) {
  const content = safeReadFile(changelogPath);
  if (!content) {
    error('Cannot read changelog: ' + changelogPath);
  }

  const parsed = parseChangelog(content);
  const entries = getEntriesBetween(parsed, fromVersion, toVersion);
  const tags = extractReconciliationTags(entries);
  const { missing, ok } = runChecks(tags, projectRoot);

  const missingCount = missing.length;
  const summary = missingCount === 0
    ? 'All items reconciled'
    : missingCount + ' item' + (missingCount === 1 ? '' : 's') + ' need' + (missingCount === 1 ? 's' : '') + ' attention';

  output({
    from: fromVersion,
    to: toVersion,
    missing,
    ok,
    summary,
  }, raw);
}

module.exports = {
  parseChangelog,
  compareSemver,
  getEntriesBetween,
  extractReconciliationTags,
  runChecks,
  cmdChangelogReconcile,
};
