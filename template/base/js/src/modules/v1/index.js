const { Router } = require("express");
const { healthRoutes } = require("./health");

const router = Router();

router.use("/health", healthRoutes);

module.exports = router;
