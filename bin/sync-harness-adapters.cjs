#!/usr/bin/env node
/*
 * Sync harness adapters:
 *   Skills:
 *     - .claude/skills -> .pi/skills + .codex/skills
 *   Agents:
 *     - agents/*.md -> .pi/agents/*.md (pi subagent adapters)
 *
 * Usage:
 *   node bin/sync-harness-adapters.cjs
 *   node bin/sync-harness-adapters.cjs --check
 */

const fs = require('fs');
const path = require('path');

const CHECK_ONLY = process.argv.includes('--check');
const ROOT = path.resolve(__dirname, '..');
const SOURCE_ROOT = path.join(ROOT, '.claude', 'skills');
const AGENTS_SOURCE_ROOT = path.join(ROOT, 'agents');

const TARGETS = [
  {
    id: 'pi',
    skillsRoot: path.join(ROOT, '.pi', 'skills'),
    readmePath: path.join(ROOT, '.pi', 'README.md'),
    adapterLabel: 'pi.dev adapter',
    heading: '# fhhs-skills pi adapters',
    intro:
      'These wrappers let pi load the existing Claude-oriented skills from `.claude/skills/`.\nKeep `.pi/` and `.claude/` directories adjacent (these adapters reference `../../../.claude/skills/...`).\nUse the pi command in the left column.',
    tableHeader: '| pi command | Original Claude command | Source file |',
    commandFor: (name) => `/skill:${name}`,
    commandBulletLabel: 'pi command',
    harnessLabel: 'pi.dev',
    instruction2:
      '2. Translate command references from `/fh:<name>` to the mapped pi skill command in `.pi/README.md` (usually `/skill:fh-<name>`, while startup skills keep `/skill:startup-...`).',
    instruction3:
      '3. If the source skill references Claude-specific tools that are unavailable, use the closest pi-equivalent tools and continue.',
    instruction4:
      '4. Translate Claude Agent-tool dispatches into pi subagent calls: use `agent: "fh:..."` for `subagent_type: "fh:..."`, and map `subagent_type: "general-purpose"` to a worker agent (for example `agent: "worker"` or your preferred implementation agent). Carry over model intent when the source specifies one, and set `agentScope` to `"project"` or `"both"` so `.pi/agents/*.md` adapters are discoverable.',
    instruction5:
      '5. Preserve quality intent using Codex model tiers: strong reasoning/review/planning tasks should use `openai-codex/gpt-5.3-codex` (high thinking), while broad scanning or lightweight formatting can use `openai-codex/gpt-5.4-mini`.',
  },
  {
    id: 'codex',
    skillsRoot: path.join(ROOT, '.codex', 'skills'),
    readmePath: path.join(ROOT, '.codex', 'README.md'),
    adapterLabel: 'Codex adapter',
    heading: '# fhhs-skills Codex adapters',
    intro:
      'These wrappers let Codex load the existing Claude-oriented skills from `.claude/skills/`.\nKeep `.codex/` and `.claude/` directories adjacent (these adapters reference `../../../.claude/skills/...`).\nUse the Codex skill name in prompts (or your Codex skill picker if available).',
    tableHeader: '| Codex skill | Original Claude command | Source file |',
    commandFor: (name) => `\`${name}\``,
    commandBulletLabel: 'Codex skill name',
    harnessLabel: 'Codex',
    instruction2:
      '2. Translate command references from `/fh:<name>` to the mapped Codex skill name in `.codex/README.md` (usually `fh-<name>`, while startup skills keep `startup-...`).',
    instruction3:
      '3. If the source skill references Claude-specific tools that are unavailable, use the closest Codex-equivalent tools and continue.',
    instruction4:
      '4. If the source skill requests Claude Agent-tool dispatch and your Codex runtime lacks equivalent subagent support, execute the delegated work inline while preserving the original intent and checks.',
    instruction5:
      '5. Preserve quality intent with Codex model tiers: use `openai-codex/gpt-5.3-codex` for planning/review/critical reasoning and `openai-codex/gpt-5.4-mini` for fast exploratory or mechanical tasks.',
  },
];

