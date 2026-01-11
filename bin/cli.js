#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { getProjectConfig } from "./lib/prompts.js";
import { setupService } from "./lib/service-setup.js";
import { generateReadme } from "./lib/readme-generator.js";
import {
  generateDockerCompose,
  generatePm2Config,
  copyDockerfile,
} from "./lib/microservice-config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get project configuration from user
const config = await getProjectConfig();
const {
  sanitizedName,
  target,
  isExistingProject,
  mode,
  isInMicroserviceProject,
} = config;

const base = path.join(__dirname, "../template/base");

// Determine which services to create
const servicesToCreate = [];
if (isInMicroserviceProject) {
  const newServiceName = config.serviceName.replace(/\s+/g, "-");
  servicesToCreate.push(newServiceName);
} else if (config.projectType === "microservice") {
  servicesToCreate.push("gateway");
  servicesToCreate.push("health-service");
  if (config.auth) {
    servicesToCreate.push("auth-service");
  }
}

// Validate and prepare project
if (!isInMicroserviceProject && config.projectType === "microservice") {
  if (isExistingProject) {
    console.error(`\n❌ Error: Project '${sanitizedName}' already exists!`);
    process.exit(1);
  }
  console.log(
    `\n🏗️  Creating microservices: ${servicesToCreate.join(", ")}...\n`
  );
} else if (!isInMicroserviceProject && config.projectType === "monolith") {
  if (isExistingProject) {
    console.error(`\n❌ Error: Project '${sanitizedName}' already exists!`);
    process.exit(1);
  }
  fs.cpSync(base, target, { recursive: true });
} else if (isInMicroserviceProject) {
  console.log(`\n🏗️  Adding service: ${servicesToCreate[0]}...\n`);
}

// Process services
if (isInMicroserviceProject || config.projectType === "microservice") {
  // Create shared folder for config and utils (only once)
  if (!isInMicroserviceProject) {
    const sharedDir = path.join(target, "shared");
    if (!fs.existsSync(sharedDir)) {
      console.log(`\n📦 Creating shared folder for config and utils...`);
      fs.mkdirSync(sharedDir, { recursive: true });

      // Copy config and utils from base template
      const baseConfigDir = path.join(base, "src", "config");
      const baseUtilsDir = path.join(base, "src", "utils");
      const sharedConfigDir = path.join(sharedDir, "config");
      const sharedUtilsDir = path.join(sharedDir, "utils");

      fs.cpSync(baseConfigDir, sharedConfigDir, { recursive: true });
      fs.cpSync(baseUtilsDir, sharedUtilsDir, { recursive: true });

      // Create shared package.json
      const sharedPackageJson = {
        name: "@shared/common",
        version: "1.0.0",
        type: "module",
        exports: {
          "./config/*": "./config/*",
          "./utils/*": "./utils/*",
        },
      };
      fs.writeFileSync(
        path.join(sharedDir, "package.json"),
        JSON.stringify(sharedPackageJson, null, 2)
      );
    }
  }

  for (const serviceName of servicesToCreate) {
    const serviceRoot = path.join(target, "services", serviceName);

    if (fs.existsSync(serviceRoot)) {
      console.error(`\n❌ Error: Service '${serviceName}' already exists!`);
      process.exit(1);
    }

    console.log(`\n🔨 Setting up ${serviceName}...`);
    fs.cpSync(base, serviceRoot, { recursive: true });

    // Remove config and utils from service (they'll use shared) - except gateway handles it differently
    if (serviceName !== "gateway") {
      const serviceConfigDir = path.join(serviceRoot, "src", "config");
      const serviceUtilsDir = path.join(serviceRoot, "src", "utils");
      if (fs.existsSync(serviceConfigDir))
        fs.rmSync(serviceConfigDir, { recursive: true });
      if (fs.existsSync(serviceUtilsDir))
        fs.rmSync(serviceUtilsDir, { recursive: true });
    }
  }

  // Get all services first (needed for gateway routing)
  const servicesDir = path.join(target, "services");
  const allServices = fs.existsSync(servicesDir)
    ? fs
        .readdirSync(servicesDir)
        .filter((f) => fs.statSync(path.join(servicesDir, f)).isDirectory())
    : servicesToCreate;

  // Now setup each service with knowledge of all services
  for (const serviceName of servicesToCreate) {
    const serviceRoot = path.join(target, "services", serviceName);
    const shouldIncludeAuth = isInMicroserviceProject
      ? config.auth
      : serviceName === "auth-service";
    await setupService(
      config,
      serviceName,
      serviceRoot,
      shouldIncludeAuth,
      allServices
    );
  }

  if (mode === "docker") {
    generateDockerCompose(target, allServices);
    copyDockerfile(target, servicesToCreate);
  } else {
    generatePm2Config(target, allServices);
  }

  // Create root package.json for microservice monorepo if it doesn't exist
  const rootPackageJsonPath = path.join(target, "package.json");
  if (!fs.existsSync(rootPackageJsonPath)) {
    const rootPackageJson = {
      name: sanitizedName,
      version: "1.0.0",
      private: true,
      scripts: {
        prepare: "husky install",
      },
      devDependencies: {
        husky: "^8.0.3",
      },
    };
    fs.writeFileSync(
      rootPackageJsonPath,
      JSON.stringify(rootPackageJson, null, 2) + "\n"
    );
  }
} else {
  await setupService(config, null, target, true);
}

