const { Router } = require('express');
const modulesRouter = require('./modules');
const { notFound, rootHandler } = require('./middlewares');
const swaggerUi = require('swagger-ui-express');
const { routeRegistry } = require('./docs/route-registry');

const router = Router();

// Root endpoint
router.get('/', rootHandler);

// Swagger UI with auto-generated spec
router.use('/api-docs', swaggerUi.serve, (_, res, next) => {
  const spec = routeRegistry.generateOpenAPI("/*__PROJECT_NAME__*/", "1.0.0");
  swaggerUi.setup(spec)(_, res, next);
});

router.use('/api', modulesRouter);

// 404 handler - must be last
router.use(notFound);

module.exports = router;
