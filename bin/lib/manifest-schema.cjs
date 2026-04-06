'use strict';
/**
 * manifest-schema.cjs — Canonical manifest shapes for fhhs-skills health checks.
 *
 * Exports:
 *   MANIFEST_VERSION        — schema version string
 *   defaultGlobalManifest() — known tools/plugins/hooks/env/dirs with install info
 *   defaultProjectManifest()— stack detection + planning state fields
 *   mergeManifests(g, p)    — deep-merge global + project (project wins)
 *   validateInstallCommand(cmd) — safe-pattern validation for install strings
 */

// ─── Version ─────────────────────────────────────────────────────────────────

const MANIFEST_VERSION = '1.0';

// ─── Item shape helpers ───────────────────────────────────────────────────────

/**
 * Create a manifest item with consistent shape.
 * @param {object} opts
 * @returns {{ required: boolean, status: string, check: string, id: string,
 *             install: string|null, since: string|null, deprecated: boolean,
 *             action: string|null, reason: string|null }}
 */
function item(opts) {
  return {
    required:   opts.required   ?? false,
    status:     opts.status     ?? 'active',
    check:      opts.check,             // 'tool'|'plugin'|'hook'|'env'|'dir'|'file'
    id:         opts.id,
    install:    opts.install    ?? null,
    since:      opts.since      ?? null,
    deprecated: opts.deprecated ?? false,
    action:     opts.action     ?? null,
    reason:     opts.reason     ?? null,
  };
}

// ─── Global manifest ─────────────────────────────────────────────────────────

/**
 * Returns the canonical global manifest: all known tools, plugins, hooks,
 * env vars, and dirs with their required/optional status and install commands.
 */
function defaultGlobalManifest() {
  return {
    version: MANIFEST_VERSION,
    items: [
      // ── Required CLI tools ──────────────────────────────────────────────
      item({
        required: true, status: 'active', check: 'tool', id: 'node',
        install: null, // installed via system package manager or nvm
        since: '1.0',
        reason: 'Node.js runtime required for all gsd-tools CLI commands',
      }),
      item({
        required: true, status: 'active', check: 'tool', id: 'git',
        install: null,
        since: '1.0',
        reason: 'Git required for all version control operations',
      }),
      item({
        required: false, status: 'active', check: 'tool', id: 'fallow',
        install: 'npm install -g fallow',
        since: '1.0',
        reason: 'Fallow CLI for project scaffolding',
      }),
      item({
        required: false, status: 'active', check: 'tool', id: 'typescript-language-server',
        install: 'npm install -g typescript-language-server typescript',
        since: '1.0',
        reason: 'TypeScript LSP for IDE language features',
      }),
      item({
        required: true, status: 'active', check: 'tool', id: 'bun',
        install: 'curl -fsSL https://bun.sh/install | bash',
        since: '1.62.4',
        reason: 'Bun runtime required for gstack browse build and fast script execution',
      }),
      item({
        required: true, status: 'active', check: 'tool', id: 'ast-grep',
        install: 'brew install ast-grep',
        since: '1.62.4',
        reason: 'ast-grep CLI for structural code search used by review, build, fix, and refactor',
      }),
      item({
        required: false, status: 'optional', check: 'tool', id: 'sqlite3',
        install: null,
        since: '1.0',
        reason: 'Required for Conductor DB queries in global-reconcile',
      }),

      // ── Required plugins ────────────────────────────────────────────────
      item({
        required: true, status: 'active', check: 'plugin', id: 'claude-mem',
        install: 'claude plugin install claude-mem',
        since: '1.0',
        reason: 'claude-mem MCP plugin for code navigation and memory',
      }),
      item({
        required: false, status: 'active', check: 'plugin', id: 'typescript-lsp@claude-plugins-official',
        install: 'claude plugin install typescript-lsp@claude-plugins-official',
        since: '1.0',
        reason: 'Official TypeScript LSP plugin for Claude Code',
      }),

      // ── context-mode — DEPRECATED (auto-remove) ─────────────────────────
      item({
        required: false, status: 'deprecated', check: 'plugin', id: 'context-mode',
        install: null,
        since: '1.0',
        deprecated: true,
        action: 'remove',
        reason: 'context-mode plugin is no longer needed; claude-mem covers these capabilities',
      }),

      // ── Hooks ───────────────────────────────────────────────────────────
      item({
        required: false, status: 'active', check: 'hook', id: 'fhhs-check-update',
        install: null, // configured by /fh:setup
        since: '1.0',
        reason: 'SessionStart hook to check for fhhs-skills updates',
      }),
      item({
        required: false, status: 'active', check: 'hook', id: 'fhhs-learnings',
        install: null,
        since: '1.0',
        reason: 'SessionStart hook to surface prior learnings',
      }),
      item({
        required: false, status: 'active', check: 'hook', id: 'fhhs-context-monitor',
        install: null,
        since: '1.0',
        reason: 'PostToolUse hook to monitor context window usage',
      }),
      item({
        required: false, status: 'active', check: 'hook', id: 'fhhs-statusline',
        install: null,
        since: '1.0',
        reason: 'statusLine hook for Claude Code status bar integration',
      }),

      // ── Environment variables ────────────────────────────────────────────
      item({
        required: true, status: 'active', check: 'env', id: 'FHHS_SKILLS_ROOT',
        install: null, // auto-set by /fh:setup
        since: '1.0',
        reason: 'Path to fhhs-skills plugin cache root — required for skill resolution',
      }),
      item({
        required: false, status: 'active', check: 'env', id: 'CLAUDE_CWD',
        install: null,
        since: '1.0',
        reason: 'Project working directory for Claude Code context',
      }),
      item({
        required: false, status: 'active', check: 'env', id: 'CLAUDE_MEM_PROJECT',
        install: null,
        since: '1.0',
        reason: 'Project name for claude-mem memory namespacing',
      }),
      item({
        required: false, status: 'optional', check: 'env', id: 'CLAUDE_CODE_ENABLE_TASKS',
        install: null,
        since: '1.0',
        reason: 'Enable Tasks feature in Claude Code',
      }),

      // ── Directories ──────────────────────────────────────────────────────
      item({
        required: true, status: 'active', check: 'dir', id: '~/.claude/get-shit-done',
        install: null, // created by /fh:setup
        since: '1.0',
        reason: 'GSD tools installation directory',
      }),
    ],
  };
}

