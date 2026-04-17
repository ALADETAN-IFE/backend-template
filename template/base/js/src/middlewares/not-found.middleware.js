import { logger } from '@/utils';

const notFound = (req, res) => {
  logger.warn('NotFound', `${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  });
};

module.exports = {
  notFound,
};
