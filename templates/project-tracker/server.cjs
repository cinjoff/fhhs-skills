'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { parsePlanning } = require('./parser.cjs');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const BASE_PORT = 3847;
const MAX_PORT_ATTEMPTS = 3;
const DEBOUNCE_MS = 300;

// Resolve .planning/ relative to CWD (user's project root)
const planningDir = path.resolve(process.cwd(), '.planning');

// ---------------------------------------------------------------------------
// Startup validation
// ---------------------------------------------------------------------------
if (!fs.existsSync(planningDir)) {
  console.error(
    '\n  Error: No .planning/ directory found in the current directory.\n\n' +
    '  The project tracker needs a .planning/ directory to read project data.\n' +
    '  Make sure you run this server from your project root.\n\n' +
    '  Expected: ' + planningDir + '\n'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Serve index.html
// ---------------------------------------------------------------------------
const indexPath = path.join(__dirname, 'index.html');

function serveIndex(res) {
  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error: index.html not found. Re-scaffold with /tracker.');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
}

// ---------------------------------------------------------------------------
// API: /api/state
// ---------------------------------------------------------------------------
function serveState(res) {
  try {
    const data = parsePlanning(planningDir);
    const json = JSON.stringify(data);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    });
    res.end(json);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// ---------------------------------------------------------------------------
// API: /api/events (SSE)
// ---------------------------------------------------------------------------
function serveEvents(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send initial comment to establish connection
  res.write(':connected\n\n');

  let debounceTimer = null;

  // NOTE: { recursive: true } only works on macOS and Windows.
  // On Linux, only top-level .planning/ changes will trigger updates.
  const watcher = fs.watch(planningDir, { recursive: true }, () => {
    // Debounce rapid file changes
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try {
        res.write('event: refresh\ndata: {}\n\n');
      } catch {
        // Connection may have closed
      }
    }, DEBOUNCE_MS);
  });

  // Clean up on connection close
  req.on('close', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    watcher.close();
  });
}

// ---------------------------------------------------------------------------
// HTTP Server
// ---------------------------------------------------------------------------
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    return serveIndex(res);
  }

  if (req.method === 'GET' && pathname === '/api/state') {
    return serveState(res);
  }

  if (req.method === 'GET' && pathname === '/api/events') {
    return serveEvents(req, res);
  }

  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

// ---------------------------------------------------------------------------
// Start with port fallback
// ---------------------------------------------------------------------------
function tryListen(port, attempt) {
  if (attempt > MAX_PORT_ATTEMPTS) {
    console.error(
      `\n  Error: Could not find an open port (tried ${BASE_PORT}-${BASE_PORT + MAX_PORT_ATTEMPTS - 1}).\n` +
      '  Close other services and try again.\n'
    );
    process.exit(1);
  }

  server.listen(port, '127.0.0.1', () => {
    console.log(
      '\n  Project Tracker is running!\n\n' +
      `  Dashboard:  http://127.0.0.1:${port}\n` +
      `  API:        http://127.0.0.1:${port}/api/state\n` +
      `  Watching:   ${planningDir}\n\n` +
      '  Press Ctrl+C to stop.\n'
    );
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`  Port ${port} is busy, trying ${port + 1}...`);
      server.removeAllListeners('error');
      tryListen(port + 1, attempt + 1);
    } else {
      throw err;
    }
  });
}

tryListen(BASE_PORT, 1);
