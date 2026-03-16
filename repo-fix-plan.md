# InfraUp Remediation Plan

This file is the reviewed remediation backlog for the repo issues found in the architecture and reliability review.

## Review Method

The requested subagent review prompt is preserved below exactly. A separate subagent execution tool was not available in this environment, so the same prompt was applied as an internal review pass before finalizing the sprint breakdown.

### Subagent Review Prompt

```text
Review the attached InfraUp remediation plan as a neutral senior engineer.

Your job:
1. Find sequencing problems, hidden dependencies, or tasks that are too large to be atomic commits.
2. Find any missing validation steps, especially around local setup, Prisma schema changes, sync transactions, waitlist API behavior, and CI gating.
3. Flag any places where the plan introduces unnecessary scope or fails to fully close one of these confirmed issues:
   - local DB port mismatch
   - waitlist not wired into local/compose startup flows
   - silent DB failures in the web layer
   - incorrect dependency image resolution in app detail snippets
   - non-transactional sync dependency refresh
   - bypassable waitlist rate limiting
   - missing automated regression coverage
4. Suggest only concrete improvements. Do not rewrite the whole plan unless necessary.

Return format:
- Blockers
- Suggested task edits
- Missing tests/validation
- Reordering recommendations
- Anything to delete as over-scope
```

## Accepted Review Improvements

- Split Go runtime/build wiring into its own atomic task because package-level helper files make single-file `go run ./cmd/.../main.go` and `go build ./cmd/.../main.go` unsafe.
- Separate schema work from sync persistence work so Prisma contract changes can be validated before web/query changes depend on them.
- Keep success-path validation and failure-path validation distinct:
  - success path uses `pnpm db:push`, `pnpm sync`, and `pnpm --filter web build` against a reachable seeded Postgres instance
  - failure path uses an invalid `DATABASE_URL` and expects a non-zero web build or sync exit
- Make CI seed a real Postgres database before the web Docker build, because the web build now intentionally fails on DB outages.
- Keep docs as the last sprint so the final state, not an intermediate state, is documented.

## Sprint 1: Dev Path And Config Correctness

Demo outcome: a fresh clone can follow the README, start the local stack, seed the database, and reach the waitlist API through a documented path.

### S1-T1 Align the default local Postgres port

- Goal: make `.env.example`, `docker-compose.yml`, and the quickstart agree on the same host port.
- Scope:
  - `.env.example`
  - `docker-compose.yml`
  - `README.md`
- Validation:
  - `cp .env.example .env.local`
  - `docker compose up -d postgres`
  - `pnpm db:push`

### S1-T2 Load repo-root env consistently from workspace scripts

- Goal: make the documented root `.env.local` file apply to web, Prisma, and generator commands.
- Scope:
  - `scripts/run-with-root-env.mjs`
  - `apps/web/package.json`
  - `packages/db/package.json`
- Validation:
  - `pnpm db:generate`
  - `pnpm --filter web build`

### S1-T3 Add a workspace manifest for the generator package

- Goal: make the Go API and sync tools first-class workspace tasks.
- Scope:
  - `apps/generator/package.json`
- Validation:
  - `pnpm --filter generator dev`
  - `pnpm --filter generator build`
  - `pnpm --filter generator test`
  - `pnpm --filter generator sync`

### S1-T4 Fix Go run/build targets to use package directories

- Goal: ensure helper files in `cmd/api` and `cmd/sync` are compiled into local scripts and Docker images.
- Scope:
  - `apps/generator/package.json`
  - `apps/generator/Dockerfile`
  - `apps/generator/Dockerfile.api`
- Validation:
  - `pnpm --filter generator build`
  - `pnpm dev`

### S1-T5 Promote sync and full-stack dev to root commands

- Goal: make `pnpm dev`, `pnpm dev:api`, `pnpm dev:web`, and `pnpm sync` the default repo entrypoints.
- Scope:
  - `package.json`
  - `turbo.json` if task graph changes are required
- Validation:
  - `pnpm dev`
  - `pnpm sync`

### S1-T6 Wire the web bundle to a real API base URL in Compose

- Goal: ensure the client-side waitlist form points at the Go API when built through Compose.
- Scope:
  - `docker-compose.yml`
  - `README.md`
