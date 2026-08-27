const mongoose = require('mongoose');

/**
   * Runs operations inside a MongoDB transaction session.
   * If replica sets are not supported/configured (standalone database),
   * it falls back to normal execution with a warning log.
   */
async function runWithTransaction(callback) {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    
    const result = await callback(session);
    
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        console.error('[Transaction Error] Failed to abort transaction:', abortErr.message);
      }
    }
    
    // Catch transaction capability errors on standalone MongoDB instances
    const errorMsg = error.message ? error.message.toLowerCase() : '';
    const isUnsupported = errorMsg.includes('replica set') || 
                          errorMsg.includes('transaction') ||
                          error.code === 20 || // IllegalOperation
                          error.code === 263;  // SessionNotFound

    if (isUnsupported && session) {
      console.warn('MongoDB transactions not supported by environment. Falling back to non-transactional execution.');
      return await callback(null);
    }
    
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

module.exports = { runWithTransaction };
