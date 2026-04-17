import { Router } from "express";
import modulesRouter from "./modules";
import { notFound, rootHandler } from "./middlewares";
import swaggerUi from "swagger-ui-express";
import { routeRegistry } from "./docs/route-registry";

const router = Router();

// Root endpoint
router.get("/", rootHandler);

// Swagger UI with auto-generated spec
router.use("/api-docs", swaggerUi.serve, (_req, res, next) => {
  const spec = routeRegistry.generateOpenAPI("/*__PROJECT_NAME__*/", "1.0.0");
  swaggerUi.setup(spec)(_req, res, next);
});

router.use("/api", modulesRouter);

// 404 handler - must be last
router.use(notFound);

export default router;
