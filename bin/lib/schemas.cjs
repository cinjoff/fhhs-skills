'use strict';

/**
 * Canonical schema validators for fhhs-skills state objects.
 * All validators return { warnings: string[] } — callers check warnings.length === 0 for pass.
 * Fail-open design: warnings describe issues but are never thrown.
 */

/**
 * Validate the shape of an .auto-state.json object.
 * Required fields: active, phase, started_at, phases_total, phases_completed,
 *                  phase_states, activity_events, session_activity, log_buffer
 * @param {unknown} obj
 * @returns {{ warnings: string[] }}
 */
function validateAutoState(obj) {
  const warnings = [];

  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    warnings.push('State is not a valid object');
    return { warnings };
  }

  // active: boolean, required
  if (obj.active === undefined) {
    warnings.push('state.active is required');
  } else if (typeof obj.active !== 'boolean') {
    warnings.push(`state.active must be a boolean, got ${typeof obj.active}`);
  }

  // phase: string|number|null, required
  if (!('phase' in obj)) {
    warnings.push('state.phase is required');
  } else if (obj.phase !== null && typeof obj.phase !== 'string' && typeof obj.phase !== 'number') {
    warnings.push(`state.phase must be a string, number, or null, got ${typeof obj.phase}`);
  }

  // started_at: string|null, required
  if (!('started_at' in obj)) {
    warnings.push('state.started_at is required');
  } else if (obj.started_at !== null && typeof obj.started_at !== 'string') {
    warnings.push(`state.started_at must be a string or null, got ${typeof obj.started_at}`);
  }

  // phases_total: number, required
  if (obj.phases_total === undefined) {
    warnings.push('state.phases_total is required');
  } else if (typeof obj.phases_total !== 'number') {
    warnings.push(`state.phases_total must be a number, got ${typeof obj.phases_total}`);
  }

  // phases_completed: number, required
  if (obj.phases_completed === undefined) {
    warnings.push('state.phases_completed is required');
  } else if (typeof obj.phases_completed !== 'number') {
    warnings.push(`state.phases_completed must be a number, got ${typeof obj.phases_completed}`);
  }

  // phase_states: object (not array, not null), required
  if (obj.phase_states === undefined) {
    warnings.push('state.phase_states is required');
  } else if (typeof obj.phase_states !== 'object' || Array.isArray(obj.phase_states) || obj.phase_states === null) {
    warnings.push('state.phase_states must be an object');
  }

  // activity_events: array, required
  if (obj.activity_events === undefined) {
    warnings.push('state.activity_events is required');
  } else if (!Array.isArray(obj.activity_events)) {
    warnings.push(`state.activity_events must be an array, got ${typeof obj.activity_events}`);
  }

  // session_activity: object (not array, not null), required
  if (obj.session_activity === undefined) {
    warnings.push('state.session_activity is required');
  } else if (typeof obj.session_activity !== 'object' || Array.isArray(obj.session_activity) || obj.session_activity === null) {
    warnings.push('state.session_activity must be an object');
  }

  // log_buffer: array, required
  if (obj.log_buffer === undefined) {
    warnings.push('state.log_buffer is required');
  } else if (!Array.isArray(obj.log_buffer)) {
    warnings.push(`state.log_buffer must be an array, got ${typeof obj.log_buffer}`);
  }

  return { warnings };
}

module.exports = { validateAutoState };
