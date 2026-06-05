const grpc = require('@grpc/grpc-js');
const AppError = require('../../errors/appError');
const watchService = require('../../services/watch.service');

function handleRpc(promise, callback) {
  promise
    .then((result) => callback(null, result))
    .catch((err) => {
      if (err instanceof AppError) {
        callback(err.toGrpc());
        return;
      }
      console.error(err);
      callback({ code: grpc.status.INTERNAL, message: 'Internal server error' });
    });
}

module.exports = {
  StartWatch: (call, callback) => {
    handleRpc(
      watchService.startWatch({
        user_id: call.request.user_id,
        media_id: call.request.media_id,
      }),
      callback
    );
  },
  UpdateProgress: (call, callback) => {
    handleRpc(
      watchService.updateProgressGrpc({
        session_id: call.request.session_id,
        user_id: call.request.user_id,
        position_seconds: call.request.position_seconds,
      }),
      callback
    );
  },
  GetWatchHistory: (call, callback) => {
    handleRpc(
      watchService
        .getWatchHistory({
          userId: call.request.user_id,
          page: call.request.page,
          limit: call.request.limit,
        })
        .then((history) => ({
          sessions: history.map(({ session }) => session),
        })),
      callback
    );
  },
};
