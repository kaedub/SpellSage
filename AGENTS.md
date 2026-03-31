# SpellSage AI Collaboration Guide

- Keep guidance actionable for this repo; no Nx Cloud workflows – CI is handled outside of these instructions.
- Use standard Nx commands when necessary but do not assume Nx Cloud connectivity or tooling.
- Apply the TypeScript rule sets below whenever working in `*.ts` or `*.tsx` files, even for small edits.
- This project uses **yarn** as its package manager. Never use `npm`, `npx`, or `pnpm` commands.
- **Never install packages automatically.** When a new dependency is needed, provide the `yarn add` command for the user to run themselves. Do not execute install commands on the user's behalf.
- TEMPORARY Greenfield Mode (remove after MVP deployment): nothing has been deployed yet, there is no backward compatibility requirement, and there is no tech debt to “work around”.
- Do not do “patches” or incremental fixes to legacy behavior; treat earlier choices as non-sacred foundations that we can rework.
- When designing and implementing, focus on defining clean, sustainable patterns for the whole application now (even if that requires rethinking earlier implementation).

---
description: Service, repository, request/command, and adapter patterns
globs: "**/*.ts,**/*.tsx"
alwaysApply: false
---

# TypeScript — Design Patterns

## Service pattern
- Prefer **interface + factory** with constructor-injected dependencies. No service locators or global singletons for core services.
- Dependencies passed as a single object: `createXxxService({ db, client }): XxxService`. Implementation class is an implementation detail (not exported if not needed).
- Example: `createDatabaseService({ db })`, `createAIService({ client })`.

## Repository vs facade
- For a clear **aggregate** (e.g. Project, FormRecord), prefer a small repository interface with methods returning `Result<T, E>` (or a typed error), not `T | null`.
- Broad “database service” facades are acceptable for cross-entity or read-only use cases; keep them thin and delegate to repositories where an aggregate exists.

## Request / command objects
- For non-trivial or multi-step operations (especially across boundaries), use a **request/command object**: it holds dependencies and input and exposes a single `execute()` (or `run()`) returning a domain type or `Result<T, E>`.
- Keeps handlers thin and logic testable without running full infra. Example: `ProjectOutlineGenerationRequest(client, project).execute()`.

## Adapters at boundaries
- One **adapter** per external system (or cohesive API surface): DB, OpenAI, queue, HTTP client. Adapter’s job: translate external types to domain (or shared) types; wrap failures in `Result` or a typed error.
- Inside the app, domain and services see only domain types; they do not see `null` or raw API shapes from the adapter.

## Composition over inheritance
- Prefer small, single-purpose types and **composition** (e.g. services that depend on other services via interfaces) over deep class hierarchies. Flat services and composition over inheritance.

---
description: Strict TypeScript + result-first error modeling
globs: "**/*.ts,**/*.tsx"
alwaysApply: false
---

# TypeScript — Strict + Result-First

## Core mindset
- Write TypeScript that is explicit, extensible, and type-safe.
- Prefer fixing root causes upstream over adding downstream guards.
- New code is NOT sacred. If earlier code forces hacks, refactor it.

## Non-negotiables
- Do NOT use `any`. Use `unknown` at boundaries, then decode.
- Do NOT use non-null assertions (`!`).
- Do NOT use `// @ts-ignore`. If unavoidable, use `@ts-expect-error` with a clear explanation comment.
- Do NOT use type assertions (`as ...`) to silence errors. If unavoidable at a boundary, explain with `// SAFE:` and keep it localized.
- Do NOT add “magic strings” or placeholders to satisfy required fields.
- Do NOT use `??` or `||` to silence type errors. Defaults only when they are real business defaults and centralized.
- Do NOT introduce optional properties when the domain says they are required.

## Result-first error modeling
- Domain and application logic MUST NOT signal failure with `undefined`, `null`, sentinel values, empty strings, or empty arrays.
- If an operation can fail, return `Result<T, E>` (not `T | undefined`, not `T | null`).
- `undefined` is allowed ONLY for “parameter not provided” at API boundaries (DTOs). It must not exist in domain entities.
- `null` is disallowed in domain entities and return types unless explicitly required by an external API/DB shape. Convert at the boundary.

## Boundaries (validate once, then trust types)
- Treat external inputs as `unknown` (HTTP payloads, env vars, DB rows, files, queues).
- Decode/validate at boundaries into domain-safe types.
- Boundary layers should return `Result<DomainType, ParseError>` (or throw only at process-level entrypoints).
- Inside domain code, missing data is a bug: redesign types or return a typed error Result.

## Modeling (make illegal states unrepresentable)
- Prefer discriminated unions over booleans and ad-hoc flags.
- Prefer branded types for IDs and validated strings where useful (e.g. `UserId`, `Email`, `Url`, `NonEmptyString`).
- Use exhaustive checks for unions (`switch` + `assertNever`).
- Avoid “stringly-typed” states; centralize literals in `const` objects and use `as const` / `satisfies`.

## Required > optional
- If a value is required in reality, it must be required in the type.
- Optional fields must be justified with `// optional because ...` and should usually be confined to boundary DTOs.
- `Partial<T>` is allowed ONLY for patch/update DTOs at boundaries, never for domain entities.

## Defaults and fallbacks
- Defaults must be explicit and documented (e.g. config, constants). Do not hide defaults inside `??` or `||` at call sites.
