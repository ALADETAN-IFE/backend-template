const { HttpError } = require("../utils");

const errorHandler = (err, _, res, __) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      status: "error",
      message: err.message,
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
};

module.exports = {
  errorHandler,
};