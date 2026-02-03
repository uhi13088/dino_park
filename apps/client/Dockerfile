# ================================
# Dino Park Tycoon - Client
# Multi-stage build for production
# ================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/client/package.json ./apps/client/
COPY packages/shared/package.json ./packages/shared/
COPY packages/game-data/package.json ./packages/game-data/

RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/client/node_modules ./apps/client/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/game-data/node_modules ./packages/game-data/node_modules

COPY . .

# Build shared packages and client
RUN pnpm --filter @dino-park/shared build
RUN pnpm --filter @dino-park/game-data build
RUN pnpm --filter @dino-park/client build

# Stage 3: Runner (Nginx)
FROM nginx:alpine AS runner

# Copy nginx config
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
