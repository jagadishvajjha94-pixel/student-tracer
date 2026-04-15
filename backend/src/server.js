require('./loadEnv');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const { connectWithRetry, getDbStatus, startReconnectLoop } = require('./config/db');
const { maybeStartMemoryServer, stopMemoryServer } = require('./config/memoryMongo');
const { requireDb } = require('./middleware/requireDb');

const authRoutes = require('./routes/authRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const exportRoutes = require('./routes/exportRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);
if (process.env.CLIENT_ORIGIN) {
  allowedOrigins.add(process.env.CLIENT_ORIGIN);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'student-interview-tracker-api',
    database: getDbStatus(),
  });
});

app.use('/api', requireDb);

app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/students', studentRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

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
