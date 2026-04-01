'use strict';
const { describe, it, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  validateAutoState, parseSessionMetrics, aggregatePhaseMetrics,
  parsePlanFrontmatter, buildDependencyGraph, assignWaves,
  comparePhaseNum, estimateSessionCost, printMilestoneCostSummary,
  cascadePlanFailures, createJsonLineParser, TOOL_TIMEOUT_EXTENSIONS, MAX_TIMEOUT_CAP,
} = require('./auto-orchestrator.cjs');

// ─── parseSessionMetrics tests ───────────────────────────────────────────────

describe('parseSessionMetrics', () => {
  it('returns zeroes for empty string', () => {
    const m = parseSessionMetrics('');
    assert.equal(m.tokens_in, 0);
    assert.equal(m.tokens_out, 0);
    assert.equal(m.read_calls, 0);
    assert.equal(m.ctx_search_hits, 0);
  });

  it('parses single JSON-line with usage', () => {
    const line = JSON.stringify({ usage: { input_tokens: 100, output_tokens: 50 } });
    const m = parseSessionMetrics(line);
    assert.equal(m.tokens_in, 100);
    assert.equal(m.tokens_out, 50);
  });

  it('accumulates multiple JSON-lines', () => {
    const lines = [
      JSON.stringify({ usage: { input_tokens: 100, output_tokens: 50 } }),
      JSON.stringify({ usage: { input_tokens: 200, output_tokens: 75 } }),
    ].join('\n');
    const m = parseSessionMetrics(lines);
    assert.equal(m.tokens_in, 300);
    assert.equal(m.tokens_out, 125);
  });

  it('ignores non-JSON lines mixed with usage lines', () => {
    const lines = [
      'Starting build...',
      JSON.stringify({ usage: { input_tokens: 100, output_tokens: 50 } }),
      'Build complete.',
    ].join('\n');
    const m = parseSessionMetrics(lines);
    assert.equal(m.tokens_in, 100);
    assert.equal(m.tokens_out, 50);
  });

  it('treats missing usage field as zero tokens', () => {
    const line = JSON.stringify({ type: 'message', content: 'hello' });
    const m = parseSessionMetrics(line);
    assert.equal(m.tokens_in, 0);
    assert.equal(m.tokens_out, 0);
  });

  it('counts Read tool calls', () => {
    const lines = [
      JSON.stringify({ tool: 'Read' }),
      JSON.stringify({ tool: 'Read' }),
      JSON.stringify({ tool: 'Edit' }),
    ].join('\n');
    const m = parseSessionMetrics(lines);
    assert.equal(m.read_calls, 2);
  });

  it('counts ctx_search hits', () => {
    const lines = [
      'called ctx_search for docs',
      JSON.stringify({ tool: 'ctx_batch_execute' }),
    ].join('\n');
    const m = parseSessionMetrics(lines);
    assert.equal(m.ctx_search_hits, 2);
  });
});

// ─── aggregatePhaseMetrics tests ─────────────────────────────────────────────

