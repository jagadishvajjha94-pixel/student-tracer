/**
 * Quick check: are Mongo/API/UI reachable? Run: npm run doctor
 */
const http = require('http');
const net = require('net');
const path = require('path');

function checkPort(port) {
  return new Promise((resolve) => {
    const s = net.createConnection({ port, host: '127.0.0.1' }, () => {
      s.end();
      resolve(true);
    });
    s.on('error', () => resolve(false));
  });
}

function httpGet(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 2000 }, (res) => {
      resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, code: res.statusCode });
    });
    req.on('error', () => resolve({ ok: false, code: null }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, code: null });
    });
  });
}

async function main() {
  const root = path.join(__dirname, '..');
  console.log('\n=== Student Interview Tracker — doctor ===\n');
  console.log('Project root:', root);

  const p5000 = await checkPort(5000);
  const p5173 = await checkPort(5173);

  console.log('\nPorts (127.0.0.1):');
  console.log(`  5000 (API):  ${p5000 ? 'LISTENING ✓' : 'NOT OPEN ✗'}`);
  console.log(`  5173 (Vite): ${p5173 ? 'LISTENING ✓' : 'NOT OPEN ✗'}`);

  if (p5000) {
    const h = await httpGet('http://127.0.0.1:5000/api/health');
    console.log(`\n  GET /api/health → ${h.ok ? 'OK' : 'failed'} ${h.code ?? ''}`);
  }

  if (!p5000 && !p5173) {
    console.log('\n--- Fix ---');
    console.log('API and UI are not running. In a terminal:\n');
    console.log(`  cd "${root}"`);
    console.log('  npm run mongo          # MongoDB (Docker), if you use it');
    console.log('  npm run dev            # leave this running\n');
    console.log('Then open in Chrome/Safari (not only the IDE Simple Browser):');
    console.log('  http://127.0.0.1:5173\n');
  } else if (!p5173) {
    console.log('\n--- Fix ---');
    console.log('The UI (Vite) is NOT running — that causes "connection refused" and chrome-error://.');
    console.log('Start it (and keep the terminal open):\n');
    console.log(`  cd "${root}" && npm run dev\n`);
    console.log('Or only the frontend: cd frontend && npm run dev\n');
  } else if (!p5000) {
    console.log('\n--- Fix ---');
    console.log('The API is not running. From project root:\n');
    console.log(`  cd "${root}/backend" && npm run dev\n`);
  } else {
    console.log('\nServers look up. Open: http://127.0.0.1:5173\n');
  }
}

main().catch(console.error);
