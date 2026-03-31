# SpellSage

Nx monorepo for a Magic: The Gathering companion: card data (Scryfall / Postgres), collection storage, and API services built with [Fastify](https://fastify.dev/).

## Applications

| Project | Description |
| --------| ------------|
| `@spellsage/api` | HTTP API (`apps/api`) |
| `@spellsage/web` | React + Vite frontend (`apps/web`) |

Shared workspace package: `@spellsage/shared` (`shared/`).

Platform code (Prisma-backed DB helpers, schema) lives under `libs/platform/` (consumed by the API via the `@platform/db` path alias).

## Prerequisites

- Node.js 20+ (aligned with `@types/node` in this repo)
- [Yarn](https://yarnpkg.com/) (package manager for install and scripts)
- PostgreSQL when running against a real database; set `DATABASE_URL` for Prisma

## Common commands

```bash
yarn install

# API (build then run Node on compiled output)
yarn nx serve @spellsage/api

# Web dev server (Vite)
yarn nx serve @spellsage/web

# Production builds
yarn nx build @spellsage/api
yarn nx build @spellsage/web

# Prisma (schema: libs/platform/prisma/schema.prisma)
yarn prisma validate --schema=libs/platform/prisma/schema.prisma
yarn prisma:generate
```

### Seed sample cards (Scryfall)

Fetches 10 random cards from the Scryfall API and upserts them into `Card` (see [`tools/seed-random-cards.ts`](tools/seed-random-cards.ts)).

1. Ensure PostgreSQL is running and `DATABASE_URL` is set (for example in a `.env` file at the repo root; `dotenv` loads it when you run the script).
2. Apply migrations so the schema exists (`yarn prisma migrate dev` or your usual workflow).
3. Run:

```bash
yarn seed:random
```

Re-running the command updates rows by Scryfall card id (upsert); it does not create duplicate primary keys.

## Nx

This repo uses [Nx](https://nx.dev) for task orchestration and caching. Use `yarn nx graph` to explore project relationships.