// ─── Project manifest ─────────────────────────────────────────────────────────

/**
 * Returns the canonical project manifest shape with stack detection,
 * feature flags, and planning state fields.
 * All values default to null/false — populated by detection at runtime.
 */
function defaultProjectManifest() {
  return {
    version: MANIFEST_VERSION,
    stack: {
      framework:      null,   // e.g. 'next', 'remix', 'express', 'vite'
      database:       null,   // e.g. 'postgres', 'mysql', 'sqlite', 'mongodb'
      auth:           null,   // e.g. 'clerk', 'next-auth', 'lucia'
      testing:        null,   // e.g. 'jest', 'vitest', 'playwright'
      packageManager: null,   // e.g. 'npm', 'pnpm', 'yarn', 'bun'
    },
    features: {
      planning:   false,  // has .planning/ directory
      conductor:  false,  // is a Conductor workspace
      startup:    false,  // has startup validation configured
    },
    planning: {
      hasRoadmap:       false,
      hasCLAUDE:        false,
      hasConductorJson: false,
    },
  };
}

// ─── Merge ────────────────────────────────────────────────────────────────────

/**
 * Deep-merge global manifest with project overrides.
 * Project values win over global values at every level.
 * Arrays are replaced (not concatenated) by project arrays.
 *
 * @param {object} global — result of defaultGlobalManifest() or similar shape
 * @param {object} project — result of defaultProjectManifest() or partial override
 * @returns {object} merged manifest
 */
function mergeManifests(global, project) {
  if (!global || typeof global !== 'object') return { ...(project || {}) };
  if (!project || typeof project !== 'object') return { ...global };

  const result = { ...global };

  for (const key of Object.keys(project)) {
    const gVal = global[key];
    const pVal = project[key];

    if (
      pVal !== null &&
      typeof pVal === 'object' &&
      !Array.isArray(pVal) &&
      gVal !== null &&
      typeof gVal === 'object' &&
      !Array.isArray(gVal)
    ) {
      // Both are plain objects — recurse
      result[key] = mergeManifests(gVal, pVal);
    } else {
      // Scalar, array, or null — project wins
      result[key] = pVal;
    }
  }

  return result;
}

// ─── Install command validation ───────────────────────────────────────────────

/**
 * Safe install command prefixes — only known package managers and claude CLI.
 * Rejects arbitrary shell commands, redirects, pipes, subshells, etc.
 */
const SAFE_INSTALL_PREFIXES = [
  /^npm\s+install\b/,
  /^pnpm\s+install\b/,
  /^yarn\s+(add|install)\b/,
  /^bun\s+(add|install)\b/,
  /^npx\s+-y\s+/,
  /^brew\s+install\b/,
  /^curl\s+-fsSL\s+https:\/\//,
  /^claude\s+plugin\s+(install|marketplace)\b/,
  /^claude\s+mcp\s+add\b/,
];

/**
 * Exact safe patterns that contain shell metacharacters (like pipes)
 * but are known-good installer commands. Checked before UNSAFE_PATTERNS.
 */
const SAFE_EXACT_PATTERNS = [
  /^curl\s+-fsSL\s+https:\/\/[^\s]+\s+\|\s*bash$/,
];

/**
 * Disallowed patterns — shell metacharacters and dangerous operators.
 * These indicate arbitrary shell execution, not a safe package install.
 */
const UNSAFE_PATTERNS = [
  /[;&|`]/, // shell chaining, pipes, backticks
  /\$\(/, // subshell expansion
  />>?/, // redirection
  /&&/, // short-circuit chaining (also caught by & above, but be explicit)
  /\|\|/, // or-chaining
];

/**
 * Validates that an install command matches known safe patterns.
 * null is valid (means manual installation).
 * Returns true if safe, false if rejected.
 *
 * @param {string|null} cmd
 * @returns {boolean}
 */
function validateInstallCommand(cmd) {
  if (cmd === null || cmd === undefined) return true;
  if (typeof cmd !== 'string') return false;

  const trimmed = cmd.trim();
  if (trimmed.length === 0) return false;

  // Allow known-good patterns that contain shell metacharacters (e.g. curl | bash)
  for (const pattern of SAFE_EXACT_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  // Reject if any unsafe pattern matches
  for (const pattern of UNSAFE_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Must start with a known safe prefix
  for (const prefix of SAFE_INSTALL_PREFIXES) {
    if (prefix.test(trimmed)) return true;
  }

  return false;
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  MANIFEST_VERSION,
  defaultGlobalManifest,
  defaultProjectManifest,
  mergeManifests,
  validateInstallCommand,
};
