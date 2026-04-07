'use strict';

const { execSync } = require('child_process');

/**
 * Run verification commands.
 *
 * @param {Array<{command: string, expect: string}>} commands
 * @param {string} cwd
 * @returns {{ passed: boolean, results: Array<{command, passed, output?, error?}> }}
 */
function runVerification(commands, cwd) {
  if (!commands || commands.length === 0) {
    return { passed: true, results: [] };
  }

  const results = [];

  for (const { command, expect } of commands) {
    let output = '';
    let error = '';
    let exitCode = 0;

    try {
      const buf = execSync(command, { cwd, timeout: 60000, stdio: 'pipe' });
      output = buf ? buf.toString() : '';
    } catch (err) {
      exitCode = err.status !== undefined ? err.status : 1;
      output = err.stdout ? err.stdout.toString() : '';
      error = err.stderr ? err.stderr.toString() : (err.message || '');
    }

    let passed = false;

    if (!expect || expect === 'exit_0') {
      passed = exitCode === 0;
    } else if (expect.startsWith('contains:')) {
      const needle = expect.slice('contains:'.length);
      passed = output.includes(needle);
    } else {
      // Unknown expect type — treat as exit_0
      passed = exitCode === 0;
    }

    const result = { command, passed };
    if (output) result.output = output;
    if (error) result.error = error;
    results.push(result);
  }

  const passed = results.every((r) => r.passed);
  return { passed, results };
}

module.exports = { runVerification };
