const { StatusCodes } = require('http-status-codes');

class ApiError {
  constructor(code, message) {
    this.code = code;
    this.message = message;
  }

  static badRequest(message) {
    return new ApiError(StatusCodes.BAD_REQUEST, message);
  }

  static notFound(message) {
    return new ApiError(StatusCodes.NOT_FOUND, message);
  }

  static unauthorized(message) {
    return new ApiError(StatusCodes.UNAUTHORIZED, message);
  }

  static forbidden(message) {
    return new ApiError(StatusCodes.FORBIDDEN, message);
  }

  static internalServer(message) {
    return new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, message);
  }
}

module.exports = ApiError;
