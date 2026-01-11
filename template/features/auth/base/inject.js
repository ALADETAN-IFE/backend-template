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

export const files = {
  ...moduleFiles,
  ...modelFiles,
  ...utilFiles,
};

export const imports = `import { authRoutes } from "./auth";`;

export const middleware = `router.use("/auth", authRoutes);`;

export const deps = ["jsonwebtoken", "@types/jsonwebtoken", "mongoose"];

export const targetFile = "src/modules/v1/index.ts";
