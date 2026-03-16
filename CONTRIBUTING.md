# Contributing

This repo is a pnpm/Turborepo monorepo with three main workflows:

- `web`: Next.js catalog and app detail pages in `apps/web`
- `generator`: Go API and registry sync tools in `apps/generator`
- `db`: Prisma schema and client in `packages/db`

## Quick Start

1. Install dependencies: `pnpm install`
2. Copy env defaults: `cp .env.example .env.local`
3. Start Postgres: `docker compose up -d postgres`
4. Generate Prisma client: `pnpm db:generate`
5. Apply schema: `pnpm db:push`
6. Seed the database from the registry: `pnpm sync`
7. Start the full local stack: `pnpm dev`

Expected local services:

- Web: `http://localhost:3000`
- API: `http://localhost:8080`
- Postgres: `localhost:5433`

## File Map

- `apps/web/app`: Next.js routes
- `apps/web/components/site`: site UI components
- `apps/web/lib/db.ts`: Prisma-backed web queries
- `apps/web/lib/mdx.ts`: registry content loading
- `apps/generator/cmd/api`: waitlist API and health endpoint
- `apps/generator/cmd/sync`: registry-to-DB sync
- `packages/db/prisma/schema.prisma`: Prisma schema
- `registry/apps`: app definitions
- `registry/dependencies`: dependency definitions
- `registry/content`: MDX content

## Core Commands

- `pnpm dev`: start web and API together
- `pnpm dev:web`: start only the web app
- `pnpm dev:api`: start only the Go API
- `pnpm sync`: load registry data into Postgres
- `pnpm db:generate`: regenerate the Prisma client
- `pnpm db:push`: apply the schema to the configured database
- `pnpm check`: regenerate Prisma, sync registry data, run Go tests, and build the web app
- `pnpm --filter generator test`: run Go tests only
- `pnpm --filter web build`: run the production web build only

## Definitions Of Done

### Registry changes

Touching `registry/apps` or `registry/dependencies` is done when:

- `pnpm sync` succeeds
- the affected app page renders the expected dependency/image data
- `pnpm --filter generator test` still passes

### Prisma or DB contract changes

Touching `packages/db/prisma/schema.prisma` is done when:

- `pnpm db:generate` succeeds
- `pnpm db:push` succeeds against a reachable Postgres instance
- `pnpm sync` succeeds with the updated schema
- `pnpm --filter web build` succeeds against a seeded database

### Web route or UI changes

Touching `apps/web` is done when:

- `pnpm --filter web build` succeeds
- the affected route renders correctly in local dev
- DB-backed routes fail loudly on DB outages instead of silently rendering empty data

### API changes

Touching `apps/generator/cmd/api` is done when:

- `pnpm --filter generator test` succeeds
- `curl http://localhost:8080/v1/health` returns `{"status":"ok"}`
- waitlist submissions return the expected HTTP status for success, rate limit, and validation failures

### Sync changes

Touching `apps/generator/cmd/sync` is done when:

- `pnpm --filter generator test` succeeds
- `pnpm sync` succeeds against a reachable Postgres instance
- app dependency refresh remains transactional for the changed code path

## Validation Notes

- `pnpm check` assumes the configured `DATABASE_URL` is reachable and already has the Prisma schema pushed.
- The web build is intentionally DB-backed now. If the database is unavailable, `pnpm --filter web build` should fail instead of silently generating empty pages.
- `TRUST_PROXY_HEADERS` must stay `false` unless the API is behind a trusted reverse proxy that sets `X-Forwarded-For`.

## Pull Request Checklist

- Keep env files untracked: `.env.local`, `apps/web/.env`, `packages/db/.env`
- Run the smallest relevant validation commands for the touched subsystem
- Run `pnpm check` before merging cross-cutting changes
- Update `README.md` or this file if the developer workflow changed
