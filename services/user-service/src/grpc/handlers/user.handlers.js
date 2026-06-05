const grpc = require('@grpc/grpc-js');
const AppError = require('../../errors/appError');
const userService = require('../../services/user.service');

function handleRpc(promise, callback) {
  promise
    .then((result) => callback(null, result))
    .catch((err) => {
      if (err instanceof AppError) {
        callback(err.toGrpc());
        return;
      }
      console.error(err);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error',
      });
    });
}

module.exports = {
  CreateUser: (call, callback) => {
    handleRpc(userService.createUser(call.request), callback);
  },
  LoginUser: (call, callback) => {
    handleRpc(userService.loginUser(call.request), callback);
  },
  GetProfile: (call, callback) => {
    handleRpc(userService.getProfile(call.request), callback);
  },
};
