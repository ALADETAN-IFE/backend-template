import { Router } from "express";
import V1Routes from "./v1";

const router = Router();

router.use("/v1", V1Routes);

export default router;
