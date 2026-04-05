#!/usr/bin/env node
'use strict';

/**
 * Regression tests for gsd-tools.cjs lazy loading.
 *
 * Verifies:
 * 1. Basic CLI smoke: generate-slug succeeds
 * 2. Unknown command fails with expected error
 * 3. No top-level requires of lazy-loaded lib modules
 *
 * Run: node bin/gsd-tools.test.cjs
 */

const assert = require('assert');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TOOLS = path.join(__dirname, 'gsd-tools.cjs');
const SOURCE = fs.readFileSync(TOOLS, 'utf8');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message}`);
    failed++;
  }
}

// ── Test 1: basic smoke — generate-slug succeeds ──────────────────────────────

test('generate-slug returns a slug', () => {
  const raw = execSync(`node "${TOOLS}" generate-slug "Hello World"`, {
    encoding: 'utf8',
  }).trim();
  assert.ok(raw.length > 0, 'Expected non-empty output');

  // Output may be plain text or JSON — handle both
  let slug;
  try {
    const parsed = JSON.parse(raw);
    slug = parsed.slug || parsed;
  } catch {
    slug = raw;
  }
  assert.ok(
    typeof slug === 'string' && /^[a-z0-9-]+$/.test(slug),
    `Expected URL-safe slug, got: ${raw}`
  );
});

// ── Test 2: unknown command exits non-zero ────────────────────────────────────

test('NONEXISTENT command exits with non-zero status', () => {
  let threw = false;
  try {
    execSync(`node "${TOOLS}" NONEXISTENT`, { encoding: 'utf8', stdio: 'pipe' });
  } catch (err) {
    threw = true;
    assert.ok(
      err.status !== 0,
      `Expected non-zero exit, got ${err.status}`
    );
  }
  assert.ok(threw, 'Expected command to throw (non-zero exit)');
});

// ── Test 3: static check — no top-level requires of lazy-loaded modules ───────

test('no top-level require() of lazy-loaded lib modules', () => {
  // Extract only the lines before `async function main()`
  const mainIdx = SOURCE.indexOf('\nasync function main()');
  assert.ok(mainIdx !== -1, 'Could not find async function main() in source');
  const preamble = SOURCE.slice(0, mainIdx);

  // Modules that must NOT appear as top-level requires
  const forbidden = [
    'state.cjs',
    'phase.cjs',
    'roadmap.cjs',
    'verify.cjs',
    'config.cjs',
    'template.cjs',
    'milestone.cjs',
    'commands.cjs',
    'init.cjs',
    'frontmatter.cjs',
    'changelog.cjs',
  ];

  const violations = forbidden.filter(mod => {
    // Match require('...mod...') patterns in preamble
    return new RegExp(`require\\([^)]*${mod.replace('.', '\\.')}[^)]*\\)`).test(preamble);
  });

  assert.strictEqual(
    violations.length,
    0,
    `Found top-level requires of lazy-loaded modules: ${violations.join(', ')}`
  );
});

test('only fs, path, and core.cjs are top-level requires', () => {
  const mainIdx = SOURCE.indexOf('\nasync function main()');
  assert.ok(mainIdx !== -1, 'Could not find async function main() in source');
  const preamble = SOURCE.slice(0, mainIdx);

  // Find all require() calls in the preamble
  const requirePattern = /require\(['"]([^'"]+)['"]\)/g;
  const found = [];
  let m;
  while ((m = requirePattern.exec(preamble)) !== null) {
    found.push(m[1]);
  }

  const allowed = new Set(['fs', 'path', './lib/core.cjs']);
  const unexpected = found.filter(dep => !allowed.has(dep));

  assert.strictEqual(
    unexpected.length,
    0,
    `Unexpected top-level requires in preamble: ${unexpected.join(', ')}`
  );
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('');

if (failed > 0) {
  process.exit(1);
}