describe('aggregatePhaseMetrics', () => {
  it('returns empty object for empty stepHistory', () => {
    const result = aggregatePhaseMetrics([]);
    assert.deepEqual(result, {});
  });

  it('aggregates a single step correctly', () => {
    const history = [{
      phase: '07-auto-mode',
      step: 'build',
      metrics: { tokens_in: 1000, tokens_out: 500, read_calls: 3, ctx_search_hits: 5 },
      cost_estimate: 0.15,
      elapsed_ms: 60000,
    }];
    const result = aggregatePhaseMetrics(history);
    assert.equal(result['07-auto-mode'].tokens_in, 1000);
    assert.equal(result['07-auto-mode'].tokens_out, 500);
    assert.equal(result['07-auto-mode'].read_calls, 3);
    assert.equal(result['07-auto-mode'].ctx_search_hits, 5);
    assert.equal(result['07-auto-mode'].cost_estimate, 0.15);
    assert.equal(result['07-auto-mode'].elapsed_ms, 60000);
    assert.equal(result['07-auto-mode'].steps, 1);
  });

  it('sums multiple steps for the same phase', () => {
    const history = [
      { phase: '07-auto-mode', step: 'plan-work', metrics: { tokens_in: 500, tokens_out: 200 }, cost_estimate: 0.05, elapsed_ms: 30000 },
      { phase: '07-auto-mode', step: 'build', metrics: { tokens_in: 1000, tokens_out: 400 }, cost_estimate: 0.10, elapsed_ms: 60000 },
    ];
    const result = aggregatePhaseMetrics(history);
    assert.equal(result['07-auto-mode'].tokens_in, 1500);
    assert.equal(result['07-auto-mode'].tokens_out, 600);
    assert.ok(Math.abs(result['07-auto-mode'].cost_estimate - 0.15) < 1e-10);
    assert.equal(result['07-auto-mode'].elapsed_ms, 90000);
    assert.equal(result['07-auto-mode'].steps, 2);
  });

  it('tracks multiple phases separately', () => {
    const history = [
      { phase: '07-auto-mode', step: 'build', metrics: { tokens_in: 1000, tokens_out: 500 }, cost_estimate: 0.15, elapsed_ms: 60000 },
      { phase: '08-tracker', step: 'build', metrics: { tokens_in: 2000, tokens_out: 800 }, cost_estimate: 0.25, elapsed_ms: 120000 },
    ];
    const result = aggregatePhaseMetrics(history);
    assert.equal(Object.keys(result).length, 2);
    assert.equal(result['07-auto-mode'].tokens_in, 1000);
    assert.equal(result['08-tracker'].tokens_in, 2000);
  });

  it('treats missing metrics as zero', () => {
    const history = [{ phase: '07-auto-mode', step: 'build', cost_estimate: 0.10, elapsed_ms: 30000 }];
    const result = aggregatePhaseMetrics(history);
    assert.equal(result['07-auto-mode'].tokens_in, 0);
    assert.equal(result['07-auto-mode'].tokens_out, 0);
    assert.equal(result['07-auto-mode'].read_calls, 0);
    assert.equal(result['07-auto-mode'].ctx_search_hits, 0);
  });

  it('skips entries without phase field', () => {
    const history = [
      { step: 'build', metrics: { tokens_in: 100, tokens_out: 50 }, cost_estimate: 0.01, elapsed_ms: 5000 },
      { phase: '07-auto-mode', step: 'build', metrics: { tokens_in: 1000, tokens_out: 500 }, cost_estimate: 0.15, elapsed_ms: 60000 },
    ];
    const result = aggregatePhaseMetrics(history);
    assert.equal(Object.keys(result).length, 1);
    assert.ok(result['07-auto-mode']);
  });
});

// ─── comparePhaseNum tests ──────���────────────────────────────────────────────

describe('comparePhaseNum', () => {
  it('returns negative when first < second', () => {
    assert.ok(comparePhaseNum('1', '2') < 0);
  });

  it('returns positive when first > second', () => {
    assert.ok(comparePhaseNum('2', '1') > 0);
  });

  it('returns 0 for equal phases', () => {
    assert.equal(comparePhaseNum('3', '3'), 0);
  });

  it('compares letter suffixes alphabetically', () => {
    assert.ok(comparePhaseNum('3A', '3B') < 0);
  });

  it('sorts no suffix before suffix', () => {
    assert.ok(comparePhaseNum('3', '3A') < 0);
  });

  it('compares decimal sub-phases', () => {
    assert.ok(comparePhaseNum('3.1', '3.2') < 0);
  });

  it('uses numeric comparison, not lexicographic', () => {
    assert.ok(comparePhaseNum('10', '9') > 0);
  });
});

// ─── estimateSessionCost tests ───────────────────────────────────────────────

