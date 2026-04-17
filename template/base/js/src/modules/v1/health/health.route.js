const { Router } = require('express');
const { healthCheck } = require('./health.controller');
const { z } = require('zod');
const {
  methodNotAllowedHandler,
  validateRequest,
} = require('../../../middlewares');
const { routeRegistry } = require('../../../docs/route-registry');

const router = Router();
const healthQuerySchema = z
  .object({
    verbose: z.coerce.boolean().optional(),
  })
  .strict();

// Register route schema with auto-generated docs
routeRegistry.register({
  method: 'GET',
  path: '/api/v1/health',
  handler: healthCheck,
  docs: {
    tags: ['Health'],
    summary: 'Health check endpoint',
    description:
      'Returns API health status and runtime metrics including uptime and memory usage.',
    parameters: [
      {
        name: 'verbose',
        in: 'query',
        required: false,
        schema: { type: 'boolean' },
        description: 'Optional verbose mode for detailed diagnostics.',
      },
    ],
    responses: {
      200: {
        description: 'Healthy response with system metrics',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'healthy' },
                uptime: { type: 'number', example: 123.45 },
                timestamp: {
                  type: 'string',
                  example: '2024-01-01T00:00:00.000Z',
                },
                services: {
                  type: 'object',
                  properties: {
                    memory: {
                      type: 'object',
                      properties: {
                        rss: { type: 'number' },
                        heapUsed: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

router.use(methodNotAllowedHandler(['GET']));
router.get('/', healthCheck);

module.exports = router;
