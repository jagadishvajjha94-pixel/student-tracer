let memoryServerInstance = null;

/**
 * When USE_MEMORY_DB=true, starts an embedded MongoDB (no Docker/Homebrew).
 * Sets process.env.MONGODB_URI for this process.
 */
async function maybeStartMemoryServer() {
  if (process.env.USE_MEMORY_DB !== 'true') {
    return;
  }

  console.log(
    '[Mongo] Starting embedded MongoDB (mongodb-memory-server). First run may download a binary…'
  );

  const { MongoMemoryServer } = require('mongodb-memory-server');
  memoryServerInstance = await MongoMemoryServer.create({
    instance: {
      dbName: 'student_interview_tracker',
      // Default 10s is too tight on slow disks / first binary extract
      launchTimeout: Number(process.env.MONGO_MEMORY_LAUNCH_TIMEOUT_MS) || 120000,
    },
  });

  process.env.MONGODB_URI = memoryServerInstance.getUri();
  console.log('[Mongo] Embedded database ready (data is not persisted after server stops).');
}

async function stopMemoryServer() {
  if (!memoryServerInstance) return;
  try {
    await memoryServerInstance.stop();
  } catch (e) {
    console.error('[Mongo] Error stopping embedded server:', e.message);
  }
  memoryServerInstance = null;
}

module.exports = { maybeStartMemoryServer, stopMemoryServer };
