import fs from "fs";
import path from "path";
import prompts from "prompts";
import pc from "picocolors";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

// Helper function to get the correct file extension (.ts or .js)
function getFileExtension(dir) {
  // Check if .ts files exist, otherwise use .js
  const sampleFiles = ["src/app.ts", "src/server.ts", "src/routes.ts"];
  for (const file of sampleFiles) {
    const tsPath = path.join(dir, file);
    if (fs.existsSync(tsPath)) return "ts";
    const jsPath = path.join(dir, file.replace(".ts", ".js"));
    if (fs.existsSync(jsPath)) return "js";
  }
  return "ts"; // default to ts
}

export const setupService = async (
  res,
  serviceName,
  serviceRoot,
  shouldIncludeAuth,
  allServices = [],
  skipInstall = false,
) => {
  let imports = [];
  let middlewares = [];
  let deps = [];
  let devDeps = [];
  let v1Imports = [];
  let v1Routes = [];

  // Detect file extension (ts or js)
  const ext = getFileExtension(serviceRoot);

  // Remove workspace-level config files from service (they should live at root)
  try {
    const serviceConfigFiles = [
      ".prettierrc",
      ".prettierignore",
      ".eslintrc.json",
      "eslint.config.js",
      "husky",
    ];
    for (const f of serviceConfigFiles) {
      const p = path.join(serviceRoot, f);
      if (fs.existsSync(p)) {
        // Remove file or directory
        const stat = fs.statSync(p);
        if (stat.isDirectory()) fs.rmSync(p, { recursive: true, force: true });
        else fs.rmSync(p, { force: true });
      }
    }
  } catch (err) {
    // Non-fatal
  }

  // Ensure service-level gitignore is renamed immediately after template copy
  try {
    const serviceGitignore = path.join(serviceRoot, "gitignore");
    const serviceDotGitignore = path.join(serviceRoot, ".gitignore");
    if (
      fs.existsSync(serviceGitignore) &&
      !fs.existsSync(serviceDotGitignore)
    ) {
      fs.renameSync(serviceGitignore, serviceDotGitignore);
    }
  } catch (err) {
    // Non-fatal; continue setup
  }

  // Special handling for gateway service
  if (serviceName === "gateway") {
    const tmplLang = res.language === "javascript" ? "js" : "ts";
    const gatewayModule = await import(
      `../../template/gateway/${tmplLang}/inject.js`
    );

    deps.push(...gatewayModule.gatewayDeps);

    // Copy gateway-specific files
    const gatewayAppPath = path.join(serviceRoot, `src/app.${ext}`);
    const gatewayServerPath = path.join(serviceRoot, `src/server.${ext}`);
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    // Read gateway template files according to selected language
    const templateExt = res.language === "javascript" ? ".js" : ".ts";
    const templateDir = path.join(
      __dirname,
      `../../template/gateway/${tmplLang}`,
    );
    const gatewayAppContent = fs.readFileSync(
      path.join(templateDir, `app${templateExt}`),
      "utf8",
    );
    const gatewayServerContent = fs.readFileSync(
      path.join(templateDir, `server${templateExt}`),
      "utf8",
    );

    // Generate routes for all services with mode (docker or nodocker)
    const mode = res.mode || "docker";
    const routes = gatewayModule.generateGatewayRoutes(allServices, mode);
    const finalAppContent = gatewayAppContent.replace("/*__ROUTES__*/", routes);

    fs.writeFileSync(gatewayAppPath, finalAppContent);
    fs.writeFileSync(gatewayServerPath, gatewayServerContent);

    // Remove unnecessary files for gateway
    const routesPath = path.join(serviceRoot, `src/routes.${ext}`);
    const modulesPath = path.join(serviceRoot, "src/modules");
    const middlewaresPath = path.join(serviceRoot, "src/middlewares");
    const configPath = path.join(serviceRoot, `src/config`);
    const utilPath = path.join(serviceRoot, `src/utils`);

    if (fs.existsSync(routesPath)) fs.rmSync(routesPath);
    if (fs.existsSync(modulesPath)) fs.rmSync(modulesPath, { recursive: true });
    if (fs.existsSync(configPath)) fs.rmSync(configPath, { recursive: true });
    if (fs.existsSync(utilPath)) fs.rmSync(utilPath, { recursive: true });
    if (fs.existsSync(middlewaresPath))
      fs.rmSync(middlewaresPath, { recursive: true });
  } else {
    // Regular service setup (existing code)
    // Add features (only for monolith or health-service)
    if (res.projectType === "monolith" || serviceName === "health-service") {
      for (const f of res.features) {
        const feature = await import(`../../template/features/${f}/inject.js`);
        const featureImports = feature.getImports
          ? feature.getImports(res.language)
          : feature.imports;
        imports.push(featureImports);
        middlewares.push(feature.middleware);
        deps.push(...feature.deps);
        if (feature.devDeps && res.language === "typescript") {
          devDeps.push(...feature.devDeps);
        }

        // If the feature provides files for the selected language, write them
        const featureFiles = feature.getFiles
          ? feature.getFiles(res.language)
          : feature.files;
        if (featureFiles) {
          for (const file in featureFiles) {
            const filePath = file.replace(/\.ts$/, `.${ext}`);
            const fullPath = path.join(serviceRoot, filePath);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, featureFiles[file]);
          }
        }
      }
    }

    // Add authentication (only for monolith or auth-service)
    if (shouldIncludeAuth && res.auth) {
      const baseAuth =
        await import("../../template/features/auth/base/inject.js");
      deps.push(...baseAuth.deps);
      if (baseAuth.devDeps && res.language === "typescript") {
        devDeps.push(...baseAuth.devDeps);
      }

      const authFiles = baseAuth.getFiles
        ? baseAuth.getFiles(res.language)
        : baseAuth.files;
      for (const file in authFiles) {
        const filePath = file.replace(/\.ts$/, `.${ext}`);
        const fullPath = path.join(serviceRoot, filePath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, authFiles[file]);
      }

      const algo = await prompts({
        type: "select",
        name: "hasher",
        message: `Password hashing method${
          serviceName ? ` for ${serviceName}` : ""
        }`,
        choices: [
          {
            title:
              process.platform === "win32"
                ? "bcrypt (recommended for Windows)"
                : "argon2 (recommended)",
            value: process.platform === "win32" ? "bcrypt" : "argon2",
          },
          {
            title:
              process.platform === "win32"
                ? "argon2 (requires build tools)"
                : "bcrypt",
            value: process.platform === "win32" ? "argon2" : "bcrypt",
          },
        ],
      });

      const hashFeature = await import(
        `../../template/features/auth/${algo.hasher}/inject.js`
      );
      deps.push(...hashFeature.deps);
      if (hashFeature.devDeps && res.language === "typescript") {
        devDeps.push(...hashFeature.devDeps);
      }

      const hashFiles = hashFeature.getFiles
        ? hashFeature.getFiles(res.language)
        : hashFeature.files;
      for (const file in hashFiles) {
        const filePath = file.replace(/\.ts$/, `.${ext}`);
        const fullPath = path.join(serviceRoot, filePath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        const content = hashFiles[file];
        fs.writeFileSync(fullPath, content);
      }

      v1Imports.push(
        baseAuth.getImports
          ? baseAuth.getImports(res.language)
          : baseAuth.imports,
      );
      v1Routes.push(baseAuth.middleware);
    }

    // Update app file
    const appPath = path.join(serviceRoot, `src/app.${ext}`);
    let content = fs.readFileSync(appPath, "utf8");
    content = content.replace("/*__IMPORTS__*/", imports.join("\n"));
    content = content.replace("/*__MIDDLEWARE__*/", middlewares.join("\n"));
    fs.writeFileSync(appPath, content);

    // Update root endpoint middleware with project info
    const rootMiddlewarePath = path.join(
      serviceRoot,
      `src/middlewares/root.middleware.${ext}`,
    );
    if (fs.existsSync(rootMiddlewarePath)) {
      let rootContent = fs.readFileSync(rootMiddlewarePath, "utf8");
      rootContent = rootContent.replace(
        "/*__PROJECT_NAME__*/",
        serviceName || res.sanitizedName,
      );
      rootContent = rootContent.replace(
        "/*__PROJECT_TYPE__*/",
        res.projectType,
      );

      // Add auth endpoint if auth is enabled
      if (shouldIncludeAuth && res.auth) {
        rootContent = rootContent.replace(
          "/*__AUTH_ENDPOINT__*/",
          'auth: "/api/v1/auth",',
        );
      } else {
        rootContent = rootContent.replace("/*__AUTH_ENDPOINT__*/", "");
      }

      fs.writeFileSync(rootMiddlewarePath, rootContent);
    }

    // Update v1 index file if needed
    if (v1Imports.length || v1Routes.length) {
      const v1IndexPath = path.join(serviceRoot, `src/modules/v1/index.${ext}`);
      let v1Content = fs.readFileSync(v1IndexPath, "utf8");

      const lastImportIndex = v1Content.lastIndexOf("import");
      const importEndIndex = v1Content.indexOf("\n", lastImportIndex) + 1;
      v1Content =
        v1Content.slice(0, importEndIndex) +
        v1Imports.join("\n") +
        "\n" +
        v1Content.slice(importEndIndex);

      const exportIndex = v1Content.lastIndexOf("export default");
      v1Content =
        v1Content.slice(0, exportIndex) +
        v1Routes.join("\n") +
        "\n\n" +
        v1Content.slice(exportIndex);

      fs.writeFileSync(v1IndexPath, v1Content);
    }

    // Update env file to conditionally include ALLOWED_ORIGIN and MONGO_URI
    const envPath = path.join(serviceRoot, `src/config/env.${ext}`);
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, "utf8");

      // Import ENV in app.ts if CORS is selected
      if (res.features && res.features.includes("cors")) {
        let appContent = fs.readFileSync(appPath, "utf8");
        if (!appContent.includes("import { ENV } from")) {
          appContent = appContent.replace(
            "/*__IMPORTS__*/",
            "import { ENV } from '@/config';\n/*__IMPORTS__*/",
          );
          fs.writeFileSync(appPath, appContent);
        }
      }

      // Add ALLOWED_ORIGIN if CORS is selected
      if (res.features && res.features.includes("cors")) {
        const assertion = res.language === "javascript" ? "" : "!";
        envContent = envContent.replace(
          "/*__ALLOWED_ORIGIN__*/",
          `ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN${assertion},`,
        );
      } else {
        envContent = envContent.replace("/*__ALLOWED_ORIGIN__*/", "");
      }

      // Add MONGO_URI and JWT_SECRET if auth is enabled
      if (shouldIncludeAuth && res.auth) {
        const assertion = res.language === "javascript" ? "" : "!";
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

      fs.writeFileSync(envPath, envContent);
    }

    // Update server file to connect to DB if auth is enabled
    const serverPath = path.join(serviceRoot, `src/server.${ext}`);
    if (fs.existsSync(serverPath)) {
      let serverContent = fs.readFileSync(serverPath, "utf8");

      if (shouldIncludeAuth && res.auth) {
        const language = res.language;
        if (language === "javascript") {
          serverContent = serverContent.replace(
            "/*__DB_IMPORT__*/",
            ", connectDB",
          );
        } else {
          serverContent = serverContent.replace(
            "/*__DB_IMPORT__*/",
            'import { connectDB } from "./config";',
          );
        }
        serverContent = serverContent.replace(
          "/*__DB_CONNECT__*/",
          `// Connect to MongoDB\nawait connectDB();`,
        );
      } else {
        serverContent = serverContent.replace("/*__DB_IMPORT__*/", "");
        serverContent = serverContent.replace("/*__DB_CONNECT__*/", "");
      }

      fs.writeFileSync(serverPath, serverContent);
    }

    // Update .env.example to conditionally include environment variables (only for monolith)
    if (res.projectType !== "microservice") {
      const envExamplePath = path.join(serviceRoot, ".env.example");
      if (fs.existsSync(envExamplePath)) {
        let envExampleContent = fs.readFileSync(envExamplePath, "utf8");

        // Add ALLOWED_ORIGIN if CORS is selected
        if (res.features && res.features.includes("cors")) {
          envExampleContent = envExampleContent.replace(
            "/*__ALLOWED_ORIGIN_ENV__*/",
            "ALLOWED_ORIGIN=http://localhost:3000",
          );
        } else {
          envExampleContent = envExampleContent.replace(
            "/*__ALLOWED_ORIGIN_ENV__*/",
            "",
          );
        }

        // Add MONGO_URI and JWT_SECRET if auth is enabled
        if (shouldIncludeAuth && res.auth) {
          envExampleContent = envExampleContent.replace(
            "/*__MONGO_URI_ENV__*/",
            "MONGO_URI=mongodb://localhost:27017/your-database-name",
          );
          envExampleContent = envExampleContent.replace(
            "/*__JWT_SECRET_ENV__*/",
            "JWT_SECRET=your-super-secret-jwt-key-change-this-in-production",
          );
        } else {
          envExampleContent = envExampleContent.replace(
            "/*__MONGO_URI_ENV__*/",
            "",
          );
          envExampleContent = envExampleContent.replace(
            "/*__JWT_SECRET_ENV__*/",
            "",
          );
        }

        fs.writeFileSync(envExamplePath, envExampleContent);
      }
    }
  } // End of else block for non-gateway services

  // Update tsconfig.json for microservices to support @/ alias with shared folder
  // Also run when adding a service into an existing microservice project
  if (res.projectType === "microservice" || res.isInMicroserviceProject) {
    const tsconfigPath = path.join(serviceRoot, "tsconfig.json");
    let tsconfigContent = fs.readFileSync(tsconfigPath, "utf8");

    // Remove comments from JSON (strip-json-comments approach)
    tsconfigContent = tsconfigContent
      .replace(/\/\/.*$/gm, "") // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, ""); // Remove multi-line comments

    const tsconfig = JSON.parse(tsconfigContent);

    // Update baseUrl to allow import from the shared folder
    tsconfig.compilerOptions.baseUrl = ".";

    // Update paths to include shared folder (works in both Docker and VS Code)
    tsconfig.compilerOptions.paths = {
      "@/*": ["src/*"],
      "@/shared/*": ["shared/*", "../../shared/*"],
    };

    // Remove rootDir restriction to allow imports from outside src/
    delete tsconfig.compilerOptions.rootDir;

    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + "\n");

    // Update imports in service files to use @/shared/* instead of @/* for utils/config
    // This applies to non-gateway services
    if (serviceName !== "gateway") {
      const healthControllerPath = path.join(
        serviceRoot,
        `src/modules/v1/health/health.controller.${ext}`,
      );
      if (fs.existsSync(healthControllerPath)) {
        let healthControllerContent = fs.readFileSync(
          healthControllerPath,
          "utf8",
        );
        healthControllerContent = healthControllerContent.replace(
          'from "@/utils"',
          'from "@/shared/utils"',
        );
        fs.writeFileSync(healthControllerPath, healthControllerContent);
      }

      // Update server.ts to use shared imports
      const serverPath = path.join(serviceRoot, `src/server.${ext}`);
      if (fs.existsSync(serverPath)) {
        // Determine a single port string for this specific service.
        // Gateway should use 4000; other services use 4001, 4002, ...
        let serverPort = "3000";
        if (Array.isArray(allServices) && allServices.length) {
          if (serviceName === "gateway") {
            serverPort = "4000";
          } else {
            const idx = allServices.indexOf(serviceName);
            if (idx !== -1) {
              // Count non-gateway services before this one to compute offset
              const nonGatewayBefore = allServices
                .slice(0, idx)
                .filter((s) => s !== "gateway").length;
              serverPort = `${4001 + nonGatewayBefore}`;
            } else {
              // Fallback: assign next available port after 4000
              serverPort = `${4001 + allServices.length - 1}`;
            }
          }
        }

        let serverContent = fs.readFileSync(serverPath, "utf8");

        // Normalize imports: accept @/ or relative imports and rewrite to shared imports
        serverContent = serverContent
          .replace(
            /from\s+["'](?:@\/utils|\.\/utils|\.\.\/utils)["']/g,
            'from "@/shared/utils"',
          )
          .replace(
            /from\s+["'](?:@\/config|\.\/config|\.\.\/config)["']/g,
            'from "@/shared/config"',
          );

        // Update PORT to use service-specific environment variable and a correct default port.
        const portEnvVar = `${serviceName.toUpperCase().replace(/-/g, "_")}_PORT`;
        const portRegex = /const\s+PORT\s*=\s*ENV\.PORT\s*\|\|\s*(\d+)\s*;/;
        if (portRegex.test(serverContent)) {
          serverContent = serverContent.replace(
            portRegex,
            `const PORT = ENV.${portEnvVar} || ${serverPort};`,
          );
        } else {
          // Fallback: replace a simple numeric default or a bare PORT assignment
          const simplePortRegex = /const\s+PORT\s*=\s*(\d+)\s*;/;
          if (simplePortRegex.test(serverContent)) {
            serverContent = serverContent.replace(
              simplePortRegex,
              `const PORT = ENV.${portEnvVar} || ${serverPort};`,
            );
          } else {
            // Last resort: append a PORT assignment near the top after imports
            const importEnd = serverContent.indexOf("\n\n");
            const insertPos = importEnd === -1 ? 0 : importEnd + 2;
            const portLine = `const PORT = ENV.${portEnvVar} || ${serverPort};\n\n`;
            serverContent =
              serverContent.slice(0, insertPos) +
              portLine +
              serverContent.slice(insertPos);
          }
        }

        fs.writeFileSync(serverPath, serverContent);
      }
    }
  }

  // Update package.json
  const packageJsonPath = path.join(serviceRoot, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  // Create new package.json with name at the top
  const orderedPackageJson = {
    name: serviceName || res.sanitizedName,
    version: packageJson.version,
    description: res.description || packageJson.description,
    ...packageJson,
  };

  // Remove duplicate keys that were moved to the top
  delete orderedPackageJson.name;
  delete orderedPackageJson.version;
  delete orderedPackageJson.description;

  // Re-add them at the top in correct order
  const finalPackageJson = {
    name: serviceName || res.sanitizedName,
    version: packageJson.version,
    description: res.description || packageJson.description,
    ...orderedPackageJson,
  };

  // Add author if provided
  if (res.author) {
    finalPackageJson.author = res.author;
  }

  // Add keywords if provided
  if (res.keywords && res.keywords.trim()) {
    finalPackageJson.keywords = res.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }

  // Add --poll flag to dev script for Docker mode (fixes watch mode in Docker on Windows)
  if (res.projectType === "microservice" && res.mode === "docker") {
    if (finalPackageJson.scripts && finalPackageJson.scripts.dev) {
      finalPackageJson.scripts.dev = finalPackageJson.scripts.dev.replace(
        "ts-node-dev --respawn --transpile-only",
        "ts-node-dev --respawn --transpile-only --poll",
      );
    }
  }

  // If creating microservices, do not install workspace-level devDependencies per service
  if (res.projectType === "microservice") {
    if (finalPackageJson.devDependencies) {
      const toRemove = [
        "prettier",
        "eslint",
        "eslint-config-prettier",
        "@typescript-eslint/eslint-plugin",
        "@typescript-eslint/parser",
        "husky",
      ];
      for (const dep of toRemove) {
        if (finalPackageJson.devDependencies[dep]) {
          delete finalPackageJson.devDependencies[dep];
        }
      }

      // Remove @types/* from JavaScript services; keep for TypeScript
      if (res.language === "javascript") {
        for (const key of Object.keys(finalPackageJson.devDependencies)) {
          if (key.startsWith("@types/"))
            delete finalPackageJson.devDependencies[key];
        }
      }

      // If devDependencies becomes empty, remove the field
      if (Object.keys(finalPackageJson.devDependencies).length === 0) {
        delete finalPackageJson.devDependencies;
      }
    }
  }

  // Remove per-service prepare script (which runs husky) for microservice workspaces
  if (res.projectType === "microservice" || res.isInMicroserviceProject) {
    if (finalPackageJson.scripts && finalPackageJson.scripts.prepare) {
      delete finalPackageJson.scripts.prepare;
    }
    // Also remove per-service lint/format/check-format scripts (workspace-level tooling lives at root)
    if (finalPackageJson.scripts) {
      delete finalPackageJson.scripts.lint;
      delete finalPackageJson.scripts.format;
      delete finalPackageJson.scripts["check-format"];
      // If scripts becomes empty, remove the field
      if (Object.keys(finalPackageJson.scripts).length === 0) {
        delete finalPackageJson.scripts;
      }
    }
  }

  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(finalPackageJson, null, 2) + "\n",
  );

  // Skip installation if skipInstall is true (will be done later in batch)
  if (skipInstall) {
    return { deps, devDeps, installSucceeded: true };
  }

  // Install dependencies
  console.log(
    pc.cyan(
      `\n📦 Installing dependencies for ${serviceName || "project"}...\n`,
    ),
  );

  let installSucceeded = false;

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
    installSucceeded = true;

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
    console.error(pc.red("\n❌ Failed to install dependencies"));
    console.error(pc.dim(`\nYou can install them later by running:`));
    console.error(
      pc.cyan(`   cd ${serviceName || res.sanitizedName} && npm install`),
    );
    console.error(pc.dim("   Then run: npm run format\n"));

    // Don't exit - let the project be created anyway
    console.log(pc.cyan("⏭️  Continuing with project creation...\n"));
  }

  return { deps, devDeps, installSucceeded };
};
