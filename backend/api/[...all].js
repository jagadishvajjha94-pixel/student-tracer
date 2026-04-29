require('../src/loadEnv');
const { applyVercelEnv } = require('../src/config/resolveVercelEnv');
const { maybeStartMemoryServer } = require('../src/config/memoryMongo');
const { connectWithRetry } = require('../src/config/db');
const { createApp } = require('../src/createApp');

applyVercelEnv();

const app = createApp();
let initPromise = null;

function shouldSkipDatabaseInit(req) {
  if (req.method === 'OPTIONS') {
    return true;
  }
  const raw = req.originalUrl || req.url || '';
  const noQuery = raw.split('?')[0] || '';
  if (noQuery === '/api/health' || noQuery.endsWith('/api/health')) {
    return true;
  }
  return false;
}

/** Connect once per warm serverless instance; allow retry if the first attempt failed. */
async function ensureInitialized() {
  if (initPromise) {
    try {
      await initPromise;
      return;
    } catch {
      initPromise = null;
    }
  }
  const onVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
  initPromise = (async () => {
    if (process.env.USE_MEMORY_DB === 'true') {
      await maybeStartMemoryServer();
    }
    await connectWithRetry({
      maxAttempts: onVercel ? 5 : 1,
      delayMs: onVercel ? 2000 : 0,
    });
  })();
  try {
    await initPromise;
  } catch (err) {
    initPromise = null;
    throw err;
  }
}

module.exports = async (req, res) => {
  if (shouldSkipDatabaseInit(req)) {
    return app(req, res);
  }
  try {
    await ensureInitialized();
    return app(req, res);
  } catch (err) {
    console.error('[vercel-api]', err);
    const msg = (err && err.message) || String(err);
    const body = {
      message: 'Server initialization failed. Check backend env variables in Vercel.',
      code: 'API_INIT_FAILED',
    };
    if (msg.includes('MONGODB_URI is not defined')) {
      body.code = 'MONGODB_URI_MISSING';
      body.message = 'MONGODB_URI is not set. In Vercel, set MONGODB_URI to your Mongo connection string (or set DATABASE_URL).';
    } else if (msg.includes('authentication failed') || msg.includes('bad auth')) {
      body.code = 'MONGODB_AUTH_FAILED';
    }
    return res.status(500).json(body);
  }
};
