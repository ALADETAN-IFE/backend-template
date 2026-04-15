#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import pc from "picocolors";
import { getProjectConfig } from "./lib/prompts.js";
import prompts from "prompts";
import { setupService } from "./lib/service-setup.js";
import { generateReadme } from "./lib/readme-generator.js";
// No TS->JS transform: templates contain language-specific folders (base/js, base/ts)
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

const baseRoot =
  config.language === "javascript"
    ? path.join(__dirname, "../template/base/js")
    : path.join(__dirname, "../template/base/ts");
const base = baseRoot;

// Determine which services to create
const servicesToCreate = [];
const servicesToSetup = [];
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
    console.error(
      `\n${pc.red("❌ Error:")} Project ${pc.bold(sanitizedName)} already exists!`,
    );
    process.exit(1);
  }
  console.log(
    `\n${pc.cyan("🏗️  Creating microservices:")} ${pc.bold(servicesToCreate.join(", "))}...\n`,
  );
} else if (!isInMicroserviceProject && config.projectType === "monolith") {
  if (isExistingProject) {
    console.error(
      `\n${pc.red("❌ Error:")} Project ${pc.bold(sanitizedName)} already exists!`,
    );
    process.exit(1);
  }
  fs.cpSync(base, target, { recursive: true });

  // Remove db file and remove connectDB export/import if auth is not enabled
  if (!config.auth) {
    const ext = config.language === "javascript" ? "js" : "ts";
    const dbPath = path.join(target, `src/config/db.${ext}`);
    if (fs.existsSync(dbPath)) {
      fs.rmSync(dbPath);
    }

    // Update index.(js|ts) to not export or require connectDB
    const indexPath = path.join(target, `src/config/index.${ext}`);
    if (fs.existsSync(indexPath)) {
      let indexContent = fs.readFileSync(indexPath, "utf8");
      if (ext === "ts") {
        indexContent = indexContent.replace(
          'export { connectDB } from "./db";\n',
          "",
        );
        // also remove any trailing references like `connectDB,` in exported objects
        indexContent = indexContent.replace(/connectDB,?/g, "");
      } else {
        indexContent = indexContent
          .replace('const { connectDB } = require("./db");', "")
          .replace(/connectDB,?/g, "");
      }
      fs.writeFileSync(indexPath, indexContent);
    }
  }

  // No TypeScript-to-JavaScript conversion — templates include language-specific variants
} else if (isInMicroserviceProject) {
  console.log(
    `\n${pc.cyan("🏗️  Adding service:")} ${pc.bold(servicesToCreate[0])}...\n`,
  );
}

