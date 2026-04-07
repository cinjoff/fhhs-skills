'use strict';

/**
 * Parse YAML frontmatter between --- markers.
 * Returns a plain object with key-value pairs.
 */
function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const yaml = match[1];
  const result = {};
  const lines = yaml.split(/\r?\n/);
  let currentKey = null;
  let currentList = null;

  for (const line of lines) {
    // List item
    const listMatch = line.match(/^(\s+)-\s+(.*)$/);
    if (listMatch && currentList !== null) {
      currentList.push(listMatch[2].trim());
      continue;
    }

    // Key: value
    const kvMatch = line.match(/^(\w[\w_-]*):\s*(.*)$/);
    if (kvMatch) {
      if (currentKey && currentList !== null) {
        result[currentKey] = currentList;
      }
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val === '' || val === '[]') {
        if (val === '[]') {
          result[currentKey] = [];
          currentList = null;
          currentKey = null;
        } else {
          currentList = [];
        }
      } else if (val === 'true') {
        result[currentKey] = true;
        currentList = null;
        currentKey = null;
      } else if (val === 'false') {
        result[currentKey] = false;
        currentList = null;
        currentKey = null;
      } else if (/^\d+$/.test(val)) {
        result[currentKey] = parseInt(val, 10);
        currentList = null;
        currentKey = null;
      } else {
        result[currentKey] = val;
        currentList = null;
        currentKey = null;
      }
      continue;
    }

    // Continuation of a list started with no items yet
    if (currentKey && currentList !== null) {
      // blank line or something else — close the list
      result[currentKey] = currentList;
      currentList = null;
      currentKey = null;
    }
  }

  // Flush trailing list
  if (currentKey && currentList !== null) {
    result[currentKey] = currentList;
  }

  return result;
}

/**
 * Extract trimmed text content from a simple XML element.
 * Uses dotAll matching so content can span multiple lines.
 */
function extractElement(tag, xml) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 's');
  const m = xml.match(re);
  if (!m) return '';
  return m[1].trim();
}



/**
 * Parse a single <task ...>...</task> block into a TaskDef.
 */
function parseTask(taskBlock) {
  // Extract wave and type from opening tag attributes
  const openTagMatch = taskBlock.match(/^<task([^>]*)>/s);
  const attrs = openTagMatch ? openTagMatch[1] : '';

  const waveAttrMatch = attrs.match(/wave=["']?(\d+)["']?/);
  const wave = waveAttrMatch ? parseInt(waveAttrMatch[1], 10) : 1;

  const typeAttrMatch = attrs.match(/type=["']?([^"'\s>]+)["']?/);
  const type = typeAttrMatch ? typeAttrMatch[1] : '';

  const dependsOnAttrMatch = attrs.match(/depends_on=["']?([^"'>]*)["']?/);
  const dependsOnAttr = dependsOnAttrMatch ? dependsOnAttrMatch[1].trim() : '';

  const name = extractElement('name', taskBlock);

  // files and read_first can appear multiple times; collect all
  const filesMatches = [...taskBlock.matchAll(/<files[^>]*>([\s\S]*?)<\/files>/gs)];
  const files = filesMatches
    .flatMap((m) =>
      m[1]
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
    );

  const readFirstMatches = [...taskBlock.matchAll(/<read_first[^>]*>([\s\S]*?)<\/read_first>/gs)];
  const readFirst = readFirstMatches
    .flatMap((m) =>
      m[1]
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
    );

  const action = extractElement('action', taskBlock);
  const verify = extractElement('verify', taskBlock);
  const done = extractElement('done', taskBlock);

  // depends_on can also be a child element
  let dependsOn = [];
  const dependsOnElem = extractElement('depends_on', taskBlock);
  if (dependsOnElem) {
    dependsOn = dependsOnElem
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  } else if (dependsOnAttr) {
    dependsOn = dependsOnAttr
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  return { name, files, readFirst, action, verify, done, type, wave, dependsOn };
}

/**
 * Topological sort of tasks within a wave based on depends_on.
 * Tasks not referenced in depends_on come first; dependent tasks follow.
 * Falls back to original order if cycle detected.
 */
function topoSort(tasks) {
  const nameSet = new Set(tasks.map((t) => t.name));
  const inDegree = new Map();
  const adj = new Map(); // name -> list of names that depend on it

  for (const t of tasks) {
    inDegree.set(t.name, 0);
    adj.set(t.name, []);
  }

  for (const t of tasks) {
    for (const dep of (t.dependsOn || [])) {
      if (nameSet.has(dep)) {
        inDegree.set(t.name, (inDegree.get(t.name) || 0) + 1);
        adj.get(dep).push(t.name);
      }
    }
  }

  const queue = tasks.filter((t) => inDegree.get(t.name) === 0).map((t) => t.name);
  const sorted = [];
  const taskByName = new Map(tasks.map((t) => [t.name, t]));

  while (queue.length > 0) {
    const name = queue.shift();
    sorted.push(taskByName.get(name));
    for (const dep of (adj.get(name) || [])) {
      const newDeg = inDegree.get(dep) - 1;
      inDegree.set(dep, newDeg);
      if (newDeg === 0) queue.push(dep);
    }
  }

  // If cycle detected, return original order
  if (sorted.length !== tasks.length) return tasks;
  return sorted;
}

/**
 * Parse PLAN.md at planPath.
 * Returns { waves: Array<Array<TaskDef>>, frontmatter: object }
 */
function parseWaves(planPath) {
  const fs = require('fs');
  const content = fs.readFileSync(planPath, 'utf8');

  const frontmatter = parseFrontmatter(content);

  // Extract <tasks>...</tasks> outer block
  const tasksBlockMatch = content.match(/<tasks[\s\S]*?>([\s\S]*?)<\/tasks>/s);
  if (!tasksBlockMatch) {
    return { waves: [], frontmatter };
  }
  const tasksBody = tasksBlockMatch[1];

  // Split on <task boundaries — each segment starts with <task
  const taskSegments = tasksBody.split(/(?=<task[\s>])/);

  const allTasks = [];
  for (const seg of taskSegments) {
    const trimmed = seg.trim();
    if (!trimmed.startsWith('<task')) continue;
    // Find the closing </task> and include it
    const closeIdx = trimmed.indexOf('</task>');
    if (closeIdx === -1) continue;
    const taskBlock = trimmed.slice(0, closeIdx + '</task>'.length);
    allTasks.push(parseTask(taskBlock));
  }

  // Group by wave
  const waveMap = new Map();
  for (const task of allTasks) {
    const w = task.wave;
    if (!waveMap.has(w)) waveMap.set(w, []);
    waveMap.get(w).push(task);
  }

  // Sort wave numbers, apply topo sort within each wave
  const sortedWaveNumbers = [...waveMap.keys()].sort((a, b) => a - b);
  const waves = sortedWaveNumbers.map((w) => topoSort(waveMap.get(w)));

  // Strip internal wave/dependsOn from TaskDef (keep only public shape)
  const cleanWaves = waves.map((waveTasks) =>
    waveTasks.map(({ name, files, readFirst, action, verify, done, type }) => ({
      name,
      files,
      readFirst,
      action,
      verify,
      done,
      type,
    }))
  );

  return { waves: cleanWaves, frontmatter };
}

module.exports = { parseWaves };
