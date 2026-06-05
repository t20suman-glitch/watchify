const grpc = require('@grpc/grpc-js');

const GRPC_TO_HTTP = {
  [grpc.status.INVALID_ARGUMENT]: 400,
  [grpc.status.UNAUTHENTICATED]: 401,
  [grpc.status.NOT_FOUND]: 404,
  [grpc.status.FAILED_PRECONDITION]: 412,
  [grpc.status.INTERNAL]: 500,
};

class AppError extends Error {
  constructor(message, grpcCode) {
    super(message);
    this.grpcCode = grpcCode;
  }

  toGrpc() {
    return { code: this.grpcCode, message: this.message };
  }

  toHttp() {
    return {
      status: GRPC_TO_HTTP[this.grpcCode] ?? 500,
      body: { error: this.message },
    };
  }
}

AppError.invalidArgument = (msg) => new AppError(msg, grpc.status.INVALID_ARGUMENT);
AppError.unauthenticated = (msg) => new AppError(msg, grpc.status.UNAUTHENTICATED);
AppError.notFound = (msg) => new AppError(msg, grpc.status.NOT_FOUND);
AppError.failedPrecondition = (msg) => new AppError(msg, grpc.status.FAILED_PRECONDITION);
AppError.internal = (msg) => new AppError(msg, grpc.status.INTERNAL);

module.exports = AppError;
