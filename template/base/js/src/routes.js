const { Router } = require('express');
const modulesRouter = require('./modules');
const { notFound, rootHandler } = require('./middlewares');
const swaggerUi = require('swagger-ui-express');
const { routeRegistry } = require('./docs');

const router = Router();

// Root endpoint
router.get('/', rootHandler);

// Swagger UI with auto-generated spec
router.use('/api-docs', swaggerUi.serve, (req, res, next) => {
  const projectName = "/*__PROJECT_NAME__*/";
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const spec = routeRegistry.generateOpenAPI(projectName, '1.0.0', baseUrl);
  const options = {
    customSiteTitle: projectName,
  };
  swaggerUi.setup(spec, options)(req, res, next);
});

router.use('/api', modulesRouter);

// 404 handler - must be last
router.use(notFound);

module.exports = router;
