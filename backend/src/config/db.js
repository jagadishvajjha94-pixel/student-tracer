const mongoose = require('mongoose');

function getDbStatus() {
  const s = mongoose.connection.readyState;
  if (s === 1) return 'connected';
  if (s === 2) return 'connecting';
  if (s === 3) return 'disconnecting';
  return 'disconnected';
}

/**
 * Retries so MongoDB can start (e.g. Docker) after the API process.
 */
async function connectWithRetry(options = {}) {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined');
  }

  const maxAttempts = options.maxAttempts ?? 15;
  const delayMs = options.delayMs ?? 2000;

  mongoose.set('strictQuery', true);

  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await mongoose.connect(uri);
      console.log('MongoDB connected');
      return;
    } catch (err) {
      lastErr = err;
      console.error(
        `[MongoDB] attempt ${attempt}/${maxAttempts} failed: ${err.message || err}`
      );
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastErr;
}

/** Keeps trying if MongoDB starts after the API (e.g. Docker slow start). */
function startReconnectLoop() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return;

  const id = setInterval(async () => {
    if (mongoose.connection.readyState === 1) {
      clearInterval(id);
      return;
    }
    try {
      mongoose.set('strictQuery', true);
      await mongoose.connect(uri);
      console.log('MongoDB connected.');
      clearInterval(id);
    } catch {
      /* try again */
    }
  }, 5000);
}

module.exports = { connectWithRetry, getDbStatus, startReconnectLoop };
