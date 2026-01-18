import { Router } from "express";
import modulesRouter from "./modules";
import { notFound, rootHandler } from "./middlewares";

const router = Router();

// Root endpoint
router.get("/", rootHandler);

router.use("/api", modulesRouter);

// 404 handler - must be last
router.use(notFound);

export default router;
