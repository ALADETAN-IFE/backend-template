export const generateReadme = (config, serviceName = null) => {
  const { projectType, mode, features = [], auth, sanitizedName } = config;
  const isMicroservice = projectType === "microservice";
  const isTypeScript = config.language === "typescript";
  const languageLabel = isTypeScript ? "TypeScript" : "JavaScript";
  const monolithFileExt = isTypeScript ? "ts" : "js";
  
  let readme = `# ${serviceName || sanitizedName}\n\n`;
  
  // Description
  if (isMicroservice && serviceName) {
    readme += `A microservice for ${sanitizedName}.\n\n`;
  } else if (isMicroservice) {
    readme += `A microservices-based backend application.\n\n`;
  } else {
    readme += `A monolithic backend API application.\n\n`;
  readme += `## Architecture\n\n`;
  if (isMicroservice) {
    readme += `- **Type**: Microservice\n`;
    readme += `- **Deployment**: ${mode === "docker" ? "Docker" : "PM2"}\n`;
    readme += `- **Gateway**: Port 4000 (main entry point)\n`;
    readme += `- **Services**:\n`;
    const servicesList = (config.allServices && config.allServices.length)
      ? config.allServices
      : ["gateway", "health-service", ...(auth ? ["auth-service"] : [])];
    servicesList.forEach((service, idx) => {
      const isGateway = service === "gateway";
      const port = isGateway
        ? 4000
        : 4001 + servicesList.filter((s) => s !== "gateway" && servicesList.indexOf(s) < idx).length;
      const pretty = service
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      readme += `  - ${pretty} (port ${port})\n`;
    });
    readme += `\n`;
  } else {
    readme += `- **Type**: Monolith API\n`;
    readme += `- **Port**: 4000 (default)\n\n`;
  readme += `## Tech Stack\n\n`;
  readme += `- **Runtime**: Node.js\n`;
  readme += `- **Language**: ${languageLabel}\n`;
  readme += `- **Framework**: Express.js\n`;
  if (auth) readme += `- **Database**: MongoDB (Mongoose)\n`;
  
  if (features.length > 0 || auth) {
    readme += `- **Features**:\n`;
    if (features.includes("cors")) readme += `  - CORS\n`;
    if (features.includes("helmet")) readme += `  - Helmet (Security headers)\n`;
    if (features.includes("rate-limit")) readme += `  - Rate Limiting\n`;
    if (features.includes("morgan")) readme += `  - Morgan (HTTP logging)\n`;
    if (auth) readme += `  - Authentication (JWT)\n`;
  }
  readme += `\n`;
  
  // Getting Started
  readme += `## Getting Started\n\n`;
  readme += `### Prerequisites\n\n`;
  readme += `- Node.js (v18 or higher)\n`;
  readme += `- npm or yarn\n`;
  if (auth) readme += `- MongoDB\n`;
  if (isMicroservice && mode === "docker") readme += `- Docker & Docker Compose\n`;
  if (isMicroservice && mode === "nodocker") readme += `- PM2 (\`npm install -g pm2\`)\n`;
  readme += `\n`;
  
  // Installation
  readme += `### Installation\n\n`;
  readme += `1. Clone the repository\n`;
  readme += `\`\`\`bash\n`;
  readme += `cd ${sanitizedName}\n`;
  readme += `\`\`\`\n\n`;
  
  if (isMicroservice) {
    readme += `2. Install dependencies for all services\n`;
    readme += `\`\`\`bash\n`;
    readme += `# Install root dependencies (Husky)\n`;
    readme += `npm install\n\n`;
    readme += `# Install dependencies for each service\n`;
    readme += `cd services/gateway && npm install && cd ../..\n`;
    readme += `cd services/health-service && npm install && cd ../..\n`;
    if (auth) readme += `cd services/auth-service && npm install && cd ../..\n`;
    readme += `\`\`\`\n\n`;
  } else {
    readme += `2. Install dependencies\n`;
    readme += `\`\`\`bash\n`;
    readme += `npm install\n`;
    readme += `\`\`\`\n\n`;
  }
  
  // Environment Variables
  readme += `3. Set up environment variables\n`;
  if (isMicroservice) {
    readme += `\`\`\`bash\n`;
    readme += `# Environment variables are configured in docker-compose.yml or pm2.config.js\n`;
    readme += `# No .env files needed for individual services\n`;
    readme += `\`\`\`\n\n`;
  } else {
    readme += `\`\`\`bash\n`;
    readme += `cp .env.example .env\n`;
    readme += `\`\`\`\n\n`;
  }
  
  if (auth) {
    readme += `4. Configure your MongoDB connection and JWT secret in the \`.env\` file${isMicroservice ? "s" : ""}\n\n`;
  }
  
  // Running the Application
  readme += `## Running the Application\n\n`;
  
  if (isMicroservice && mode === "docker") {
    readme += `### With Docker\n\n`;
    readme += `\`\`\`bash\n`;
    readme += `# Start all services\n`;
    readme += `npm run dev\n\n`;
    readme += `# Start in detached mode\n`;
    readme += `npm run dev -d\n\n`;
    readme += `# Stop all services\n`;
    readme += `npm stop\n`;
    readme += `\`\`\`\n\n`;
  } else if (isMicroservice && mode === "nodocker") {
    readme += `### With PM2\n\n`;
    readme += `\`\`\`bash\n`;
    readme += `# Start all services\n`;
    readme += `pm2 start pm2.config.js\n\n`;
    readme += `# View logs\n`;
    readme += `pm2 logs\n\n`;
    readme += `# Stop all services\n`;
    readme += `pm2 stop all\n\n`;
    readme += `# Delete all services\n`;
    readme += `pm2 delete all\n`;
    readme += `\`\`\`\n\n`;
  } else {
    readme += `### Development\n\n`;
    readme += `\`\`\`bash\n`;
    readme += `npm run dev\n`;
    readme += `\`\`\`\n\n`;
    if (isTypeScript) {
      readme += `### Production\n\n`;
      readme += `\`\`\`bash\n`;
      readme += `npm run build\n`;
      readme += `npm start\n`;
      readme += `\`\`\`\n\n`;
    }
  }
  
  // API Endpoints
  readme += `## API Endpoints\n\n`;
  
  if (isMicroservice) {
    readme += `All requests go through the API Gateway at \`http://localhost:4000\`\n\n`;

    readme += `### Gateway Endpoints\n`;
    readme += `- **GET** \`/\` - API information and available endpoints\n`;
    readme += `- **GET** \`/health\` - Gateway health check\n`;

    readme += `### Health Service (Proxied through Gateway)\n`;
    readme += `- **GET** \`/api/v1/health\` - Service health check with system metrics\n`;
    readme += `  - Returns: status, uptime, timestamp, memory usage\n\n`;

    if (auth) {
      readme += `### Auth Service (Proxied through Gateway)\n`;
      readme += `- **POST** \`/api/v1/auth/register\` - Register a new user\n`;
      readme += `- **POST** \`/api/v1/auth/login\` - Login user\n\n`;
    }
    
    readme += `### Direct Service Access (Development Only)\n`;
    const directServices = (config.allServices && config.allServices.length)
      ? config.allServices
      : ["gateway", "health-service", ...(auth ? ["auth-service"] : [])];
    directServices.forEach((service) => {
      const isGateway = service === "gateway";
      const port = isGateway
        ? 4000
        : 4001 + directServices.filter((s) => s !== "gateway" && directServices.indexOf(s) < directServices.indexOf(service)).length;
      const basePath = isGateway ? `` : `/api/v1`;
      readme += `- **${service}**: \`http://localhost:${port}${basePath}\`\n`;
    });
    readme += `\n`;

    readme += "### Example Requests\n";
    readme += "```bash\n";
    readme += "# Gateway info\n";
    readme += "curl http://localhost:4000/\n\n";
    readme += "# Gateway health\n";
    readme += "curl http://localhost:4000/health\n\n";

      : ["gateway", "health-service", ...(auth ? ["auth-service"] : [])];
    exampleServices.forEach((service) => {
      if (service === "gateway") return; // gateway already covered
      const port = service === "gateway" ? 4000 : 4001 + exampleServices.filter((s) => s !== "gateway" && exampleServices.indexOf(s) < exampleServices.indexOf(service)).length;
      readme += `# ${service} (direct access)\n`;
      readme += `curl http://localhost:${port}/api/v1/health\n\n`;
    });

    if (auth && exampleServices.includes("auth-service")) {
      const authPort = 4001 + exampleServices.filter((s) => s !== "gateway" && exampleServices.indexOf(s) < exampleServices.indexOf("auth-service")).length;
      readme += "# Auth requests (through gateway)\n";
      readme += `curl -X POST http://localhost:4000/api/v1/auth/register \\\n  -H "Content-Type: application/json" \\\n  -d '{"username":"testuser","password":"password123"}'\n\n`;
      readme += `curl -X POST http://localhost:4000/api/v1/auth/login \\\n  -H "Content-Type: application/json" \\\n  -d '{"username":"testuser","password":"password123"}'\n\n`;

      readme += "# Auth requests (direct access)\n";
      readme += `curl -X POST http://localhost:${authPort}/api/v1/auth/register \\\n  -H "Content-Type: application/json" \\\n  -d '{"username":"testuser","password":"password123"}'\n\n`;
      readme += `curl -X POST http://localhost:${authPort}/api/v1/auth/login \\\n  -H "Content-Type: application/json" \\\n  -d '{"username":"testuser","password":"password123"}'\n\n`;
    }

  } else {
    readme += `Base URL: \`http://localhost:4000\`\n\n`;
    readme += `- **GET** \`/\` - Root endpoint (API info)\n`;
    readme += `- **GET** \`/api/v1/health\` - Health check\n\n`;
    
    if (auth) {
      readme += `### Authentication\n`;
      readme += `- **POST** \`/api/v1/auth/register\` - Register a new user\n`;
      readme += `- **POST** \`/api/v1/auth/login\` - Login user\n\n`;
    }

    // Example requests for monolith
    readme += "### Example Requests\n";
    readme += "```bash\n";
    readme += "# Root info\n";
    readme += "curl http://localhost:4000/\n\n";
    readme += "# Health check\n";
    readme += "curl http://localhost:4000/api/v1/health\n\n";
    if (auth) {
      readme += "# Register user\n";
      readme += `curl -X POST http://localhost:4000/api/v1/auth/register \\\n`;
      readme += `  -H \"Content-Type: application/json\" \\\n`;
      readme += `  -d '{"username":"testuser","password":"password123"}'\n\n`;
      readme += "# Login user\n";
      readme += `curl -X POST http://localhost:4000/api/v1/auth/login \\\n`;
      readme += `  -H \"Content-Type: application/json\" \\\n`;
      readme += `  -d '{"username":"testuser","password":"password123"}'\n\n`;
    }
    readme += "```\n\n";
  }
  
  // Project Structure
  readme += `## Project Structure\n\n`;
  readme += `\`\`\`\n`;
  
  if (isMicroservice) {
    readme += `${sanitizedName}/\n`;
    readme += `├── shared/              # Shared utilities across services\n`;
    readme += `│   ├── config/         # Database, environment configs\n`;
    readme += `│   └── utils/          # Logger, error handlers\n`;
    readme += `├── services/\n`;
    const projectServices = (config.allServices && config.allServices.length)
      ? config.allServices
      : ["gateway", "health-service", ...(auth ? ["auth-service"] : [])];
    projectServices.forEach((service) => {
      readme += `│   ├── ${service}/\n`;
    });
    readme += `├── ${mode === "docker" ? "docker-compose.yml" : "pm2.config.js"}\n`;
    readme += `├── .husky/             # Git hooks\n`;
    readme += `└── package.json        # Root package.json\n`;
  } else {
    readme += `${sanitizedName}/\n`;
    readme += `├── src/\n`;
    readme += `│   ├── config/         # Configuration files\n`;
    readme += `│   ├── middlewares/    # Custom middlewares\n`;
    readme += `│   ├── modules/        # Feature modules\n`;
    readme += `│   │   └── v1/         # API version 1\n`;
    if (auth) readme += `│   │       ├── auth/   # Auth module\n`;
    readme += `│   │       └── health/ # Health check\n`;
    if (auth) readme += `│   ├── models/         # Database models\n`;
    readme += `│   ├── utils/          # Utility functions\n`;
    readme += `│   ├── app.${monolithFileExt}          # Express app setup\n`;
    readme += `│   ├── routes.${monolithFileExt}       # Route definitions\n`;
    readme += `│   └── server.${monolithFileExt}       # Server entry point\n`;
    readme += `├── .husky/             # Git hooks\n`;
    readme += `├── package.json\n`;
    if (isTypeScript) {
      readme += `└── tsconfig.json\n`;
    }
  }
  readme += `\`\`\`\n\n`;
  
  // Scripts
  readme += `## Available Scripts\n\n`;
  if (isMicroservice) {
    if (mode === "docker") {
      readme += `- \`npm run dev\` - Start all services\n`;
      readme += `- \`npm stop\` - Stop all services\n`;
      readme += `- \`docker-compose logs -f [service-name]\` - View service logs\n`;
    } else {
      readme += `- \`pm2 start pm2.config.js\` - Start all services\n`;
      readme += `- \`pm2 logs\` - View all service logs\n`;
      readme += `- \`pm2 monit\` - Monitor services\n`;
      readme += `- \`pm2 stop all\` - Stop all services\n`;
    }
  } else {
    readme += `- \`npm run dev\` - Start development server with hot reload\n`;
    if (isTypeScript) {
      readme += `- \`npm run build\` - Build for production\n`;
    }
    readme += `- \`npm start\` - Start production server\n`;
    readme += `- \`npm run lint\` - Run ESLint\n`;
    readme += `- \`npm run format\` - Run Prettier\n`;
  }
  readme += `\n`;
  
  // Environment Variables
  readme += `## Environment Variables\n\n`;
  readme += `| Variable | Description | Default |\n`;
  readme += `| --- | --- | --- |\n`;
  if (isMicroservice) {
    const envServices = (config.allServices && config.allServices.length)
      ? config.allServices
      : ["gateway", "health-service", ...(auth ? ["auth-service"] : [])];
    envServices.forEach((service, idx) => {
      const isGateway = service === "gateway";
      const port = isGateway
        ? 4000
        : 4001 + envServices.filter((s) => s !== "gateway" && envServices.indexOf(s) < idx).length;
      const envVarName = `${service.toUpperCase().replace(/-/g, "_")}_PORT`;
      const description = `${service.replace(/-/g, " ")} service port`;
      readme += `| \`${envVarName}\` | ${description} | \`${port}\` |\n`;
    });
  } else {
    readme += `| \`PORT\` | Server port | \`4000\` |\n`;
  }
  readme += `| \`NODE_ENV\` | Environment | \`development\` |\n`;
  if (features.includes("cors")) {
    readme += `| \`ALLOWED_ORIGIN\` | CORS allowed origin | \`http://localhost:3000\` |\n`;
  }
  if (auth) {
    readme += `| \`MONGO_URI\` | MongoDB connection string | - |\n`;
    readme += `| \`JWT_SECRET\` | JWT secret key | - |\n`;
  }
  readme += `\n`;
  
  // Scaffold attribution
  readme += `\n`;
  readme += `## About this Scaffold\n\n`;
  readme += `This project was generated using the @ifecodes/backend-template scaffold. `;
  readme += `You can recreate or customize this scaffold using the CLI: \n\n`;
  readme += `- Run without installing (recommended): \`npx ifecodes-template\`\n`;
  readme += `- Install globally: \`npm i -g @ifecodes/backend-template\` and run \`ifecodes-template\`\n\n`;

  // License
  readme += `## License\n\n`;
  readme += `MIT\n`;

  return readme;
};
