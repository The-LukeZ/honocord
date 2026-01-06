# Features

Honocord brings together the power of Discord's Interaction API and Hono's lightweight framework with a focus on developer experience and edge computing.

_Yes, AI helped me build this - with the focus on **helped**._

## 🚀 Core Features

---

### Type-Safe Development

Full TypeScript support throughout the entire stack:

- **End-to-End Types** - From handlers to Discord API responses
- **Autocomplete & IntelliSense** - IDE support for all methods and properties
- **Type Guards** - Runtime type checking with TypeScript inference
- **Custom Environment Types** - Extend with your own bindings and variables

```typescript
// TypeScript knows the exact type
const name = interaction.options.getString("name", true); // string
const count = interaction.options.getInteger("count"); // number | null

if (interaction.inGuild()) {
  const guildId = interaction.guildId; // TypeScript knows this exists
}
```

---

### Handler-Based Architecture

Clean, modular code organization:

```typescript
// Define handlers separately
const pingCommand = new SlashCommandHandler()
  .setName("ping")
  .setDescription("Pong!")
  .addHandler(async (interaction) => {
    await interaction.reply("🏓 Pong!");
  });

// Load them together
bot.loadHandlers(pingCommand, greetCommand, buttonHandler);
```

**Benefits:**

- **Separation of Concerns** - Each handler is self-contained
- **Easy Testing** - Test handlers in isolation
- **Reusability** - Share handlers across projects
- **Hot Reloading** - Change handlers without restarting (in dev mode)

---

## 💬 Interaction Support

### Slash Commands

Full-featured slash command support:

- **Options & Validation** - String, integer, boolean, user, role, channel, and more
- **Subcommands & Groups** - Organize complex command structures
- **Required & Optional** - Fine-grained control over user input
- **Autocomplete** - Real-time suggestions as users type

```typescript
const searchCommand = new SlashCommandHandler()
  .setName("search")
  .setDescription("Search for items")
  .addStringOption((option) =>
    option.setName("query").setDescription("What to search for").setAutocomplete(true).setRequired(true)
  )
  .addHandler(handleSearch)
  .addAutocompleteHandler(handleAutocomplete);
```

---

### Context Menus

Right-click context menu commands:

- **User Commands** - Actions on users (ban, view profile, etc.)
- **Message Commands** - Actions on messages (report, translate, etc.)

```typescript
const reportUser = new ContextCommandHandler()
  .setName("Report User")
  .setType(ApplicationCommandType.User)
  .addHandler(async (interaction) => {
    const user = interaction.targetUser;
    // Handle report...
  });
```

---

### Message Components

Interactive buttons and select menus:

- **Buttons** - Primary, secondary, success, danger, link styles
- **Select Menus** - String, user, role, channel, mentionable options
- **Prefix Matching** - One handler for multiple related components
- **Parameter Passing** - Pass data through custom IDs

```typescript
// Create a button
new ButtonBuilder().setCustomId("confirm/action?1234567890").setLabel("Confirm").setStyle(ButtonStyle.Success);

// Handle with prefix matching
const confirmHandler = new ComponentHandler("confirm").addHandler(async (interaction) => {
  const { firstParam } = parseCustomId(interaction.custom_id);
  // Use param...
});
```

---

### Modals (Forms)

Full modal/form support:

- **Text Inputs** - Short and paragraph styles
- **Validation** - Min/max length, required fields
- **Field Access** - Type-safe field resolution
- **Flexible Triggers** - Show from commands or components

```typescript
await interaction.showModal(
  new ModalBuilder({
    custom_id: "feedback",
    title: "Send Feedback",
  }).addLabelComponents(
    new LabelBuilder()
      .setLabel("Your Feedback")
      .setTextInputComponent((input) => input.setCustomId("message").setStyle(TextInputStyle.Paragraph).setRequired(true))
  )
);
```

---

## 🔧 Developer Experience

### Minimal Boilerplate

_Well, I tried at least..._

Get started in seconds:

```typescript
import { Honocord, SlashCommandHandler } from "honocord";

const bot = new Honocord();

bot.loadHandlers(
  new SlashCommandHandler()
    .setName("ping")
    .setDescription("Pong!")
    .addHandler(async (i) => await i.reply("Pong!"))
);

export default bot.getApp();
```

---

### Built-in Utilities

Helpful utilities included:

**Custom ID Parser:**

```typescript
const { prefix, component, params } = parseCustomId("action/button?user123");
```

**Autocomplete Helper:**

