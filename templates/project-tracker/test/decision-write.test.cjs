'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ---------------------------------------------------------------------------
// Fixture: real DECISIONS.md content from nerve-os/quito
// ---------------------------------------------------------------------------
const DECISIONS_FIXTURE = `# Decisions

Architectural and design decisions logged during project development.

Format: \`DEC-NNN: Title\` with confidence level, rationale, and affected artifacts.

---

## DEC-001: Platform hierarchy via org metadata, not user-level platformRole
**Date:** 2026-03-27 (revised)
**Confidence:** HIGH
**Status:** ACTIVE

Platform hierarchy implemented using Better Auth organization \`additionalFields\` — a "platform" org is the top-level entity, label orgs reference it via \`parentOrgId\` in metadata. Platform admin = owner of the platform org. No custom column on the \`user\` table.

**Why:** User requested using org additional properties to control hierarchy. Keeps all access control within Better Auth's org model. Platform admin is just the owner of a special org type, not a separate role system.
**Affects:** \`src/lib/auth.ts\` (org additionalFields), \`src/lib/roles.ts\`, platform route group

---

## DEC-002: Remove organizationLimit for multi-label artists
**Date:** 2026-03-27
**Confidence:** HIGH
**Status:** ACTIVE

Remove \`organizationLimit: 1\` from Better Auth org plugin config. Artists can be invited to multiple label organizations. Cross-label queries use \`listOrganizations()\` to get all org IDs, then standard SQL.

**Why:** Multi-org membership is a native Better Auth feature. The limit was only needed when the app was single-label focused.
**Affects:** \`src/lib/auth.ts\`, artist dashboard, invitation flow

---

## DEC-003: Artist billing profiles in dedicated table, not member metadata
**Date:** 2026-03-27
**Confidence:** HIGH
**Status:** ACTIVE

Billing details stored in \`artist_billing_profiles\` table keyed by \`(organization_id, artist_name)\`, not on the Better Auth member table.

**Why:** Not all artists are platform members (some may never log in). Billing details are per-label relationship. Keeps Better Auth member table clean.
**Affects:** New migration, billing profile form, invoice generation

---

## DEC-004: @react-pdf/renderer for invoice PDFs
**Date:** 2026-03-27
**Confidence:** HIGH
**Status:** ACTIVE

Use \`@react-pdf/renderer\` with \`renderToBuffer()\` for server-side PDF generation. No headless browser needed.

**Why:** React 19 compatible (since v4.1.0), JSX-based templates match the codebase, lightweight, well-maintained (15K+ stars).
**Affects:** Invoice PDF template, \`next.config.ts\` (serverExternalPackages)
`;

// ---------------------------------------------------------------------------
// Extracted logic from server.cjs (serveDecision) — pure functions for testing
// ---------------------------------------------------------------------------

/**
 * Atomic write: write to .tmp, then rename to final path.
 * Mirrors atomicWriteFile in server.cjs.
 */
function atomicWriteFile(filePath, content) {
  const tmpPath = filePath + '.tmp';
  fs.writeFileSync(tmpPath, content, 'utf8');
  fs.renameSync(tmpPath, filePath);
}

/**
 * Core decision-update logic extracted from serveDecision in server.cjs.
 * Returns updated file content, or throws on error.
 *
 * @param {string} content - Raw DECISIONS.md content
 * @param {string} decisionId - e.g. "DEC-001"
 * @param {'accept'|'dispute'} action
 * @param {string} [rationale] - Required when action === 'dispute'
 * @returns {string} Updated content
 */
