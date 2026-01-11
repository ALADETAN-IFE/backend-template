import fs from "fs";
import path from "path";

export const generateReadme = (config, serviceName = null) => {
  const { projectType, mode, features = [], auth, sanitizedName } = config;
  const isMonolith = projectType === "monolith";
  const isMicroservice = projectType === "microservice";
  
  let readme = `# ${serviceName || sanitizedName}\n\n`;
  
  // Description
  if (isMicroservice && serviceName) {
    readme += `A microservice for ${sanitizedName}.\n\n`;
  } else if (isMicroservice) {
    readme += `A microservices-based backend application.\n\n`;
  } else {
    readme += `A monolithic backend API application.\n\n`;
  }
  
  // Architecture
  readme += `## Architecture\n\n`;
  if (isMicroservice) {
    readme += `- **Type**: Microservice\n`;
    readme += `- **Deployment**: ${mode === "docker" ? "Docker" : "PM2"}\n`;
    readme += `- **Gateway**: Port 4000 (main entry point)\n`;
    readme += `- **Services**:\n`;
    readme += `  - Gateway (port 4000)\n`;
    readme += `  - Health Service (port 4001)\n`;
    if (auth) readme += `  - Auth Service (port 4002)\n`;
    readme += `\n`;
  } else {
    readme += `- **Type**: Monolith API\n`;
    readme += `- **Port**: 4000 (default)\n\n`;
  }
  
  // Tech Stack
  readme += `## Tech Stack\n\n`;
  readme += `- **Runtime**: Node.js\n`;
  readme += `- **Language**: TypeScript\n`;
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
  readme += `\`\`\`bash\n`;
  if (isMicroservice) {
    readme += `# Copy .env.example to .env in each service\n`;
    readme += `cp services/gateway/.env.example services/gateway/.env\n`;
    readme += `cp services/health-service/.env.example services/health-service/.env\n`;
    if (auth) readme += `cp services/auth-service/.env.example services/auth-service/.env\n`;
  } else {
    readme += `cp .env.example .env\n`;
  }
  readme += `\`\`\`\n\n`;
  
  if (auth) {
    readme += `4. Configure your MongoDB connection and JWT secret in the \`.env\` file${isMicroservice ? "s" : ""}\n\n`;
  }
  
  // Running the Application
  readme += `## Running the Application\n\n`;
  
  if (isMicroservice && mode === "docker") {
    readme += `### With Docker\n\n`;
    readme += `\`\`\`bash\n`;
    readme += `# Start all services\n`;
    readme += `docker-compose up\n\n`;
    readme += `# Start in detached mode\n`;
    readme += `docker-compose up -d\n\n`;
    readme += `# Stop all services\n`;
    readme += `docker-compose down\n`;
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
    readme += `### Production\n\n`;
    readme += `\`\`\`bash\n`;
    readme += `npm run build\n`;
    readme += `npm start\n`;
    readme += `\`\`\`\n\n`;
  }
  
  // API Endpoints
  readme += `## API Endpoints\n\n`;
  
  if (isMicroservice) {
    readme += `All requests go through the API Gateway at \`http://localhost:4000\`\n\n`;
    readme += `### Health Service\n`;
    readme += `- **GET** \`/health\` - Health check\n\n`;
    
    if (auth) {
      readme += `### Auth Service\n`;
      readme += `- **POST** \`/auth/register\` - Register a new user\n`;
      readme += `- **POST** \`/auth/login\` - Login user\n\n`;
    }
  } else {
    readme += `Base URL: \`http://localhost:4000\`\n\n`;
    readme += `- **GET** \`/\` - Root endpoint (API info)\n`;
    readme += `- **GET** \`/v1/health\` - Health check\n\n`;
    
    if (auth) {
      readme += `### Authentication\n`;
      readme += `- **POST** \`/v1/auth/register\` - Register a new user\n`;
      readme += `- **POST** \`/v1/auth/login\` - Login user\n\n`;
    }
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
    readme += `│   ├── gateway/        # API Gateway (port 4000)\n`;
    readme += `│   ├── health-service/ # Health checks (port 4001)\n`;
    if (auth) readme += `│   └── auth-service/   # Authentication (port 4002)\n`;
    else readme += `│   └── ...\n`;
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
    readme += `│   ├── app.ts          # Express app setup\n`;
    readme += `│   ├── routes.ts       # Route definitions\n`;
    readme += `│   └── server.ts       # Server entry point\n`;
    readme += `├── .husky/             # Git hooks\n`;
    readme += `├── package.json\n`;
    readme += `└── tsconfig.json\n`;
  }
  readme += `\`\`\`\n\n`;
  
  // Scripts
  readme += `## Available Scripts\n\n`;
  if (isMicroservice) {
    if (mode === "docker") {
      readme += `- \`docker-compose up\` - Start all services\n`;
      readme += `- \`docker-compose down\` - Stop all services\n`;
      readme += `- \`docker-compose logs -f [service-name]\` - View service logs\n`;
    } else {
      readme += `- \`pm2 start pm2.config.js\` - Start all services\n`;
      readme += `- \`pm2 logs\` - View all service logs\n`;
      readme += `- \`pm2 monit\` - Monitor services\n`;
      readme += `- \`pm2 stop all\` - Stop all services\n`;
    }
  } else {
    readme += `- \`npm run dev\` - Start development server with hot reload\n`;
    readme += `- \`npm run build\` - Build for production\n`;
    readme += `- \`npm start\` - Start production server\n`;
    readme += `- \`npm run lint\` - Run ESLint\n`;
    readme += `- \`npm run format\` - Run Prettier\n`;
  }
  readme += `\n`;
  
  // Environment Variables
  readme += `## Environment Variables\n\n`;
  readme += `| Variable | Description | Default |\n`;
  readme += `|----------|-------------|---------||\n`;
  readme += `| \`PORT\` | Server port | \`4000\` |\n`;
  readme += `| \`NODE_ENV\` | Environment | \`development\` |\n`;
  if (features.includes("cors")) {
    readme += `| \`ALLOWED_ORIGIN\` | CORS allowed origin | \`http://localhost:3000\` |\n`;
  }
  if (auth) {
    readme += `| \`MONGO_URI\` | MongoDB connection string | - |\n`;
    readme += `| \`JWT_SECRET\` | JWT secret key | - |\n`;
  }
  readme += `\n`;
  
  // License
  readme += `## License\n\n`;
  readme += `MIT\n`;
  
  return readme;
};
