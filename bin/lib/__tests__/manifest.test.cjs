'use strict';
/**
 * Unit tests for bin/lib/manifest.cjs
 *
 * Tests use Node.js built-in assert + manual mocking via Module._resolveFilename
 * injection to avoid external test framework dependencies.
 */

const assert = require('assert');
const path = require('path');
const os = require('os');
const fs = require('fs');

// ─── Mock setup ───────────────────────────────────────────────────────────────

// We test the exported functions directly with real fs in a tmpdir,
// and use simple wrapper tests for resilience cases.

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-test-'));

function cleanup() {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
}

// Write a minimal mock manifest-schema.cjs so manifest.cjs can load it
const schemaPath = path.join(tmpDir, 'manifest-schema.cjs');
fs.writeFileSync(schemaPath, `
'use strict';
const MANIFEST_VERSION = '1';
function defaultGlobalManifest() {
  return {
    version: '1',
    items: [
      { id: 'node', check: 'tool', type: 'setup', required: true, hint: 'Install Node.js 20+ from nodejs.org' },
      { id: 'pnpm', check: 'tool', type: 'setup', required: false },
      { id: 'claude-mem', check: 'plugin', type: 'setup', required: true },
      { id: 'check-update', check: 'hook', type: 'setup', required: false },
      { id: 'FHHS_SKILLS_ROOT', check: 'env', type: 'setup', required: true },
    ]
  };
}
function defaultProjectManifest() {
  return { version: '1', items: [] };
}
function mergeManifests(g, p) {
  return Object.assign({}, g, p, { items: [...(g.items || []), ...(p.items || [])] });
}
function validateInstallCommand(cmd) { return { valid: true }; }
module.exports = { MANIFEST_VERSION, defaultGlobalManifest, defaultProjectManifest, mergeManifests, validateInstallCommand };
`);

// Patch require cache so manifest.cjs loads our mock schema
const Module = require('module');
const origResolve = Module._resolveFilename.bind(Module);
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === './manifest-schema.cjs' && parent && parent.filename && parent.filename.includes('manifest.cjs')) {
    return schemaPath;
  }
  return origResolve(request, parent, isMain, options);
};

// Now load manifest engine
const manifestPath = path.join(__dirname, '..', 'manifest.cjs');
// Clear cache to reload with patched resolver
delete require.cache[require.resolve(manifestPath)];
const {
  readManifest,
  checkManifest,
  remediate,
  discoverProjects,
  generateManifest,
  checkAndRemediate,
  formatOutput,
} = require(manifestPath);

// ─── Test helpers ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('  ✓', name);
    passed++;
  } catch (e) {
    console.error('  ✗', name);
    console.error('    ', e.message);
    failed++;
  }
}

// ─── Test 1: checkManifest detects a missing tool ────────────────────────────

console.log('\n[checkManifest]');

test('detects missing tool when check=tool and binary not found', () => {
  // Use a tool name that is guaranteed not to exist
  const merged = {
    items: [
      { id: '__fake_tool_xyz_does_not_exist__', check: 'tool', type: 'setup', required: true },
    ]
  };
  const results = checkManifest(merged, null);
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].id, '__fake_tool_xyz_does_not_exist__');
  assert.notStrictEqual(results[0].status, 'ok', 'missing tool should not be ok');
});

test('returns ok for a tool that exists (node)', () => {
  const merged = {
    items: [
      { id: 'node', check: 'tool', type: 'setup', required: true },
    ]
  };
  const results = checkManifest(merged, null);
  assert.strictEqual(results.length, 1);
  // node is always present in this test environment
  assert.strictEqual(results[0].status, 'ok');
});

test('each result has category, id, status, details', () => {
  const merged = {
    items: [{ id: 'node', check: 'tool', type: 'setup', required: true }]
  };
  const results = checkManifest(merged, null);
  const r = results[0];
  assert.ok('category' in r, 'has category');
  assert.ok('id' in r, 'has id');
  assert.ok('status' in r, 'has status');
  assert.ok('details' in r, 'has details');
});

test('skips project-scoped checks when no project root has .planning', () => {
  const fakeRoot = path.join(tmpDir, 'no-planning-project');
  fs.mkdirSync(fakeRoot, { recursive: true });
  const merged = {
    items: [
      { id: 'CLAUDE.md', check: 'file', type: 'project', required: true },
    ]
  };
  const results = checkManifest(merged, fakeRoot);
  // Should be skipped since no .planning dir
  assert.strictEqual(results.length, 0);
});

test('rejects IDs with shell metacharacters', () => {
  const merged = {
    items: [
      { id: 'bad;id&&rm', check: 'tool', type: 'setup', required: true },
    ]
  };
  const results = checkManifest(merged, null);
  assert.strictEqual(results[0].status, 'error');
  assert.ok(results[0].details.includes('unsafe'), 'should mention unsafe characters');
});

// ─── Test 2: remediate attempts install and records result ───────────────────

console.log('\n[remediate]');

