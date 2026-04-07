'use strict';

const fs = require('fs');

/**
 * Extract the text content of an XML element from a string.
 */
function extractXmlElement(tag, text) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 's');
  const m = text.match(re);
  if (!m) return '';
  return m[1].trim();
}

/**
 * Format a Date or ISO string as YYYY-MM-DDTHH:MM:SSZ.
 */
function formatDate(dateInput) {
  if (!dateInput) return '';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Generate SUMMARY.md content for a completed plan execution.
 *
 * @param {object} config
 * @param {string} config.phaseId
 * @param {string|number} config.planNumber
 * @param {string} config.planPath
 * @param {Array<{taskName: string, success: boolean, filesModified: string[], error?: string}>} config.taskResults
 * @param {{passed: boolean, results: Array<{command, passed, output?, error?}>}} config.verificationResult
 * @param {string} config.commitHash
 * @param {Date|string} config.startTime
 * @param {Date|string} config.endTime
 * @returns {string} Full SUMMARY.md content
 */
function generateSummary(config) {
  const {
    phaseId = '',
    planNumber = '',
    planPath = '',
    taskResults = [],
    verificationResult = { passed: true, results: [] },
    commitHash = '',
    startTime,
    endTime,
  } = config;

  // Determine overall status
  const allTasksSucceeded = taskResults.every((t) => t.success);
  const verificationPassed = verificationResult && verificationResult.passed;
  const status = allTasksSucceeded && verificationPassed ? 'success' : 'partial';

  // Read plan file to extract objective
  let objective = '';
  if (planPath) {
    try {
      const planContent = fs.readFileSync(planPath, 'utf8');
      objective = extractXmlElement('objective', planContent);
    } catch (_) {
      // If plan file unreadable, leave objective blank
    }
  }

  // Collect all files modified
  const allFilesSet = new Set();
  for (const t of taskResults) {
    if (Array.isArray(t.filesModified)) {
      for (const f of t.filesModified) {
        allFilesSet.add(f);
      }
    }
  }
  const allFiles = [...allFilesSet];

  // --- Build YAML frontmatter ---
  const frontmatterLines = [
    '---',
    `phase: ${phaseId}`,
    `plan: ${planNumber}`,
    `status: ${status}`,
    `commit: ${commitHash}`,
    `started: ${formatDate(startTime)}`,
    `completed: ${formatDate(endTime)}`,
    '---',
  ];

  // --- Build body sections ---
  const bodyLines = [];

  // Objective section
  bodyLines.push('## Objective');
  bodyLines.push('');
  if (objective) {
    bodyLines.push(objective);
  } else {
    bodyLines.push('_(objective not found in plan)_');
  }
  bodyLines.push('');

  // Task outcomes section
  bodyLines.push('## Task Outcomes');
  bodyLines.push('');
  if (taskResults.length === 0) {
    bodyLines.push('No tasks executed.');
  } else {
    for (const t of taskResults) {
      const icon = t.success ? 'PASS' : 'FAIL';
      bodyLines.push(`- [${icon}] ${t.taskName}`);
      if (!t.success && t.error) {
        bodyLines.push(`  - Error: ${t.error}`);
      }
    }
  }
  bodyLines.push('');

  // Files modified section
  bodyLines.push('## Files Modified');
  bodyLines.push('');
  if (allFiles.length === 0) {
    bodyLines.push('No files recorded.');
  } else {
    for (const f of allFiles) {
      bodyLines.push(`- ${f}`);
    }
  }
  bodyLines.push('');

  // Verification results section
  bodyLines.push('## Verification Results');
  bodyLines.push('');
  const vrPassed = verificationResult && verificationResult.passed;
  bodyLines.push(`Overall: ${vrPassed ? 'PASSED' : 'FAILED'}`);
  bodyLines.push('');
  const vrResults = (verificationResult && verificationResult.results) || [];
  if (vrResults.length === 0) {
    bodyLines.push('No verification commands run.');
  } else {
    for (const r of vrResults) {
      const icon = r.passed ? 'PASS' : 'FAIL';
      bodyLines.push(`- [${icon}] \`${r.command}\``);
      if (!r.passed && r.error) {
        bodyLines.push(`  - Error: ${r.error.trim()}`);
      }
    }
  }
  bodyLines.push('');

  return [...frontmatterLines, '', ...bodyLines].join('\n');
}

module.exports = { generateSummary };
