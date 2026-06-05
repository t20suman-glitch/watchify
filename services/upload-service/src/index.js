const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const connectDatabase = require('./lib/database/connect');
const { startGrpcServer } = require('./grpc/server');
const { startHttpServer } = require('./http/server');

async function main() {
  await connectDatabase();
  startGrpcServer();
  startHttpServer();
  console.log('upload-service started (gRPC + HTTP)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
