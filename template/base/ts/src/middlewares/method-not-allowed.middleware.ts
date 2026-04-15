import { Request, Response, NextFunction } from "express";

// Middleware to handle 405 Method Not Allowed for unsupported HTTP methods on defined routes

const methodNotAllowed =
  (allowedMethods: string[]) => (req: Request, res: Response, next: NextFunction) => {
    if (!allowedMethods.includes(req.method)) {
      res.set("Allow", allowedMethods.join(", "));
      return res.status(405).json({
        status: "error",
        message: `Method ${req.method} not allowed for ${req.originalUrl}`,
        allowed: allowedMethods,
      });
    }
    next();
  };

export default methodNotAllowed;
