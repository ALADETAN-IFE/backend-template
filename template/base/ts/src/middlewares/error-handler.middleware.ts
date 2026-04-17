import { NextFunction, Request, Response } from "express";
import { HttpError, logger } from "@/utils";

// Centralized error handling middleware

export const errorHandler = (
  err: unknown,
  _: Request,
  res: Response,
  __: NextFunction,
) => {
  if (err instanceof HttpError) {
    logger.warn("ErrorHandler", `${err.status} ${err.message}`);
    return res.status(err.status).json({
      status: "error",
      message: err.message,
    });
  }

  logger.error("ErrorHandler", "Unhandled error", err as Error);

  return res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
};
