import express, { Request, Response, NextFunction } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { logger } from "@/shared/utils";

const app = express();

// Root endpoint
app.get("/", (_req: Request, res: Response) => {
  logger.info("Gateway", "Root endpoint accessed");

  res.json({ 
    status: "ok", 
    service: "API Gateway",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      healthService: "/api/v1/health"
    }
  });
});

// Health check for the gateway itself
app.get("/health", (_req: Request, res: Response) => {
  logger.info("Gateway", "Health check accessed");
  res.json({ status: "ok", service: "gateway" });
});

// Service routes - will be dynamically configured
/*__ROUTES__*/

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Gateway error:", err);
  res.status(500).json({ error: "Internal gateway error" });
});

export default app;
