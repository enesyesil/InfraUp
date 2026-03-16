# InfraUp

Discover and deploy 50+ self-hosted open source alternatives to SaaS tools. Replace Notion, Slack, HubSpot, Jira, and more — on your own infrastructure.

## Architecture

```
infraup/
├── apps/
│   ├── web/            # Next.js 14 (App Router, SSR / standalone)
│   └── generator/      # Go API + registry tools
├── packages/
│   └── db/             # Prisma schema + client (PostgreSQL 16)
├── registry/
│   ├── apps/           # 50 app YAML definitions
│   ├── dependencies/   # 7 dependency YAMLs (postgres, redis, etc.)
│   └── content/        # MDX content for each app
├── docker-compose.yml  # Local dev (Postgres, web, api, sync)
├── turbo.json          # Turborepo pipeline
└── pnpm-workspace.yaml
```

**Monorepo** managed with pnpm workspaces and Turborepo.

| Component | Tech | Purpose |
|-----------|------|---------|
| `apps/web` | Next.js 14, Tailwind CSS, shadcn/ui | Public-facing site, app catalog, guides, blog |
| `apps/generator` | Go 1.22 | Waitlist API, health endpoint, scaffold CLI, and registry sync |
| `packages/db` | Prisma 5, PostgreSQL 16 | Shared schema and Prisma client |

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9
- **Go** >= 1.22
- **Docker** & Docker Compose
- **PostgreSQL 16** (via Docker or local)

## Quick Start

```bash
# 1. Clone
git clone https://github.com/your-org/infraup.git && cd infraup

# 2. Install dependencies
pnpm install

# 3. Start Postgres
docker compose up -d postgres

# 4. Configure environment
cp .env.example .env.local
# Defaults target the local Compose Postgres on localhost:5433.
# Edit DATABASE_URL, RESEND_API_KEY, GITHUB_TOKEN, or NEXT_PUBLIC_API_URL only if needed.

# 5. Generate Prisma client and push schema
pnpm db:generate
pnpm db:push

# 6. Sync registry to database
pnpm sync

# 7. Start the full local stack (web + waitlist API)
pnpm dev

# 8. Verify the stack
curl http://localhost:8080/v1/health
# Then open http://localhost:3000/apps and confirm the catalog is populated
```

`pnpm dev` starts the Next.js app on `http://localhost:3000` and the Go API on `http://localhost:8080`.

If `DATABASE_URL` points at an external Postgres instance managed through Dokploy, open the database access link or tunnel from the Dokploy console before running `pnpm db:push`, `pnpm sync`, or `pnpm check`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `RESEND_API_KEY` | No | Resend API key for waitlist emails |
| `GITHUB_TOKEN` | No | GitHub PAT for star counts and metadata |
| `NEXT_PUBLIC_GENERATOR_LIVE` | No | Set to `"true"` to enable generator links |
| `NEXT_PUBLIC_API_URL` | No | Go API base URL (default: `http://localhost:8080`) |
| `TRUST_PROXY_HEADERS` | No | Set to `"true"` only when the API runs behind a trusted reverse proxy |

For **production (e.g. Dokploy)**, set the same variables at runtime. The web container must have **`DATABASE_URL`** at runtime (for SSR, on-demand pages, and sitemap). See the Production section in [.env.example](.env.example) for a concise list and examples.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the web app and Go API in dev mode |
| `pnpm dev:web` | Start only the web app |
| `pnpm dev:api` | Start only the Go API |
| `pnpm build` | Build all workspaces |
| `pnpm lint` | Lint all workspaces |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm sync` | Sync the registry into the database |
| `pnpm check` | Regenerate Prisma, resync the registry, run Go tests, and build the web app |

## Registry

The `registry/` directory contains YAML definitions for all apps and dependencies. Each app YAML includes:

- Docker image, ports, and resource requirements
- Category, license, and feature matrix
- SaaS tools it replaces
- Dependencies (postgres, redis, etc.)

To add a new app, create a YAML file in `registry/apps/` and corresponding MDX in `registry/content/apps/`, then run the sync CLI.

## Docker

CI builds and pushes three images to GHCR: **web** (frontend), **api** (backend for waitlist/health, used by `NEXT_PUBLIC_API_URL`), and **sync** (registry-to-DB job).

The **web** app runs in SSR mode (Next.js standalone server), listens on **port 3000**, and requires **`DATABASE_URL` at runtime** for on-demand pages and the sitemap. Point Traefik or your reverse proxy at the web container on port 3000.

```bash
# Bootstrap Postgres first so the web image build can reach the database
docker compose up -d postgres

# Build and run everything (web, api, sync) against the running Postgres instance
docker compose up --build web api sync

# Build individual images
docker build -f apps/web/Dockerfile -t infraup-web .
docker build -f apps/generator/Dockerfile.api -t infraup-api .
docker build -f apps/generator/Dockerfile -t infraup-sync .
```

## Pre-Push Checklist

- Verify local env files are not tracked: `.env.local`, `apps/web/.env`, `packages/db/.env`
- Verify `.pnpm-store/` and other local artifacts are ignored
- Run `pnpm install` and `pnpm check`
- Verify Docker image builds:
  - `docker build -f apps/web/Dockerfile -t infraup-web .`
  - `docker build -f apps/generator/Dockerfile.api -t infraup-api .`
  - `docker build -f apps/generator/Dockerfile -t infraup-sync .`
- Confirm `.github/workflows/build-and-push.yml` is valid and GHCR package permissions are enabled

## Project Structure

### Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with featured apps, categories, waitlist |
| `/apps` | Full app catalog with search, filter, sort |
| `/apps/[slug]` | App detail page or category listing |
| `/compare/[a]-vs-[b]` | Side-by-side app comparison |
| `/deploy` | 5-step deploy guide |
| `/calculator` | Savings calculator |
| `/platform` | Config generator (coming soon) |
| `/guides` | Self-hosting guides |
| `/blog` | Blog posts |
| `/about` | About page |

### Design System

Brutalist / technical zine aesthetic:
- **No rounded corners** — all `border-radius: 0`
- **Hard offset shadows** — 3D "brutal" box shadows
- **Fonts** — Playfair Display (headings), Inter (body), IBM Plex Mono (code/UI)
- **Colors** — `#ffffff` (white), `#1a1a1a` (ink), `#c0392b` (accent red)

## License

This project is licensed under the [MIT License](LICENSE).
