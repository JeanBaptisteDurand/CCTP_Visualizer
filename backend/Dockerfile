# Backend Dockerfile

FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database/migrations ./src/database/migrations
COPY --from=builder /app/src/database/runMigrations.js ./src/database/runMigrations.js
COPY docker-entrypoint.sh ./

EXPOSE 3001

# Run migrations automatically on startup
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]

