const { Router } = require("express");
const modulesRouter = require("./modules");
const { notFound, rootHandler } = require("./middlewares");

const router = Router();

// Root endpoint
router.get("/", rootHandler);

router.use("/api", modulesRouter);

// 404 handler - must be last
router.use(notFound);

module.exports = router;

