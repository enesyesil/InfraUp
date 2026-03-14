FROM node:20-bookworm-slim AS base
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
RUN pnpm install --frozen-lockfile

FROM base AS builder
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY . .
WORKDIR /app/packages/db
RUN pnpm prisma generate
WORKDIR /app
RUN pnpm --filter web build

FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/apps/web/out /usr/share/nginx/html
EXPOSE 80
