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
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GENERATOR_LIVE
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GENERATOR_LIVE=$NEXT_PUBLIC_GENERATOR_LIVE
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY . .
WORKDIR /app/packages/db
RUN pnpm prisma generate
WORKDIR /app
RUN pnpm --filter web build

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl ca-certificates
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
# Next.js standalone does not bundle Prisma's native engine; copy it so Alpine (linux-musl-openssl-3.0.x) can load it.
RUN mkdir -p /app/node_modules/.prisma/client
COPY --from=builder /app/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client/ /app/node_modules/.prisma/client/
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
