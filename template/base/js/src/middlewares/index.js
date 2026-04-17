const methodNotAllowedHandler = require("./method-not-allowed.middleware");
const { notFound } = require("./not-found.middleware");
const { rootHandler } = require("./root.middleware");
const { errorHandler } = require("./error-handler.middleware");
const { observabilityMiddleware } = require("./observability.middleware");

module.exports = {
  methodNotAllowedHandler,
  notFound,
  rootHandler,
  errorHandler,
  observabilityMiddleware,
};
