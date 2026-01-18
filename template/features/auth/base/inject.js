import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read all module files
const modulesDir = path.join(__dirname, "../modules");
const modelsDir = path.join(__dirname, "../models");
const utilsDir = path.join(__dirname, "../utils");

const readDirFiles = (dir, prefix = "", language = "typescript") => {
  const files = {};
  const items = fs.readdirSync(dir);
  const ext = language === "javascript" ? ".js" : ".ts";

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const isDir = fs.statSync(fullPath).isDirectory();
    const desiredName = item.replace(/\.ts$|\.js$/, ext);
    const chosenPath = isDir
      ? fullPath
      : fs.existsSync(path.join(dir, desiredName))
      ? path.join(dir, desiredName)
      : fullPath;

    const relativePath = path.join(prefix, path.basename(desiredName));

    if (isDir) {
      Object.assign(files, readDirFiles(chosenPath, relativePath, language));
    } else {
      const content = fs.readFileSync(chosenPath, "utf8");
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
  try {
    await mongoose.connect(ENV.MONGO_URI);
    logger.log("db", "MongoDB connected");
  } catch (error) {
    logger.error("db", "MongoDB connection failed", error);
    process.exit(1);
  }
};
`;

  if (language === "javascript") {
    return `const mongoose = require("mongoose");
const { ENV } = require("./env");
const { logger } = require("../utils");

async function connectDB() {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    logger.log("db", "MongoDB connected");
  } catch (error) {
    logger.error("db", "MongoDB connection failed", error);
    process.exit(1);
  }
}

module.exports = { connectDB };
`;
  }

  return tsContent;
};

const getHealthControllerContent = (language) => {
  const tsContent = `import { Request, Response } from "express";
import mongoose from "mongoose";
const { logger } = require("../../../utils");

export const healthCheck = async (_req: Request, res: Response) => {
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

  if (language === "javascript") {
    return `const mongoose = require("mongoose");
const { logger } = require("../../../utils");

async function healthCheck(_req, res) {
  const mongoState = mongoose.connection.readyState;
  const healthy = mongoState === 1;

  const failed = [];
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
}

module.exports = { healthCheck };
`;
  }

  return tsContent;
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