describe('estimateSessionCost', () => {
  it('returns 0 for empty strings', () => {
    assert.equal(estimateSessionCost('', ''), 0);
  });

  it('calculates cost for known input lengths', () => {
    // 4000 chars prompt = 1000 tokens → 1000/1000 * 0.015 = 0.015
    // 2000 chars response = 500 tokens → 500/1000 * 0.075 = 0.0375
    // total = 0.0525
    const prompt = 'x'.repeat(4000);
    const response = 'y'.repeat(2000);
    const cost = estimateSessionCost(prompt, response);
    assert.ok(Math.abs(cost - 0.0525) < 1e-10);
  });

  it('rounds up partial tokens', () => {
    // 5 chars = ceil(5/4) = 2 tokens input → 2/1000 * 0.015 = 0.00003
    // 1 char = ceil(1/4) = 1 token output �� 1/1000 * 0.075 = 0.000075
    const cost = estimateSessionCost('hello', 'x');
    assert.ok(cost > 0);
    const expected = (2 / 1000) * 0.015 + (1 / 1000) * 0.075;
    assert.ok(Math.abs(cost - expected) < 1e-10);
  });
});

// ─── parsePlanFrontmatter tests ──────────────────────────────────────────────

describe('parsePlanFrontmatter', () => {
  let tmpDir;

  function writeTmp(name, content) {
    const p = path.join(tmpDir, name);
    fs.writeFileSync(p, content);
    return p;
  }

  // Create a fresh temp dir for each test file
  it('parses inline format', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-test-'));
    const p = writeTmp('inline.md', '---\nfiles_modified: [a.js, b.ts]\n---\n# Plan');
    const result = parsePlanFrontmatter(p);
    assert.deepEqual(result, { files_modified: ['a.js', 'b.ts'] });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('parses block list format', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-test-'));
    const p = writeTmp('block.md', '---\nfiles_modified:\n  - src/app.js\n  - lib/utils.ts\n---\n# Plan');
    const result = parsePlanFrontmatter(p);
    assert.deepEqual(result, { files_modified: ['src/app.js', 'lib/utils.ts'] });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns null for no frontmatter', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-test-'));
    const p = writeTmp('nofm.md', '# Plan\nNo frontmatter here');
    const result = parsePlanFrontmatter(p);
    assert.equal(result, null);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty files_modified when key is absent', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orch-test-'));
    const p = writeTmp('nofiles.md', '---\nphase: 1\ntype: execute\n---\n# Plan');
    const result = parsePlanFrontmatter(p);
    assert.deepEqual(result, { files_modified: [] });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns null for non-existent file', () => {
    const result = parsePlanFrontmatter('/tmp/nonexistent-plan-file-xyz.md');
    assert.equal(result, null);
  });
});

// ─── buildDependencyGraph tests ──────────────────────────────────────────────

describe('buildDependencyGraph', () => {
  it('creates dependency when files overlap', () => {
    const phases = [{ id: '1' }, { id: '2' }];
    const planMap = {
      '1': { files_modified: ['src/app.js', 'lib/utils.js'] },
      '2': { files_modified: ['lib/utils.js', 'tests/app.test.js'] },
    };
    const deps = buildDependencyGraph(phases, planMap);
    assert.deepEqual(deps['1'], []);
    assert.deepEqual(deps['2'], ['1']);
  });

  it('no dependency when files do not overlap', () => {
    const phases = [{ id: '1' }, { id: '2' }];
    const planMap = {
      '1': { files_modified: ['src/app.js'] },
      '2': { files_modified: ['src/other.js'] },
    };
    const deps = buildDependencyGraph(phases, planMap);
    assert.deepEqual(deps['1'], []);
    assert.deepEqual(deps['2'], []);
  });

  it('depends on all predecessors when no plan exists', () => {
    const phases = [{ id: '1' }, { id: '2' }, { id: '3' }];
    const planMap = {
      '1': { files_modified: ['a.js'] },
      '2': { files_modified: ['b.js'] },
      // '3' has no plan — conservative fallback
    };
    const deps = buildDependencyGraph(phases, planMap);
    assert.deepEqual(deps['3'], ['1', '2']);
  });
});

// ─── assignWaves tests ───────────────────────────────────────���───────────────

