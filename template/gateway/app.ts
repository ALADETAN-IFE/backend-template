import express, { Request, Response, NextFunction } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { logger } from "@/utils";

const app = express();

// Health check for the gateway itself
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "gateway" });
});

// Service routes - will be dynamically configured
/*__ROUTES__*/

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error("Gateway error:", err);
  res.status(500).json({ error: "Internal gateway error" });
});

export default app;
