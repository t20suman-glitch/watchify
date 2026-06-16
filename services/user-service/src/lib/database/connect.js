const mongoose = require('mongoose');
const logger = require('../logger');

async function connectDatabase(uri = process.env.MONGO_URI) {
  if (!uri) {
    throw new Error('MONGO_URI is not set');
  }
  await mongoose.connect(uri);
  logger.info('MongoDB connected');
  return mongoose.connection;
}

module.exports = connectDatabase;
