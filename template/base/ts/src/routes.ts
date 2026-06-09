import { NextFunction, Request, Response, Router } from "express";
import modulesRouter from "./modules";
import { notFound, rootHandler } from "./middlewares";
import swaggerUi from "swagger-ui-express";
import { routeRegistry } from "./docs";

const router = Router();

// Root endpoint
router.get("/", rootHandler);

// Swagger UI with auto-generated spec
router.use("/api-docs", swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
  const projectName = "/*__PROJECT_NAME__*/";
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const spec = routeRegistry.generateOpenAPI(projectName, "1.0.0", baseUrl);
  const options = {
    customSiteTitle: projectName,
  };
  swaggerUi.setup(spec, options)(req, res, next);
});

router.use("/api", modulesRouter);

// 404 handler - must be last
router.use(notFound);

export default router;
