#!/usr/bin/env node
// Check for fhhs-skills updates in background, write result to cache
// Called by SessionStart hook - runs once per session
// Checks GitHub raw for the latest plugin.json version

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const homeDir = os.homedir();
const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(homeDir, '.claude');
const cacheDir = path.join(claudeDir, 'cache');
const cacheFile = path.join(cacheDir, 'fhhs-update-check.json');

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Throttle: only check once per 6 hours
if (fs.existsSync(cacheFile)) {
  try {
    const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    const sixHours = 6 * 60 * 60;
    if (cache.checked && (Math.floor(Date.now() / 1000) - cache.checked) < sixHours) {
      process.exit(0);
    }
  } catch (e) {}
}

// Find installed version from plugin.json in the plugin cache
// The symlink ~/.claude/get-shit-done/bin/ points into the plugin directory
const gsdBinDir = path.join(claudeDir, 'get-shit-done', 'bin');

const child = spawn(process.execPath, ['-e', `
  const fs = require('fs');
  const path = require('path');
  const https = require('https');

  const cacheFile = ${JSON.stringify(cacheFile)};
  const gsdBinDir = ${JSON.stringify(gsdBinDir)};

  // Find installed version by walking up from the bin symlink
  let installed = '0.0.0';
  try {
    const realBin = fs.realpathSync(gsdBinDir);
    // realBin is something like .../fhhs-skills/{hash}/bin
    // plugin.json is at .../fhhs-skills/{hash}/.claude-plugin/plugin.json
    const pluginRoot = path.dirname(realBin);
    const pluginJsonPath = path.join(pluginRoot, '.claude-plugin', 'plugin.json');
    if (fs.existsSync(pluginJsonPath)) {
      const pluginData = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
      installed = pluginData.version || '0.0.0';
    }
  } catch (e) {}

  // Also try marketplace listing for installed plugins
  if (installed === '0.0.0') {
    try {
      const installedPlugins = path.join(${JSON.stringify(path.join(homeDir, '.claude'))}, 'plugins', 'installed_plugins.json');
      if (fs.existsSync(installedPlugins)) {
        const data = JSON.parse(fs.readFileSync(installedPlugins, 'utf8'));
        const fhPlugin = data.plugins && data.plugins['fh@fhhs-skills'];
        if (fhPlugin && fhPlugin.version) {
          installed = fhPlugin.version;
        }
      }
    } catch (e) {}
  }

  // Check GitHub for latest version
  function fetchLatest() {
    return new Promise((resolve, reject) => {
      const url = 'https://raw.githubusercontent.com/cinjoff/fhhs-skills/main/.claude-plugin/plugin.json';
      https.get(url, { timeout: 10000 }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error('HTTP ' + res.statusCode));
          res.resume();
          return;
        }
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(data.version || null);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  fetchLatest().then(latest => {
    const result = {
      update_available: latest && installed !== latest && installed !== '0.0.0',
      installed,
      latest: latest || 'unknown',
      checked: Math.floor(Date.now() / 1000)
    };
    fs.writeFileSync(cacheFile, JSON.stringify(result));
  }).catch(() => {
    const result = {
      update_available: false,
      installed,
      latest: 'unknown',
      checked: Math.floor(Date.now() / 1000)
    };
    fs.writeFileSync(cacheFile, JSON.stringify(result));
  });
`], {
  stdio: 'ignore',
  windowsHide: true,
  detached: true
});

child.unref();
