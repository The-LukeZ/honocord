# Honocord - Imagine an interactions bot

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

- **cloudflare-workers** - Basic bot on Cloudflare Workers
- **custom-hono-integration** - Integration with existing Hono apps (with Bun)
- **webhook-events** - Handling Discord webhook events alongside interactions
