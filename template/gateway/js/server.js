const http = require('http');
const app = require('./app');
const { logger } = require('@/shared/utils');
const { ENV } = require('@/shared/config');

const PORT = ENV.GATEWAY_PORT || 4000;

const server = http.createServer(app);

server.listen(PORT, () => {
  logger.info(`🚀 API Gateway running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
