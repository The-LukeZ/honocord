# Honocord - Imagine an interactions bot

**Honocord is a powerful, type-safe library for building Discord bots using interactions with the Hono web framework.**

> [!IMPORTANT]
> No, this ain't abandoned - I'm just busy with other projects and life stuff. If you want something added or want to help out, open an issue or PR and I'll try to get to it when I can. Thanks for understanding!

## Contents

- [What is Honocord?](#what-is-honocord)
- [Key Features](#key-features)
- [Install](#install)
- [Usage](#usage)
- [Getting Help](#getting-help)
- [Examples](#examples)
- [Testing](#testing)
- [Contributing](#contributing)
- [Caveats](#caveats)
- [License](#license)

## What is Honocord?

Honocord bridges Discord's Interaction API with Hono's lightweight web framework, allowing you to build fast, serverless Discord bots that run on edge platforms like Cloudflare Workers, or traditional Node.js environments.

## Key Features

- **🚀 Edge-First Design** - Optimized for Cloudflare Workers with async interaction handling
- **📘 Fully Type-Safe** - Built with TypeScript using `discord-api-types` for excellent type safety (I hope at least)
- **🎯 Handler-Based Architecture** - Clean, modular system for commands, components, modals, and webhooks
- **⚡ Hono Integration** - Leverages Hono's lightweight, fast routing capabilities
- **🔧 Flexible Deployment** - Works with Cloudflare Workers, Bun, Node.js, and more
- **🎨 Rich Builders** - Re-exports Discord.js builders for creating embeds, buttons, modals, and more
- **🤖 Autocomplete Support** - Built-in autocomplete helper for slash commands
- **🔐 Secure by Default** - Automatic signature verification for Discord interactions and webhooks
- **🪝 Direct Webhook Support** - Handle Discord webhook events alongside interactions
- **Caching Support** - Caching system with adapters for in-memory, Durable Objects, Mongo and custom implementations

_Disclaimer: Yes, AI helped me build this - with the focus on **helped**._

Refer to the [docs](https://honocord.thelukez.com) for detailed guides, API reference, and examples.

Also get familiar with [Discord.js](https://discord.js.org/docs/) and [Discord API Concepts](https://discord.com/developers/docs/intro).

## Install

```bash
pnpm add honocord hono
# or: npm install honocord hono / bun add honocord hono
```

`hono` is a peer dependency. `mongoose` is an optional peer dependency, only needed for
`honocord/cache/mongo`. Requires Node.js 24+ (or Cloudflare Workers / Bun).

## Usage

```ts
import { Honocord, SlashCommandHandler } from "honocord";

export const pingCommand = new SlashCommandHandler()
  .setName("ping")
  .setDescription("Replies with Pong!")
  .addHandler(async (interaction) => {
    await interaction.reply("🏓 Pong!");
  });

const bot = new Honocord();
bot.loadHandlers(pingCommand);

// POST / and POST /interactions handle Discord interactions
export default bot.getApp();
```

Honocord reads `DISCORD_PUBLIC_KEY` and `DISCORD_TOKEN` from the Hono context's env bindings.
Register commands with `registerCommands(token, applicationId, ...handlers)`. The
[Quick Start](https://honocord.thelukez.com/docs/quickstart) covers the full setup.

## Getting Help

If you encounter issues or have questions:

- Check the [Examples](https://github.com/The-LukeZ/honocord-examples) repo
- Review the documentation pages
- Open an issue on GitHub

## Examples

Browse the [Examples](https://github.com/The-LukeZ/honocord-examples) repo for complete, working implementations:

- **[cloudflare-workers](https://github.com/The-LukeZ/honocord-examples/tree/main/examples/cloudflare-workers)** - Bot on Cloudflare Workers with commands, autocomplete, buttons, modals, context menus, middleware and Durable Object caching
- **[node-server](https://github.com/The-LukeZ/honocord-examples/tree/main/examples/node-server)** - Integration with an existing Hono app on Node.js, with in-memory caching
- **[webhook-events](https://github.com/The-LukeZ/honocord-examples/tree/main/examples/webhook-events)** - Handling Discord webhook events on Cloudflare Workers and sending files with `AttachmentBuilder`
- **[dynamic-commands](https://github.com/The-LukeZ/honocord-examples/tree/main/examples/dynamic-commands)** - Per-guild custom commands created at runtime, handled by dynamic command handlers

## Testing

Tests are located in `src/tests/` and follow the directory structure of the modules they test:

```tree
src/
├── tests/
│   ├── interactions/
│   │   └── BaseInteraction.test.ts
│   └── utils/
│       └── Autocomplete.test.ts
├── interactions/
├── utils/
└── ...
```

Run tests with:

```bash
pnpm test          # Run all tests
pnpm test --watch  # Run in watch mode
```

Tests use [Vitest](https://vitest.dev/) for fast unit testing with TypeScript support.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CONVENTIONS.md`](CONVENTIONS.md). Releases are described in [`RELEASING.md`](RELEASING.md).

The repository is organized as a monorepo with the following structure:

- **`src/`** - Core Honocord library, including the cache adapters (`src/cache`, exposed as `honocord/cache`, `honocord/cache/memory`, `honocord/cache/do` and `honocord/cache/mongo`)
- **`docs/`** - Documentation site (SvelteKit + svelte-docsmith)

### Building

```bash
pnpm build         # Build the root package
pnpm typecheck     # Type check the root package
```

The package uses [tsdown](https://tsdown.dev/) for zero-config builds.

## Caveats

- Interactions and webhook events only: there is no Gateway connection, so no presence, message
  events or other gateway events.
- On Cloudflare Workers, handlers run after the response via `waitUntil` and are bound by Workers
  CPU and duration limits.
- `reply()` and `deferReply()` are ephemeral by default; pass `false` as the second argument for
  a public reply.
- The in-memory cache adapter does not work on Workers, and the Durable Object adapter only works
  on Workers.

## License

[MIT](LICENSE) © The-LukeZ
