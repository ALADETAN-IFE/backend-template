import { Router } from "express";
import { register, login } from "./auth.controller";
import { methodNotAllowedHandler } from "@/middlewares";

const router = Router();
router.use(methodNotAllowedHandler(["POST"]));
router.post("/login", login);
router.post("/register", register);

export default router;

