/**
 * Normalizes process.env for Vercel/serverless so a Mongo connection string
 * is recognized even if the host uses a different name (common with providers).
 * Call this after `loadEnv` in serverless entrypoints.
 */
function applyVercelEnv() {
  if (!process.env.MONGODB_URI) {
    if (process.env.DATABASE_URL) {
      process.env.MONGODB_URI = process.env.DATABASE_URL;
    } else if (process.env.MONGO_URL) {
      process.env.MONGODB_URI = process.env.MONGO_URL;
    }
  }

  const onVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
  if (onVercel && process.env.USE_MEMORY_DB === 'true') {
    console.warn(
      '[vercel-api] USE_MEMORY_DB is not supported on Vercel (embedded Mongo will not work). ' +
        'Set MONGODB_URI (e.g. Atlas) and set USE_MEMORY_DB to false in Vercel env.'
    );
    process.env.USE_MEMORY_DB = 'false';
  }
}

module.exports = { applyVercelEnv };
