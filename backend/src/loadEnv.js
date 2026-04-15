/**
 * Load backend/.env regardless of process cwd (fixes npm --prefix / monorepo runs).
 */
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error && process.env.NODE_ENV !== 'test') {
  console.warn(
    `[env] No file at ${envPath} — copy backend/.env.example to backend/.env`
  );
}

module.exports = { envPath };
