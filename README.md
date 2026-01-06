# HonoCord

A Discord interaction handler library for [Hono](https://hono.dev/), designed to work seamlessly with Cloudflare Workers and other edge runtimes.

## Features

- 🔥 Built on top of Hono for maximum performance
- ⚡ Perfect for Cloudflare Workers and edge runtimes
- 🎯 Type-safe interaction handlers
- 🔐 Built-in request verification
- 🎨 Support for all Discord interaction types:
  - Slash commands with autocomplete
  - User and Message context menu commands
  - Message components (buttons, select menus)
  - Modal submissions
- 🗂️ Prefix-based routing for components and modals
- 📦 Minimal dependencies using `@discordjs/core` and `@discordjs/builders`

<small>Yes, AI helped me build this. With the focus on **helped**.</small>

## Installation

```bash
pnpm install honocord @discordjs/core @discordjs/builders @discordjs/rest discord-api-types
```

## Quick Start

```typescript
import { Honocord, SlashCommandHandler } from "honocord";

const bot = new Honocord();

// Define a slash command
const pingCommand = new SlashCommandHandler().setName("ping").setDescription("Replies with Pong!");

// Add handler to the command
pingCommand.handler = async (interaction) => {
  await interaction.reply("Pong! 🏓");
};

// Register handlers
bot.loadHandlers(pingCommand);

// Export the app
export default bot.getApp();

// Or use with your own Hono app
import { Hono } from "hono";

const app = new Hono();
```

## Usage with and without Cloudflare Workers

Hono, well rather CF Workers, have a small issue with responding to interactions.

When using HonoCord in a Cloudflare Worker environment, you should ensure that your environment variable `IS_CF_WORKER` is set to `"true"` **or** you pass this information to HonoCord in the constructor:

```typescript
const bot = new Honocord({ isCFWorker: true }); // true indicates CF Worker environment
```

<details>
    <summary>Why that is needed?</summary>

On Cloudflare Workers, we need to make use of `c.executionContext.waitUntil()` to handle asynchronous tasks properly without blocking the response. By checking for the `IS_CF_WORKER` environment variable, HonoCord can determine if it's running in a Cloudflare Worker environment and adjust its behavior accordingly.

This approach allows HonoCord to maintain compatibility with both Cloudflare Workers and other environments, ensuring that interactions are handled correctly regardless of where the code is executed.

</details>

> [!IMPORTANT]
> This readme assumes you are using Cloudflare Workers.
> Most stuff is the same for other environments, but keep in mind the `IS_CF_WORKER` variable and the way you export and use your Hono app.

## Philosophy - How It Works

HonoCord leverages Hono's lightweight and fast request handling capabilities to process Discord interactions efficiently. It verifies incoming requests using Discord's public key, ensuring security and authenticity.

To handle interactions, you define various handler types (slash commands, context commands, components, modals) and register them with the `Honocord` instance. Each handler processes its respective interaction type.

### Custom IDs

Custom IDs for components and modals use a **prefix-based routing system**, allowing you to easily manage multiple interactions with shared logic.

Custom IDs follow the pattern: `prefix/component/path?param1/param2`

As you can see, it is basically split into two parts: a **path** and **parameters**.
Both parts are separated by a `?`, and each part is further divided by `/` (every path-segment and param). However, the `prefix` defines which handler will process the interaction.

Use the `parseCustomId` utility to parse custom IDs:

```typescript
import { parseCustomId } from "honocord";

// Example: "approve/user/request?user123/action456"
const parsed = parseCustomId("approve/user/request?user123/action456");

console.log(parsed.prefix); // "approve"
console.log(parsed.component); // "user"
console.log(parsed.lastPathItem); // "request"
console.log(parsed.compPath); // ["approve", "user", "request"]
console.log(parsed.params); // ["user123", "action456"]
console.log(parsed.firstParam); // "user123"
console.log(parsed.lastParam); // "action456"

// Get only the prefix
const prefix = parseCustomId("approve/user/request?user123", true); // "approve"
```

## Handlers

### 1. Slash Command Handler

Slash commands are the primary way users interact with your bot. They support autocomplete for option values.

```typescript
import { SlashCommandHandler } from "honocord";

const searchCommand = new SlashCommandHandler()
  .setName("search")
  .setDescription("Search for something")
  .addStringOption((option) =>
    option.setName("query").setDescription("What to search for").setRequired(true).setAutocomplete(true)
  )
  .handler(async (interaction) => {
    const query = interaction.options.getString("query", true);
    await interaction.reply(`Searching for: ${query}`);
  })
  .autocomplete(async (interaction) => {
    const focusedValue = interaction.options.getFocused();
    const choices = ["apple", "banana", "cherry", "dragon fruit", "elderberry"]
      .filter((choice) => choice.startsWith(focusedValue.toLowerCase()))
      .slice(0, 25); // Discord limits to 25 choices

    await interaction.respond(choices.map((choice) => ({ name: choice, value: choice })));
  });

bot.loadHandlers(searchCommand);
```

### 2. Context Command Handler

Context commands appear in the right-click menu for users or messages.

```typescript
import { ContextCommandHandler } from "honocord";
import { ApplicationCommandType } from "discord-api-types/v10";

// User context command
const userInfoCommand = new ContextCommandHandler().setName("User Info").setType(ApplicationCommandType.User);

userInfoCommand.handler = async (interaction) => {
  const user = interaction.targetUser;
  await interaction.reply(`User: ${user.username} (${user.id})`);
};

// Message context command
const translateCommand = new ContextCommandHandler().setName("Translate").setType(ApplicationCommandType.Message);

translateCommand.handler = async (interaction) => {
  const message = interaction.targetMessage;
  await interaction.reply(`Translating: "${message.content}"`);
};

bot.loadHandlers(userInfoCommand, translateCommand);
```

### 3. Component Handler

Component handlers handle interactions from buttons, select menus, and other message components. They use a **prefix-based routing system**.

```typescript
import { ComponentHandler } from "honocord";
import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from "@discordjs/builders";

// Create a button with a custom_id using a prefix
const button = new ButtonBuilder()
  .setCustomId("approve/user123") // prefix: "approve"
  .setLabel("Approve")
  .setStyle(ButtonStyle.Success);

// Handler for all components with the "approve" prefix
const approveHandler = new ComponentHandler("approve", async (interaction) => {
  // Parse the custom_id to get parameters
  const { params } = parseCustomId(interaction.customId);
  const userId = params[0]; // "user123"

  await interaction.reply(`Approved user: ${userId}`);
});

bot.loadHandlers(approveHandler);
```

### 4. Modal Handler

Modal handlers process form submissions. Like components, they use prefix-based routing.

```typescript
import { ModalHandler } from "honocord";
import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "@discordjs/builders";

// Create a modal
const modal = new ModalBuilder()
  .setCustomId("feedback/feature") // prefix: "feedback"
  .setTitle("Feature Feedback");

const input = new TextInputBuilder()
  .setCustomId("feedback_text")
  .setLabel("What would you like to see?")
  .setStyle(TextInputStyle.Paragraph)
  .setRequired(true);

modal.addComponents(new ActionRowBuilder().addComponents(input));

// Handler for all modals with the "feedback" prefix
const feedbackHandler = new ModalHandler("feedback", async (interaction) => {
  const { component } = parseCustomId(interaction.customId);
  const feedbackText = interaction.fields.getTextInputValue("feedback_text");

  await interaction.reply({
    content: `Thanks for your ${component} feedback: "${feedbackText}"`,
    ephemeral: true,
  });
});

bot.loadHandlers(feedbackHandler);
```

## Complete Example

<details>
    <summary>If you want to only use Honocord for your project and have no existing Hono app:</summary>

```typescript
import { Honocord, SlashCommandHandler, ComponentHandler, ModalHandler } from "honocord";

const bot = new Honocord();

// Slash command
const greetCommand = new SlashCommandHandler()
  .setName("greet")
  .setDescription("Sends a greeting")
  .addStringOption((option) => option.setName("name").setDescription("Who to greet").setRequired(true));

greetCommand.handler = async (interaction) => {
  const name = interaction.options.getString("name", true);
  await interaction.reply(`Hello, ${name}! 👋`);
};

// Component handler for buttons
const confirmHandler = new ComponentHandler("confirm", async (interaction) => {
  const { params } = parseCustomId(interaction.customId);
  const action = params[0];

  await interaction.update({
    content: `You confirmed: ${action}`,
    components: [], // Remove buttons
  });
});

// Modal handler
const reportHandler = new ModalHandler("report", async (interaction) => {
  const reason = interaction.fields.getTextInputValue("reason");
  const details = interaction.fields.getTextInputValue("details");

  await interaction.reply({
    content: "Report submitted successfully!",
    ephemeral: true,
  });

  // Process the report...
});

// Register all handlers
bot.loadHandlers(greetCommand, confirmHandler, reportHandler);

// For Cloudflare Workers
export default bot.getApp();
```

</details>

or

<details>
    <summary>You want to use Honocord with your existing Hono app:</summary>

```typescript
/**
 * Example: Using HonoCord with custom environment types in a Hono app
 */

import { Hono } from "hono";
import { Honocord, SlashCommandHandler, ComponentHandler } from "honocord";
import type { BaseHonocordEnv, BaseInteractionContext } from "honocord";

// Define your custom bindings
interface MyBindings {
  DISCORD_TOKEN: string;
  DATABASE: D1Database;
  CACHE: KVNamespace;
  IS_CF_WORKER: "true";
}

// Create custom environment and context types
type MyEnv = BaseHonocordEnv<MyBindings>;
type MyContext = BaseInteractionContext<MyBindings>;

// Create Hono app
const app = new Hono<MyEnv>();

// Initialize bot
const bot = new Honocord();

// Create command with type-safe environment access
const pingCommand = new SlashCommandHandler().setName("ping").setDescription("Ping the bot");

pingCommand.handler = async (interaction) => {
  const ctx = interaction.ctx as MyContext;

  // Type-safe access to bindings
  const cache = ctx.env.CACHE;
  await cache.put("last_ping", new Date().toISOString());

  await interaction.reply("Pong! 🏓");
};

// Create command that queries database
const statsCommand = new SlashCommandHandler().setName("stats").setDescription("Show bot stats");

statsCommand.handler = async (interaction) => {
  const ctx = interaction.ctx as MyContext;
  const db = ctx.env.DATABASE;

  const result = await db.prepare("SELECT COUNT(*) as count FROM users").first();
  await interaction.reply(`Total users: ${result?.count ?? 0}`);
};

// Component handler
const approveButton = new ComponentHandler("approve", async (interaction) => {
  const ctx = interaction.ctx as MyContext;
  const db = ctx.env.DATABASE;

  // Update database
  await db.prepare("UPDATE requests SET approved = 1").run();

  await interaction.update({ content: "✅ Approved!" });
});

// Load handlers
bot.loadHandlers(pingCommand, statsCommand, approveButton);

// Interaction endpoint
app.post("/interactions", (c) => bot.handle(c as MyContext));

// Regular API routes
app.get("/", (c) => c.json({ status: "ok" }));

export default app;
```

</details>

## Environment Variables

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_PUBLIC_KEY=your_public_key_here
```

The `DISCORD_PUBLIC_KEY` is required for request verification and should be available in your environment (e.g., `c.env.DISCORD_PUBLIC_KEY` in Cloudflare Workers).

## TypeScript Support

HonoCord is written in TypeScript and provides full type safety.

### Custom Environment Types

```typescript
import type { BaseHonocordEnv, BaseInteractionContext } from "honocord";

// Define your custom environment
interface MyEnv {
  DISCORD_TOKEN: string;
  DISCORD_PUBLIC_KEY: string;
  DATABASE_URL: string;
}

// Create a custom context type
type MyContext = BaseInteractionContext<MyEnv>;

// Use in your handlers
const command = new SlashCommandHandler().setName("data").setDescription("Fetch data");

command.handler = async (interaction: MyContext) => {
  const dbUrl = interaction.env.DATABASE_URL; // Fully typed!
  // ...
};
```

## Registering Commands with Discord

HonoCord handles command execution, but you still need to register your commands with Discord's API. Here's how:

```typescript
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

const commands = [
  pingCommand.toJSON(),
  searchCommand.toJSON(),
  // ... other commands
];

// Register globally (takes up to 1 hour to propagate)
await rest.put(Routes.applicationCommands(APPLICATION_ID), { body: commands });

// Or register for a specific guild (instant)
await rest.put(Routes.applicationGuildCommands(APPLICATION_ID, GUILD_ID), {
  body: commands,
});
```

## API Reference

### `Honocord`

Main class for handling Discord interactions.

**Constructor:**

- `new Honocord(options?: HonocordOptions)` - Creates a new instance

**Methods:**

- `loadHandlers(handlers: Handler[])` - Registers interaction handlers
- `handle(c: Context)` - Hono handler for processing interactions
- `getApp()` - Returns a pre-configured Hono app instance

### `SlashCommandHandler`

Extends `SlashCommandBuilder` from `@discordjs/builders`.

**Properties:**

- `handler: (interaction: ChatInputCommandInteraction) => Promise<void> | void` - Command execution handler
- `autocomplete?: (interaction: AutocompleteInteraction) => Promise<void> | void` - Optional autocomplete handler

### `ContextCommandHandler`

Extends `ContextMenuCommandBuilder` from `@discordjs/builders`.

**Properties:**

- `handler: (interaction: UserCommandInteraction | MessageCommandInteraction) => Promise<void> | void` - Command execution handler

### `ComponentHandler`

Handler for message components.

**Constructor:**

- `new ComponentHandler(prefix: string, handler: Function)` - Creates a handler for components with the given prefix

### `ModalHandler`

Handler for modal submissions.

**Constructor:**

- `new ModalHandler(prefix: string, handler: Function)` - Creates a handler for modals with the given prefix

### `parseCustomId`

Utility function for parsing custom IDs.

```typescript
// Get full parsing details
parseCustomId(customId: string): ParsedCustomId

// Get only the prefix
parseCustomId(customId: string, onlyPrefix: true): string
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
