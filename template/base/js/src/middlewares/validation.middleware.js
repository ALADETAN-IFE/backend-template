const { ZodError } = require("zod");
const { BadRequestError } = require("../utils");

const validateRequest = (schemas = {}) => {
  return (req, _, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues
          .map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`)
          .join("; ");
        return next(new BadRequestError(`Request validation failed - ${issues}`));
      }

      return next(error);
    }
  };
};

module.exports = {
  validateRequest,
};