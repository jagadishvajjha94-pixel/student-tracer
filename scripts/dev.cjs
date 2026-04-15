/**
 * Starts API + UI with correct working directories (avoids wrong cwd / missing .env).
 * Opens your REAL browser (Safari/Chrome) when Vite is ready — avoids Cursor "Simple Browser"
 * which triggers chrome-error:// + "Unsafe attempt to load URL" for localhost.
 */
const http = require('http');
const { spawn, exec } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const backendDir = path.join(root, 'backend');
const frontendDir = path.join(root, 'frontend');

const APP_URL = 'http://127.0.0.1:5173/';
const OPEN_BROWSER = process.env.OPEN_BROWSER !== '0';

function run(cwd) {
  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'npm.cmd' : 'npm';
  return spawn(cmd, ['run', 'dev'], {
    cwd,
    stdio: 'inherit',
    shell: isWin,
    env: { ...process.env },
  });
}

function waitForHttpOk(url, timeoutMs = 120000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const poll = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error('Timed out waiting for Vite'));
        return;
      }
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => setTimeout(poll, 400));
      req.setTimeout(2000, () => {
        req.destroy();
        setTimeout(poll, 400);
      });
    };
    poll();
  });
}

function openExternalBrowser(url) {
  const platform = process.platform;
  let command;
  if (platform === 'darwin') {
    command = `open "${url}"`;
  } else if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }
  exec(command, (err) => {
    if (err) {
      console.error('\nCould not auto-open browser:', err.message);
      console.error('Open this URL yourself:', url, '\n');
      return;
    }
    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│  App opened in your SYSTEM browser (Safari / Chrome / Edge). │');
    console.log('│  Ignore the editor "Simple Browser" tab if it shows an error. │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');
  });
}

console.log('\n>>> Starting API (port 5000) + UI (port 5173). Keep this terminal open.\n');

const api = run(backendDir);
const ui = run(frontendDir);

if (OPEN_BROWSER) {
  setTimeout(() => {
    waitForHttpOk(APP_URL)
      .then(() => openExternalBrowser(APP_URL))
      .catch((e) => {
        console.error('\n[dev]', e.message);
        console.error('Open manually when Vite is ready:', APP_URL, '\n');
      });
  }, 500);
} else {
  console.log('>>> OPEN_BROWSER=0 — open yourself:', APP_URL, '\n');
}

function shutdown() {
  try {
    api.kill('SIGTERM');
  } catch (_) {}
  try {
    ui.kill('SIGTERM');
  } catch (_) {}
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

api.on('exit', (code, sig) => {
  if (sig === 'SIGTERM') return;
  if (code && code !== 0) {
    console.error(`[api] exited with ${code}`);
    shutdown();
  }
});
ui.on('exit', (code, sig) => {
  if (sig === 'SIGTERM') return;
  if (code && code !== 0) {
    console.error(`[ui] exited with ${code}`);
    shutdown();
  }
});
