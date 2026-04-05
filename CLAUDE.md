# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm build:all          # Build all packages + root (use before publishing)
pnpm build              # Build root only
pnpm build:packages     # Build packages/* only
pnpm dev                # Watch mode (root)
pnpm dev:packages       # Watch mode (packages/*)
pnpm test               # Run Vitest tests
pnpm typecheck          # TypeScript check (root)
pnpm typecheck:packages # TypeScript check (packages/*)
pnpm format             # Format with Prettier
pnpm check              # Check formatting (CI uses this)
```

Tests use Vitest — run a single test file with:
```bash
pnpm vitest run src/tests/path/to/file.test.ts
```

## Architecture

Honocord is a type-safe library for building Discord bots using Discord's Interaction API, integrated with the Hono web framework. It targets edge runtimes (Cloudflare Workers) and Node.js.

### Monorepo structure

- `src/` — Core library (the `honocord` npm package)
- `packages/cache-base/` — Abstract cache adapter interface
- `packages/cache-memory/` — In-memory cache implementation
- `packages/cache-do/` — Cloudflare Durable Objects cache
- `packages/cache-mongo/` — MongoDB cache adapter
- `docs/` — Astro Starlight documentation site (not published to npm)

### Core data flow

1. Discord sends an HTTP POST to the bot's endpoint
2. Hono middleware runs `verifyDiscordRequest` (Ed25519 signature check)
3. `Honocord` class routes the interaction to the matching handler by type + name/customId
4. Handler receives a typed interaction context and responds via Discord's REST API

### Key files

| File | Role |
|------|------|
| `src/Honocord.ts` | Central class — registers handlers, wires Hono routes, exposes `app()` |
| `src/interactions/` | Typed interaction classes (ChatInput, Button, Modal, Autocomplete, etc.) |
| `src/handlers/` | Handler builder classes (SlashCommandHandler, ComponentHandler, etc.) |
| `src/resolvers/` | `CommandOptionResolver` and `ModalComponentResolver` for extracting values |
| `src/utils/CacheManager.ts` | Namespaced cache (channels/users/roles/guilds/members) using a cache adapter |
| `src/utils/discordVerify.ts` | Hono middleware for Discord request signature verification |
| `src/utils/registerCommands.ts` | Bulk-registers slash commands via Discord REST |
| `src/types/` | TypeScript generics for context, env bindings, and variable extension |

### Type system

`Honocord` is generic — consumers can extend `BaseHonocordEnv` to add typed env bindings (e.g. Cloudflare KV, secrets) and custom Hono variables. This flows through every handler context.

### Cache adapters

All adapters extend `BaseCache` from `@honocord/cache-base`. Register one with `honocord.withCache(adapter)`. The `CacheManager` wraps it with namespaced helpers.

## Versioning & releases

Uses Changesets. For every PR that changes package behavior:

```bash
pnpm changeset   # describe the change and bump type
```

On merge to `main`, the GitHub Actions release workflow auto-bumps versions and publishes to npm. The `honocord-docs` package is excluded from publishing.
