const grpc = require('@grpc/grpc-js');
const loadProto = require('../lib/grpc/loadProto');
const config = require('../config');
const userHandlers = require('./handlers/user.handlers');

function startGrpcServer() {
  const userProto = loadProto('user.proto');
  const server = new grpc.Server();
  server.addService(userProto.user.UserService.service, userHandlers);
  const address = `0.0.0.0:${config.port}`;
  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) throw err;
    server.start();
    console.log(`user-service gRPC listening on ${port}`);
  });
}

module.exports = { startGrpcServer };
