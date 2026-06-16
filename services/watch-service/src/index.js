const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const logger = require('./lib/logger');
const connectDatabase = require('./lib/database/connect');
const { startGrpcServer } = require('./grpc/server');
const { startHttpServer } = require('./http/server');

async function main() {
  if (!process.env.JWT_SECRET) {
    logger.warn(
      'JWT_SECRET is not set — using default. Tokens from user-service will fail unless secrets match.'
    );
  }

  await connectDatabase();
  startGrpcServer();
  startHttpServer();
  logger.info('Service started (gRPC + HTTP)');
}

main().catch((err) => {
  logger.logError('Failed to start service', err);
  process.exit(1);
});
