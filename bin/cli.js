#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import pc from "picocolors";
import { getProjectConfig } from "./lib/prompts.js";
import { setupService } from "./lib/service-setup.js";
import { generateReadme } from "./lib/readme-generator.js";
import { transformToJavaScript, transformDirectory } from "./lib/ts-to-js.js";
import {
  generateDockerCompose,
  generatePm2Config,
  copyDockerfile,
  copyDockerignore,
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
    console.error(`\n${pc.red("❌ Error:")} Project ${pc.bold(sanitizedName)} already exists!`);
    process.exit(1);
  }
  console.log(
    `\n${pc.cyan("🏗️  Creating microservices:")} ${pc.bold(servicesToCreate.join(", "))}...\n`
  );
} else if (!isInMicroserviceProject && config.projectType === "monolith") {
  if (isExistingProject) {
    console.error(`\n${pc.red("❌ Error:")} Project ${pc.bold(sanitizedName)} already exists!`);
    process.exit(1);
  }
  fs.cpSync(base, target, { recursive: true });
  
  // Remove db.ts from config if auth is not enabled
  if (!config.auth) {
    const dbPath = path.join(target, "src/config/db.ts");
    if (fs.existsSync(dbPath)) {
      fs.rmSync(dbPath);
    }
    
    // Update index.ts to not export connectDB
    const indexPath = path.join(target, "src/config/index.ts");
    if (fs.existsSync(indexPath)) {
      let indexContent = fs.readFileSync(indexPath, "utf8");
      indexContent = indexContent.replace('export { connectDB } from "./db";\n', '');
      fs.writeFileSync(indexPath, indexContent);
    }
  }
  
  // Transform to JavaScript if selected
  if (config.language === "javascript") {
    // console.log("\n🔄 Converting TypeScript to JavaScript...\n");
    console.log(`\n${pc.cyan("⚙️  Setting up JavaScript project...")}\n`);
    transformToJavaScript(target);
  }
} else if (isInMicroserviceProject) {
  console.log(`\n${pc.cyan("🏗️  Adding service:")} ${pc.bold(servicesToCreate[0])}...\n`);
}

