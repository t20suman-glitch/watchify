const mongoose = require('mongoose');
const logger = require('../logger');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectDatabase(uri = process.env.MONGO_URI, { retries = 10, delayMs = 2000 } = {}) {
  if (!uri) {
    throw new Error('MONGO_URI is not set');
  }

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(uri);
      logger.info('MongoDB connected');
      return mongoose.connection;
    } catch (err) {
      if (attempt >= retries) {
        throw err;
      }
      logger.warn('MongoDB connection failed, retrying', {
        attempt,
        retries,
        error: err.message,
      });
      await wait(delayMs);
    }
  }

  throw new Error('MongoDB connection failed');
}

module.exports = connectDatabase;
