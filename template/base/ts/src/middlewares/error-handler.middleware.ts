import { NextFunction, Request, Response } from "express";
import { HttpError } from "@/utils";

// Centralized error handling middleware

export const errorHandler = (
  err: unknown,
  _: Request,
  res: Response,
  __: NextFunction,
) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      status: "error",
      message: err.message,
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
};
