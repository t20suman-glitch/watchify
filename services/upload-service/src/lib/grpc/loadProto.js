const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_ROOT = path.resolve(__dirname, '../../../proto');

function loadProto(protoFile) {
  const packageDefinition = protoLoader.loadSync(path.join(PROTO_ROOT, protoFile), {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  return grpc.loadPackageDefinition(packageDefinition);
}

module.exports = loadProto;