```typescript
const autocompleteResponse = new AutocompleteHelper("query", interaction.user)
  .addChoices({ name: "Option 1", value: "opt1" })
  .response(); // Automatically filters
await interaction.respond(autocompleteResponse); // Sends filtered choices
```

**Color Constants:**

```typescript
import { Colors } from "honocord";

const embed = new EmbedBuilder().setColor(Colors.Blue);
```

**Command Registration:**

```typescript
await registerCommands(token, appId, ...handlers);
// You can also pass a single array
await registerCommands(token, appId, handlers);
```

---

### Flexible Integration

Use Honocord your way:

**Standalone App:**

```typescript
const bot = new Honocord();
export default bot.getApp();
```

**Custom Hono Integration:**

```typescript
const app = new Hono();
app.get("/", (c) => c.text("Hello"));
app.post("/interactions", bot.handle);
```

**With Middleware:**

```typescript
app.use("*", logger());
app.use("*", cors());
app.post("/interactions", bot.handle);
```

---

## 🔐 Security

### Automatic Signature Verification

Every request is automatically verified by the same logic [discord-interactions](https://github.com/discord/discord-interactions-js) has (without the extra dependency).

---

### Environment-Based Configuration

Keep secrets secure:

```typescript
// Access through context
const token = interaction.context.env.DISCORD_TOKEN;

// Never hardcoded
const bot = new Honocord(); // Uses env vars automatically
```

---

## ⚡ Performance

### Efficient Routing

Optimized handler lookup:

- **Commands, Components and Modals**: O(1) hash map lookup by name/custom_id-prefix
- **Minimal Overhead**: Direct API access, no unnecessary layers (except the discordjs API wrapper and REST client)

---

### Deferred Responses

Handle long-running operations:

```typescript
await interaction.deferReply();

// Do expensive work
await processLargeDataset();

// Update when ready
await interaction.editReply("Complete!");
```

---

### Ephemeral Messages

Reduce server clutter:

```typescript
// Only visible to user
await interaction.reply("Secret info", true);
```

---

## 🎨 Rich Content

### Discord.js Builders

Re-exports most important builders like EmbedBuilder and Components V2 Builders.

```typescript
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder } from "honocord";

const embed = new EmbedBuilder().setTitle("Hello!").setColor(Colors.Blue).setDescription("Welcome to the server");

const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder().setCustomId("welcome").setLabel("Get Started").setStyle(1) // Primary Style
);

await interaction.reply({
  embeds: [embed],
  components: [row],
});

// Or with Components V2
import { ContainerBuilder, TextDisplayBuilder, Colors } from "honocord";

const container = new ContainerBuilder().setAccentColor(Colors.Green).addTextDisplayComponents(
  new TextDisplayBuilder().setContent("# Hello, world!");
)

await interaction.reply({
  components: [container],
});
```

You don't need to call `.toJSON()` manually - Honocord does it for you. Discord.js inspired.

---

## 🌍 Deployment Options

### Cloudflare Workers

Deploy globally in seconds:

```bash
wrangler deploy
```

Cloudflare Workers has some unique configurations that Honocord needs to function. See the [Cloudflare Workers Deployment Guide](/wiki/Deployment-Guide#cloudflare-workers) for details.

---

### Traditional Servers

Works anywhere Node.js runs:

```bash
node index.js
# or
bun run index.ts
```

---

### Docker

Containerize your bot:

```dockerfile
FROM oven/bun:1
COPY . .
RUN bun install
CMD ["bun", "run", "index.ts"]
```

---

## 📦 Lightweight

### Minimal Dependencies

Honocord only requires:

- `hono` - Web framework
- `discord-api-types` - Type definitions
- `@discordjs/core` - API wrapper
- `@discordjs/rest` - HTTP REST client
- `@discordjs/builders` - Builders

---

### TypeScript First

Written in TypeScript, designed for TypeScript:

- Source maps included
- Full type inference
- JSDoc comments
- Declaration files

---

### Extensible

Extend with custom types:

```typescript
interface MyEnv {
  DATABASE: D1Database;
  CACHE: KVNamespace;
}

type MyContext = BaseInteractionContext<MyEnv>;

// Now fully typed in handlers
new SlashCommandHandler<MyContext>().addHandler(async (interaction) => {
  const db = interaction.context.env.DATABASE;
  const cache = interaction.context.env.CACHE;
});
```

---

### Rate Limit Handling

Respects Discord rate limits automatically via `@discordjs/rest`.

---

### Monitoring

Built-in debug logging:

```typescript
const bot = new Honocord({
  debugRest: true, // Log all REST requests
});
```
