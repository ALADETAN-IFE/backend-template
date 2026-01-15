import fs from "fs";
import path from "path";
import prompts from "prompts";
import pc from "picocolors";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

// Helper function to get the correct file extension (.ts or .js)
function getFileExtension(dir) {
  // Check if .ts files exist, otherwise use .js
  const sampleFiles = ['src/app.ts', 'src/server.ts', 'src/routes.ts'];
  for (const file of sampleFiles) {
    const tsPath = path.join(dir, file);
    if (fs.existsSync(tsPath)) return 'ts';
    const jsPath = path.join(dir, file.replace('.ts', '.js'));
    if (fs.existsSync(jsPath)) return 'js';
  }
  return 'ts'; // default to ts
}

export const setupService = async (
  res,
  serviceName,
  serviceRoot,
  shouldIncludeAuth,
  allServices = []
) => {
  let imports = [];
  let middlewares = [];
  let deps = [];
  let devDeps = [];
  let v1Imports = [];
  let v1Routes = [];
  
  // Detect file extension (ts or js)
  const ext = getFileExtension(serviceRoot);

  // Special handling for gateway service
  if (serviceName === "gateway") {
    const gatewayModule = await import("../../template/gateway/inject.js");
    deps.push(...gatewayModule.gatewayDeps);

    // Copy gateway-specific files
    const gatewayAppPath = path.join(serviceRoot, `src/app.${ext}`);
    const gatewayServerPath = path.join(serviceRoot, `src/server.${ext}`);
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    const gatewayAppContent = fs.readFileSync(
      path.join(__dirname, "../../template/gateway/app.ts"),
      "utf8"
    );
    const gatewayServerContent = fs.readFileSync(
      path.join(__dirname, "../../template/gateway/server.ts"),
      "utf8"
    );

    // Generate routes for all services
    const routes = gatewayModule.generateGatewayRoutes(allServices);
    const finalAppContent = gatewayAppContent.replace("/*__ROUTES__*/", routes);

    fs.writeFileSync(gatewayAppPath, finalAppContent);
    fs.writeFileSync(gatewayServerPath, gatewayServerContent);

    // Remove unnecessary files for gateway
    const routesPath = path.join(serviceRoot, `src/routes.${ext}`);
    const modulesPath = path.join(serviceRoot, "src/modules");
    const middlewaresPath = path.join(serviceRoot, "src/middlewares");

    if (fs.existsSync(routesPath)) fs.rmSync(routesPath);
    if (fs.existsSync(modulesPath)) fs.rmSync(modulesPath, { recursive: true });
    if (fs.existsSync(middlewaresPath))
      fs.rmSync(middlewaresPath, { recursive: true });
  } else {
    // Regular service setup (existing code)
    // Add features (only for monolith or health-service)
    if (res.projectType === "monolith" || serviceName === "health-service") {
      for (const f of res.features) {
        const feature = await import(`../../template/features/${f}/inject.js`);
        imports.push(feature.imports);
        middlewares.push(feature.middleware);
        deps.push(...feature.deps);
        if (feature.devDeps) {
          devDeps.push(...feature.devDeps);
        }
      }
    }

    // Add authentication (only for monolith or auth-service)
    if (shouldIncludeAuth && res.auth) {
      const baseAuth = await import(
        "../../template/features/auth/base/inject.js"
      );
      deps.push(...baseAuth.deps);
      if (baseAuth.devDeps) {
        devDeps.push(...baseAuth.devDeps);
      }

      for (const file in baseAuth.files) {
        const fullPath = path.join(serviceRoot, file);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, baseAuth.files[file]);
      }

      const algo = await prompts({
        type: "select",
        name: "hasher",
        message: `Password hashing method${
          serviceName ? ` for ${serviceName}` : ""
        }`,
        choices: [
          { 
            title: process.platform === "win32" 
              ? "bcrypt (recommended for Windows)" 
              : "argon2 (recommended)", 
            value: process.platform === "win32" ? "bcrypt" : "argon2" 
          },
          { 
            title: process.platform === "win32" 
              ? "argon2 (requires build tools)" 
              : "bcrypt", 
            value: process.platform === "win32" ? "argon2" : "bcrypt" 
          },
        ],
      });

      const hashFeature = await import(
        `../../template/features/auth/${algo.hasher}/inject.js`
      );
      deps.push(...hashFeature.deps);
      if (hashFeature.devDeps) {
        devDeps.push(...hashFeature.devDeps);
      }

      for (const file in hashFeature.files) {
        const fullPath = path.join(serviceRoot, file);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, hashFeature.files[file]);
      }

      v1Imports.push(baseAuth.imports);
      v1Routes.push(baseAuth.middleware);
    }

    // Update app file
    const appPath = path.join(serviceRoot, `src/app.${ext}`);
    let content = fs.readFileSync(appPath, "utf8");
    content = content.replace("/*__IMPORTS__*/", imports.join("\n"));
    content = content.replace("/*__MIDDLEWARE__*/", middlewares.join("\n"));
    fs.writeFileSync(appPath, content);

    // Update root endpoint middleware with project info
    const rootMiddlewarePath = path.join(serviceRoot, `src/middlewares/root.middleware.${ext}`);
    if (fs.existsSync(rootMiddlewarePath)) {
      let rootContent = fs.readFileSync(rootMiddlewarePath, "utf8");
      rootContent = rootContent.replace("/*__PROJECT_NAME__*/", serviceName || res.sanitizedName);
      rootContent = rootContent.replace("/*__PROJECT_TYPE__*/", res.projectType);
      
      // Add auth endpoint if auth is enabled
      if (shouldIncludeAuth && res.auth) {
        rootContent = rootContent.replace(
          "/*__AUTH_ENDPOINT__*/",
          'auth: "/v1/auth",'
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
            "import { ENV } from '@/config';\n/*__IMPORTS__*/"
          );
          fs.writeFileSync(appPath, appContent);
        }
      }
      
      // Add ALLOWED_ORIGIN if CORS is selected
      if (res.features && res.features.includes("cors")) {
        envContent = envContent.replace(
          "/*__ALLOWED_ORIGIN__*/",
          'ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN!,'
        );
      } else {
        envContent = envContent.replace("/*__ALLOWED_ORIGIN__*/", "");
      }
      
      // Add MONGO_URI if auth is enabled
      if (shouldIncludeAuth && res.auth) {
        envContent = envContent.replace(
          "/*__MONGO_URI__*/",
          'MONGO_URI: process.env.MONGO_URI!,'
        );
        envContent = envContent.replace(
          "/*__JWT_SECRET__*/",
          'JWT_SECRET: process.env.JWT_SECRET!,'
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
        serverContent = serverContent.replace(
          "/*__DB_IMPORT__*/",
          'import { connectDB } from "./config";'
        );
        serverContent = serverContent.replace(
          "/*__DB_CONNECT__*/",
          `// Connect to MongoDB
await connectDB();`
        );
      } else {
        serverContent = serverContent.replace("/*__DB_IMPORT__*/", "");
        serverContent = serverContent.replace("/*__DB_CONNECT__*/", "");
      }
      
      fs.writeFileSync(serverPath, serverContent);
    }
    
    // Update .env.example to conditionally include environment variables
    const envExamplePath = path.join(serviceRoot, ".env.example");
    if (fs.existsSync(envExamplePath)) {
      let envExampleContent = fs.readFileSync(envExamplePath, "utf8");
      
      // Add ALLOWED_ORIGIN if CORS is selected
      if (res.features && res.features.includes("cors")) {
        envExampleContent = envExampleContent.replace(
          "/*__ALLOWED_ORIGIN_ENV__*/",
          'ALLOWED_ORIGIN=http://localhost:3000'
        );
      } else {
        envExampleContent = envExampleContent.replace("/*__ALLOWED_ORIGIN_ENV__*/", "");
      }
      
      // Add MONGO_URI and JWT_SECRET if auth is enabled
      if (shouldIncludeAuth && res.auth) {
        envExampleContent = envExampleContent.replace(
          "/*__MONGO_URI_ENV__*/",
          'MONGO_URI=mongodb://localhost:27017/your-database-name'
        );
        envExampleContent = envExampleContent.replace(
          "/*__JWT_SECRET_ENV__*/",
          'JWT_SECRET=your-super-secret-jwt-key-change-this-in-production'
        );
      } else {
        envExampleContent = envExampleContent.replace("/*__MONGO_URI_ENV__*/", "");
        envExampleContent = envExampleContent.replace("/*__JWT_SECRET_ENV__*/", "");
      }
      
      fs.writeFileSync(envExamplePath, envExampleContent);
    }
  } // End of else block for non-gateway services

  // Update tsconfig.json for microservices to support @/ alias with shared folder
  if (res.projectType === "microservice") {
    const tsconfigPath = path.join(serviceRoot, "tsconfig.json");
    let tsconfigContent = fs.readFileSync(tsconfigPath, "utf8");
    
    // Remove comments from JSON (strip-json-comments approach)
    tsconfigContent = tsconfigContent
      .replace(/\/\/.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    
    const tsconfig = JSON.parse(tsconfigContent);

    // Update paths to include shared folder
    tsconfig.compilerOptions.paths = {
      "@/*": ["*"],
      "@/config/*": ["../../shared/config/*"],
      "@/utils/*": ["../../shared/utils/*"],
    };

    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + "\n");
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
    finalPackageJson.keywords = res.keywords.split(',').map(k => k.trim()).filter(Boolean);
  }
  
  // Add Node.js native path aliasing for JavaScript projects
  // This replaces TypeScript's tsconfig paths with Node's native imports field
  if (res.language === 'javascript') {
    finalPackageJson.imports = {
      "#/*": "./src/*"
    };
  }
  
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(finalPackageJson, null, 2) + "\n"
  );

  // Install dependencies
  console.log(
    pc.cyan(`\n📦 Installing dependencies for ${serviceName || "project"}...\n`)
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
      console.warn(pc.yellow("⚠️  Warning: Code formatting failed. You can run it manually later with: npm run format\n"));
    }
  } catch (error) {
    console.error(pc.yellow("\n⚠️  Warning: Some dependencies failed to install."));
    console.error(pc.yellow("This is usually due to native modules (like argon2) requiring build tools.\n"));
    console.error(pc.cyan("💡 Solutions:"));
    console.error(pc.dim("   1. Install build tools: npm install --global windows-build-tools"));
    console.error(pc.dim("   2. Or switch to bcrypt (works better on Windows)"));
    console.error(pc.dim("   3. Or manually install later: cd " + (serviceName || res.sanitizedName) + " && npm install"));
    console.error(pc.dim("   4. Then run: npm run format\n"));
    
    // Don't exit - let the project be created anyway
    console.log(pc.cyan("⏭️  Continuing with project creation...\n"));
  }

  return { deps, installSucceeded };
};
