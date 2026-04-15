require('../src/loadEnv');
const { maybeStartMemoryServer } = require('../src/config/memoryMongo');
const { connectWithRetry } = require('../src/config/db');
const { createApp } = require('../src/createApp');

const app = createApp();
let initPromise;

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      if (process.env.USE_MEMORY_DB === 'true') {
        await maybeStartMemoryServer();
      }
      await connectWithRetry({ maxAttempts: 1, delayMs: 0 });
    })();
  }
  return initPromise;
}

module.exports = async (req, res) => {
  try {
    await ensureInitialized();
    return app(req, res);
  } catch (err) {
    console.error('[vercel-api]', err);
    return res.status(500).json({
      message: 'Server initialization failed. Check backend env variables in Vercel.',
    });
  }
};
