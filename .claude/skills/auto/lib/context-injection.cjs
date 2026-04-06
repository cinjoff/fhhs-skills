'use strict';

/**
 * context-injection.cjs
 * Builds the prompt string for a single task session.
 * Decision D3: Orchestrator injects plan-level context.
 *              Task sessions discover code-level context themselves via smart tools.
 */

/**
 * Build a complete prompt for a task session.
 *
 * @param {object} taskDef - Parsed task from PLAN.md
 * @param {string} taskDef.name         - e.g. "Task 1: Create schema"
 * @param {string[]} taskDef.files      - Files to create/modify
 * @param {string[]} taskDef.readFirst  - Files to read before acting
 * @param {string} taskDef.action       - Step-by-step instructions
 * @param {string} taskDef.verify       - Verification steps
 * @param {string} taskDef.done         - Acceptance criteria
 * @param {string} taskDef.type         - "auto" | "tdd" | "checkpoint:human-verify"
 *
 * @param {object} planContext - Plan-level context pre-read by the orchestrator
 * @param {string} planContext.phaseId
 * @param {string} planContext.phaseName
 * @param {string} planContext.phaseGoal
 * @param {string} planContext.contextDecisions  - CONTEXT.md decisions section
 * @param {string} planContext.projectConstraints - CLAUDE.md Gotchas (first 4000 chars)
 * @param {object|null} planContext.specSections  - { architecture, dataFlow, failureModes, qualityRubrics }
 * @param {string} planContext.planPath
 *
 * @returns {string} Complete prompt for `claude -p`
 */
function buildTaskPrompt(taskDef, planContext) {
  const task = taskDef || {};
  const ctx = planContext || {};

  const parts = [];

  // ── 1. Task instructions (FIRST — most important, lost-in-the-middle principle) ──
  parts.push(`# Task: ${task.name || '(unnamed task)'}`);

  if (task.action) {
    parts.push(`## Instructions\n\n${task.action}`);
  }

  const files = Array.isArray(task.files) ? task.files : [];
  if (files.length > 0) {
    parts.push(`## Files to Create / Modify\n\n${files.map((f) => `- ${f}`).join('\n')}`);
  }

  const readFirst = Array.isArray(task.readFirst) ? task.readFirst : [];
  if (readFirst.length > 0) {
    parts.push(`## Read First\n\n${readFirst.map((f) => `- ${f}`).join('\n')}`);
  }

  if (task.verify) {
    parts.push(`## Verification Steps\n\n${task.verify}`);
  }

  if (task.done) {
    parts.push(`## Acceptance Criteria\n\n${task.done}`);
  }

  // ── 2. Plan-level context (phase goal + CONTEXT.md decisions) ──
  const hasPhaseInfo = ctx.phaseId || ctx.phaseName || ctx.phaseGoal;
  if (hasPhaseInfo) {
    const phaseHeader = [ctx.phaseId, ctx.phaseName].filter(Boolean).join(' — ');
    const phaseLines = [];
    if (phaseHeader) phaseLines.push(`**Phase:** ${phaseHeader}`);
    if (ctx.phaseGoal) phaseLines.push(`**Goal:** ${ctx.phaseGoal}`);
    if (ctx.planPath) phaseLines.push(`**Plan:** ${ctx.planPath}`);
    parts.push(`## Plan Context\n\n${phaseLines.join('\n')}`);
  }

  if (ctx.contextDecisions && ctx.contextDecisions.trim()) {
    parts.push(`## Decisions (from CONTEXT.md)\n\n${ctx.contextDecisions.trim()}`);
  }

  // ── 3. SPEC sections if present ──
  if (ctx.specSections && typeof ctx.specSections === 'object') {
    const spec = ctx.specSections;
    const specParts = [];

    if (spec.architecture && spec.architecture.trim()) {
      specParts.push(`### Architecture\n\n${spec.architecture.trim()}`);
    }
    if (spec.dataFlow && spec.dataFlow.trim()) {
      specParts.push(`### Data Flow\n\n${spec.dataFlow.trim()}`);
    }
    if (spec.failureModes && spec.failureModes.trim()) {
      specParts.push(`### Failure Modes\n\n${spec.failureModes.trim()}`);
    }
    if (spec.qualityRubrics && spec.qualityRubrics.trim()) {
      specParts.push(`### Quality Rubrics\n\n${spec.qualityRubrics.trim()}`);
    }

    if (specParts.length > 0) {
      parts.push(`## Spec\n\n${specParts.join('\n\n')}`);
    }
  }

  // ── 4. Project constraints from CLAUDE.md — LAST ──
  if (ctx.projectConstraints && ctx.projectConstraints.trim()) {
    parts.push(`## Project Constraints\n\n${ctx.projectConstraints.trim()}`);
  }

  // ── 5. Smart tool instructions ──
  parts.push(
    `## Code Discovery\n\n` +
      `Use smart_outline and smart_unfold for code exploration. ` +
      `Use smart_search to find patterns across the codebase. ` +
      `Only Read full files when you need to Edit them.`
  );

  // ── 6. Deviation rules ──
  parts.push(
    `## Deviation Rules\n\n` +
      `If you encounter a blocking issue, stop immediately and report it. ` +
      `Do not guess. Do not deviate from the task scope.`
  );

  // ── 7. Self-check instructions ──
  parts.push(
    `## Self-Check\n\n` +
      `Before reporting completion, verify that every file listed under "Files to Create / Modify" ` +
      `actually exists on disk. If any file is missing, create it or report it as a deviation.`
  );

  // ── 8. Report format ──
  parts.push(
    `## Report Format\n\n` +
      `When done, respond with exactly these sections:\n\n` +
      `**Implemented:** (what was built)\n` +
      `**Tests:** (tests added or run)\n` +
      `**Files Changed:** (list of files)\n` +
      `**Deviations:** (any scope changes or skipped items)\n` +
      `**Stubs:** (anything left intentionally incomplete)\n` +
      `**Concerns:** (issues to flag for the orchestrator)`
  );

  return parts.join('\n\n');
}

module.exports = { buildTaskPrompt };
