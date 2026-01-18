const { Router } = require("express");
const { register, login } = require("./auth.controller");
const { methodNotAllowedHandler } = require("../../../middlewares");

const router = Router();
router.use(methodNotAllowedHandler(["POST"]));
router.post("/login", login);
router.post("/register", register);

module.exports = router;
