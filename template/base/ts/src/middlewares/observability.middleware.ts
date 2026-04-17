import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import { logger } from "@/utils";

export const observabilityMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const requestId = req.get("X-Request-Id") || randomUUID();
  const startedAt = Date.now();

  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    logger.info(
      "HTTP",
      `${requestId} ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`,
    );
  });

  next();
};