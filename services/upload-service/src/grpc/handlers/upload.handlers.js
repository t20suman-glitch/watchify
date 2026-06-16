const grpc = require('@grpc/grpc-js');
const AppError = require('../../errors/appError');
const logger = require('../../lib/logger');
const uploadService = require('../../services/upload.service');

function handleRpc(promise, callback) {
  promise
    .then((result) => callback(null, result))
    .catch((err) => {
      if (err instanceof AppError) {
        callback(err.toGrpc());
        return;
      }
      logger.logError('Unhandled gRPC error', err);
      callback({ code: grpc.status.INTERNAL, message: 'Internal server error' });
    });
}

module.exports = {
  UploadMedia: (call, callback) => {
    handleRpc(uploadService.uploadMediaStream(call), callback);
  },
  GetMedia: (call, callback) => {
    handleRpc(uploadService.getMedia(call.request.media_id), callback);
  },
  ListMedia: (call, callback) => {
    handleRpc(
      uploadService.listMedia(call.request).then((media) => ({ media })),
      callback
    );
  },
};
