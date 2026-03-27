import { build, context } from 'esbuild';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const watch = process.argv.includes('--watch');

mkdirSync('.build', { recursive: true });

async function buildJS(ctx) {
  if (ctx) {
    await ctx.rebuild();
  } else {
    await build({
      entryPoints: ['src/app.jsx'],
      bundle: true,
      format: 'esm',
      minify: true,
      jsx: 'automatic',
      jsxImportSource: 'preact',
      outfile: '.build/app.js',
      alias: {
        'react': '@preact/compat',
        'react-dom': '@preact/compat',
        'react/jsx-runtime': '@preact/compat/jsx-runtime',
      },
    });
  }
}

function buildCSS() {
  execSync('npx @tailwindcss/cli -i src/index.css -o .build/styles.css --minify', {
    stdio: 'inherit',
  });
}

function assemble() {
  const template = readFileSync('src/index.html', 'utf8');
  const css = readFileSync('.build/styles.css', 'utf8');
  const js = readFileSync('.build/app.js', 'utf8');
  const out = template
    .replace('/*__CSS__*/', () => css)
    .replace('/*__JS__*/', () => js);
  writeFileSync('index.html', out);
}

async function run() {
  if (watch) {
    const ctx = await context({
      entryPoints: ['src/app.jsx'],
      bundle: true,
      format: 'esm',
      minify: true,
      jsx: 'automatic',
      jsxImportSource: 'preact',
      outfile: '.build/app.js',
      alias: {
        'react': '@preact/compat',
        'react-dom': '@preact/compat',
        'react/jsx-runtime': '@preact/compat/jsx-runtime',
      },
    });

    async function rebuild() {
      try {
        await buildJS(ctx);
        buildCSS();
        assemble();
        console.log(`[${new Date().toLocaleTimeString()}] Built successfully`);
      } catch (e) {
        console.error('Build error:', e.message);
      }
    }

    await rebuild();

    // Poll for changes every 500ms
    const { statSync } = await import('fs');
    const { join } = await import('path');
    const { readdirSync } = await import('fs');

    function getFiles(dir) {
      const files = [];
      try {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, entry.name);
          if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.build') {
            files.push(...getFiles(full));
          } else if (entry.isFile() && /\.(jsx?|css|html)$/.test(entry.name)) {
            files.push(full);
          }
        }
      } catch {}
      return files;
    }

    let lastMtimes = {};
    function checkChanges() {
      const files = getFiles('src');
      let changed = false;
      const newMtimes = {};
      for (const f of files) {
        try {
          const mt = statSync(f).mtimeMs;
          newMtimes[f] = mt;
          if (lastMtimes[f] !== mt) changed = true;
        } catch {}
      }
      lastMtimes = newMtimes;
      return changed;
    }

    // Initialize mtimes
    checkChanges();

    console.log('Watching for changes...');
    setInterval(async () => {
      if (checkChanges()) {
        await rebuild();
      }
    }, 500);
  } else {
    await buildJS(null);
    buildCSS();
    assemble();
    console.log('Build complete');
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
