const express = require('express');
const config = require('../config');
const videoRoutes = require('./routes/video.routes');
const { errorHandler } = require('./middleware/errorHandler');

function startHttpServer() {
  const app = express();

  app.use(express.json());
  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', uploadService: config.uploadServiceUrl })
  );
  app.use('/api/videos', videoRoutes);
  app.use(errorHandler);

  app.listen(config.httpPort, () => {
    console.log(`watch-service HTTP listening on ${config.httpPort}`);
  });
}

module.exports = { startHttpServer };
