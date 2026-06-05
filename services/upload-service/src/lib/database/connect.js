const mongoose = require('mongoose');

async function connectDatabase(uri = process.env.MONGO_URI) {
  if (!uri) {
    throw new Error('MONGO_URI is not set');
  }
  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = connectDatabase;