// Generate README.md
if (!isInMicroserviceProject) {
  console.log("\n📝 Generating README.md...\n");
  const readmeContent = generateReadme(config);
  fs.writeFileSync(path.join(target, "README.md"), readmeContent);
  
  // Generate .env from .env.example for each service or root
  console.log("📄 Setting up environment files...\n");
  if (config.projectType === "microservice") {
    const servicesDir = path.join(target, "services");
    const allServices = fs.readdirSync(servicesDir).filter((f) => 
      fs.statSync(path.join(servicesDir, f)).isDirectory()
    );
    
    for (const service of allServices) {
      const envExamplePath = path.join(servicesDir, service, ".env.example");
      const envPath = path.join(servicesDir, service, ".env");
      if (fs.existsSync(envExamplePath) && !fs.existsSync(envPath)) {
        fs.copyFileSync(envExamplePath, envPath);
      }
    }
  } else {
    const envExamplePath = path.join(target, ".env.example");
    const envPath = path.join(target, ".env");
    if (fs.existsSync(envExamplePath) && !fs.existsSync(envPath)) {
      fs.copyFileSync(envExamplePath, envPath);
    }
  }
}

// Initialize git and Husky
if (!isInMicroserviceProject) {
  execSync("git init", { cwd: target, stdio: "inherit" });

  // Install husky and setup at root level
  if (config.projectType === "microservice") {
    console.log("\n📦 Installing Husky at root level...\n");
    execSync("npm install", { cwd: target, stdio: "inherit" });
    console.log("\n🔧 Setting up Husky...\n");
    execSync("npm run prepare", { cwd: target, stdio: "inherit" });
  } else if (config.projectType === "monolith") {
    console.log("\n🔧 Setting up Husky...\n");
    execSync("npm run prepare", { cwd: target, stdio: "inherit" });
  }
}

// Success messages
const servicesDir = path.join(target, "services");
const allServices = fs.existsSync(servicesDir)
  ? fs
      .readdirSync(servicesDir)
      .filter((f) => fs.statSync(path.join(servicesDir, f)).isDirectory())
  : servicesToCreate;

if (isInMicroserviceProject) {
  console.log(`\n✅ Service '${servicesToCreate[0]}' added successfully!`);
  console.log(`\n📦 All services: ${allServices.join(", ")}`);
  console.log(`\n💡 Next steps:`);
  console.log(
    mode === "docker"
      ? `   1. Start services: docker-compose up`
      : `   1. Start services: pm2 start pm2.config.js`
  );
} else if (config.projectType === "microservice") {
  console.log("\n✅ Backend created successfully!");
  console.log(`\n📦 Created services: ${servicesToCreate.join(", ")}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. cd ${sanitizedName}`);
  console.log(
    mode === "docker"
      ? `   2. Start services: docker-compose up`
      : `   2. Start services: pm2 start pm2.config.js`
  );
} else {
  console.log("\n✅ Backend created successfully!");
  console.log(`\n💡 Next steps:`);
  console.log(`   1. cd ${sanitizedName}`);
  console.log(`   2. npm run dev`);
}