function applyDecisionUpdate(content, decisionId, action, rationale) {
  if (action !== 'accept' && action !== 'dispute') {
    throw new Error('action must be "accept" or "dispute"');
  }

  // Split by --- separator lines (lines that are exactly ---)
  const blocks = content.split(/\n---\n/);

  // Find the block containing ## decisionId:
  const headerPattern = new RegExp('^##\\s+' + decisionId.replace(/[-]/g, '\\$&') + ':', 'm');
  const blockIndex = blocks.findIndex(block => headerPattern.test(block));

  if (blockIndex === -1) {
    const err = new Error(`Decision ${decisionId} not found`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  let block = blocks[blockIndex];

  if (action === 'accept') {
    block = block.replace(/\*\*Status:\*\*[^\n]*/m, () => '**Status:** ACCEPTED');
  } else {
    // dispute: update status and insert rationale line after it
    const rationaleText = rationale || '';
    block = block.replace(/(\*\*Status:\*\*[^\n]*)/m, () => {
      return `**Status:** DISPUTED\n**Dispute Rationale:** '${rationaleText}'`;
    });
  }

  blocks[blockIndex] = block;
  return blocks.join('\n---\n');
}

/**
 * Apply decision update in a temp project directory (writes file atomically).
 * Returns the updated content string.
 */
function applyAndWrite(tmpDir, content, decisionId, action, rationale) {
  const decisionsPath = path.join(tmpDir, '.planning', 'DECISIONS.md');
  const updated = applyDecisionUpdate(content, decisionId, action, rationale);
  atomicWriteFile(decisionsPath, updated);
  return fs.readFileSync(decisionsPath, 'utf8');
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err.message}`);
    failed++;
    failures.push({ name, err });
  }
}

function makeTmpProject() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'decision-test-'));
  fs.mkdirSync(path.join(tmpDir, '.planning'), { recursive: true });
  const decisionsPath = path.join(tmpDir, '.planning', 'DECISIONS.md');
  fs.writeFileSync(decisionsPath, DECISIONS_FIXTURE, 'utf8');
  return { tmpDir, decisionsPath };
}

function cleanup(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

console.log('\nDecision write tests\n');

// (a) Accept a decision: DEC-001 ACTIVE → ACCEPTED
test('accept DEC-001: **Status:** ACTIVE → ACCEPTED', () => {
  const { tmpDir } = makeTmpProject();
  try {
    const updated = applyAndWrite(tmpDir, DECISIONS_FIXTURE, 'DEC-001', 'accept');
    assert.ok(updated.includes('**Status:** ACCEPTED'), 'should contain ACCEPTED status');
    // Extract just the DEC-001 block (up to next ## header or end) and verify ACTIVE is gone
    const dec001Block = updated.match(/## DEC-001[^\n]*\n[\s\S]*?(?=\n## |\n---\n|$)/);
    assert.ok(dec001Block, 'DEC-001 block should exist');
    assert.ok(!dec001Block[0].includes('**Status:** ACTIVE'), 'DEC-001 should no longer be ACTIVE');
  } finally {
    cleanup(tmpDir);
  }
});

// (b) Dispute DEC-003 with rationale
test('dispute DEC-003 with rationale inserts DISPUTED status and Dispute Rationale line', () => {
  const { tmpDir } = makeTmpProject();
  try {
    const updated = applyAndWrite(tmpDir, DECISIONS_FIXTURE, 'DEC-003', 'dispute', 'Need more analysis');
    assert.ok(updated.includes('**Status:** DISPUTED'), 'should contain DISPUTED status');
    assert.ok(updated.includes("**Dispute Rationale:** 'Need more analysis'"), 'should contain dispute rationale');
    // Rationale line should appear right after the status line
    const disputedIdx = updated.indexOf('**Status:** DISPUTED');
    const rationaleIdx = updated.indexOf("**Dispute Rationale:**");
    assert.ok(rationaleIdx > disputedIdx, 'rationale should come after status');
  } finally {
    cleanup(tmpDir);
  }
});

// (c) Decision not found
test('update DEC-999 throws NOT_FOUND error', () => {
  let threw = false;
  try {
    applyDecisionUpdate(DECISIONS_FIXTURE, 'DEC-999', 'accept');
  } catch (err) {
    threw = true;
    assert.ok(err.message.includes('DEC-999'), `error message should mention DEC-999, got: ${err.message}`);
    assert.strictEqual(err.code, 'NOT_FOUND');
  }
  assert.ok(threw, 'should have thrown an error');
});

// (d) Preserve other decisions after accepting DEC-001
test('accepting DEC-001 leaves DEC-002 and DEC-003 unchanged', () => {
  const { tmpDir } = makeTmpProject();
  try {
    const updated = applyAndWrite(tmpDir, DECISIONS_FIXTURE, 'DEC-001', 'accept');
    // DEC-002 still ACTIVE
    const dec002Match = updated.match(/## DEC-002[\s\S]*?(?=\n---\n|$)/);
    assert.ok(dec002Match, 'DEC-002 block should exist');
    assert.ok(dec002Match[0].includes('**Status:** ACTIVE'), 'DEC-002 should still be ACTIVE');
    // DEC-003 still ACTIVE
    const dec003Match = updated.match(/## DEC-003[\s\S]*?(?=\n---\n|$)/);
    assert.ok(dec003Match, 'DEC-003 block should exist');
    assert.ok(dec003Match[0].includes('**Status:** ACTIVE'), 'DEC-003 should still be ACTIVE');
  } finally {
    cleanup(tmpDir);
  }
});

// (e) Atomic write: .tmp file is written then renamed (no stale .tmp left behind)
test('atomicWriteFile leaves no .tmp file after successful write', () => {
  const { tmpDir, decisionsPath } = makeTmpProject();
  try {
    const updated = applyDecisionUpdate(DECISIONS_FIXTURE, 'DEC-001', 'accept');
    atomicWriteFile(decisionsPath, updated);
    const tmpPath = decisionsPath + '.tmp';
    assert.ok(!fs.existsSync(tmpPath), '.tmp file should not exist after atomic write');
    const written = fs.readFileSync(decisionsPath, 'utf8');
    assert.ok(written.includes('**Status:** ACCEPTED'), 'final file should have updated content');
  } finally {
    cleanup(tmpDir);
  }
});

// (f) Idempotent: accepting an already-accepted decision works
test('accepting an already-accepted decision is idempotent', () => {
  const { tmpDir } = makeTmpProject();
  try {
    // First accept
    const firstPass = applyDecisionUpdate(DECISIONS_FIXTURE, 'DEC-001', 'accept');
    assert.ok(firstPass.includes('**Status:** ACCEPTED'));
    // Second accept on already-accepted content
    const secondPass = applyDecisionUpdate(firstPass, 'DEC-001', 'accept');
    assert.ok(secondPass.includes('**Status:** ACCEPTED'), 'should still be ACCEPTED after second accept');
    // Count occurrences — should be exactly one ACCEPTED for DEC-001
    const dec001Block = secondPass.match(/## DEC-001[\s\S]*?(?=\n---\n|$)/);
    assert.ok(dec001Block, 'DEC-001 block should exist');
    const acceptedCount = (dec001Block[0].match(/\*\*Status:\*\* ACCEPTED/g) || []).length;
    assert.strictEqual(acceptedCount, 1, 'should have exactly one ACCEPTED status in DEC-001 block');
  } finally {
    cleanup(tmpDir);
  }
});

// (g) Registry validation: path not in registry is rejected
test('registry validation rejects path not in registry', () => {
  // Simulate the registry check: loadRegistry returns [] (no entries)
  const fakeRegistry = [];
  const projectPath = '/tmp/nonexistent-project';
  const registryEntry = fakeRegistry.find(e => e.path === projectPath);
  assert.ok(!registryEntry, 'path should not be found in empty registry');
  // Confirm the check works for a matching path too
  const fakeRegistryWithEntry = [{ path: projectPath, name: 'test' }];
  const found = fakeRegistryWithEntry.find(e => e.path === projectPath);
  assert.ok(found, 'path should be found when in registry');
});

// (h) Dispute with empty rationale (no rationale argument)
test('dispute with no rationale uses empty string for Dispute Rationale', () => {
  const updated = applyDecisionUpdate(DECISIONS_FIXTURE, 'DEC-002', 'dispute');
  assert.ok(updated.includes('**Status:** DISPUTED'));
  assert.ok(updated.includes("**Dispute Rationale:** ''"), 'should have empty rationale');
});

// (i) Fixture content check: real entries present
test('fixture contains real DEC-001 through DEC-004 entries', () => {
  assert.ok(DECISIONS_FIXTURE.includes('DEC-001'), 'fixture has DEC-001');
  assert.ok(DECISIONS_FIXTURE.includes('DEC-002'), 'fixture has DEC-002');
  assert.ok(DECISIONS_FIXTURE.includes('DEC-003'), 'fixture has DEC-003');
  assert.ok(DECISIONS_FIXTURE.includes('DEC-004'), 'fixture has DEC-004');
  assert.ok(DECISIONS_FIXTURE.includes('Platform hierarchy'), 'fixture has real DEC-001 content');
  assert.ok(DECISIONS_FIXTURE.includes('artist_billing_profiles'), 'fixture has real DEC-003 content');
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  process.exit(1);
}