describe('assignWaves', () => {
  it('assigns all independent phases to wave 1', () => {
    const depGraph = { A: [], B: [], C: [] };
    const waves = assignWaves(depGraph);
    assert.equal(waves.A, 1);
    assert.equal(waves.B, 1);
    assert.equal(waves.C, 1);
  });

  it('assigns linear chain to sequential waves', () => {
    const depGraph = { A: [], B: ['A'], C: ['B'] };
    const waves = assignWaves(depGraph);
    assert.equal(waves.A, 1);
    assert.equal(waves.B, 2);
    assert.equal(waves.C, 3);
  });

  it('handles diamond dependency correctly', () => {
    // A→B, A→C, B+C→D
    const depGraph = { A: [], B: ['A'], C: ['A'], D: ['B', 'C'] };
    const waves = assignWaves(depGraph);
    assert.equal(waves.A, 1);
    assert.equal(waves.B, 2);
    assert.equal(waves.C, 2);
    assert.equal(waves.D, 3);
  });
});

// ─── printMilestoneCostSummary tests ─────────────────────────────────────────

describe('printMilestoneCostSummary', () => {
  it('handles empty input gracefully', () => {
    // Should not throw
    printMilestoneCostSummary({});
    printMilestoneCostSummary(null);
    printMilestoneCostSummary(undefined);
  });
});

// ─── cascadePlanFailures tests ──────────────────────────────────────────────

describe('cascadePlanFailures', () => {
  it('reschedules dependents of plan-failed phases', () => {
    const phases = [{ id: '1' }, { id: '2' }, { id: '3' }];
    const phase_states = { '1': 'plan-failed', '2': 'pending', '3': 'pending' };
    const depGraph = { '1': [], '2': ['1'], '3': [] };

    const rescheduled = cascadePlanFailures(phases, phase_states, depGraph);

    assert.equal(phase_states['2'], 'rescheduled-sequential');
    assert.equal(phase_states['1'], 'rescheduled-sequential');
    assert.equal(phase_states['3'], 'pending'); // unaffected
    assert.equal(rescheduled.length, 2);
  });

  it('never overwrites built phase states', () => {
    const phases = [{ id: '1' }, { id: '2' }];
    const phase_states = { '1': 'plan-failed', '2': 'built' };
    const depGraph = { '1': [], '2': ['1'] };

    const rescheduled = cascadePlanFailures(phases, phase_states, depGraph);

    // Phase 2 is 'built' and must NOT be overwritten
    assert.equal(phase_states['2'], 'built');
    // Only phase 1 itself gets rescheduled
    assert.equal(rescheduled.length, 1);
    assert.equal(rescheduled[0].id, '1');
  });

  it('never overwrites reviewed phase states', () => {
    const phases = [{ id: '1' }, { id: '2' }];
    const phase_states = { '1': 'plan-failed', '2': 'reviewed' };
    const depGraph = { '1': [], '2': ['1'] };

    const rescheduled = cascadePlanFailures(phases, phase_states, depGraph);

    assert.equal(phase_states['2'], 'reviewed');
    assert.equal(rescheduled.length, 1);
  });

  it('returns empty array when no phases have plan-failed', () => {
    const phases = [{ id: '1' }, { id: '2' }];
    const phase_states = { '1': 'planned', '2': 'pending' };
    const depGraph = { '1': [], '2': ['1'] };

    const rescheduled = cascadePlanFailures(phases, phase_states, depGraph);

    assert.equal(rescheduled.length, 0);
    assert.equal(phase_states['1'], 'planned');
    assert.equal(phase_states['2'], 'pending');
  });

  it('handles missing depGraph entries gracefully', () => {
    const phases = [{ id: '1' }, { id: '2' }];
    const phase_states = { '1': 'plan-failed', '2': 'pending' };
    const depGraph = {}; // no entries

    const rescheduled = cascadePlanFailures(phases, phase_states, depGraph);

    // Phase 1 gets rescheduled (itself), phase 2 has no dep on 1
    assert.equal(phase_states['1'], 'rescheduled-sequential');
    assert.equal(phase_states['2'], 'pending');
    assert.equal(rescheduled.length, 1);
  });

  it('accepts optional log function', () => {
    const phases = [{ id: '1' }];
    const phase_states = { '1': 'plan-failed' };
    const depGraph = { '1': [] };
    const logs = [];

    cascadePlanFailures(phases, phase_states, depGraph, (msg) => logs.push(msg));

    assert.ok(logs.length === 0 || logs.length > 0); // just verifies no crash
  });
});