// Process services
if (isInMicroserviceProject || config.projectType === "microservice") {
  // Create shared folder for config and utils (only once)
  if (!isInMicroserviceProject) {
    const sharedDir = path.join(target, "shared");
    if (!fs.existsSync(sharedDir)) {
      console.log(`\n${pc.cyan("📦 Creating shared folder for config and utils...")}`);
      fs.mkdirSync(sharedDir, { recursive: true });

      // Copy config and utils from base template
      const baseConfigDir = path.join(base, "src", "config");
      const baseUtilsDir = path.join(base, "src", "utils");
      const sharedConfigDir = path.join(sharedDir, "config");
      const sharedUtilsDir = path.join(sharedDir, "utils");

      fs.cpSync(baseConfigDir, sharedConfigDir, { recursive: true });
      fs.cpSync(baseUtilsDir, sharedUtilsDir, { recursive: true });

      // Remove db.ts from shared config if auth is not enabled
      if (!config.auth) {
        const sharedDbPath = path.join(sharedConfigDir, "db.ts");
        if (fs.existsSync(sharedDbPath)) {
          fs.rmSync(sharedDbPath);
        }
        
        // Update index.ts to not export connectDB
        const sharedIndexPath = path.join(sharedConfigDir, "index.ts");
        if (fs.existsSync(sharedIndexPath)) {
          let indexContent = fs.readFileSync(sharedIndexPath, "utf8");
          indexContent = indexContent.replace('export { connectDB } from "./db";\n', '');
          fs.writeFileSync(sharedIndexPath, indexContent);
        }
      }

      // Update shared env.ts to include all service port environment variables
      const sharedEnvPath = path.join(sharedConfigDir, "env.ts");
      if (fs.existsSync(sharedEnvPath)) {
        let envContent = fs.readFileSync(sharedEnvPath, "utf8");
        
        // Build port environment variables for all services
        const allServices = ["gateway", "health-service"];
        if (config.auth) allServices.push("auth-service");
        
        const portEnvVars = allServices.map((service, index) => {
          const isGateway = service === "gateway";
          const port = isGateway ? 4000 : 4001 + index - 1;
          const envVarName = `${service.toUpperCase().replace(/-/g, "_")}_PORT`;
          // Don't add ! for JavaScript projects - it will cause syntax errors
          const assertion = config.language === "javascript" ? "" : "!";
          return `  ${envVarName}: process.env.${envVarName}${assertion},`;
        }).join("\n");
        
        // Replace PORT with service-specific ports
        envContent = envContent.replace(
          "  PORT: process.env.PORT!,",
          portEnvVars
        );
        
        fs.writeFileSync(sharedEnvPath, envContent);
      }

      // Create shared package.json
      const sharedPackageJson = {
        name: "@shared/common",
        version: "1.0.0",
        type: "commonjs",
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

    // Remove .env and .env.example from microservices (environment variables come from docker-compose/pm2)
    const envPath = path.join(serviceRoot, ".env");
    const envExamplePath = path.join(serviceRoot, ".env.example");
    if (fs.existsSync(envPath)) fs.rmSync(envPath);
    if (fs.existsSync(envExamplePath)) fs.rmSync(envExamplePath);

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

  // Step 1: Setup all service files first (without installing dependencies)
  console.log(pc.cyan("\n⚙️  Setting up service files...\n"));
  const serviceConfigs = [];
  
  for (const serviceName of servicesToCreate) {
    const serviceRoot = path.join(target, "services", serviceName);
    const shouldIncludeAuth = isInMicroserviceProject
      ? config.auth
      : serviceName === "auth-service";
    const result = await setupService(
      config,
      serviceName,
      serviceRoot,
      shouldIncludeAuth,
      allServices,
      true // Skip install for now
    );
    serviceConfigs.push({
      serviceName,
      serviceRoot,
      deps: result.deps,
      devDeps: result.devDeps
    });
  }

  // Step 2: Generate docker-compose/pm2 config and root files
  if (mode === "docker") {
    generateDockerCompose(target, allServices);
    copyDockerfile(target, servicesToCreate);
    copyDockerignore(target, servicesToCreate);
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

  // Step 3: Generate README and create root configuration files
  if (!isInMicroserviceProject) {
    console.log(`\n${pc.cyan("📝 Generating README.md...")}\n`);
    const readmeContent = generateReadme(config);
    fs.writeFileSync(path.join(target, "README.md"), readmeContent);
    
    // Rename gitignore to .gitignore (npm doesn't publish .gitignore files)
    for (const service of allServices) {
      const gitignorePath = path.join(servicesDir, service, "gitignore");
      const dotGitignorePath = path.join(servicesDir, service, ".gitignore");
      if (fs.existsSync(gitignorePath)) {
        fs.renameSync(gitignorePath, dotGitignorePath);
      }
    }
    
    // Create root .gitignore for microservices
    const rootGitignoreContent = `.env\nnode_modules\n`;
    fs.writeFileSync(path.join(target, ".gitignore"), rootGitignoreContent);

    // Create root .env and .env.example for microservices
    let rootENVContent = `# Environment Configuration\nNODE_ENV=development\n\n`;
    
    // Add port configuration for each service
    allServices.forEach((service, index) => {
      const isGateway = service === "gateway";
      const port = isGateway ? 4000 : 4001 + allServices.filter((s, i) => s !== "gateway" && i < index).length;
      const envVarName = `${service.toUpperCase().replace(/-/g, "_")}_PORT`;
      const serviceName = service.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
      rootENVContent += `# ${serviceName}\n${envVarName}=${port}\n\n`;
    });
    
    fs.writeFileSync(path.join(target, ".env"), rootENVContent);
    fs.writeFileSync(path.join(target, ".env.example"), rootENVContent);

    // Create root tsconfig.json for microservices workspace
    const rootTsConfigContent = {
      "compilerOptions": {
        "target": "ES2020",
        "module": "CommonJS",
        "lib": ["ES2020"],
        "moduleResolution": "node",
        "esModuleInterop": true,
        "skipLibCheck": true,
        "strict": true,
        "baseUrl": ".",
        "paths": {
          "@/*": ["./*"]
        }
      },
      "include": [],
      "references": allServices.map(service => ({
        "path": `./services/${service}`
      }))
    };
    fs.writeFileSync(
      path.join(target, "tsconfig.json"),
      JSON.stringify(rootTsConfigContent, null, 2) + "\n"
    );
  }

  // Step 4: Transform to JavaScript if selected (before npm install)
  if (config.language === "javascript") {
    console.log(`\n${pc.cyan("⚙️  Converting microservices to JavaScript...")}\n`);
    
    // Transform shared folder
    const sharedDir = path.join(target, "shared");
    if (fs.existsSync(sharedDir)) {
      transformDirectory(sharedDir);
    }
    
    // Transform each service
    for (const serviceName of allServices) {
      const serviceRoot = path.join(target, "services", serviceName);
      console.log(pc.dim(`   Transforming ${serviceName}...`));
      transformToJavaScript(serviceRoot);
    }
    
    console.log(pc.green("✓ JavaScript transformation complete\n"));
  }

  // Step 5: Install dependencies for all services
  console.log(pc.cyan("\n📦 Installing dependencies for all services...\n"));
  let allInstallsSucceeded = true;

  for (const { serviceName, serviceRoot, deps, devDeps } of serviceConfigs) {
    console.log(pc.cyan(`\n📦 Installing dependencies for ${serviceName}...\n`));
    
    try {
      if (deps.length) {
        execSync(`npm install ${deps.join(" ")}`, {
          cwd: serviceRoot,
          stdio: "inherit",
        });
      }
      if (devDeps.length) {
        execSync(`npm install -D ${devDeps.join(" ")}`, {
          cwd: serviceRoot,
          stdio: "inherit",
        });
      }
      execSync("npm install", { cwd: serviceRoot, stdio: "inherit" });

      // Run format after successful install
      console.log(pc.cyan("\n🎨 Formatting code...\n"));
      try {
        execSync("npm run format", { cwd: serviceRoot, stdio: "inherit" });
      } catch (formatError) {
        console.warn(
          pc.yellow(
            "⚠️  Warning: Code formatting failed. You can run it manually later with: npm run format\n",
          ),
        );
      }
    } catch (error) {
      allInstallsSucceeded = false;
      console.error(
        pc.red(`\n❌ Failed to install dependencies for ${serviceName}`),
      );
      console.error(pc.dim(`\nYou can install them later by running:`));
      console.error(pc.cyan(`   cd services/${serviceName} && npm install\n`));
    }
  }

  // Store for later use
  config.allInstallsSucceeded = allInstallsSucceeded;
} else {
  const result = await setupService(config, null, target, true);
  config.installSucceeded = result.installSucceeded;
}

// Generate README.md for monolith (microservices already done above)
if (!isInMicroserviceProject && config.projectType === "monolith") {
  console.log(`\n${pc.cyan("📝 Generating README.md...")}\n`);
  const readmeContent = generateReadme(config);
  fs.writeFileSync(path.join(target, "README.md"), readmeContent);
  
  // Rename gitignore to .gitignore (npm doesn't publish .gitignore files)
  const gitignorePath = path.join(target, "gitignore");
  const dotGitignorePath = path.join(target, ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    fs.renameSync(gitignorePath, dotGitignorePath);
  }
  
  // Generate .env from .env.example for monolith only
  console.log(`${pc.cyan("📄 Setting up environment files...")}\n`);
  const envExamplePath = path.join(target, ".env.example");
  const envPath = path.join(target, ".env");
  if (fs.existsSync(envExamplePath) && !fs.existsSync(envPath)) {
    fs.copyFileSync(envExamplePath, envPath);
  }
}

// Initialize git and Husky
if (!isInMicroserviceProject) {
  execSync("git init", { cwd: target, stdio: "inherit" });

  // Install husky and setup at root level
  if (config.projectType === "microservice") {
    console.log("\n📦 Installing Husky at root level...\n");
    if (config.allInstallsSucceeded) {
      try {
        execSync("npm install", { cwd: target, stdio: "inherit" });
        console.log("\n🔧 Setting up Husky...\n");
        execSync("npm run prepare", { cwd: target, stdio: "inherit" });
      } catch (error) {
        console.log("\n⚠️  Husky setup failed\n");
      }
    } else {
      console.log("\n⚠️  Husky setup skipped (run 'npm install && npm run prepare' after fixing service dependencies)\n");
    }
  } else if (config.projectType === "monolith") {
    // Only setup Husky if installation succeeded
    if (config.installSucceeded) {
      console.log(`\n${pc.cyan("🔧 Setting up Husky...")}\n`);
      try {
        execSync("npm run prepare", { cwd: target, stdio: "inherit" });
      } catch (error) {
        console.log(`\n${pc.yellow("⚠️  Husky setup failed")} ${pc.dim("(run 'npm run prepare' manually after fixing dependencies)")}\n`);
      }
    } else {
      console.log(`\n${pc.yellow("⚠️  Husky setup skipped")} ${pc.dim("(run 'npm install && npm run prepare' to set up git hooks)")}\n`);
    }
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
  console.log(`\n${pc.green("✅ Service")} ${pc.bold(servicesToCreate[0])} ${pc.green("added successfully!")}`);
  console.log(`\n${pc.cyan("📦 All services:")} ${allServices.join(", ")}`);
  console.log(`\n${pc.blue("💡 Next steps:")}`);
  console.log(
    mode === "docker"
      ? `   ${pc.dim("1.")} Start services: ${pc.bold("docker-compose up")}`
      : `   ${pc.dim("1.")} Start services: ${pc.bold("pm2 start pm2.config.js")}`
  );
} else if (config.projectType === "microservice") {
  console.log(`\n${pc.green("✅ Backend created successfully!")}`);
  console.log(`\n${pc.cyan("📦 Created services:")} ${servicesToCreate.join(", ")}`);
  console.log(`\n${pc.blue("💡 Next steps:")}`);
  console.log(`   ${pc.dim("1.")} cd ${pc.bold(sanitizedName)}`);
  console.log(
    mode === "docker"
      ? `   ${pc.dim("2.")} Start services: ${pc.bold("docker-compose up")}`
      : `   ${pc.dim("2.")} Start services: ${pc.bold("pm2 start pm2.config.js")}`
  );
} else {
  console.log(`\n${pc.green("✅ Backend created successfully!")}`);
  console.log(`\n${pc.blue("💡 Next steps:")}`);
  console.log(`   ${pc.dim("1.")} cd ${pc.bold(sanitizedName)}`);
  console.log(`   ${pc.dim("2.")} npm run dev`);
}
