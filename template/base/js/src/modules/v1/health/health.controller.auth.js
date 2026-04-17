const mongoose = require("mongoose");
const { logger } = require("../../../utils");

const healthCheck = async (_, res) => {
  const mongoState = mongoose.connection.readyState;

  const healthy = mongoState === 1;

  const failed = [];
  if (mongoState !== 1) failed.push("mongodb");

  return res.status(healthy ? 200 : 503).json({
    status: healthy ? "healthy" : "unhealthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoState === 1 ? "connected" : "disconnected",
      memory: {
        rss: process.memoryUsage().rss,
        heapUsed: process.memoryUsage().heapUsed,
      },
    },
    failed,
  });
};

module.exports = {
  healthCheck,
};
