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
pnpm add honocord@latest
```

The most important stuff from the dependencies is already exported through honocord itselfy but if you need more from `discord-api-types` for example, you should install it yourself as well.

## Quick Start

```typescript
import { Honocord, SlashCommandHandler } from "honocord";

const bot = new Honocord();

// Define a slash command
const pingCommand = new SlashCommandHandler().setName("ping").setDescription("Replies with Pong!");

// Add handler to the command
pingCommand.addHandler(async (interaction) => {
  await interaction.reply("Pong! 🏓");
});

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
  .addHandler(async (interaction) => {
    const query = interaction.options.getString("query", true);
    await interaction.reply(`Searching for: ${query}`);
  })
  .addAutocompleteHandler(async (interaction) => {
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

userInfoCommand.addHandler(async (interaction) => {
  const user = interaction.targetUser;
  await interaction.reply(`User: ${user.username} (${user.id})`);
});

// Message context command
const translateCommand = new ContextCommandHandler().setName("Translate").setType(ApplicationCommandType.Message);

translateCommand.addHandler(async (interaction) => {
  const message = interaction.targetMessage;
  await interaction.reply(`Translating: "${message.content}"`);
});

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

// ActionRows in modals are deprecated and should not be used because Honocord doesn't process them!
const input = new LabelBuilder()
  .setLabel("What would you like to see?")
  .setTextInputComponent(
    new TextInputBuilder()
    .setCustomId("feedback_text")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
  );

modal.addLabelComponents(input);

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

Please refer to the [Examples](https://github.com/The-LukeZ/honocord-examples) repository for complete working examples, including deployment to Cloudflare Workers.

## Environment Variables

```env
DISCORD_APPLICATION_ID=your_application_id_here # only required for command registration
DISCORD_TOKEN=your_bot_token_here # always required
DISCORD_PUBLIC_KEY=your_public_key_here # always required
IS_CF_WORKER=true # only required if using Cloudflare Workers
```

The `DISCORD_PUBLIC_KEY` is required for request verification and should be available in your environment (e.g., `c.env.DISCORD_PUBLIC_KEY` in Cloudflare Workers).

## TypeScript Support

HonoCord is written in TypeScript and provides full type safety.

### Custom Environment Types

```typescript
// src/types.ts
import type { BaseHonocordEnv, BaseInteractionContext } from "honocord";

type MyEnv = {
  MY_VARIABLE: string;
};

export type HonoEnv = BaseHonocordEnv<MyEnv>;
export type MyContext = BaseInteractionContext<MyEnv>;

// src/index.ts
import type { BaseHonocordEnv, BaseInteractionContext } from "honocord";
import type { HonoEnv, MyContext } from "./types";

// Use in your handlers
const command = new SlashCommandHandler()
  .setName("data")
  .setDescription("Fetch data")
  .addHandler(async (interaction: MyContext) => {
    const myVariable = interaction.env.MY_VARIABLE; // Fully typed!
    // ...
  });
```

## Registering Commands

You can register your commands using the `registerCommands()` utility function.

```typescript
// src/handlers/index.ts
export * from "./pingCommand";
export * from "./approveHandler";
// ...export other handlers

// src/register.ts
import { registerCommands } from "honocord";
import * as handlers from "./handlers/index";

await registerCommands(process.env.DISCORD_TOKEN!, process.env.DISCORD_APPLICATION_ID!, ...Object.values(handlers));
```

You should add the script to your package.json:

```json
{
  "scripts": {
    // tsx is recommended for running TypeScript files directly, but you can use any method you prefer, even node itself if you use a JS file.
    "register": "tsx --env-file=.env src/register.ts"
  }
}
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
  - Route: `POST /interactions` - Handles Discord interaction requests
  - Route: `GET *` - Displays a generic "Is Running" text.

### `SlashCommandHandler`

Extends `SlashCommandBuilder` from `@discordjs/builders`.

**Methods:**

- `addHandler(handler: (interaction: ChatInputCommandInteraction) => Promise<void> | void)` - Adds the command execution handler
- `addAutocompleteHandler(handler: (interaction: AutocompleteInteraction) => Promise<void> | void)` - Adds an optional autocomplete handler

### `ContextCommandHandler`

Extends `ContextMenuCommandBuilder` from `@discordjs/builders`.

**Constructor:**

```ts
new ContextCommandHandler<
  T extends ContextCommandType = ContextCommandType,
  InteractionData = T extends ContextCommandType.User ? UserContextInteraction : MessageContextInteraction,
  > ()
```

`ContextCommandType` is an enum with values `User` and `Message`; Derived from ApplicationCommandType, but narrowed down to the two context command types.

**Methods:**

- `addHandler(handler: (interaction: InteractionData) => Promise<void> | void)` - Adds the command execution handler

### `ComponentHandler`

Handler for message components.

**Constructor:**

- `new ComponentHandler<T extends MessageComponentType = MessageComponentType>(prefix: string, handler?: Function)` - Creates a handler for components with the given prefix

`MessageComponentType` is a union of `ComponentType` values that represent message components (e.g., Button, StringSelectMenu).

**Methods:**

- `addHandler(handler: (interaction: MessageComponentInteraction<T>) => Promise<void> | void)` - Adds or replaces the component handler function

### `ModalHandler`

Handler for modal submissions.

**Constructor:**

- `new ModalHandler(prefix: string, handler?: Function)` - Creates a handler for modals with the given prefix

**Methods:**

- `addHandler(handler: (interaction: ModalInteraction) => Promise<void> | void)` - Adds or replaces the modal submit handler function

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