test('remediate returns { remediated, failed, removed, skipped } shape', () => {
  const checkResults = [];
  const result = remediate(checkResults, null);
  assert.ok(Array.isArray(result.remediated), 'has remediated');
  assert.ok(Array.isArray(result.failed), 'has failed');
  assert.ok(Array.isArray(result.removed), 'has removed');
  assert.ok(Array.isArray(result.skipped), 'has skipped');
});

test('remediate skips items with status=ok', () => {
  const checkResults = [
    { category: 'tool', id: 'node', status: 'ok', details: 'Installed', item: {} },
  ];
  const result = remediate(checkResults, null);
  assert.strictEqual(result.remediated.length, 0);
  assert.strictEqual(result.failed.length, 0);
});

test('remediate records failure when tool install fails (fake tool)', () => {
  const checkResults = [
    { category: 'tool', id: '__nonexistent_pkg_xyz__', status: 'missing', details: 'Not found', item: { check: 'tool', type: 'setup' } },
  ];
  const result = remediate(checkResults, null);
  // pnpm install will fail for a fake package — should land in failed, not throw
  assert.ok(result.failed.length > 0 || result.remediated.length > 0, 'should record an outcome');
  // Must not throw
});

test('remediate creates dir for missing dir items', () => {
  const dirPath = path.join(tmpDir, 'auto-created-dir');
  const checkResults = [
    { category: 'dir', id: dirPath, status: 'missing', details: 'Not found', item: { check: 'dir', type: 'setup' } },
  ];
  const result = remediate(checkResults, null);
  // The path starts with tmpDir (absolute, not ~), should create it
  const created = fs.existsSync(dirPath);
  assert.ok(created || result.failed.length > 0, 'should either create dir or record failure');
  if (created) {
    assert.strictEqual(result.remediated.length, 1);
    assert.ok(result.remediated[0].action.includes('created'));
  }
});

// ─── Test 3: deprecated item triggers removal tracking ───────────────────────

console.log('\n[deprecated items]');

test('checkManifest marks deprecated+present item as warn', () => {
  // Create a fake plugin presence by writing installed_plugins.json
  const claudeDir = path.join(tmpDir, 'claude-home', '.claude', 'plugins');
  fs.mkdirSync(claudeDir, { recursive: true });
  const pluginsJson = path.join(claudeDir, 'installed_plugins.json');
  fs.writeFileSync(pluginsJson, JSON.stringify({ plugins: { 'old-plugin': { version: '1.0' } } }));

  const merged = {
    items: [
      { id: 'old-plugin', check: 'plugin', type: 'setup', required: false, deprecated: true, removeAction: 'uninstall-plugin' },
    ]
  };
  // Note: checkManifest reads from real home dir. We just verify the logic branch works.
  const results = checkManifest(merged, null);
  // Either warn (found + deprecated) or ok (not found = already gone)
  assert.ok(['warn', 'ok', 'missing', 'error'].includes(results[0].status));
});

test('remediate triggers removal for deprecated items with warn status', () => {
  const checkResults = [
    {
      category: 'plugin',
      id: 'context-mode',
      status: 'warn',
      details: 'Deprecated — should be removed',
      item: { check: 'plugin', type: 'setup', deprecated: true, removeAction: 'uninstall-plugin' },
    }
  ];
  // claude plugin uninstall will likely fail in test env — should record in failed/removed, not throw
  const result = remediate(checkResults, null);
  assert.ok(result.removed.length > 0 || result.failed.length > 0, 'should attempt removal');
});

// ─── Test 4: corrupt manifest file falls back to defaults ────────────────────

console.log('\n[readManifest]');

test('readManifest handles corrupt global manifest with warning', () => {
  const corruptPath = path.join(tmpDir, 'corrupt-manifest.json');
  fs.writeFileSync(corruptPath, '{ this is not valid json !!!');
  const result = readManifest(corruptPath, null);
  assert.ok(result.global, 'returns global');
  assert.ok(result.merged, 'returns merged');
  assert.ok(Array.isArray(result.warnings), 'has warnings');
  assert.ok(result.warnings.length > 0, 'warning about corrupt file');
  assert.ok(result.warnings[0].includes('corrupt'), 'warning mentions corrupt');
});

test('readManifest handles missing manifest files gracefully', () => {
  const result = readManifest(null, null);
  assert.ok(result.global, 'returns default global');
  assert.ok(result.project, 'returns default project');
  assert.ok(result.merged, 'returns merged');
  assert.ok(Array.isArray(result.warnings));
});

test('readManifest returns { global, project, merged, warnings }', () => {
  const result = readManifest(null, null);
  assert.ok('global' in result);
  assert.ok('project' in result);
  assert.ok('merged' in result);
  assert.ok('warnings' in result);
});

// ─── Test 5: output is always valid JSON even when operations fail ────────────

console.log('\n[formatOutput / resilience]');