- Validation:
  - `docker compose up --build web api sync`
  - submit the waitlist form and confirm the request targets the API URL, not a same-origin fallback

### S1-T7 Rewrite the quickstart around explicit success signals

- Goal: document the full local flow and make verification deterministic.
- Scope:
  - `README.md`
- Validation:
  - follow the quickstart from a clean checkout
  - confirm:
    - `pnpm db:push` succeeds
    - `pnpm sync` succeeds
    - `curl http://localhost:8080/v1/health` returns `{"status":"ok"}`
    - `http://localhost:3000/apps` renders populated catalog data

## Sprint 2: Dependency And Sync Data Correctness

Demo outcome: dependency metadata is stored as first-class data, app detail pages render the correct dependency images, and sync writes app dependency state transactionally.

### S2-T1 Add a first-class Dependency model to Prisma

- Goal: persist dependency registry metadata instead of reconstructing it in the web layer.
- Scope:
  - `packages/db/prisma/schema.prisma`
- Validation:
  - `pnpm db:generate`
  - `pnpm db:push`

### S2-T2 Regenerate the Prisma client and update web query payloads

- Goal: expose the new dependency relation cleanly to the web app.
- Scope:
  - generated Prisma client
  - `apps/web/lib/db.ts`
- Validation:
  - `pnpm db:generate`
  - `pnpm --filter web build`

### S2-T3 Load dependency registry YAML in the sync command

- Goal: parse `registry/dependencies/*.yaml` before app sync begins.
- Scope:
  - `apps/generator/cmd/sync/main.go`
  - `apps/generator/cmd/sync/persistence.go`
- Validation:
  - `pnpm --filter generator test`
  - `pnpm sync`

### S2-T4 Upsert dependency rows before app persistence

- Goal: ensure all dependency slugs referenced by apps exist in the database before app writes run.
- Scope:
  - `apps/generator/cmd/sync/persistence.go`
- Validation:
  - `pnpm sync`
  - inspect the `Dependency` table row count against the number of files in `registry/dependencies`

### S2-T5 Normalize app dependency entries against the dependency registry

- Goal: reject unknown dependency slugs and fill missing dependency types from registry metadata.
- Scope:
  - `apps/generator/cmd/sync/persistence.go`
  - `apps/generator/cmd/sync/persistence_test.go`
- Validation:
  - `pnpm --filter generator test`
  - run sync with an invalid dependency fixture and expect a non-zero exit

### S2-T6 Make per-app sync writes transactional

- Goal: keep app upsert, dependency delete, and dependency reinsert in one transaction.
- Scope:
  - `apps/generator/cmd/sync/persistence.go`
  - `apps/generator/cmd/sync/main.go`
- Validation:
  - `pnpm --filter generator test`
  - force a dependency insert failure and confirm the previous dependency set remains intact

### S2-T7 Render dependency images from the dependency relation in the web app

- Goal: stop using `getApp(depSlug)` fallback logic and stop forcing `:latest` onto dependency images.
- Scope:
  - `apps/web/app/(site)/apps/[slug]/page.tsx`
  - `apps/web/components/site/AppComparison.tsx`
  - `apps/web/lib/db.ts`
- Validation:
  - `pnpm --filter web build`
  - open `/apps/listmonk` and confirm the Compose tab uses the registry-defined Postgres image
  - open `/apps/chatwoot` and confirm both Postgres and Redis dependencies use registry-defined images

## Sprint 3: Failure Handling And API Hardening

Demo outcome: DB-backed routes fail loudly on operational outages, and waitlist rate limiting uses stable client identity handling with useful logs.

### S3-T1 Add a shared DB query wrapper for the web layer

- Goal: centralize DB error logging and stop silent operational fallbacks.
- Scope:
  - `apps/web/lib/db.ts`
- Validation:
  - `pnpm --filter web build`
  - verify failed queries emit labeled logs

### S3-T2 Remove silent fallback behavior from DB-backed route data sources

- Goal: make build-critical routes fail on DB outages instead of rendering empty content.
- Scope:
  - `apps/web/lib/db.ts`
  - any route that depends on DB-backed static params or page data
- Validation:
  - `DATABASE_URL='postgresql://invalid:invalid@127.0.0.1:1/invalid' pnpm --filter web build`
  - expected result: non-zero exit

