const express = require('express');
const config = require('../config');
const logger = require('../lib/logger');
const userRoutes = require('./routes/user.routes');
const { errorHandler } = require('./middleware/errorHandler');

function startHttpServer() {
  const app = express();

  app.use(logger.requestLogger);
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/users', userRoutes);
  app.use(errorHandler);

  app.listen(config.httpPort, () => {
    logger.info('HTTP server listening', { port: config.httpPort });
  });
}

module.exports = { startHttpServer };
