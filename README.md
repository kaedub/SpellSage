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
- PostgreSQL when running against a real database; set `DATABASE_URL` for Prisma

## Common commands

```bash
npm install

# API (build then run Node on compiled output)
npx nx serve @spellsage/api

# Web dev server (Vite)
npx nx serve @spellsage/web

# Production builds
npx nx build @spellsage/api
npx nx build @spellsage/web

# Prisma (schema: libs/platform/prisma/schema.prisma)
npx prisma validate --schema=libs/platform/prisma/schema.prisma
```

## Nx

This repo uses [Nx](https://nx.dev) for task orchestration and caching. Use `npx nx graph` to explore project relationships.
