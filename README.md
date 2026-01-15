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
│   ├── config/         # Database, environment configs
│   └── utils/          # Logger, error handlers
├── services/
│   ├── gateway/        # API Gateway (port 4000)
│   ├── health-service/ # Health checks (port 4001)
│   └── auth-service/   # Authentication (port 4002)
├── docker-compose.yml  # Docker setup (if selected)
├── pm2.config.js       # PM2 setup (if selected)
├── .husky/             # Git hooks
└── package.json        # Root package.json
```

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

## � TypeScript vs JavaScript

This CLI generates **TypeScript** projects by default but fully supports **JavaScript** through intelligent transformation:

### TypeScript (Default)

- Full type safety and IntelliSense
- Modern ECMAScript features
- Compile-time error checking
- Better tooling and refactoring support

### JavaScript

- Automatically transpiled from TypeScript templates
- Type annotations removed for cleaner code
- Dependencies adjusted (no @types packages)
- Same functionality, simpler syntax

**Note**: When selecting JavaScript, the CLI transforms the TypeScript template on-the-fly, ensuring you get a production-ready JavaScript project with all the same features.

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
GET  /              - API information
GET  /v1/health     - Health check
POST /v1/auth/register - Register user (if auth enabled)
POST /v1/auth/login    - Login user (if auth enabled)
```

### Microservice

All requests go through the API Gateway at `http://localhost:4000`

```
GET  /health        - Health service
POST /auth/register - Auth service (if enabled)
POST /auth/login    - Auth service (if enabled)
```

---

## 🔧 Environment Variables

### Basic Setup

```env
PORT=4000
NODE_ENV=development
```

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

MIT

---

## ✨ Author

**Aladetan Fortune Ifeloju (IfeCodes)**  
Full Stack Developer & TechPreneur

- GitHub: [@ALADETAN-IFE](https://github.com/ALADETAN-IFE)
- Twitter: [@IfeCodes](https://twitter.com/IfeCodes_)

---

## 🙏 Acknowledgments

Built with ❤️ for the developer community to accelerate backend development.
