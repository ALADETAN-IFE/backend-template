const methodNotAllowedHandler = require("./method-not-allowed.middleware");
const { notFound } = require("./not-found.middleware");
const { rootHandler } = require("./root.middleware");

module.exports = {
  methodNotAllowedHandler,
  notFound,
  rootHandler,
};