const AGENT_TARGET = {
  id: 'pi',
  agentsRoot: path.join(ROOT, '.pi', 'agents'),
  readmePath: path.join(ROOT, '.pi', 'agents', 'README.md'),
  adapterLabel: 'pi subagent adapter',
  heading: '# fhhs-skills pi subagent adapters',
  intro:
    'These wrappers let pi subagent tooling load the existing fhhs agent personas from `agents/*.md`.\nUse `agentScope: "project"` or `"both"` so `.pi/agents/*.md` can be discovered in your repo root.',
  tableHeader: '| subagent_type | Source agent | Source file |',
  harnessLabel: 'pi subagent',
};

function yamlQuoted(value) {
  return JSON.stringify(String(value));
}

function unquoteYamlScalar(value) {
  const v = String(value || '').trim();
  if (v.length >= 2) {
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      return v.slice(1, -1);
    }
  }
  return v;
}

function parseFrontmatter(text) {
  if (!text.startsWith('---\n')) return {};
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return {};
  const fm = text.slice(4, end);
  const data = {};
  for (const line of fm.split('\n')) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) data[m[1]] = unquoteYamlScalar(m[2]);
  }
  return data;
}

function stripFrontmatter(text) {
  if (!text.startsWith('---\n')) return text;
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return text;
  return text.slice(end + 5).replace(/^\n+/, '');
}

