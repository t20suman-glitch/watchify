const express = require('express');
const config = require('../config');
const logger = require('../lib/logger');
const uploadRoutes = require('./routes/upload.routes');
const { errorHandler } = require('./middleware/errorHandler');

function startHttpServer() {
  const app = express();

  app.use(logger.requestLogger);
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ status: 'ok', storage: config.storageProvider }));
  app.use('/api/uploads', uploadRoutes);
  app.use(errorHandler);

  app.listen(config.httpPort, () => {
    logger.info('HTTP server listening', { port: config.httpPort });
  });
}

module.exports = { startHttpServer };
