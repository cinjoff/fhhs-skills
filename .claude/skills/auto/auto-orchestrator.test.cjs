'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateAutoState, parseSessionMetrics, aggregatePhaseMetrics } = require('./auto-orchestrator.cjs');

// ─── validateAutoState ────────────────────────────────────────────────────────

test('validateAutoState: valid sequential state (phase + active)', () => {
  const state = { phase: 'phase-01', active: true };
  const result = validateAutoState(state);
  assert.equal(result.valid, true);
  assert.deepEqual(result.state, state);
});

test('validateAutoState: valid pipeline state (phase_states + active)', () => {
  const state = { phase_states: { 'phase-01': 'done' }, active: false };
  const result = validateAutoState(state);
  assert.equal(result.valid, true);
  assert.deepEqual(result.state, state);
});

test('validateAutoState: valid state with both phase and phase_states', () => {
  const state = { phase: 'phase-02', phase_states: { 'phase-01': 'done' }, active: true };
  const result = validateAutoState(state);
  assert.equal(result.valid, true);
});

test('validateAutoState: null input → invalid with reason', () => {
  const result = validateAutoState(null);
  assert.equal(result.valid, false);
  assert.ok(typeof result.reason === 'string' && result.reason.length > 0, 'should have a reason');
});

test('validateAutoState: missing phase and phase_states → invalid', () => {
  const result = validateAutoState({ active: true });
  assert.equal(result.valid, false);
  assert.ok(result.reason.includes('phase'), 'reason should mention phase');
});

test('validateAutoState: missing active field → invalid', () => {
  const result = validateAutoState({ phase: 'phase-01' });
  assert.equal(result.valid, false);
  assert.ok(result.reason.includes('active'), 'reason should mention active');
});

test('validateAutoState: string input → invalid', () => {
  const result = validateAutoState('some string');
  assert.equal(result.valid, false);
  assert.ok(typeof result.reason === 'string');
});

test('validateAutoState: number input → invalid', () => {
  const result = validateAutoState(42);
  assert.equal(result.valid, false);
  assert.ok(typeof result.reason === 'string');
});

// ─── parseSessionMetrics ──────────────────────────────────────────────────────

test('parseSessionMetrics: JSON-lines with usage objects → sums tokens correctly', () => {
  const stdout = [
    JSON.stringify({ usage: { input_tokens: 100, output_tokens: 50 } }),
    JSON.stringify({ usage: { input_tokens: 200, output_tokens: 75 } }),
  ].join('\n');
  const metrics = parseSessionMetrics(stdout);
  assert.equal(metrics.tokens_in, 300);
  assert.equal(metrics.tokens_out, 125);
});

test('parseSessionMetrics: mixed JSON and non-JSON lines → ignores non-JSON', () => {
  const stdout = [
    'some plain text line',
    JSON.stringify({ usage: { input_tokens: 10, output_tokens: 5 } }),
    'another non-json line',
    '{ bad json',
  ].join('\n');
  const metrics = parseSessionMetrics(stdout);
  assert.equal(metrics.tokens_in, 10);
  assert.equal(metrics.tokens_out, 5);
});

test('parseSessionMetrics: empty string → zeroes', () => {
  const metrics = parseSessionMetrics('');
  assert.equal(metrics.tokens_in, 0);
  assert.equal(metrics.tokens_out, 0);
  assert.equal(metrics.read_calls, 0);
  assert.equal(metrics.ctx_search_hits, 0);
});

test('parseSessionMetrics: lines with Read tool calls → counts read_calls', () => {
  const stdout = [
    '{"tool":"Read","path":"foo.txt"}',
    '{"tool":"Read","path":"bar.txt"}',
    '{"tool":"Edit","path":"baz.txt"}',
  ].join('\n');
  const metrics = parseSessionMetrics(stdout);
  assert.equal(metrics.read_calls, 2);
});

test('parseSessionMetrics: lines with ctx_search → counts ctx_search_hits', () => {
  const stdout = [
    'called ctx_search with query',
    'ctx_batch_execute results',
    'ctx_search again',
  ].join('\n');
  const metrics = parseSessionMetrics(stdout);
  assert.equal(metrics.ctx_search_hits, 3);
});

test('parseSessionMetrics: JSON without usage field → no tokens counted', () => {
  const stdout = JSON.stringify({ type: 'message', content: 'hello' });
  const metrics = parseSessionMetrics(stdout);
  assert.equal(metrics.tokens_in, 0);
  assert.equal(metrics.tokens_out, 0);
});

// ─── aggregatePhaseMetrics ────────────────────────────────────────────────────

test('aggregatePhaseMetrics: stepHistory with multiple entries for same phase → sums correctly', () => {
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

test('aggregatePhaseMetrics: no matching entries → zeroes', () => {
  const stepHistory = [
    { phase: 'phase-02', metrics: { tokens_in: 100, tokens_out: 50 }, elapsed_ms: 1000 },
  ];
  const result = aggregatePhaseMetrics(stepHistory, 'phase-01');
  assert.equal(result.tokens_in, 0);
  assert.equal(result.tokens_out, 0);
  assert.equal(result.elapsed_ms, 0);
  assert.equal(result.step_count, 0);
});

test('aggregatePhaseMetrics: mixed phases → filters correctly', () => {
  const stepHistory = [
    { phase: 'phase-01', metrics: { tokens_in: 100, tokens_out: 50 }, elapsed_ms: 500 },
    { phase: 'phase-02', metrics: { tokens_in: 999, tokens_out: 999 }, elapsed_ms: 9999 },
    { phase: 'phase-01', metrics: { tokens_in: 50, tokens_out: 25 }, elapsed_ms: 250 },
  ];
  const result = aggregatePhaseMetrics(stepHistory, 'phase-01');
  assert.equal(result.tokens_in, 150);
  assert.equal(result.tokens_out, 75);
  assert.equal(result.elapsed_ms, 750);
  assert.equal(result.step_count, 2);
});

test('aggregatePhaseMetrics: entries with missing metrics → handles gracefully', () => {
  const stepHistory = [
    { phase: 'phase-01', elapsed_ms: 1000 },
    { phase: 'phase-01', metrics: { tokens_in: 50, tokens_out: 25 }, elapsed_ms: 500 },
  ];
  const result = aggregatePhaseMetrics(stepHistory, 'phase-01');
  assert.equal(result.tokens_in, 50);
  assert.equal(result.tokens_out, 25);
  assert.equal(result.elapsed_ms, 1500);
  assert.equal(result.step_count, 2);
});

test('aggregatePhaseMetrics: empty stepHistory → zeroes', () => {
  const result = aggregatePhaseMetrics([], 'phase-01');
  assert.equal(result.tokens_in, 0);
  assert.equal(result.tokens_out, 0);
  assert.equal(result.elapsed_ms, 0);
  assert.equal(result.step_count, 0);
});