function listSourceSkills() {
  const dirs = fs.readdirSync(SOURCE_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const skills = [];
  for (const dir of dirs) {
    const skillPath = path.join(SOURCE_ROOT, dir, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;
    const text = fs.readFileSync(skillPath, 'utf8');
    const fm = parseFrontmatter(text);
    const sourceName = fm.name || dir;
    const description = fm.description || `${sourceName} skill`;
    const mappedName = sourceName.replace(/:/g, '-');

    let originalCommand;
    if (sourceName.startsWith('fh:')) {
      originalCommand = `/fh:${sourceName.split(':', 2)[1]}`;
    } else if (sourceName.startsWith('startup-')) {
      originalCommand = `/fh:${sourceName}`;
    } else {
      originalCommand = `/${sourceName}`;
    }

    skills.push({ dir, sourceName, description, mappedName, originalCommand });
  }
  return skills;
}

function listSourceAgents() {
  const entries = fs.readdirSync(AGENTS_SOURCE_ROOT, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.md'))
    .map((d) => d.name)
    .sort();

  const agents = [];
  for (const fileName of entries) {
    const sourcePath = path.join(AGENTS_SOURCE_ROOT, fileName);
    const text = fs.readFileSync(sourcePath, 'utf8');
    const fm = parseFrontmatter(text);
    const sourceName = fm.name || fileName.replace(/\.md$/, '');
    const description = fm.description || `${sourceName} agent`;
    const subagentType = sourceName.startsWith('fh:') ? sourceName : `fh:${sourceName}`;
    const body = stripFrontmatter(text).trim();

    agents.push({ fileName, sourceName, description, subagentType, body, generated: false });
  }

  // Compatibility alias for Claude `subagent_type: "general-purpose"` dispatches in pi adapters.
  // This project-level `worker` agent overrides the builtin worker and keeps plan/build execution
  // on a strong Codex profile by default.
  agents.push({
    fileName: 'worker.md',
    sourceName: 'worker',
    description: 'General-purpose implementation worker for translated `general-purpose` subagent dispatches.',
    subagentType: 'worker',
    generated: true,
    body: [
      'You are the default implementation worker used by fhhs pi adapters when source skills dispatch `subagent_type: "general-purpose"`.',
      '',
      'Operating rules:',
      '- Execute the delegated task end-to-end with minimal, correct changes.',
      '- Follow repository conventions and constraints from project context files.',
      '- Prefer concrete verification (tests/lint/build) over assumptions.',
      '- Report changed files, validation steps, and any unresolved risks.',
      '',
      'Output format:',
      '## Completed',
      '- What was implemented',
      '',
      '## Files Changed',
      '- `path/to/file` - short reason',
      '',
      '## Verification',
      '- Commands run and outcomes',
      '',
      '## Risks / Follow-ups',
      '- Remaining concerns if any',
    ].join('\n'),
  });

  return agents;
}

function wrapperContent(target, skill) {
  const sourceRel = `../../../.claude/skills/${skill.dir}/SKILL.md`;
  return [
    '---',
    `name: ${skill.mappedName}`,
    `description: ${yamlQuoted(`${skill.description} (${target.adapterLabel})`)}`,
    '---',
    '',
    `# ${skill.mappedName}`,
    '',
    `This is a ${target.harnessLabel} compatibility adapter for the original fhhs skill \`${skill.sourceName}\`.`,
    '',
    `- ${target.commandBulletLabel}: ${target.id === 'pi' ? `\`${target.commandFor(skill.mappedName)}\`` : target.commandFor(skill.mappedName)}`,
    `- Original Claude Code command: \`${skill.originalCommand}\``,
    `- Source skill file: \`${sourceRel}\``,
    '',
    '## Instructions',
    '',
    `1. Read and follow \`${sourceRel}\`.`,
    target.instruction2,
    target.instruction3,
    ...(target.instruction4 ? [target.instruction4] : []),
    ...(target.instruction5 ? [target.instruction5] : []),
    '',
  ].join('\n');
}

function readmeContent(target, skills) {
  const lines = [
    '<!-- AUTO-GENERATED by bin/sync-harness-adapters.cjs. Do not edit manually. -->',
    target.heading,
    '',
    target.intro,
    '',
    target.tableHeader,
    '|---|---|---|',
  ];

  for (const skill of skills) {
    const cmd = target.id === 'pi' ? `\`${target.commandFor(skill.mappedName)}\`` : target.commandFor(skill.mappedName);
    lines.push(
      `| ${cmd} | \`${skill.originalCommand}\` | \`.claude/skills/${skill.dir}/SKILL.md\` |`,
    );
  }

  lines.push('');

  if (target.id === 'pi') {
    lines.push('## Subagent adapters (optional)');
    lines.push('');
    lines.push('For pi subagent tooling, this repo also generates adapters in `.pi/agents/*.md` with `fh:*` names.');
    lines.push('Use `agentScope: "project"` or `"both"` so project-local agents are discoverable.');
    lines.push('See `.pi/agents/README.md` for the full mapping.');
    lines.push('');
  }

  return lines.join('\n');
}

const HIGH_QUALITY_AGENT_SET = new Set([
  'code-architect',
  'code-reviewer',
  'design-secure',
  'gsd-debugger',
  'gsd-integration-checker',
  'gsd-nyquist-auditor',
  'gsd-phase-researcher',
  'gsd-plan-checker',
  'gsd-project-researcher',
  'gsd-research-synthesizer',
  'gsd-roadmapper',
  'gsd-verifier',
  'reflector',
  'spec-architect',
  'worker',
]);

function resolveAgentRuntimeConfig(sourceName) {
  if (HIGH_QUALITY_AGENT_SET.has(sourceName)) {
    return {
      model: 'openai-codex/gpt-5.3-codex',
      fallbackModels: 'openai-codex/gpt-5.4-mini',
      thinking: 'high',
    };
  }

  return {
    model: 'openai-codex/gpt-5.4-mini',
    fallbackModels: 'openai-codex/gpt-5.3-codex',
    thinking: 'medium',
  };
}

function agentWrapperContent(target, agent) {
  const runtime = resolveAgentRuntimeConfig(agent.sourceName);
  const sourceBullet = agent.generated
    ? '- Generated alias: project-level compatibility agent (not sourced from `agents/*.md`)'
    : `- Generated from: \`../../agents/${agent.fileName}\``;

  return [
    '---',
    `name: ${agent.subagentType}`,
    `description: ${yamlQuoted(`${agent.description} (${target.adapterLabel})`)}`,
    `model: ${runtime.model}`,
    `fallbackModels: ${runtime.fallbackModels}`,
    `thinking: ${runtime.thinking}`,
    'systemPromptMode: replace',
    'inheritProjectContext: true',
    'inheritSkills: false',
    '---',
    '',
    `# ${agent.subagentType}`,
    '',
    `This is a ${target.harnessLabel} compatibility adapter for the fhhs agent \`${agent.sourceName}\`.`,
    '',
    sourceBullet,
    `- Runtime profile: \`${runtime.model}\` (thinking: \`${runtime.thinking}\`)`,
    '- If Claude-specific tools from the source prompt are unavailable in pi, use the closest pi-equivalent tools and continue.',
    '',
    '## Source Prompt',
    '',
    agent.body,
    '',
  ].join('\n');
}

function agentReadmeContent(target, agents) {
  const lines = [
    '<!-- AUTO-GENERATED by bin/sync-harness-adapters.cjs. Do not edit manually. -->',
    target.heading,
    '',
    target.intro,
    '',
    '| subagent_type | Source agent | Default model profile | Source file |',
    '|---|---|---|---|',
  ];

  for (const agent of agents) {
    const runtime = resolveAgentRuntimeConfig(agent.sourceName);
    const sourceFile = agent.generated ? '(generated compatibility alias)' : `agents/${agent.fileName}`;
    lines.push(
      `| \`${agent.subagentType}\` | \`${agent.sourceName}\` | \`${runtime.model}:${runtime.thinking}\` | ${sourceFile.startsWith('agents/') ? `\`${sourceFile}\`` : sourceFile} |`,
    );
  }

  lines.push('');
  lines.push('High-quality plan/build/review agents default to `openai-codex/gpt-5.3-codex:high`.');
  lines.push('Faster execution-oriented agents default to `openai-codex/gpt-5.4-mini:medium`.');
  lines.push('The generated `worker` alias is pinned to the strong Codex profile for translated `general-purpose` dispatches.');
  lines.push('');
  lines.push('Need a different profile? Use `/agents` (edit), or `subagents.agentOverrides` in `.pi/settings.json` / `~/.pi/agent/settings.json`.');
  lines.push('');
  return lines.join('\n');
}

function normalize(s) {
  return s.replace(/\r\n/g, '\n');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function planExpected(skills, agents) {
  const expected = new Map();

  for (const target of TARGETS) {
    for (const skill of skills) {
      const filePath = path.join(target.skillsRoot, skill.mappedName, 'SKILL.md');
      expected.set(filePath, wrapperContent(target, skill));
    }
    expected.set(target.readmePath, readmeContent(target, skills));
  }

  for (const agent of agents) {
    const filePath = path.join(AGENT_TARGET.agentsRoot, agent.fileName);
    expected.set(filePath, agentWrapperContent(AGENT_TARGET, agent));
  }
  expected.set(AGENT_TARGET.readmePath, agentReadmeContent(AGENT_TARGET, agents));

  return expected;
}

function currentManagedFiles() {
  const files = new Set();

  for (const target of TARGETS) {
    if (fs.existsSync(target.skillsRoot)) {
      for (const dirent of fs.readdirSync(target.skillsRoot, { withFileTypes: true })) {
        if (!dirent.isDirectory()) continue;
        files.add(path.join(target.skillsRoot, dirent.name, 'SKILL.md'));
      }
    }
    if (fs.existsSync(target.readmePath)) files.add(target.readmePath);
  }

  if (fs.existsSync(AGENT_TARGET.agentsRoot)) {
    for (const dirent of fs.readdirSync(AGENT_TARGET.agentsRoot, { withFileTypes: true })) {
      if (!dirent.isFile()) continue;
      if (!dirent.name.endsWith('.md')) continue;
      files.add(path.join(AGENT_TARGET.agentsRoot, dirent.name));
    }
  }
  if (fs.existsSync(AGENT_TARGET.readmePath)) files.add(AGENT_TARGET.readmePath);

  return files;
}

function sync() {
  const skills = listSourceSkills();
  const agents = listSourceAgents();
  const expected = planExpected(skills, agents);
  const current = currentManagedFiles();

  const mismatches = [];

  // Check expected files
  for (const [filePath, content] of expected.entries()) {
    if (!fs.existsSync(filePath)) {
      mismatches.push(`missing: ${path.relative(ROOT, filePath)}`);
      continue;
    }
    const actual = normalize(fs.readFileSync(filePath, 'utf8'));
    if (actual !== normalize(content)) {
      mismatches.push(`outdated: ${path.relative(ROOT, filePath)}`);
    }
  }

  // Check stale files
  for (const filePath of current) {
    if (!expected.has(filePath)) {
      mismatches.push(`stale: ${path.relative(ROOT, filePath)}`);
    }
  }

  if (CHECK_ONLY) {
    if (mismatches.length) {
      console.error('Adapter sync check failed:');
      for (const m of mismatches) console.error(`  - ${m}`);
      process.exit(1);
    }
    console.log(`Adapter sync check passed (${skills.length} source skills, ${agents.length} source agents).`);
    return;
  }

  // Write expected files
  for (const [filePath, content] of expected.entries()) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, 'utf8');
  }

  // Remove stale wrapper dirs/files
  for (const filePath of current) {
    if (expected.has(filePath)) continue;
    if (fs.existsSync(filePath)) fs.rmSync(filePath, { force: true });
    const dir = path.dirname(filePath);
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
  }

  console.log(`Synced adapters for ${skills.length} source skills and ${agents.length} source agents.`);
}

sync();
