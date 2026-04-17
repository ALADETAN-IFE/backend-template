const { Router } = require("express");
const { register, login } = require("./auth.controller");
const { methodNotAllowedHandler, validateRequest } = require("../../../middlewares");
const { z } = require("zod");

const router = Router();

// Define request schemas for validation
const registerSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
  .strict();

const loginSchema = z
  .object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

router.use(methodNotAllowedHandler(["POST"]));
router.post("/login", validateRequest({ body: loginSchema }), login);
router.post("/register", validateRequest({ body: registerSchema }), register);

module.exports = router;
