# Backend Dockerfile

FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install ALL dependencies (including devDependencies for build)
RUN if [ -f pnpm-lock.yaml ]; then \
  pnpm install --frozen-lockfile; \
  else \
  pnpm install; \
  fi

COPY . .

# Build TypeScript (using pnpm exec to ensure correct binary resolution)
RUN pnpm exec tsc

FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies (use --frozen-lockfile only if lockfile exists)
RUN if [ -f pnpm-lock.yaml ]; then \
  pnpm install --frozen-lockfile --prod; \
  else \
  pnpm install --prod; \
  fi

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database/migrations ./src/database/migrations
COPY --from=builder /app/src/database/runMigrations.js ./src/database/runMigrations.js
COPY docker-entrypoint.sh ./

EXPOSE 3001

# Run migrations automatically on startup
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]

