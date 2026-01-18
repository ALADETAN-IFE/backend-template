import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { stripTypeScript } from "../../../../bin/lib/ts-to-js.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read all module files
const modulesDir = path.join(__dirname, "../modules");
const modelsDir = path.join(__dirname, "../models");
const utilsDir = path.join(__dirname, "../utils");

const readDirFiles = (dir, prefix = "", language = "typescript") => {
  const files = {};
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const ext = language === "javascript" ? ".js" : ".ts";
    const relativePath = path.join(prefix, item.replace(/\.ts$/, ext));
    
    if (fs.statSync(fullPath).isDirectory()) {
      Object.assign(files, readDirFiles(fullPath, relativePath, language));
    } else {
      let content = fs.readFileSync(fullPath, "utf8");
      if (language === "javascript") {
        content = stripTypeScript(content);
      }
      files[relativePath] = content;
    }
  }
  
  return files;
};

const getDbContent = (language) => {
  const tsContent = `import mongoose from "mongoose";
import { ENV } from "./env";
import { logger } from "@/utils";

export const connectDB = async () => {
  await mongoose.connect(ENV.MONGO_URI);
  logger.log("db", "MongoDB connected");
};
`;
  
  return language === "javascript" ? stripTypeScript(tsContent) : tsContent;
};

const getHealthControllerContent = (language) => {
  const tsContent = `import { Request, Response } from "express";
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
  
  return language === "javascript" ? stripTypeScript(tsContent) : tsContent;
};

export const getFiles = (language = "typescript") => {
  const ext = language === "javascript" ? ".js" : ".ts";
  const moduleFiles = readDirFiles(modulesDir, "src/modules/v1/auth", language);
  const modelFiles = readDirFiles(modelsDir, "src/models", language);
  const utilFiles = readDirFiles(utilsDir, "src/utils", language);
  
  return {
    ...moduleFiles,
    ...modelFiles,
    ...utilFiles,
    [`src/config/db${ext}`]: getDbContent(language),
    [`src/modules/v1/health/health.controller${ext}`]: getHealthControllerContent(language),
  };
};

// For backward compatibility
export const files = getFiles("typescript");

export const imports = `import { authRoutes } from "./auth";`;

export const getImports = (language) => language === "javascript"
  ? `const { authRoutes } = require("./auth");`
  : `import { authRoutes } from "./auth";`;

export const middleware = `router.use("/auth", authRoutes);`;

export const deps = ["jsonwebtoken", "mongoose"];
export const devDeps = ["@types/jsonwebtoken"];

export const targetFile = "src/modules/v1/index.ts";