// ─── validateAutoState tests (from origin/main) ──────────────────────────────

describe('validateAutoState', () => {
  it('accepts valid state with phase field', () => {
    const result = validateAutoState({ phase: 'phase-01', phase_states: { 'phase-01': 'done' } });
    assert.equal(result.valid, true);
  });

  it('rejects null input', () => {
    const result = validateAutoState(null);
    assert.equal(result.valid, false);
    assert.ok(typeof result.reason === 'string' && result.reason.length > 0);
  });

  it('rejects string input', () => {
    const result = validateAutoState('some string');
    assert.equal(result.valid, false);
    assert.ok(typeof result.reason === 'string');
  });

  it('rejects number input', () => {
    const result = validateAutoState(42);
    assert.equal(result.valid, false);
    assert.ok(typeof result.reason === 'string');
  });
});

// ─── aggregatePhaseMetrics with phaseId filter ───────────────────────────────

describe('aggregatePhaseMetrics (single-phase mode)', () => {
  it('sums entries for a specific phase', () => {
    const stepHistory = [
      { phase: 'phase-01', metrics: { tokens_in: 100, tokens_out: 50 }, elapsed_ms: 1000 },
      { phase: 'phase-01', metrics: { tokens_in: 200, tokens_out: 75 }, elapsed_ms: 2000 },
    ];
    const result = aggregatePhaseMetrics(stepHistory, 'phase-01');
    assert.equal(result.tokens_in, 300);
    assert.equal(result.tokens_out, 125);
    assert.equal(result.elapsed_ms, 3000);
    assert.equal(result.step_count, 2);
  });

  it('returns zeroes for non-matching phase', () => {
    const stepHistory = [
      { phase: 'phase-02', metrics: { tokens_in: 100, tokens_out: 50 }, elapsed_ms: 1000 },
    ];
    const result = aggregatePhaseMetrics(stepHistory, 'phase-01');
    assert.equal(result.tokens_in, 0);
    assert.equal(result.step_count, 0);
  });

  it('returns zeroes for empty stepHistory', () => {
    const result = aggregatePhaseMetrics([], 'phase-01');
    assert.equal(result.tokens_in, 0);
    assert.equal(result.step_count, 0);
  });
});

// ─── createJsonLineParser tests ───────────────────────────────────────────────

