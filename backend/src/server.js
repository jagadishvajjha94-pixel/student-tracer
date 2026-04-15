require('./loadEnv');
const mongoose = require('mongoose');
const { connectWithRetry, startReconnectLoop } = require('./config/db');
const { maybeStartMemoryServer, stopMemoryServer } = require('./config/memoryMongo');
const { createApp } = require('./createApp');

const app = createApp();
const PORT = Number(process.env.PORT) || 5000;

async function shutdown(signal) {
  console.log(`\n${signal} — shutting down…`);
  try {
    await mongoose.connection.close();
    await stopMemoryServer();
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

/** Load demo users & interviews when DB is empty (local / non-production). */
async function maybeAutoSeed() {
  if (process.env.AUTO_SEED === 'false') return;
  if (process.env.NODE_ENV === 'production') return;
  try {
    const User = require('./models/User');
    const count = await User.countDocuments();
    if (count > 0) return;
    const { seedDemoData } = require('./seed/seedData');
    console.log('[demo] Empty database — seeding demo accounts & interviews…');
    await seedDemoData();
    console.log('[demo] Use the “Demo logins” box on the sign-in page (password: demo123).');
  } catch (e) {
    console.error('[demo] Auto-seed failed:', e.message);
  }
}

function start() {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is required. Copy backend/.env.example to backend/.env');
    process.exit(1);
  }

  if (process.env.USE_MEMORY_DB !== 'true' && !process.env.MONGODB_URI) {
    console.error('Set MONGODB_URI or USE_MEMORY_DB=true in backend/.env');
    process.exit(1);
  }

  const host = process.env.HOST || '0.0.0.0';

  app.listen(PORT, host, () => {
    console.log(`API server: http://localhost:${PORT}  (bound on ${host})`);
    console.log('Health check: GET /api/health');

    connectWithRetry()
      .then(async () => {
        console.log('Database ready.');
        await maybeAutoSeed();
      })
      .catch((err) => {
        console.error('\n--- MongoDB could not be reached ---');
        console.error(err.message);
        console.error(
          'If USE_MEMORY_DB is false, start MongoDB or set USE_MEMORY_DB=true in backend/.env'
        );
        console.error('Tip: docker compose up -d  (from project root)\n');
        startReconnectLoop();
      });
  });

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

(async () => {
  try {
    await maybeStartMemoryServer();
  } catch (e) {
    console.error('Failed to start embedded MongoDB:', e);
    process.exit(1);
  }
  start();
})();
