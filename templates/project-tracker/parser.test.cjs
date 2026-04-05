'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { parsePhases } = require('./parser.cjs');

// Helper: create a temp .planning directory with milestone-based plan files
function createTempPlanning() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tracker-test-'));
  const planningDir = path.join(tmpDir, '.planning');
  fs.mkdirSync(planningDir);
  return { tmpDir, planningDir };
}

function cleanup(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  mkdirp(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

// A minimal plan file with tasks
const PLAN_CONTENT = `---
phase: 10
plan: 1
---
# Phase 10 Plan 1

<objective>Implement the core feature.</objective>

<task>
<name>Task 1: Build the thing</name>
</task>
<task>
<name>Task 2: Test the thing</name>
</task>
`;

const SUMMARY_CONTENT = `---
completed_at: "2026-03-01T12:00:00Z"
plan: 1
---
## What Was Done
Built and tested the thing.
`;

// ============================================================
// Test: Plans in milestones/ directories are discovered
// ============================================================
function testMilestonePhasePlansDiscovered() {
  const { tmpDir, planningDir } = createTempPlanning();
  try {
    // Create plans under milestones/v1.0-phases/10-core-feature/
    const phaseDir = path.join(planningDir, 'milestones', 'v1.0-phases', '10-core-feature');
    writeFile(path.join(phaseDir, '10-01-PLAN.md'), PLAN_CONTENT);

    const roadmapPhases = [
      { number: 10, name: 'Core Feature', goal: 'Build core', status: 'active' },
    ];
    const state = { currentPhase: '10', currentPlan: 1, status: 'active' };

    const result = parsePhases(planningDir, roadmapPhases, state);

    // Phase should have tasks from the milestone plan
    const phase10 = result.phases.find(p => p.number === 10);
    if (!phase10) {
      throw new Error('Phase 10 not found in results');
    }
    if (!phase10.tasks || phase10.tasks.length === 0) {
      throw new Error(`Phase 10 has no tasks. Got: ${JSON.stringify(phase10)}`);
    }
    if (phase10.tasks[0].name !== 'Build the thing') {
      throw new Error(`Expected task name "Build the thing", got "${phase10.tasks[0].name}"`);
    }
    console.log('  PASS: testMilestonePhasePlansDiscovered');
  } finally {
    cleanup(tmpDir);
  }
}

// ============================================================
// Test: Summaries in milestones/ mark plans as complete
// ============================================================
function testMilestonePhaseSummariesWork() {
  const { tmpDir, planningDir } = createTempPlanning();
  try {
    const phaseDir = path.join(planningDir, 'milestones', 'v1.0-phases', '10-core-feature');
    writeFile(path.join(phaseDir, '10-01-PLAN.md'), PLAN_CONTENT);
    writeFile(path.join(phaseDir, '10-01-SUMMARY.md'), SUMMARY_CONTENT);

    const roadmapPhases = [
      { number: 10, name: 'Core Feature', goal: 'Build core', status: 'complete' },
    ];
    const state = { currentPhase: '11', currentPlan: 1, status: 'active' };

    const result = parsePhases(planningDir, roadmapPhases, state);
    const phase10 = result.phases.find(p => p.number === 10);

    if (!phase10 || !phase10.tasks) {
      throw new Error('Phase 10 has no tasks');
    }
    if (phase10.tasks[0].status !== 'complete') {
      throw new Error(`Expected task status "complete", got "${phase10.tasks[0].status}"`);
    }
    console.log('  PASS: testMilestonePhaseSummariesWork');
  } finally {
    cleanup(tmpDir);
  }
}

// ============================================================
// Test: Multiple milestones are all scanned
// ============================================================
function testMultipleMilestones() {
  const { tmpDir, planningDir } = createTempPlanning();
  try {
    // v1.0 milestone
    const phase10Dir = path.join(planningDir, 'milestones', 'v1.0-phases', '10-core-feature');
    writeFile(path.join(phase10Dir, '10-01-PLAN.md'), PLAN_CONTENT);

    // v1.1 milestone
    const plan20 = PLAN_CONTENT.replace(/phase: 10/g, 'phase: 20');
    const phase20Dir = path.join(planningDir, 'milestones', 'v1.1-phases', '20-advanced-feature');
    writeFile(path.join(phase20Dir, '20-01-PLAN.md'), plan20);

    const roadmapPhases = [
      { number: 10, name: 'Core Feature', goal: 'Build core', status: 'complete' },
      { number: 20, name: 'Advanced Feature', goal: 'Build advanced', status: 'active' },
    ];
    const state = { currentPhase: '20', currentPlan: 1, status: 'active' };

    const result = parsePhases(planningDir, roadmapPhases, state);

    const phase10 = result.phases.find(p => p.number === 10);
    const phase20 = result.phases.find(p => p.number === 20);

    if (!phase10 || !phase10.tasks || phase10.tasks.length === 0) {
      throw new Error('Phase 10 missing tasks from v1.0 milestone');
    }
    if (!phase20 || !phase20.tasks || phase20.tasks.length === 0) {
      throw new Error('Phase 20 missing tasks from v1.1 milestone');
    }
    console.log('  PASS: testMultipleMilestones');
  } finally {
    cleanup(tmpDir);
  }
}

// ============================================================
// Test: phases/ directory still works (backward compat)
// ============================================================
function testPhasesDirStillWorks() {
  const { tmpDir, planningDir } = createTempPlanning();
  try {
    const phaseDir = path.join(planningDir, 'phases', '10-core-feature');
    writeFile(path.join(phaseDir, '10-01-PLAN.md'), PLAN_CONTENT);

    const roadmapPhases = [
      { number: 10, name: 'Core Feature', goal: 'Build core', status: 'active' },
    ];
    const state = { currentPhase: '10', currentPlan: 1, status: 'active' };

    const result = parsePhases(planningDir, roadmapPhases, state);
    const phase10 = result.phases.find(p => p.number === 10);

    if (!phase10 || !phase10.tasks || phase10.tasks.length === 0) {
      throw new Error('Phase 10 missing tasks from phases/ directory');
    }
    console.log('  PASS: testPhasesDirStillWorks');
  } finally {
    cleanup(tmpDir);
  }
}

// ============================================================
// Test: phases/ overrides milestones/ (specificity)
// ============================================================
function testPhasesDirOverridesMilestones() {
  const { tmpDir, planningDir } = createTempPlanning();
  try {
    // Milestone plan
    const msDir = path.join(planningDir, 'milestones', 'v1.0-phases', '10-core-feature');
    writeFile(path.join(msDir, '10-01-PLAN.md'), PLAN_CONTENT);

    // phases/ plan with different task name
    const phaseDir = path.join(planningDir, 'phases', '10-core-feature');
    const overridePlan = PLAN_CONTENT.replace('Build the thing', 'Override task');
    writeFile(path.join(phaseDir, '10-01-PLAN.md'), overridePlan);

    const roadmapPhases = [
      { number: 10, name: 'Core Feature', goal: 'Build core', status: 'active' },
    ];
    const state = { currentPhase: '10', currentPlan: 1, status: 'active' };

    const result = parsePhases(planningDir, roadmapPhases, state);
    const phase10 = result.phases.find(p => p.number === 10);

    if (!phase10 || !phase10.tasks) {
      throw new Error('Phase 10 missing tasks');
    }
    // phases/ should win since it's scanned after milestones/
    if (phase10.tasks[0].name !== 'Override task') {
      throw new Error(`Expected "Override task", got "${phase10.tasks[0].name}"`);
    }
    console.log('  PASS: testPhasesDirOverridesMilestones');
  } finally {
    cleanup(tmpDir);
  }
}

// ============================================================
// Run all tests
// ============================================================
console.log('\nParser tests:\n');

let passed = 0;
let failed = 0;

const tests = [
  testMilestonePhasePlansDiscovered,
  testMilestonePhaseSummariesWork,
  testMultipleMilestones,
  testPhasesDirStillWorks,
  testPhasesDirOverridesMilestones,
];

for (const test of tests) {
  try {
    test();
    passed++;
  } catch (err) {
    console.log(`  FAIL: ${test.name} — ${err.message}`);
    failed++;
  }
}

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
