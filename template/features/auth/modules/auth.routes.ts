import { Router } from "express";
import { register, login } from "./auth.controller";
import { methodNotAllowedHandler, validateRequest } from "@/middlewares";
import { z } from "zod";
import { routeRegistry } from "@/docs";

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
// Register route docs for auto OpenAPI generation
routeRegistry.register({
  method: 'POST',
  path: '/api/v1/auth/login',
  handler: login,
  docs: {
    tags: ['Auth'],
    summary: 'User login',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { type: 'object', properties: { username: { type: 'string' }, password: { type: 'string' } } },
        },
      },
    },
    responses: {
      200: { description: 'Successful login' },
      400: { description: 'Invalid request' },
      401: { description: 'Unauthorized' },
    },
  },
});

routeRegistry.register({
  method: 'POST',
  path: '/api/v1/auth/register',
  handler: register,
  docs: {
    tags: ['Auth'],
    summary: 'Register new user',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { type: 'object', properties: { username: { type: 'string' }, password: { type: 'string' } } },
        },
      },
    },
    responses: {
      201: { description: 'User created' },
      400: { description: 'Invalid request' },
    },
  },
});

router.post("/login", validateRequest({ body: loginSchema }), login);
router.post("/register", validateRequest({ body: registerSchema }), register);

export default router;

