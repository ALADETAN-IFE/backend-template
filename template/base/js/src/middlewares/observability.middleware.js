const { randomUUID } = require("crypto");
const { logger } = require("../utils");

const observabilityMiddleware = (req, res, next) => {
  const requestId = req.get("X-Request-Id") || randomUUID();
  const startedAt = Date.now();

  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    logger.info(
      "HTTP",
      `${requestId} ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`,
    );
  });

  next();
};

module.exports = {
  observabilityMiddleware,
};