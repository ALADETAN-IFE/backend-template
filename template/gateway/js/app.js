const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { logger } = require("@/shared/utils");

const app = express();

// Root endpoint
app.get("/", (_req, res) => {
  logger.info("Gateway", "Root endpoint accessed");

  res.json({
    status: "ok",
    service: "API Gateway",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      healthService: "/api/v1/health",
    },
  });
});

// Health check for the gateway itself
app.get("/health", (_req, res) => {
  logger.info("Gateway", "Health check accessed");
  res.json({ status: "ok", service: "gateway" });
});

// Service routes - will be dynamically configured
/*__ROUTES__*/

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, _req, res, next) => {
  logger.error("Gateway error:", err);
  res.status(500).json({ error: "Internal gateway error" });
});

module.exports = app;