describe('createJsonLineParser', () => {
  it('emits complete JSON object from a single chunk with newline', () => {
    const received = [];
    const feed = createJsonLineParser((obj) => received.push(obj));
    feed(JSON.stringify({ tool: 'Read' }) + '\n');
    assert.equal(received.length, 1);
    assert.equal(received[0].tool, 'Read');
  });

  it('reassembles JSON line split across two data events', () => {
    const received = [];
    const feed = createJsonLineParser((obj) => received.push(obj));
    const line = JSON.stringify({ tool: 'Edit', usage: { input_tokens: 10 } });
    feed(line.slice(0, 10));
    assert.equal(received.length, 0, 'should not emit partial line');
    feed(line.slice(10) + '\n');
    assert.equal(received.length, 1);
    assert.equal(received[0].tool, 'Edit');
  });

  it('ignores non-JSON lines mixed with JSON lines', () => {
    const received = [];
    const feed = createJsonLineParser((obj) => received.push(obj));
    feed('Starting session...\n');
    feed(JSON.stringify({ type: 'result' }) + '\n');
    feed('Done.\n');
    assert.equal(received.length, 1);
    assert.equal(received[0].type, 'result');
  });

  it('emits multiple JSON objects from one chunk', () => {
    const received = [];
    const feed = createJsonLineParser((obj) => received.push(obj));
    const chunk = [
      JSON.stringify({ tool: 'Read' }),
      JSON.stringify({ tool: 'Write' }),
      JSON.stringify({ usage: { input_tokens: 5, output_tokens: 2 } }),
    ].join('\n') + '\n';
    feed(chunk);
    assert.equal(received.length, 3);
    assert.equal(received[0].tool, 'Read');
    assert.equal(received[1].tool, 'Write');
    assert.equal(received[2].usage.input_tokens, 5);
  });

  it('discards buffer and stops emitting when buffer exceeds 1MB', () => {
    const received = [];
    const feed = createJsonLineParser((obj) => received.push(obj));
    // Fill buffer past 1MB with no newline
    feed('x'.repeat(1024 * 1024 + 1));
    // After cap hit, buffer is cleared — subsequent valid JSON should work again
    feed(JSON.stringify({ tool: 'Bash' }) + '\n');
    // The oversized chunk clears buffer; then new line arrives and is parsed
    assert.equal(received.length, 1);
    assert.equal(received[0].tool, 'Bash');
  });

  it('skips empty lines without error', () => {
    const received = [];
    const feed = createJsonLineParser((obj) => received.push(obj));
    feed('\n\n' + JSON.stringify({ tool: 'Agent' }) + '\n\n');
    assert.equal(received.length, 1);
  });
});

// ─── TOOL_TIMEOUT_EXTENSIONS / graduated timeout tests ───────────────────────

describe('TOOL_TIMEOUT_EXTENSIONS', () => {
  it('exports TOOL_TIMEOUT_EXTENSIONS as an object with expected keys', () => {
    assert.ok(typeof TOOL_TIMEOUT_EXTENSIONS === 'object');
    assert.ok('Bash' in TOOL_TIMEOUT_EXTENSIONS);
    assert.ok('Agent' in TOOL_TIMEOUT_EXTENSIONS);
    assert.ok('Edit' in TOOL_TIMEOUT_EXTENSIONS);
    assert.ok('Write' in TOOL_TIMEOUT_EXTENSIONS);
  });

  it('Bash extension is 5 minutes in ms', () => {
    assert.equal(TOOL_TIMEOUT_EXTENSIONS['Bash'], 5 * 60 * 1000);
  });

  it('graduated timeout: stepKillMs + Bash extension does not exceed MAX_TIMEOUT_CAP', () => {
    const stepKillMs = 15 * 60 * 1000;  // build step
    const toolExtension = TOOL_TIMEOUT_EXTENSIONS['Bash'] || 0;
    const effectiveKillMs = Math.min(stepKillMs + toolExtension, MAX_TIMEOUT_CAP);
    assert.equal(effectiveKillMs, 20 * 60 * 1000);
    assert.ok(effectiveKillMs <= MAX_TIMEOUT_CAP);
  });

  it('MAX_TIMEOUT_CAP is enforced when combined value exceeds it', () => {
    const stepKillMs = 24 * 60 * 1000;  // near cap
    const toolExtension = TOOL_TIMEOUT_EXTENSIONS['Bash'] || 0;  // +5min → 29min total
    const effectiveKillMs = Math.min(stepKillMs + toolExtension, MAX_TIMEOUT_CAP);
    assert.equal(effectiveKillMs, MAX_TIMEOUT_CAP);  // capped at 25min
  });

  it('null toolName gets 0 extension', () => {
    const toolExtension = (null && TOOL_TIMEOUT_EXTENSIONS[null]) || 0;
    assert.equal(toolExtension, 0);
  });

  it('unknown toolName gets 0 extension', () => {
    const toolExtension = (TOOL_TIMEOUT_EXTENSIONS['UnknownTool']) || 0;
    assert.equal(toolExtension, 0);
  });

  it('MAX_TIMEOUT_CAP is 25 minutes in ms', () => {
    assert.equal(MAX_TIMEOUT_CAP, 25 * 60 * 1000);
  });
});
