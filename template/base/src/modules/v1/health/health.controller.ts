import { Request, Response } from "express";
import { logger } from "@/utils";

export const healthCheck = async (_: Request, res: Response) => {
  logger.info("Health", "healthy");

  return res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      memory: {
        rss: process.memoryUsage().rss,
        heapUsed: process.memoryUsage().heapUsed,
      },
    },
  });
};
