# Honocord - Imagine an interactions bot

> [!IMPORTANT]
> No, this ain't abandoned - I'm just busy with other projects and life stuff. I you want something added or want to help out, open an issue or PR and I'll try to get to it when I can. Thanks for understanding!

Honocord is a powerful, type-safe library for building Discord bots using interactions with the Hono web framework.

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

## Getting Help

If you encounter issues or have questions:

- Check the [Examples](https://github.com/The-LukeZ/honocord-examples) repo
- Review the documentation pages
- Open an issue on GitHub

## Examples

Browse the [Examples](https://github.com/The-LukeZ/honocord-examples) repo for complete, working implementations:

- **cloudflare-workers** - Bot on Cloudflare Workers with Caching
- **custom-hono-integration** - Integration with existing Hono apps (with Bun)
- **webhook-events** - Handling Discord webhook events alongside interactions
- **caching-mongo** - Example of a simple MongoDB cache adapter implementation

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

The repository is organized as a monorepo with the following structure:

- **`src/`** - Core Honocord library
- **`packages/`** - Optional cache adapters (`cache-base`, `cache-memory`, `cache-do`, `cache-mongo`)
- **`docs/`** - Documentation site (Astro)

### Building

```bash
pnpm build         # Build the root package
pnpm build:all     # Build root and all cache packages
pnpm typecheck     # Type check the root package
```

All packages use [tsdown](https://tsdown.dev/) for zero-config builds.
