class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

class BadRequestError extends HttpError {
  constructor(message = "Bad Request") {
    super(400, message);
  }
}

class UnprocessableEntityError extends HttpError {
  constructor(message = "Unprocessable Entity") {
    super(422, message);
  }
}

class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

class ForbiddenError extends HttpError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

class NotFoundError extends HttpError {
  constructor(message = "Not Found") {
    super(404, message);
  }
}

class ConflictError extends HttpError {
  constructor(message = "Conflict") {
    super(409, message);
  }
}

class TooManyRequestsError extends HttpError {
  constructor(message = "Too Many Requests") {
    super(429, message);
  }
}

class BadGatewayError extends HttpError {
  constructor(message = "Bad Gateway") {
    super(502, message);
  }
}

class InternalServerError extends HttpError {
  constructor(message = "Internal Server Error") {
    super(500, message);
  }
}

module.exports = {
  HttpError,
  BadRequestError,
  UnprocessableEntityError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  BadGatewayError,
  InternalServerError,
};
