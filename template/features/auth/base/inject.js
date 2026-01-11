import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read all module files
const modulesDir = path.join(__dirname, "../modules");
const modelsDir = path.join(__dirname, "../models");
const utilsDir = path.join(__dirname, "../utils");

const readDirFiles = (dir, prefix = "") => {
  const files = {};
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.join(prefix, item);
    
    if (fs.statSync(fullPath).isDirectory()) {
      Object.assign(files, readDirFiles(fullPath, relativePath));
    } else {
      files[relativePath] = fs.readFileSync(fullPath, "utf8");
    }
  }
  
  return files;
};

const moduleFiles = readDirFiles(modulesDir, "src/modules/v1/auth");
const modelFiles = readDirFiles(modelsDir, "src/models");
const utilFiles = readDirFiles(utilsDir, "src/utils");

// Add MongoDB-enabled db.ts
const dbContent = `import mongoose from "mongoose";
import { ENV } from "./env";
import { logger } from "@/utils";

export const connectDB = async () => {
  await mongoose.connect(ENV.MONGO_URI);
  logger.log("db", "MongoDB connected");
};
`;

// Add MongoDB health check
const healthControllerContent = `import { Request, Response } from "express";
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
`;

export const files = {
  ...moduleFiles,
  ...modelFiles,
  ...utilFiles,
  "src/config/db.ts": dbContent,
  "src/modules/v1/health/health.controller.ts": healthControllerContent,
};

export const imports = `import { authRoutes } from "./auth";`;

export const middleware = `router.use("/auth", authRoutes);`;

export const deps = ["jsonwebtoken", "@types/jsonwebtoken", "mongoose"];

export const targetFile = "src/modules/v1/index.ts";
