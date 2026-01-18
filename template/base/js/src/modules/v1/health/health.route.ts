import { Router } from "express";
import { healthCheck } from "./health.controller";
import { methodNotAllowedHandler } from "@/middlewares";

const router = Router();
router.use(methodNotAllowedHandler(["GET"]));
router.get("/", healthCheck);

export default router;
