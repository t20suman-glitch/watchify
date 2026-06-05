const grpc = require('@grpc/grpc-js');
const loadProto = require('../lib/grpc/loadProto');
const config = require('../config');
const uploadHandlers = require('./handlers/upload.handlers');

function startGrpcServer() {
  const uploadProto = loadProto('upload.proto');
  const server = new grpc.Server();
  server.addService(uploadProto.upload.UploadService.service, uploadHandlers);
  const address = `0.0.0.0:${config.port}`;
  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) throw err;
    server.start();
    console.log(`upload-service gRPC listening on ${port}`);
  });
}

module.exports = { startGrpcServer };
