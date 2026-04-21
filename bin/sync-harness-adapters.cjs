#!/usr/bin/env node
/*
 * Sync harness adapter skills from .claude/skills into:
 *   - .pi/skills
 *   - .codex/skills
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
  },
];

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
  return lines.join('\n');
}

function normalize(s) {
  return s.replace(/\r\n/g, '\n');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function planExpected(skills) {
  const expected = new Map();
  for (const target of TARGETS) {
    for (const skill of skills) {
      const filePath = path.join(target.skillsRoot, skill.mappedName, 'SKILL.md');
      expected.set(filePath, wrapperContent(target, skill));
    }
    expected.set(target.readmePath, readmeContent(target, skills));
  }
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
  return files;
}

function sync() {
  const skills = listSourceSkills();
  const expected = planExpected(skills);
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
    console.log(`Adapter sync check passed (${skills.length} source skills).`);
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

  console.log(`Synced adapters for ${skills.length} source skills.`);
}

sync();
