import { Router } from "express";
import { register, login } from "./auth.controller";
import { methodNotAllowedHandler, validateRequest } from "@/middlewares";
import { z } from "zod";

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

export default router;

