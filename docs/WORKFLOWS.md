WORKFLOWS — User Guide

Purpose
- A concise guide for users of the project generator. It explains what each workflow produces and which choices affect the resulting project, without exposing internal implementation files.

How to run the generator
- Run the project generator and answer the interactive prompts. You will be asked:
  - Project name
  - Language: TypeScript or JavaScript
  - Project type: Monolith or Microservice
  - (If Microservice) Mode: Docker or PM2 (nodocker)
  - Features: choose any of CORS, Rate Limiter, Helmet, Morgan
  - Include authentication? (yes/no)
  - Is this a team or individual project?
  - If authentication: choose password hasher (bcrypt or argon2)

What each choice produces
- Monolith
  - Single-application scaffold containing `src/`, a `package.json`, and environment examples.
  - If authentication is enabled, the scaffold includes auth routes, models, JWT helpers, and database connection wiring. Otherwise DB wiring is removed.
  - README and `.env.example` are generated to match the chosen options and language.
  - If the project is marked as team-based, a starter GitHub Actions CI/CD workflow is included under `.github/workflows/`.

- Microservice workspace
  - Creates a monorepo-like structure with a `shared/` folder (shared config & utils) and `services/` for individual services (gateway, health, and optionally auth).
  - If Docker mode is chosen, a `docker-compose.yml` and per-service Dockerfiles are included. If PM2 mode is chosen, PM2 config is included instead.
  - A root `.env` and `.env.example` with one port per service is generated.

- Authentication (yes/no)
  - No: no auth controllers/models, DB connection removed from generated code, no JWT env vars.
  - Yes: auth controllers, routes, user model, JWT helper, and DB connect logic are added; generated `.env.example` includes `MONGO_URI` and `JWT_SECRET`.

- Password hasher (bcrypt vs argon2)
  - `bcrypt`: adds bcrypt dependency and hashing helpers using `bcrypt.hash`/`bcrypt.compare`. Recommended default on Windows.
  - `argon2`: adds argon2 dependency and helpers using argon2 API. Recommended default on non-Windows.

- Docker vs PM2 (nodocker)
  - Docker: includes `docker-compose.yml`, Dockerfiles, and Docker-focused run instructions in the README (`docker build`, `docker-compose up`).
  - PM2: includes PM2 configuration and README instructions for starting services under PM2.

- JavaScript vs TypeScript
  - JavaScript: no build step required; sources are `.js`. `package.json` uses Node native import mappings.
  - TypeScript: includes `tsconfig.json` and build scripts (`tsc`); generated files use `.ts` and type annotations.

Dynamic README
- The generator creates a README tailored to your selections. It includes:
  - How to install and run (language-appropriate commands)
  - Docker or PM2 run instructions depending on mode
  - Environment variables required (including JWT and DB when auth is enabled)
  - Environment validation notes and request tracing/HTTP logging defaults
  - CI/CD starter workflow for team projects; skipped for individual projects
  - Notes about chosen features and any platform-specific recommendations (e.g., hasher choice on Windows)

Quick reference — produced files you will see
- `README.md` — customized for your choices
- `.env` / `.env.example` — includes service ports and auth/DB vars when relevant
- `docker-compose.yml` + `Dockerfile` per service (only for Docker mode)
- `pm2.config.js` or similar (only for PM2 mode)
- `services/` and/or `shared/` when creating microservices

Need more detail?
- I can expand this into a checklist that lists exact files created per option (JS vs TS and per-feature file lists), or export the matrix as CSV. Which would you prefer?