// Process services
if (isInMicroserviceProject || config.projectType === "microservice") {
  // Create shared folder for config and utils (only once)
  if (!isInMicroserviceProject) {
    const sharedDir = path.join(target, "shared");
    if (!fs.existsSync(sharedDir)) {
      console.log(
        `\n${pc.cyan("📦 Creating shared folder for config and utils...")}`,
      );
      fs.mkdirSync(sharedDir, { recursive: true });

      // Copy config and utils from base template
      const baseConfigDir = path.join(base, "src", "config");
      const baseUtilsDir = path.join(base, "src", "utils");
      const sharedConfigDir = path.join(sharedDir, "config");
      const sharedUtilsDir = path.join(sharedDir, "utils");

      fs.cpSync(baseConfigDir, sharedConfigDir, { recursive: true });
      fs.cpSync(baseUtilsDir, sharedUtilsDir, { recursive: true });

      // Remove db files and strip connectDB exports/imports when auth is not enabled
      if (!config.auth) {
        for (const ext of ["ts", "js"]) {
          const sharedDbPath = path.join(sharedConfigDir, `db.${ext}`);
          if (fs.existsSync(sharedDbPath)) fs.rmSync(sharedDbPath);

          const sharedIndexPath = path.join(sharedConfigDir, `index.${ext}`);
          if (fs.existsSync(sharedIndexPath)) {
            let idx = fs.readFileSync(sharedIndexPath, "utf8");
            // Remove various export/import patterns referencing connectDB
            idx = idx.replace(
              /export\s*\{\s*connectDB\s*\}\s*from\s*["']\.\/db["'];?/g,
              "",
            );
            idx = idx.replace(
              /const\s*\{\s*connectDB\s*\}\s*=\s*require\(["']\.\/db["']\);?/g,
              "",
            );
            idx = idx.replace(
              /import\s*\{\s*connectDB\s*\}\s*from\s*["']\.\/db["'];?/g,
              "",
            );
            idx = idx.replace(/\bconnectDB,?\b/g, "");
            idx = idx.replace(/\n{3,}/g, "\n\n");
            fs.writeFileSync(sharedIndexPath, idx);
          }
        }
      }
      const ext = config.language === "javascript" ? "js" : "ts";

      // Update shared env.ts to include all service port environment variables
      const sharedEnvPath = path.join(sharedConfigDir, `env.${ext}`);
      if (fs.existsSync(sharedEnvPath)) {
        let envContent = fs.readFileSync(sharedEnvPath, "utf8");
        console.log(`\n${pc.cyan("🔧 Updating shared env configuration...")}`);

        // Build port environment variables for all services
        const allServices = ["gateway", "health-service"];
        if (config.auth) allServices.push("auth-service");

        const portEnvVars = allServices
          .map((service) => {
            const envVarName = `${service.toUpperCase().replace(/-/g, "_")}_PORT`;
            // Don't add ! for JavaScript projects - it will cause syntax errors
            const assertion = config.language === "javascript" ? "" : "!";
            return `  ${envVarName}: process.env.${envVarName}${assertion},`;
          })
          .join("\n");

        // Replace PORT with service-specific ports
        envContent = envContent.replace(
          "  PORT: process.env.PORT!,",
          portEnvVars,
        );

        // Add ALLOWED_ORIGIN if CORS is selected
        if (config.features && config.features.includes("cors")) {
          const assertion = config.language === "javascript" ? "" : "!";
          envContent = envContent.replace(
            "/*__ALLOWED_ORIGIN__*/",
            `ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN${assertion},`,
          );
        } else {
          envContent = envContent.replace("/*__ALLOWED_ORIGIN__*/", "");
        }

        // Add MONGO_URI and JWT_SECRET if auth is enabled
        if (config.auth) {
          const assertion = config.language === "javascript" ? "" : "!";
          envContent = envContent.replace(
            "/*__MONGO_URI__*/",
            `MONGO_URI: process.env.MONGO_URI${assertion},`,
          );
          envContent = envContent.replace(
            "/*__JWT_SECRET__*/",
            `JWT_SECRET: process.env.JWT_SECRET${assertion},`,
          );
        } else {
          envContent = envContent.replace("/*__MONGO_URI__*/", "");
          envContent = envContent.replace("/*__JWT_SECRET__*/", "");
        }

        fs.writeFileSync(sharedEnvPath, envContent);
      }

      // Update shared config/index to conditionally export connectDB
      const sharedConfigIndexPath = path.join(sharedConfigDir, `index.${ext}`);
      if (fs.existsSync(sharedConfigIndexPath)) {
        let indexContent = fs.readFileSync(sharedConfigIndexPath, "utf8");
        if (!config.auth) {
          if (ext === "ts") {
            indexContent = indexContent.replace(
              'export { connectDB } from "./db";\n',
              "",
            );
          }
          indexContent = indexContent
            .replace('const { connectDB } = require("./db");', "")
            .replace("connectDB,", "");
          fs.writeFileSync(sharedConfigIndexPath, indexContent);
        }
      }

      // Update shared utils/logger to use shared config
      const sharedLoggerPath = path.join(sharedUtilsDir, `logger.${ext}`);
      if (fs.existsSync(sharedLoggerPath)) {
        console.log(
          `\n${pc.cyan("🔧 Updating shared logger to use shared config...")}`,
        );
        let loggerContent = fs.readFileSync(sharedLoggerPath, "utf8");
        // Replace imports like: from '@/config'; or from "@/config" with relative import to shared config
        loggerContent = loggerContent.replace(
          /from\s+["']@\/config["'];?/g,
          "from '../config';",
        );
        fs.writeFileSync(sharedLoggerPath, loggerContent);
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
        JSON.stringify(sharedPackageJson, null, 2),
      );
    }
  }

  for (const serviceName of servicesToCreate) {
    const serviceRoot = path.join(target, "services", serviceName);

    // Check for exact or alternate folder conflicts (e.g., 'order' vs 'order-service')
    const altName = serviceName.endsWith("-service")
      ? serviceName.replace(/-service$/, "")
      : `${serviceName}-service`;
    const altPath = path.join(target, "services", altName);
    let conflictPath = null;
    if (fs.existsSync(serviceRoot)) conflictPath = serviceRoot;
    else if (fs.existsSync(altPath)) conflictPath = altPath;

    if (conflictPath) {
      const rel = path.relative(target, conflictPath);
      const resp = await prompts({
        type: "select",
        name: "action",
        message: `Service directory '${rel}' already exists and conflicts with requested '${serviceName}'. Choose action:`,
        choices: [
          { title: "Abort generation", value: "abort" },
          { title: `Skip creating '${serviceName}'`, value: "skip" },
          {
            title: `Overwrite '${rel}' with '${serviceName}'`,
            value: "overwrite",
          },
        ],
        initial: 0,
      });

      if (!resp.action || resp.action === "abort") {
        console.log(pc.red("Aborting."));
        process.exit(1);
      }
      if (resp.action === "skip") {
        console.log(pc.yellow(`Skipping ${serviceName}`));
        continue;
      }
      if (resp.action === "overwrite") {
        try {
          fs.rmSync(conflictPath, { recursive: true, force: true });
        } catch (e) {
          console.error(
            pc.red(`Failed to remove existing path: ${conflictPath}`),
          );
          process.exit(1);
        }
      }
    }

    console.log(`\n🔨 Setting up ${serviceName}...`);
    fs.cpSync(base, serviceRoot, { recursive: true });
    // track which services we actually created/overwrote so we can run setupService for them
    servicesToSetup.push(serviceName);

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
  const existingServices = fs.existsSync(servicesDir)
    ? fs
        .readdirSync(servicesDir)
        .filter((f) => fs.statSync(path.join(servicesDir, f)).isDirectory())
    : [];
  // Include services we're about to create so port computation and gateway routing
  // are aware of newly added services when setting up files.
  const allServices = Array.from(
    new Set([...existingServices, ...servicesToSetup]),
  );

  // Step 1: Setup all service files first (without installing dependencies)
  console.log(pc.cyan("\n⚙️  Setting up service files...\n"));
  const serviceConfigs = [];

  for (const serviceName of servicesToSetup) {
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
      true, // Skip install for now
    );
    serviceConfigs.push({
      serviceName,
      serviceRoot,
      deps: result.deps,
      devDeps: result.devDeps,
    });
  }

  // Remove per-service husky hooks and ensure a single root pre-commit hook
  try {
    const servicesDirPath = path.join(target, "services");
    const allServicesList = fs.existsSync(servicesDirPath)
      ? fs
          .readdirSync(servicesDirPath)
          .filter((f) =>
            fs.statSync(path.join(servicesDirPath, f)).isDirectory(),
          )
      : [];

    // Remove `.husky` folders from each service
    for (const svc of allServicesList) {
      const svcHusky = path.join(servicesDirPath, svc, ".husky");
      if (fs.existsSync(svcHusky)) {
        fs.rmSync(svcHusky, { recursive: true, force: true });
      }
    }

    // Ensure root .husky/pre-commit exists at target
    const rootHuskyDir = path.join(target, ".husky");
    if (!fs.existsSync(rootHuskyDir))
      fs.mkdirSync(rootHuskyDir, { recursive: true });
    const preCommitPath = path.join(rootHuskyDir, "pre-commit");
    const preCommitContent =
      config.language === "typescript"
        ? 'set -e\n\necho "Checking format (prettier)..."\nnpm run check-format\n\necho "Running TypeScript type-check..."\nnpx tsc --noEmit\n\necho "Checking lint..."\nnpm run lint -- --max-warnings=0\n'
        : 'set -e\n\necho "Checking format (prettier)..."\nnpm run check-format\n\necho "Checking lint..."\nnpm run lint -- --max-warnings=0\n';
    fs.writeFileSync(preCommitPath, preCommitContent);
  } catch (err) {
    // Non-fatal; continue setup even if husky files couldn't be created/removed
  }

  // Step 2: Generate docker-compose/pm2 config and root files
  if (mode === "docker") {
    generateDockerCompose(target, allServices, config.sanitizedName);
    copyDockerfile(target, servicesToSetup);
    copyDockerignore(target, servicesToSetup);
  } else {
    generatePm2Config(target, allServices);
  }

  // Create root package.json for microservice monorepo if it doesn't exist
  const rootPackageJsonPath = path.join(target, "package.json");
  if (!fs.existsSync(rootPackageJsonPath)) {
    const rootPackageJson = {
      name: sanitizedName,
      version: config.version || "1.0.0",
      description: config.description || "",
      private: true,
      scripts: {
        dev:
          mode === "docker"
            ? "docker-compose up"
            : "npx pm2 start pm2.config.js && npx pm2 logs",
        stop: mode === "docker" ? "docker-compose down" : "npx pm2 kill",
        restart:
          mode === "docker"
            ? "docker-compose restart"
            : "npx pm2 restart all && npx pm2 logs",
        lint: 'eslint "services/**/*.{js,ts,tsx}" "shared/**/*.{js,ts,tsx}"',
        format:
          'prettier --write "services/**/*.{js,ts,json}" "shared/**/*.{js,ts,json}"',
        "check-format":
          'prettier --check "services/**/*.{js,ts,json}" "shared/**/*.{js,ts,json}"',
        prepare: "husky install",
      },
      devDependencies: {
        husky: "^9.1.7",
        prettier: "^3.7.4",
        "@typescript-eslint/eslint-plugin": "^8.50.1",
        "@typescript-eslint/parser": "^8.50.1",
        eslint: "^9.39.2",
        "eslint-config-prettier": "^10.1.8",
      },
    };

    // Add runtime dependencies for non-Docker (PM2) mode
    if (mode !== "docker") {
      rootPackageJson.dependencies = {
        dotenv: "^17.2.3",
        pm2: "^6.0.14",
        "ts-node": "^10.9.2",
        "tsconfig-paths": "^4.2.0",
      };
    }
    fs.writeFileSync(
      rootPackageJsonPath,
      JSON.stringify(rootPackageJson, null, 2) + "\n",
    );
  }

  // Ensure root lint/format config files exist (copy from template base if available), and remove any per-service copies
  try {
    const rootFiles = [".prettierrc", ".prettierignore", ".eslintrc.json"];
    for (const f of rootFiles) {
      const src = path.join(base, f);
      const dest = path.join(target, f);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      } else if (!fs.existsSync(dest)) {
        // create minimal defaults
        if (f === ".prettierignore")
          fs.writeFileSync(dest, "node_modules\n" + "dist\n");
        else if (f === ".eslintrc.json")
          fs.writeFileSync(dest, JSON.stringify({ root: true }, null, 2));
        else fs.writeFileSync(dest, "{}");
      }
    }

    // Write eslint.config.js with recommended workspace config (overwrite)
    const eslintConfigPath = path.join(target, "eslint.config.js");

    // Build dynamic project list for TypeScript projects based on the services present
    const projectPaths = ["./tsconfig.json"];
    try {
      if (typeof allServices !== "undefined" && Array.isArray(allServices)) {
        for (const svc of allServices) {
          const svcTsPath = `./services/${svc}/tsconfig.json`;
          if (fs.existsSync(path.join(target, svcTsPath))) {
            projectPaths.push(svcTsPath);
          }
        }
      }
    } catch (e) {
      // non-fatal; fall back to default projectPaths containing only root tsconfig
    }

    const projectEntries = projectPaths
      .map((p) => `          "${p}",`)
      .join("\n");

    const eslintConfigContent = `const tsParser = require("@typescript-eslint/parser");\nconst tsPlugin = require("@typescript-eslint/eslint-plugin");\n\nmodule.exports = [\n  // Files/paths to ignore (replaces .eslintignore usage in flat config)\n  {\n    ignores: ["node_modules/**", "dist/**"],\n  },\n\n  // TypeScript rules for source files\n  {\n    files: ["services/**/*.{js,ts,tsx}", "shared/**/*.{js,ts,tsx}"],\n    languageOptions: {\n      parser: tsParser,\n      parserOptions: {\n        project: [\n${projectEntries}\n        ],\n        tsconfigRootDir: __dirname,\n        ecmaVersion: 2020,\n        sourceType: "module",\n      },\n    },\n    plugins: {\n      "@typescript-eslint": tsPlugin,\n    },\n    rules: {\n      // Disallow explicit 'any'\n      "@typescript-eslint/no-explicit-any": "error",\n\n      // You can add or tune more TypeScript rules here\n      "@typescript-eslint/explicit-module-boundary-types": "off",\n    },\n  },\n];\n`;
    fs.writeFileSync(eslintConfigPath, eslintConfigContent);

    // Remove per-service copies if they exist (already removed in setupService, but double-check)
    const servicesDirPath = path.join(target, "services");
    if (fs.existsSync(servicesDirPath)) {
      const svcs = fs
        .readdirSync(servicesDirPath)
        .filter((f) =>
          fs.statSync(path.join(servicesDirPath, f)).isDirectory(),
        );
      for (const svc of svcs) {
        for (const f of [...rootFiles, "eslint.config.js"]) {
          const p = path.join(servicesDirPath, svc, f);
          if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
        }
      }
    }
  } catch (err) {
    // non-fatal
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
      const port = isGateway
        ? 4000
        : 4001 +
          allServices.filter((s, i) => s !== "gateway" && i < index).length;
      const envVarName = `${service.toUpperCase().replace(/-/g, "_")}_PORT`;
      const serviceName = service
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      rootENVContent += `# ${serviceName}\n${envVarName}=${port}\n\n`;
    });

    fs.writeFileSync(path.join(target, ".env"), rootENVContent);
    fs.writeFileSync(path.join(target, ".env.example"), rootENVContent);

    // Create root tsconfig.json for microservices workspace
    const rootTsConfigContent = {
      compilerOptions: {
        target: "ES2020",
        module: "CommonJS",
        lib: ["ES2020"],
        moduleResolution: "node",
        esModuleInterop: true,
        skipLibCheck: true,
        strict: true,
        baseUrl: ".",
        paths: {
          "@/*": ["./*"],
        },
      },
      include: [],
      exclude: ["node_modules", "dist"],
      references: allServices.map((service) => ({
        path: `./services/${service}`,
      })),
    };
    fs.writeFileSync(
      path.join(target, "tsconfig.json"),
      JSON.stringify(rootTsConfigContent, null, 2) + "\n",
    );
  }

  // If we're adding a service into an existing microservice project,
  // ensure shared config and gateway are updated to reference the new service.
  if (isInMicroserviceProject) {
    try {
      const sharedConfigDir = path.join(target, "shared", "config");
      const languageExt = config.language === "javascript" ? "js" : "ts";
      const sharedEnvPath = path.join(sharedConfigDir, `env.${languageExt}`);

      if (fs.existsSync(sharedEnvPath)) {
        let envContent = fs.readFileSync(sharedEnvPath, "utf8");

        // Build port environment variables for all services
        const portEnvVars = allServices
          .map((service) => {
            const envVarName = `${service.toUpperCase().replace(/-/g, "_")}_PORT`;
            const assertion = config.language === "javascript" ? "" : "!";
            return `  ${envVarName}: process.env.${envVarName}${assertion},`;
          })
          .join("\n");

        // Remove any existing *_PORT lines to avoid duplication
        envContent = envContent.replace(
          /^[ \t]*[A-Z0-9_]+_PORT:\s*process\.env\.[A-Z0-9_]+!?\,?\s*$/gim,
          "",
        );
        // Normalize multiple consecutive blank lines
        envContent = envContent.replace(/\n{2,}/g, "\n\n");

        // Attempt several fallback strategies to inject port variables:
        // 1. Replace explicit placeholder if present in template
        // 2. Insert right after the first object opening brace (or replace placeholder)
        if (envContent.includes("/*__PORTS__*/")) {
          envContent = envContent.replace(
            "/*__PORTS__*/",
            "/*__PORTS__*/\n" + portEnvVars,
          );
        } else {
          // Fallback: find the opening brace of the exported ENV object and insert after it
          const braceIndex = envContent.indexOf("{");
          if (braceIndex !== -1) {
            const insertPos =
              envContent.indexOf("\n", braceIndex) + 1 || braceIndex + 1;
            // insert a stable placeholder comment followed by the ports block
            envContent =
              envContent.slice(0, insertPos) +
              "  /*__PORTS__*/\n" +
              portEnvVars +
              "\n" +
              envContent.slice(insertPos);
          } else {
            // Final fallback: append a placeholder and the ports to the end
            envContent = envContent + "\n/*__PORTS__*/\n" + portEnvVars;
          }
        }

        fs.writeFileSync(sharedEnvPath, envContent);
      }

      // Re-generate gateway routes if gateway exists (so new service gets proxied)
      const gatewayRoot = path.join(target, "services", "gateway");
      if (fs.existsSync(gatewayRoot)) {
        // Re-run setupService for gateway to rewrite app/server/env files
        await setupService(
          config,
          "gateway",
          gatewayRoot,
          config.auth,
          allServices,
          true,
        );
      }

      // Update root .env and .env.example so newly added services have port entries
      try {
        const servicesDirPath = path.join(target, "services");
        const svcList = fs.existsSync(servicesDirPath)
          ? fs
              .readdirSync(servicesDirPath)
              .filter((f) =>
                fs.statSync(path.join(servicesDirPath, f)).isDirectory(),
              )
          : allServices;

        // Update only .env.example: preserve runtime .env (don't overwrite user changes)
        try {
          const envExamplePath = path.join(target, ".env.example");
          const servicesPorts = svcList.map((service, index) => {
            const isGateway = service === "gateway";
            const port = isGateway
              ? 4000
              : 4001 +
                svcList.filter((s, i) => s !== "gateway" && i < index).length;
            const envVarName = `${service.toUpperCase().replace(/-/g, "_")}_PORT`;
            const serviceNamePretty = service
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
            return `# ${serviceNamePretty}\n${envVarName}=${port}\n`;
          });

          const portsBlock = servicesPorts.join("\n");

          let exampleContent = "";
          if (fs.existsSync(envExamplePath)) {
            exampleContent = fs.readFileSync(envExamplePath, "utf8");

            // Remove existing *_PORT lines and any immediate preceding single-line comment
            const lines = exampleContent.split(/\r?\n/);
            const filtered = [];
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const next = lines[i + 1];
              if (next && /^[A-Z0-9_]+_PORT=/.test(next.trim())) {
                // skip this line if it's a comment immediately preceding a _PORT assignment
                i++; // skip next as well
                continue;
              }
              if (/^[A-Z0-9_]+_PORT=/.test(line.trim())) {
                // skip existing port assignment
                continue;
              }
              filtered.push(line);
            }

            exampleContent = filtered.join("\n");
          } else {
            // create minimal header if example file doesn't exist
            exampleContent = `# Environment Configuration\nNODE_ENV=development\n\n`;
          }

          // Ensure NODE_ENV line exists and insert portsBlock after it
          const nodeEnvRegex = /^NODE_ENV=.*$/m;
          if (nodeEnvRegex.test(exampleContent)) {
            exampleContent = exampleContent.replace(
              nodeEnvRegex,
              (m) => `${m}\n\n${portsBlock}\n`,
            );
          } else {
            // Prepend header and ports
            exampleContent =
              `# Environment Configuration\nNODE_ENV=development\n\n${portsBlock}\n` +
              exampleContent;
          }

          fs.writeFileSync(envExamplePath, exampleContent);
          // Inform the user about the new ports and remind them to update their runtime .env if needed
          try {
            console.log(
              pc.cyan("\n🔧 Updated .env.example with service port entries:\n"),
            );
            console.log(pc.green(portsBlock));
            console.log(
              pc.dim(
                "If you keep a runtime .env with custom overrides, do NOT overwrite it.\nPlease copy any new *_PORT entries from .env.example into .env as appropriate.",
              ),
            );
          } catch (e) {
            // non-fatal if logging fails
          }
        } catch (e) {
          // non-fatal
        }
      } catch (e) {
        // non-fatal
      }
    } catch (e) {
      // non-fatal; continue even if updating shared/gateway fails
    }
  }

  // Step 5: Install dependencies for all services

  console.log(pc.cyan("\n📦 Installing dependencies for all services...\n"));
  let allInstallsSucceeded = true;

  for (const { serviceName, serviceRoot, deps, devDeps } of serviceConfigs) {
    console.log(
      pc.cyan(`\n📦 Installing dependencies for ${serviceName}...\n`),
    );

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

  // Safety net: ensure eslint.config.js exists in generated monolith projects
  const templateEslintConfig = path.join(base, "eslint.config.js");
  const generatedEslintConfig = path.join(target, "eslint.config.js");
  if (
    config.projectType === "monolith" &&
    fs.existsSync(templateEslintConfig) &&
    !fs.existsSync(generatedEslintConfig)
  ) {
    fs.copyFileSync(templateEslintConfig, generatedEslintConfig);
  }
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
  try {
    const rootEnvExamplePath = path.join(target, ".env.example");
    const rootEnvPath = path.join(target, ".env");
    if (fs.existsSync(rootEnvExamplePath) && !fs.existsSync(rootEnvPath)) {
      fs.copyFileSync(rootEnvExamplePath, rootEnvPath);
    }
  } catch (err) {
    // Non-fatal; proceed even if we fail to write env files
  }
}

// Initialize git and Husky
if (!isInMicroserviceProject) {
  execSync("git init", { cwd: target, stdio: "inherit" });

  // Install husky and other devDeps and setup at root level
  if (config.projectType === "microservice") {
    console.log("\n📦 Installing dependencies at root level...\n");
    if (config.allInstallsSucceeded) {
      try {
        execSync("npm install", { cwd: target, stdio: "inherit" });
        console.log("\n🔧 Setting up Husky...\n");
        execSync("npm run prepare", { cwd: target, stdio: "inherit" });
      } catch (error) {
        console.log("\n⚠️  Husky setup failed\n");
      }
      // Run format after successful install
      console.log(pc.cyan("\n🎨 Formatting code...\n"));
      try {
        execSync("npm run format", { cwd: target, stdio: "inherit" });
      } catch (formatError) {
        console.warn(
          pc.yellow(
            "⚠️  Warning: Code formatting failed. You can run it manually later with: npm run format\n",
          ),
        );
      }
    } else {
      console.log(
        "\n⚠️  Husky setup skipped (run 'npm install && npm run prepare' after fixing service dependencies)\n",
      );
    }
  } else if (config.projectType === "monolith") {
    // Only setup Husky if installation succeeded
    if (config.installSucceeded) {
      console.log(`\n${pc.cyan("🔧 Setting up Husky...")}\n`);
      try {
        execSync("npm run prepare", { cwd: target, stdio: "inherit" });
      } catch (error) {
        console.log(
          `\n${pc.yellow("⚠️  Husky setup failed")} ${pc.dim("(run 'npm run prepare' manually after fixing dependencies)")}\n`,
        );
      }
    } else {
      console.log(
        `\n${pc.yellow("⚠️  Husky setup skipped")} ${pc.dim("(run 'npm install && npm run prepare' to set up git hooks)")}\n`,
      );
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
// Update root README when adding services to an existing microservice project
if (isInMicroserviceProject) {
  try {
    const readmeContent = generateReadme({ ...config, allServices });
    fs.writeFileSync(path.join(target, "README.md"), readmeContent);
    console.log(`\n${pc.cyan("📝 Updated README.md with new services")}`);
  } catch (e) {
    // non-fatal
  }
}

if (isInMicroserviceProject) {
  if (servicesToSetup.length > 0) {
    console.log(
      `\n${pc.green("✅ Service")} ${pc.bold(servicesToSetup[0])} ${pc.green("added successfully!")}`,
    );
  } else {
    console.log(pc.yellow("\n⚠️  No new service was created (skipped by your selection)."));
  }
  console.log(`\n${pc.cyan("📦 All services:")} ${allServices.join(", ")}`);
  console.log(`\n${pc.blue("💡 Next steps:")}`);
  console.log(`   ${pc.dim("1.")} Start services: ${pc.bold("npm run dev")}`);
} else if (config.projectType === "microservice") {
  console.log(`\n${pc.green("✅ Microservice Backend created successfully!")}`);
  console.log(
    `\n${pc.cyan("📦 Created services:")} ${servicesToCreate.join(", ")}`,
  );
  console.log(`\n${pc.blue("💡 Next steps:")}`);
  console.log(`   ${pc.dim("1.")} cd ${pc.bold(sanitizedName)}`);
  console.log(`   ${pc.dim("2.")} Start services: ${pc.bold("npm run dev")}`);
} else {
  console.log(`\n${pc.green("✅ Monolith Backend created successfully!")}`);
  console.log(`\n${pc.blue("💡 Next steps:")}`);
  console.log(`   ${pc.dim("1.")} cd ${pc.bold(sanitizedName)}`);
  console.log(`   ${pc.dim("2.")} npm run dev`);
}
// Post-processing: ensure shared config does not export/connect to DB when auth is disabled
try {
  if (!config.auth) {
    const sharedConfigDir = path.join(target, "shared", "config");
    if (fs.existsSync(sharedConfigDir)) {
      for (const ext of ["ts", "js"]) {
        const idxPath = path.join(sharedConfigDir, `index.${ext}`);
        if (!fs.existsSync(idxPath)) continue;
        let idxContent = fs.readFileSync(idxPath, "utf8");
        // Remove various connectDB export/import patterns
        idxContent = idxContent.replace(
          /export\s*\{\s*connectDB\s*\}\s*from\s*["']\.\/db["'];?/g,
          "",
        );
        idxContent = idxContent.replace(
          /import\s*\{\s*connectDB\s*\}\s*from\s*["']\.\/db["'];?/g,
          "",
        );
        idxContent = idxContent.replace(
          /const\s*\{\s*connectDB\s*\}\s*=\s*require\(["']\.\/db["']\);?/g,
          "",
        );
        // Remove any remaining connectDB identifiers (commas/newlines)
        idxContent = idxContent.replace(/connectDB,?/g, "");
        // Normalize multiple blank lines
        idxContent = idxContent.replace(/\n{3,}/g, "\n\n");
        fs.writeFileSync(idxPath, idxContent);
      }
    }
  }
} catch (e) {
  // non-fatal
}
