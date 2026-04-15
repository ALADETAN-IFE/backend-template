# 🚀 Backend Template Generator

A powerful CLI tool to generate production-ready Node.js backend applications with Express.js. Supports both **TypeScript** and **JavaScript**, with monolith and microservice architectures, and optional features like authentication, CORS, rate limiting, and more.

---

## ✨ Features

- 🎯 **TypeScript & JavaScript Support** - Choose your preferred language
- 🏗️ **Dual Architecture** - Monolith or Microservice
- 🐳 **Docker Ready** - Containerized microservices
- ⚡ **PM2 Support** - Process management for production
- 🔐 **JWT Authentication** - Built-in auth with MongoDB
- 🛡️ **Security First** - CORS, Helmet, Rate Limiting
- 📝 **Professional Logging** - Morgan + Winston
- 🎨 **Colored CLI** - Beautiful Vite-like terminal output
- 📋 **Project Metadata** - Description, author, and keywords support

---

## 📦 Installation & Usage

### Quick Start

```bash
npx @ifecodes/backend-template my-project
```

Or install globally:

```bash
npm install -g @ifecodes/backend-template
ifecodes-template my-project
```

### With Arguments

```bash
# Create a monolith
npx @ifecodes/backend-template my-api mono

# Create a microservice
npx @ifecodes/backend-template my-project micro
```

---

## 🧠 Interactive Setup

When you run the CLI, you'll be prompted to choose:

### 1. **Language**

- **TypeScript** (default) - Full type safety and modern tooling
- **JavaScript** - Transpiled from TypeScript for simplicity

### 2. **Project Metadata**

- **Description** - Project description for package.json
- **Author** - Your name or organization
- **Keywords** - Comma-separated keywords for discoverability

### 3. **Project Type**

- **Monolith API** - Traditional single-server architecture
- **Microservice** - Distributed services with API Gateway

### 4. **Deployment Mode** (Microservices only)

- **Docker** - Container-based deployment with docker-compose
- **PM2** - Process manager for Node.js applications

### 5. **Optional Features**

- ✅ **CORS** - Cross-Origin Resource Sharing
- ✅ **Helmet** - Security headers middleware
- ✅ **Rate Limiting** - API request throttling
- ✅ **Morgan** - HTTP request logger

### 6. **Authentication**

- ✅ **JWT Authentication** with MongoDB
- Choose between **bcrypt** (recommended for Windows) or **argon2** for password hashing

---

## 🗂 Project Structure

### Monolith

```
my-backend/
├── src/
│   ├── config/         # Configuration files
│   ├── middlewares/    # Custom middlewares
│   ├── modules/        # Feature modules
│   │   └── v1/         # API version 1
│   │       ├── auth/   # Auth module (if enabled)
│   │       └── health/ # Health check
│   ├── models/         # Database models (if auth)
│   ├── utils/          # Utility functions
│   ├── app.ts          # Express app setup
│   ├── routes.ts       # Route definitions
│   └── server.ts       # Server entry point
├── .husky/             # Git hooks
├── .env                # Environment variables
├── package.json
└── tsconfig.json
```

### Microservice

```
my-project/
├── shared/              # Shared utilities across services
│   ├── config/         # Environment configs (db.ts only if auth enabled)
│   └── utils/          # Logger, error handlers
├── services/
│   ├── gateway/        # API Gateway (port 4000)
│   ├── health-service/ # Health checks (port 4001)
│   └── auth-service/   # Authentication (port 4002, if enabled)
├── docker-compose.yml  # Docker setup (if selected)
├── pm2.config.js       # PM2 setup (if selected)
├── .env                # Root environment variables
├── .gitignore          # Git ignore (includes .env and node_modules)
├── tsconfig.json       # Root TypeScript config with project references
├── .husky/             # Git hooks
└── package.json        # Root package.json
```

**Note**: Each microservice does NOT have its own `.env` file. Environment variables are managed at the root level through `docker-compose.yml` or `pm2.config.js`.

---

## ▶️ Running the Application

### Monolith

```bash
cd my-backend

# Development
npm run dev

# Production
npm run build
npm start
```

### Microservice (Docker)

```bash
cd my-project

# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Microservice (PM2)

```bash
cd my-project

# Start all services
pm2 start pm2.config.js

# View logs
pm2 logs

# Monitor services
pm2 monit