### S3-T3 Add normalized client IP extraction for the waitlist API

- Goal: strip ports from `RemoteAddr` and only trust `X-Forwarded-For` when explicitly enabled.
- Scope:
  - `apps/generator/cmd/api/client_ip.go`
  - `apps/generator/cmd/api/client_ip_test.go`
  - `.env.example`
- Validation:
  - `pnpm --filter generator test`

### S3-T4 Key the rate limiter on normalized client IPs

- Goal: make reconnects on different source ports count toward the same waitlist limit.
- Scope:
  - `apps/generator/cmd/api/main.go`
  - `apps/generator/cmd/api/client_ip.go`
- Validation:
  - `pnpm --filter generator test`
  - send six requests from one client and confirm the sixth request returns `429`

### S3-T5 Improve waitlist API logs for rejection and email delivery

- Goal: produce grep-friendly logs for rate-limit rejection, DB failure, provider failure, and email success.
- Scope:
  - `apps/generator/cmd/api/main.go`
- Validation:
  - `pnpm --filter generator test`
  - exercise success and failure cases with `curl`

## Sprint 4: Regression Coverage, CI, And Handoff Docs

Demo outcome: the repo has an automated validation gate, CI enforces it, and contributors have a compact source-of-truth for setup and definitions of done.

### S4-T1 Add Go tests for client IP extraction and rate-limit behavior

- Goal: lock in the new client identity rules.
- Scope:
  - `apps/generator/cmd/api/client_ip_test.go`
- Validation:
  - `pnpm --filter generator test`

### S4-T2 Add Go tests for sync dependency normalization and transaction behavior

- Goal: lock in dependency registry validation and rollback semantics.
- Scope:
  - `apps/generator/cmd/sync/persistence_test.go`
- Validation:
  - `pnpm --filter generator test`

### S4-T3 Add a repo-level check command

- Goal: create one validation entrypoint for Prisma generation, sync, Go tests, and web build.
- Scope:
  - `package.json`
- Validation:
  - `pnpm check`

### S4-T4 Gate CI image builds on repo checks

- Goal: block publish steps when the repo no longer passes its validation contract.
- Scope:
  - `.github/workflows/build-and-push.yml`
- Validation:
  - CI runs `pnpm check` before image builds
  - a failing Go test or web build prevents image publication

### S4-T5 Seed a real database for CI web builds

- Goal: keep the stricter DB-backed web build working in GitHub Actions.
- Scope:
  - `.github/workflows/build-and-push.yml`
- Validation:
  - the `check` job pushes the Prisma schema, runs sync, and builds the web app against a seeded Postgres service
  - the web Docker image build uses build args that point at the seeded CI database

### S4-T6 Add a contributor workflow guide

- Goal: document the shortest path to setup, validation, and safe changes.
- Scope:
  - `CONTRIBUTING.md`
- Validation:
  - a new engineer can answer:
    - where do I change web, sync, or schema code?
    - what do I run locally?
    - what proves I am done?

### S4-T7 Publish the reviewed remediation roadmap

- Goal: preserve the sprint plan, task boundaries, and validation matrix in-repo.
- Scope:
  - `repo-fix-plan.md`
- Validation:
  - file exists at the repo root
  - task list is atomic, commit-sized, and grouped into demoable sprints

## Validation Matrix

### Success-path validation

- `pnpm db:generate`
- `pnpm db:push`
- `pnpm sync`
- `pnpm --filter generator test`
- `pnpm --filter web build`
- `pnpm check`

### Failure-path validation

- `DATABASE_URL='postgresql://invalid:invalid@127.0.0.1:1/invalid' pnpm sync`
- `DATABASE_URL='postgresql://invalid:invalid@127.0.0.1:1/invalid' pnpm --filter web build`

### Runtime smoke validation

- `pnpm dev`
- `curl http://localhost:8080/v1/health`
- open `/apps`
- submit the waitlist form

## Notes

- `pnpm dev` is intentionally the full local stack. If a web-only flow is needed, use `pnpm dev:web`.
- The web build now depends on a reachable seeded database by design.
- `TRUST_PROXY_HEADERS` should remain `false` in local development and direct-to-app deployments.