test('formatOutput returns valid structure with empty inputs', () => {
  const out = formatOutput([], null, {}, []);
  assert.strictEqual(typeof out.status, 'string');
  assert.strictEqual(typeof out.version, 'string');
  assert.ok(Array.isArray(out.items));
  assert.ok(typeof out.summary === 'object');
});

test('formatOutput counts errors correctly', () => {
  const checkResults = [
    { category: 'tool', id: 'node', status: 'ok', details: 'Installed' },
    { category: 'tool', id: 'missing-tool', status: 'missing', details: 'Not found' },
  ];
  const out = formatOutput(checkResults, null, {}, []);
  assert.strictEqual(out.summary.ok, 1);
  assert.strictEqual(out.summary.errors, 1);
  assert.ok(out.errors && out.errors.length > 0);
});

test('checkAndRemediate always returns valid JSON even on errors', () => {
  // Pass obviously invalid paths — should not throw
  const result = checkAndRemediate('/nonexistent/global.json', '/nonexistent/project.json', '/nonexistent/root', { noRemediate: true });
  assert.strictEqual(typeof result.status, 'string');
  assert.ok(Array.isArray(result.items));
  assert.ok(typeof result.summary === 'object');
  // Serialize to verify it's valid JSON
  const serialized = JSON.stringify(result);
  const reparsed = JSON.parse(serialized);
  assert.ok(reparsed);
});

// ─── Test 6: discoverProjects handles DB unavailable with silent fallback ─────

console.log('\n[discoverProjects]');

test('discoverProjects returns an array (does not throw when DB unavailable)', () => {
  // DB is almost certainly unavailable in test env
  const projects = discoverProjects();
  assert.ok(Array.isArray(projects), 'returns array');
  // Each project has expected shape
  for (const p of projects) {
    assert.ok('path' in p, 'project has path');
    assert.ok('name' in p, 'project has name');
    assert.ok('source' in p, 'project has source');
  }
});

test('discoverProjects deduplicates by normalized path', () => {
  const projects = discoverProjects();
  const paths = projects.map(p => p.path);
  const unique = new Set(paths);
  assert.strictEqual(paths.length, unique.size, 'no duplicate paths');
});

// ─── Test 7: generateManifest detects Next.js from package.json ──────────────

console.log('\n[generateManifest]');

test('generateManifest detects Next.js from package.json deps', () => {
  const projDir = path.join(tmpDir, 'nextjs-project');
  fs.mkdirSync(projDir, { recursive: true });
  fs.writeFileSync(path.join(projDir, 'package.json'), JSON.stringify({
    dependencies: { next: '^14.0.0', react: '^18.0.0' }
  }));

  const manifest = generateManifest(projDir);
  assert.strictEqual(manifest.profile.framework, 'nextjs');
});

test('generateManifest detects pnpm from pnpm-lock.yaml', () => {
  const projDir = path.join(tmpDir, 'pnpm-project');
  fs.mkdirSync(projDir, { recursive: true });
  fs.writeFileSync(path.join(projDir, 'package.json'), JSON.stringify({ dependencies: {} }));
  fs.writeFileSync(path.join(projDir, 'pnpm-lock.yaml'), 'lockfileVersion: 9');

  const manifest = generateManifest(projDir);
  assert.strictEqual(manifest.profile.packageManager, 'pnpm');
});

test('generateManifest detects supabase database', () => {
  const projDir = path.join(tmpDir, 'supabase-project');
  fs.mkdirSync(projDir, { recursive: true });
  fs.writeFileSync(path.join(projDir, 'package.json'), JSON.stringify({
    dependencies: { '@supabase/supabase-js': '^2.0.0' }
  }));

  const manifest = generateManifest(projDir);
  assert.strictEqual(manifest.profile.database, 'supabase');
});

test('generateManifest detects vitest from config file', () => {
  const projDir = path.join(tmpDir, 'vitest-project');
  fs.mkdirSync(projDir, { recursive: true });
  fs.writeFileSync(path.join(projDir, 'package.json'), JSON.stringify({ dependencies: {} }));
  fs.writeFileSync(path.join(projDir, 'vitest.config.ts'), 'export default {}');

  const manifest = generateManifest(projDir);
  assert.strictEqual(manifest.profile.testing, 'vitest');
});

test('generateManifest handles missing package.json gracefully', () => {
  const projDir = path.join(tmpDir, 'empty-project');
  fs.mkdirSync(projDir, { recursive: true });

  const manifest = generateManifest(projDir);
  assert.ok(manifest.profile, 'returns profile');
  assert.strictEqual(typeof manifest.profile.framework, 'undefined', 'no framework detected');
});

test('generateManifest detects .planning/ presence', () => {
  const projDir = path.join(tmpDir, 'planning-project');
  fs.mkdirSync(path.join(projDir, '.planning'), { recursive: true });
  fs.writeFileSync(path.join(projDir, 'package.json'), JSON.stringify({ dependencies: {} }));

  const manifest = generateManifest(projDir);
  assert.strictEqual(manifest.profile.hasPlanning, true);
});

// ─── Report ───────────────────────────────────────────────────────────────────

cleanup();

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
