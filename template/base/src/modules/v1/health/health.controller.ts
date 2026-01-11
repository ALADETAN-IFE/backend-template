import { Request, Response } from "express";
import mongoose from "mongoose";
import { logger } from "@/utils";

export const healthCheck = async (_: Request, res: Response) => {
  const mongoState = mongoose.connection.readyState;
  const healthy = mongoState === 1;

  const failed: string[] = [];
  if (mongoState !== 1) failed.push("mongodb");

  logger.info("Health", healthy ? "healthy" : "unhealthy");

  return res.status(healthy ? 200 : 503).json({
    status: healthy ? "healthy" : "unhealthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoState === 1 ? "connected" : "disconnected",
      memory: {
        rss: process.memoryUsage().rss,
        heapUsed: process.memoryUsage().heapUsed,
      },
    },
    failed,
  });
};
