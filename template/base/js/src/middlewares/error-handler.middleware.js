const { HttpError, logger } = require("../utils");

const errorHandler = (err, _, res, __) => {
  if (err instanceof HttpError) {
    logger.warn("ErrorHandler", `${err.status} ${err.message}`);
    return res.status(err.status).json({
      status: "error",
      message: err.message,
    });
  }

  logger.error("ErrorHandler", "Unhandled error", err);

  return res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
};

module.exports = {
  errorHandler,
};