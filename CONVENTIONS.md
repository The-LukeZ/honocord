# Conventions

House rules for building and maintaining **honocord**. Numbered so reviews and commit
messages can cite a rule as §N.

## 1. What this project is (and is not)

Honocord is a library for Discord bots that receive interactions and webhook events over HTTP,
built on [Hono](https://hono.dev). It verifies requests, routes them to typed handlers, and wraps
Discord's REST API through discord.js packages (`@discordjs/core`, `@discordjs/rest`,
`@discordjs/builders`). It targets Cloudflare Workers first, and also runs on Node.js and Bun.

It is **not** a Gateway client: there is no WebSocket connection, no presence, and no gateway
events. It is also not a framework: it does not own your app, it gives you handlers and a Hono
handler to mount where you like.

## 2. Repository layout

| Path                   | What belongs there                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `src/`                 | The published `honocord` package                                                                 |
| `src/handlers/`        | Handler classes (`SlashCommandHandler`, `ComponentHandler`, `ModalHandler`, dynamic handlers, …) |
| `src/interactions/`    | Typed interaction classes passed to handlers                                                     |
| `src/resolvers/`       | Option and modal field resolvers                                                                 |
| `src/cache/`           | Cache adapters, published as `honocord/cache`, `honocord/cache/memory`, `/do` and `/mongo`       |
| `src/utils/`           | Request verification, command registration, cache manager, fetcher                               |
| `src/structures/`      | Builders such as `AttachmentBuilder`                                                             |
| `src/types/`           | Public TypeScript types                                                                          |
| `src/tests/`           | Vitest tests, mirroring the layout of the code they test                                         |
| `src/test/`            | Type-level checks, run by `pnpm typecheck`, never executed                                       |
| `docs/`                | Documentation site (svelte-docsmith), private workspace package, not published                   |
| `scripts/`, `tooling/` | Scripts that generate the API reference from TypeDoc                                             |
| `.changeset/`          | Pending changesets                                                                               |

## 3. Code style

- TypeScript in strict mode. Run `pnpm typecheck` before pushing.
- Formatting is Prettier's job: `pnpm format` writes, `pnpm check` verifies (CI runs `check`).
- Public classes, methods and types carry JSDoc, because the API reference is generated from it.
- Discord API shapes come from `discord-api-types`. Do not redeclare them.
- New public exports go through `src/index.ts` (or a subpath export in `package.json`).

## 4. Writing voice

Dense, specific, honest. Tables for matrices, prose for reasoning. No marketing language, and
no unexplained acronyms on first use.

## 5. Versioning and releases

[Semantic versioning](https://semver.org/), managed by [Changesets](https://github.com/changesets/changesets).
Every PR that changes package behavior includes a changeset (`pnpm changeset`). On merge to
`main`, the release workflow opens or updates a "Version Packages" PR that bumps the version and
writes `CHANGELOG.md`; merging that PR publishes to npm. Do not edit `CHANGELOG.md` by hand.
See [`RELEASING.md`](RELEASING.md) for the full flow.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
(`feat:` / `fix:` / `docs:` / `refactor:` / `test:` / `chore:` / `ci:`).
