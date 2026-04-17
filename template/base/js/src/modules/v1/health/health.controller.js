const { logger } = require('../../../utils');

const healthCheck = async (_, res) => {
  logger.info('Health', 'healthy');

  return res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      memory: {
        rss: process.memoryUsage().rss,
        heapUsed: process.memoryUsage().heapUsed,
      },
    },
  });
};

module.exports = {
  healthCheck,
};
