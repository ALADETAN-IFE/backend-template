import { Request, Response } from "express";
import { logger } from "@/utils";

export const notFound = (req: Request, res: Response) => {
  logger.warn("NotFound", `${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  });
};
