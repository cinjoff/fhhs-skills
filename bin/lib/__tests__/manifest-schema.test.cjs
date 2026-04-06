'use strict';
/**
 * Unit tests for manifest-schema.cjs
 * Uses Node.js built-in assert module (no external deps required)
 */

const assert = require('assert');
const {
  MANIFEST_VERSION,
  defaultGlobalManifest,
  defaultProjectManifest,
  mergeManifests,
  validateInstallCommand,
} = require('../manifest-schema.cjs');

// ─── MANIFEST_VERSION ────────────────────────────────────────────────────────

assert.strictEqual(typeof MANIFEST_VERSION, 'string', 'MANIFEST_VERSION must be a string');
assert.ok(MANIFEST_VERSION.length > 0, 'MANIFEST_VERSION must not be empty');

// ─── defaultGlobalManifest ───────────────────────────────────────────────────

const global = defaultGlobalManifest();
assert.ok(global && typeof global === 'object', 'defaultGlobalManifest returns object');
assert.ok(Array.isArray(global.items), 'global manifest has items array');

// All items have required shape fields
for (const item of global.items) {
  assert.ok('required' in item, `item ${item.id} missing required`);
  assert.ok('status' in item, `item ${item.id} missing status`);
  assert.ok('check' in item, `item ${item.id} missing check`);
  assert.ok('id' in item, `item ${item.id} missing id`);
  assert.ok(['active', 'deprecated', 'optional'].includes(item.status), `item ${item.id} has invalid status: ${item.status}`);
  assert.ok(['tool', 'plugin', 'hook', 'env', 'dir', 'file', 'mcp'].includes(item.check), `item ${item.id} has invalid check: ${item.check}`);
}

// context-mode is deprecated with action: "remove"
const contextMode = global.items.find(i => i.id === 'context-mode');
assert.ok(contextMode, 'context-mode item must exist');
assert.strictEqual(contextMode.deprecated, true, 'context-mode must have deprecated: true');
assert.strictEqual(contextMode.action, 'remove', 'context-mode must have action: "remove"');

// claude-mem is required
const claudeMem = global.items.find(i => i.id === 'claude-mem');
assert.ok(claudeMem, 'claude-mem item must exist');
assert.strictEqual(claudeMem.required, true, 'claude-mem must be required');

// node is a required tool
const node = global.items.find(i => i.id === 'node');
assert.ok(node, 'node item must exist');
assert.strictEqual(node.required, true, 'node must be required');
assert.strictEqual(node.check, 'tool', 'node must have check: "tool"');

// ─── defaultProjectManifest ──────────────────────────────────────────────────

const project = defaultProjectManifest();
assert.ok(project && typeof project === 'object', 'defaultProjectManifest returns object');

// Stack detection fields
assert.ok('stack' in project, 'project manifest has stack section');
assert.ok('framework' in project.stack, 'project.stack has framework');
assert.ok('database' in project.stack, 'project.stack has database');
assert.ok('auth' in project.stack, 'project.stack has auth');
assert.ok('testing' in project.stack, 'project.stack has testing');
assert.ok('packageManager' in project.stack, 'project.stack has packageManager');

// Features
assert.ok('features' in project, 'project manifest has features section');
assert.ok('planning' in project.features, 'project.features has planning');
assert.ok('conductor' in project.features, 'project.features has conductor');
assert.ok('startup' in project.features, 'project.features has startup');

// Planning state
assert.ok('planning' in project, 'project manifest has planning section');
assert.ok('hasRoadmap' in project.planning, 'project.planning has hasRoadmap');
assert.ok('hasCLAUDE' in project.planning, 'project.planning has hasCLAUDE');
assert.ok('hasConductorJson' in project.planning, 'project.planning has hasConductorJson');

// ─── mergeManifests ──────────────────────────────────────────────────────────

const baseGlobal = defaultGlobalManifest();
const overrideProject = {
  _overrides: {
    items: [{ id: 'node', install: 'custom-node-install' }],
  },
  stack: { framework: 'next', database: null, auth: null, testing: 'jest', packageManager: 'pnpm' },
  features: { planning: true, conductor: false, startup: false },
  planning: { hasRoadmap: true, hasCLAUDE: true, hasConductorJson: false },
};

const merged = mergeManifests(baseGlobal, overrideProject);
assert.ok(merged && typeof merged === 'object', 'mergeManifests returns object');

// Project stack values should win
assert.strictEqual(merged.stack.framework, 'next', 'project stack.framework wins');
assert.strictEqual(merged.stack.packageManager, 'pnpm', 'project stack.packageManager wins');
assert.strictEqual(merged.features.conductor, false, 'project features.conductor wins');
assert.strictEqual(merged.planning.hasRoadmap, true, 'project planning.hasRoadmap wins');

// Global items still present
assert.ok(Array.isArray(merged.items), 'merged has items array');
assert.ok(merged.items.length > 0, 'merged items not empty');

// Test that plain project properties override global
const g2 = { items: [{ id: 'foo', required: true, status: 'active', check: 'tool', install: null, since: null, deprecated: null, action: null, reason: null }], version: '1.0' };
const p2 = { version: '2.0', stack: { framework: 'react' } };
const m2 = mergeManifests(g2, p2);
assert.strictEqual(m2.version, '2.0', 'project version wins over global');

// ─── validateInstallCommand ───────────────────────────────────────────────────

// Safe commands
assert.strictEqual(validateInstallCommand(null), true, 'null install is valid (manual)');
assert.strictEqual(validateInstallCommand('npm install -g typescript'), true, 'npm install is valid');
assert.strictEqual(validateInstallCommand('pnpm install -g typescript'), true, 'pnpm install is valid');
assert.strictEqual(validateInstallCommand('claude plugin install claude-mem'), true, 'claude plugin install is valid');
assert.strictEqual(validateInstallCommand('pnpm install -g typescript-language-server typescript'), true, 'pnpm multi-package is valid');
assert.strictEqual(validateInstallCommand('npm install -g @scope/package'), true, 'scoped npm package is valid');

// Safe curl | bash patterns (known installers)
assert.strictEqual(validateInstallCommand('curl -fsSL https://bun.sh/install | bash'), true, 'curl -fsSL https pipe bash is valid');
assert.strictEqual(validateInstallCommand('curl -fsSL https://example.com/install.sh | bash'), true, 'curl -fsSL any https pipe bash is valid');

// Unsafe commands (arbitrary shell)
assert.strictEqual(validateInstallCommand('rm -rf /'), false, 'rm command is invalid');
assert.strictEqual(validateInstallCommand('curl https://example.com | bash'), false, 'curl pipe bash without -fsSL is invalid');
assert.strictEqual(validateInstallCommand('echo "evil" > /etc/hosts'), false, 'echo redirect is invalid');
assert.strictEqual(validateInstallCommand('; malicious'), false, 'semicolon injection is invalid');
assert.strictEqual(validateInstallCommand('`cmd`'), false, 'backtick execution is invalid');
assert.strictEqual(validateInstallCommand('$(evil)'), false, 'subshell expansion is invalid');

console.log('All manifest-schema tests passed.');
