const grpc = require('@grpc/grpc-js');
const loadProto = require('../lib/grpc/loadProto');
const config = require('../config');
const watchHandlers = require('./handlers/watch.handlers');

function startGrpcServer() {
  const watchProto = loadProto('watch.proto');
  const server = new grpc.Server();
  server.addService(watchProto.watch.WatchService.service, watchHandlers);
  const address = `0.0.0.0:${config.port}`;
  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) throw err;
    server.start();
    console.log(`watch-service gRPC listening on ${port}`);
  });
}

module.exports = { startGrpcServer };
