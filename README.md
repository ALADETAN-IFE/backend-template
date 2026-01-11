# 🚀 Backend Template Generator

A powerful CLI tool to generate production-ready Node.js + TypeScript backend applications with Express.js. Supports both monolith and microservice architectures with optional features like authentication, CORS, rate limiting, and more.

---

## 📦 Installation & Usage

### Quick Start

```bash
npx backend-template my-project
```

Or install globally:

```bash
npm install -g backend-template
backend-template my-project
```

### With Arguments

```bash
# Create a monolith
npx backend-template my-api mono

# Create a microservice
npx backend-template my-project micro
```

---

## 🧠 Interactive Setup

When you run the CLI, you'll be prompted to choose:

### 1. **Project Type**
- **Monolith API** - Traditional single-server architecture
- **Microservice** - Distributed services with API Gateway

### 2. **Deployment Mode** (Microservices only)
- **Docker** - Container-based deployment with docker-compose
- **PM2** - Process manager for Node.js applications

### 3. **Optional Features**
- ✅ **CORS** - Cross-Origin Resource Sharing
- ✅ **Helmet** - Security headers middleware
- ✅ **Rate Limiting** - API request throttling
- ✅ **Morgan** - HTTP request logger

### 4. **Authentication**
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
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (with Mongoose, if auth enabled)
- **Authentication**: JWT + bcrypt/argon2
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan, Custom Logger
- **Git Hooks**: Husky
- **Deployment**: Docker or PM2

---

## 🌟 Features

### ✅ Smart Defaults
- Auto-generates README with project-specific instructions
- Creates `.env` from `.env.example` with default values
- Configures TypeScript paths for clean imports (`@/config`, `@/utils`)

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
npx backend-template

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
