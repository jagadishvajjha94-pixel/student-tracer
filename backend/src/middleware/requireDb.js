const mongoose = require('mongoose');

/**
 * Returns 503 when MongoDB is not ready so the client gets a clear message instead of 500.
 * Skips /api/health and OPTIONS preflight.
 */
function requireDb(req, res, next) {
  if (req.method === 'OPTIONS') {
    return next();
  }
  const noQuery = req.originalUrl.split('?')[0];
  if (noQuery === '/api/health') {
    return next();
  }
  if (mongoose.connection.readyState === 1) {
    return next();
  }
  return res.status(503).json({
    message:
      'Database is not connected. For local dev, set USE_MEMORY_DB=true in backend/.env and restart the API. Or start MongoDB on port 27017 (docker compose / brew).',
    code: 'DB_UNAVAILABLE',
  });
}

module.exports = { requireDb };
