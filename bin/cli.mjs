#!/usr/bin/env node
/*
 * StatusCraft launcher — opens the visual statusline designer in your browser.
 * Zero dependencies: uses only Node's built-in modules, so `npx statuscraft`
 * and `bunx statuscraft` both work without an install step.
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadPkg() {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  } catch {
    return { name: 'statuscraft', version: '0.0.0' };
  }
}
const pkg = loadPkg();

// ---- argument parsing ----
const argv = process.argv.slice(2);
const opts = { port: Number(process.env.STATUSCRAFT_PORT) || 4567, open: true };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--help' || a === '-h') { printHelp(); process.exit(0); }
  else if (a === '--version' || a === '-v') { console.log(pkg.version); process.exit(0); }
  else if (a === '--no-open') { opts.open = false; }
  else if (a === '--port' || a === '-p') { opts.port = Number(argv[++i]); }
  else { console.error(`unknown option: ${a}\n`); printHelp(); process.exit(1); }
}

function printHelp() {
  console.log(`
StatusCraft — visual statusline designer for Claude Code

Usage:
  npx statuscraft [options]
  bunx statuscraft [options]

Options:
  -p, --port <n>   Port to serve on (default: 4567, auto-increments if busy)
      --no-open    Don't auto-open the browser
  -h, --help       Show this help
  -v, --version    Show version

The designer opens in your browser. Build your statusline, click
"Apply to Claude Code" (or copy the script), then follow the on-screen steps.
`);
}

// ---- load the designer HTML ----
let html;
try {
  html = readFileSync(join(ROOT, 'index.html'));
} catch {
  console.error('error: index.html not found next to the StatusCraft package.');
  process.exit(1);
}

// ---- open the default browser, cross-platform ----
function openBrowser(url) {
  let cmd, args;
  if (process.platform === 'darwin') { cmd = 'open'; args = [url]; }
  else if (process.platform === 'win32') { cmd = 'cmd'; args = ['/c', 'start', '""', url]; }
  else { cmd = 'xdg-open'; args = [url]; }
  try {
    const child = spawn(cmd, args, { stdio: 'ignore', detached: true });
    child.on('error', () => {}); // URL is printed anyway, so failing to open is non-fatal
    child.unref();
  } catch { /* ignore */ }
}

// ---- serve the single HTML file ----
const server = createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(html);
});

let attempts = 0;
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && attempts < 20) {
    attempts++;
    server.listen(opts.port + attempts, '127.0.0.1');
  } else {
    console.error('error: could not start server —', err.message);
    process.exit(1);
  }
});

server.on('listening', () => {
  const url = `http://localhost:${server.address().port}`;
  console.log(`\n  StatusCraft designer\n  ▸ ${url}\n`);
  if (opts.open) openBrowser(url);
  console.log('  Design your statusline, then "Apply to Claude Code" or copy the script.');
  console.log('  Press Ctrl+C to stop.\n');
});

server.listen(opts.port, '127.0.0.1');

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 500).unref(); // force-exit if close hangs
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
