/**
 * CLI: npm run seed
 * Seeds the DB your .env points at (or in-memory if USE_MEMORY_DB=true).
 */
require('../loadEnv');
const { maybeStartMemoryServer, stopMemoryServer } = require('../config/memoryMongo');
const mongoose = require('mongoose');
const { seedDemoData } = require('./seedData');

async function run() {
  await maybeStartMemoryServer();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI missing. Set USE_MEMORY_DB=true or MONGODB_URI in backend/.env');
  }
  await mongoose.connect(uri);
  console.log('Connected for seed');

  await seedDemoData();

  console.log('\n========== Demo logins — password for all: demo123 ==========');
  console.log('Admin:        admin@tracker.local');
  console.log('Interviewers: sarah@tracker.local | james@tracker.local | maria@tracker.local');
  console.log('Students:     roll CS2024001, CS2024002, CS2024015, CS2024022, CS2024030');
  console.log('==============================================================\n');

  await mongoose.disconnect();
  await stopMemoryServer();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
