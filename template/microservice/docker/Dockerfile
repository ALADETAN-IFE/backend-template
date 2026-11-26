# syntax=docker/dockerfile:1

# ---- base ----
FROM node:24-slim AS base
WORKDIR /app
RUN chown node:node /app
RUN npm install --global corepack@latest && corepack enable

# ---- dev: used by docker-compose ----
FROM base AS dev
ARG SERVICE_NAME
ARG PACKAGE_MANAGER=npm
RUN if [ "$PACKAGE_MANAGER" = "bun" ]; then npm install --global bun; fi
USER node
COPY --chown=node:node services/${SERVICE_NAME}/ ./
RUN if [ "$PACKAGE_MANAGER" = "pnpm" ]; then \
      if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile --ignore-scripts; else pnpm install --ignore-scripts; fi; \
    elif [ "$PACKAGE_MANAGER" = "yarn" ]; then \
      if [ -f yarn.lock ]; then yarn install --frozen-lockfile --ignore-scripts; else yarn install --ignore-scripts; fi; \
    elif [ "$PACKAGE_MANAGER" = "bun" ]; then \
      if [ -f bun.lock ] || [ -f bun.lockb ]; then bun install --frozen-lockfile; else bun install; fi; \
    elif [ -f package-lock.json ]; then \
      npm ci --ignore-scripts; \
    else \
      npm install --ignore-scripts; \
    fi
COPY --chown=node:node shared ./shared
CMD ["npm", "run", "dev"]

# ---- build: compiles TypeScript and is a no-op for JavaScript ----
FROM dev AS build
RUN npm run build --if-present
RUN npm prune --omit=dev --ignore-scripts

# ---- prod: deployable image ----
FROM base AS prod
ENV NODE_ENV=production
USER node
COPY --chown=node:node --from=build /app ./
CMD ["npm", "start"]
