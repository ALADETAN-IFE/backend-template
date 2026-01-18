const { Router } = require("express");
const { healthCheck } = require("./health.controller");
const { methodNotAllowedHandler } = require("../../../middlewares");

const router = Router();
router.use(methodNotAllowedHandler(["GET"]));
router.get("/", healthCheck);

module.exports = router;