# Stop all services
pm2 stop all
```

---

## 🛠 Tech Stack

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript or JavaScript
- **Framework**: Express.js
- **Database**: MongoDB (with Mongoose, if auth enabled)
- **Authentication**: JWT + bcrypt/argon2
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan, Custom Logger
- **Git Hooks**: Husky
- **Deployment**: Docker or PM2

---

## TypeScript vs JavaScript

This CLI generates **TypeScript** projects by default but also includes explicit **JavaScript** templates. There is no fragile, on-the-fly TypeScript → JavaScript transform at runtime — the project templates include language-specific variants so the output is predictable and parseable in Node.js.

### TypeScript (Default)

- Full type safety and IntelliSense
- Modern ECMAScript features
- Compile-time error checking
- Better tooling and refactoring support

### JavaScript

- Pre-authored JavaScript (CommonJS) templates are included
- No TypeScript annotations remain in generated `.js` files
- DevDependencies that are TypeScript-only are omitted for JS projects
- Same functionality with simpler runtime setup

---

## 🌟 Features

### ✅ Smart Defaults

- Auto-generates README with project-specific instructions
- Creates `.env` from `.env.example` with default values
- Configures TypeScript paths for clean imports (`@/config`, `@/utils`)
- Project metadata (description, author, keywords) in package.json

### ✅ Microservice Architecture

- **API Gateway** on port 4000 (single entry point)
- **Service Discovery** - Automatically routes to correct service
- **Shared Folder** - Common utilities across all services
- **Health Checks** - Built-in monitoring endpoints

### ✅ Developer Experience

- **Hot Reload** - Development server with nodemon
- **ESLint** - Code quality enforcement
- **Git Hooks** - Pre-commit linting with Husky
- **Type Safety** - Full TypeScript support

---

## 📡 API Endpoints

### Monolith

```
GET  /                  - API information
GET  /api/v1/health     - Health check
POST /api/v1/auth/register - Register user (if auth enabled)
POST /api/v1/auth/login    - Login user (if auth enabled)
```

### Microservice

All requests go through the API Gateway at `http://localhost:4000`

```
GET  /health            - Gateway health check
GET  /api/v1/health     - Health service check
POST /api/v1/auth/register - Auth service (if enabled)
POST /api/v1/auth/login    - Auth service (if enabled)
```

---

## 🔧 Environment Variables

### Monolith

```env
PORT=4000
NODE_ENV=development
```

### Microservice (Root .env)

```env
NODE_ENV=development

# Gateway Service
GATEWAY_PORT=4000

# Health Service  
HEALTH_SERVICE_PORT=4001

# Auth Service (if enabled)
AUTH_SERVICE_PORT=4002
```

**Note**: Microservices use environment variables from `docker-compose.yml` or `pm2.config.js`. Individual services don't have `.env` files.

### With CORS

```env
ALLOWED_ORIGIN=http://localhost:3000
```

### With Authentication

```env
MONGO_URI=mongodb://localhost:27017/your-database-name
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

---

## 🚀 Adding Services (Microservice)

You can add more services to an existing microservice project:

```bash
cd my-project
npx @ifecodes/backend-template

# You'll be prompted to name the new service
# Example: user-service, order-service, etc.
```

The CLI will:

- Create the new service
- Update `docker-compose.yml` or `pm2.config.js`
- Configure routing in the API Gateway

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

### Development

```bash
git clone https://github.com/ALADETAN-IFE/backend-template.git
cd backend-template
npm install
npm link
```

---

## 📄 License

Apache License 2.0

Copyright © 2026 Aladetan Fortune Ifeloju (IfeCodes)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this project except in compliance with the License.
You may obtain a copy of the License at:

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

---

## ✨ Author

**Aladetan Fortune Ifeloju (IfeCodes)**  
Full-Stack Developer & TechPreneur  

- GitHub: [@ALADETAN-IFE](https://github.com/ALADETAN-IFE)  
- Portfolio: [IFECODES](https://ifecodes.xyz)
- Twitter/X: [@IfeCodes](https://twitter.com/IfeCodes_)
- LinkedIn: [Aladetan Fortune Ife](https://www.linkedin.com/in/fortune-ife-aladetan-458ab136a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app)

---

## 🙏 Acknowledgments

Built with ❤️ for the developer community to accelerate backend development.

Special thanks to contributors and organizations who adopt, extend, and support this project while respecting its license and attribution.
