import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "@/utils";

type RequestSchemas = {
  body?: { parse: (value: unknown) => unknown };
  query?: { parse: (value: unknown) => unknown };
  params?: { parse: (value: unknown) => unknown };
};

const isValidationError = (
  error: unknown,
): error is { issues: Array<{ path?: Array<string | number>; message: string }> } => {
  return (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as { issues?: unknown }).issues)
  );
};

export const validateRequest = (schemas: RequestSchemas) => {
  return (req: Request, _: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query) as Record<string, unknown>;
        Object.assign(req.query as Record<string, unknown>, parsedQuery);
      }

      if (schemas.params) {
        const parsedParams = schemas.params.parse(req.params) as Record<string, unknown>;
        Object.assign(req.params as Record<string, unknown>, parsedParams);
      }

      next();
    } catch (error: unknown) {
      if (isValidationError(error)) {
        const issues = error.issues
          .map((issue) => `${issue.path?.join(".") || "request"}: ${issue.message}`)
          .join("; ");
        return next(new BadRequestError(`Request validation failed - ${issues}`));
      }

      return next(error);
    }
  };
};
