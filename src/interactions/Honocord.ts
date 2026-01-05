import {
  APIApplicationCommandAutocompleteInteraction,
  APIApplicationCommandInteraction,
  ApplicationCommandType,
  InteractionResponseType,
  InteractionType,
} from "discord-api-types/v10";
import { ChatInputCommandInteraction } from "./ChatInputInteraction";
import { API } from "@discordjs/core/http-only";
import { REST } from "@discordjs/rest";
import { Hono } from "hono";
import { verifyDiscordRequest } from "@utils/discordVerify";
import { parseCustomId } from "@utils/index";
import type { BaseVariables, BaseInteractionContext, ValidInteraction } from "../types";
import { UserCommandInteraction } from "./UserContextCommandInteraction";
import { MessageCommandInteraction } from "./MessageContextCommandInteraction";
import { MessageComponentInteraction } from "./MessageComponentInteraction";
import { ModalInteraction } from "./ModalInteraction";
import { AutocompleteInteraction } from "./AutocompleteInteraction";
import { SlashCommandHandler, ContextCommandHandler, ComponentHandler, ModalHandler, type Handler } from "./handlers";

export class Honocord {
  private api: API;
  private commandHandlers: Map<string, SlashCommandHandler | ContextCommandHandler> = new Map();
  private componentHandlers: ComponentHandler[] = [];
  private modalHandlers: ModalHandler[] = [];

  constructor(discordToken?: string) {
    if (!discordToken) {
      throw new TypeError("A Discord token must be provided to InteractionHandler");
    }
    this.api = new API(new REST({ authPrefix: "Bot" }).setToken(discordToken));
  }

  /**
   * Registers handlers for interactions.
   *
   * @param handlers - Array of CommandHandler, ComponentHandler, or ModalHandler instances
   *
   * @example
   * ```typescript
   * import { HonoCord, CommandHandler, ComponentHandler, ModalHandler, HonocordSlashCommandBuilder } from "honocord";
   *
   * const honoCord = new HonoCord("YOUR_BOT_TOKEN");
   *
   * // Command handler with autocomplete
   * const searchCommand = new HonocordSlashCommandBuilder()
   *   .setName("search")
   *   .setDescription("Search for something")
   *   .addStringOption(option =>
   *     option.setName("query")
   *       .setDescription("Search query")
   *       .setAutocomplete(true)
   *   )
   *   .handler(async (interaction) => {
   *     const query = interaction.options.getString("query", true);
   *     await interaction.reply(`Searching for: ${query}`);
   *   })
   *   .autocomplete(async (interaction) => {
   *     const focused = interaction.options.getFocused();
   *     await interaction.respond([
   *       { name: "Option 1", value: "opt1" },
   *       { name: "Option 2", value: "opt2" }
   *     ]);
   *   });
   *
   * // Component handler (for buttons, select menus with custom_id prefix)
   * const buttonHandler = new ComponentHandler("mybutton", async (interaction) => {
   *   await interaction.reply("Button clicked!");
   * });
   *
   * // Modal handler (for modals with custom_id prefix)
   * const modalHandler = new ModalHandler("mymodal", async (interaction) => {
   *   const value = interaction.fields.getTextInputValue("field_id");
   *   await interaction.reply(`You submitted: ${value}`);
   * });
   *
   * honoCord.loadHandlers(
   *   new CommandHandler(searchCommand),
   *   buttonHandler,
   *   modalHandler
   * );
   * ```
   */
  loadHandlers(...handlers: Handler[]): void {
    for (const handler of handlers) {
      if (handler instanceof SlashCommandHandler || handler instanceof ContextCommandHandler) {
        if (this.commandHandlers.has(handler.name)) {
          console.warn(`Command handler for "${handler.name}" already exists. Overwriting.`);
        }
        this.commandHandlers.set(handler.name, handler);
      } else if (handler instanceof ComponentHandler) {
        // Check for duplicate prefixes
        const existing = this.componentHandlers.find((h) => h.prefix === handler.prefix);
        if (existing) {
          console.warn(`Component handler with prefix "${handler.prefix}" already exists. Overwriting.`);
          this.componentHandlers = this.componentHandlers.filter((h) => h.prefix !== handler.prefix);
        }
        this.componentHandlers.push(handler);
      } else if (handler instanceof ModalHandler) {
        // Check for duplicate prefixes
        const existing = this.modalHandlers.find((h) => h.prefix === handler.prefix);
        if (existing) {
          console.warn(`Modal handler with prefix "${handler.prefix}" already exists. Overwriting.`);
          this.modalHandlers = this.modalHandlers.filter((h) => h.prefix !== handler.prefix);
        }
        this.modalHandlers.push(handler);
      }
    }
  }

  private createCommandInteraction(ctx: BaseInteractionContext, interaction: APIApplicationCommandInteraction) {
    switch (interaction.data.type) {
      case ApplicationCommandType.ChatInput:
        return new ChatInputCommandInteraction(this.api, interaction as any, ctx);
      case ApplicationCommandType.User:
        return new UserCommandInteraction(this.api, interaction as any, ctx);
      case ApplicationCommandType.Message:
        return new MessageCommandInteraction(this.api, interaction as any, ctx);
      default:
        throw new Error(
          `Unsupported application command type: ${interaction.data.type} (${ApplicationCommandType[interaction.data.type]})`
        );
    }
  }

  private async handleCommandInteraction(ctx: BaseInteractionContext, interaction: APIApplicationCommandInteraction) {
    const interactionObj = this.createCommandInteraction(ctx, interaction);
    const commandName = interaction.data.name;
    const handler = this.commandHandlers.get(commandName);

    if (handler) {
      try {
        if (handler instanceof SlashCommandHandler && interaction.data.type === ApplicationCommandType.ChatInput) {
          await handler.execute(interactionObj as ChatInputCommandInteraction);
        } else if (handler instanceof ContextCommandHandler) {
          if (interaction.data.type === ApplicationCommandType.User) {
            await handler.execute(interactionObj as UserCommandInteraction);
          } else if (interaction.data.type === ApplicationCommandType.Message) {
            await handler.execute(interactionObj as MessageCommandInteraction);
          }
        }
      } catch (error) {
        console.error(`Error executing command handler for "${commandName}":`, error);
        throw error;
      }
    }

    return interactionObj;
  }

  private async handleAutocompleteInteraction(
    ctx: BaseInteractionContext,
    interaction: APIApplicationCommandAutocompleteInteraction
  ) {
    const interactionObj = new AutocompleteInteraction(this.api, interaction, ctx);
    const commandName = interaction.data.name;
    const handler = this.commandHandlers.get(commandName);

    if (handler && handler instanceof SlashCommandHandler) {
      try {
        await handler.executeAutocomplete(interactionObj);
      } catch (error) {
        console.error(`Error executing autocomplete handler for "${commandName}":`, error);
        throw error;
      }
    }

    return interactionObj;
  }

  private async handleComponentInteraction(
    ctx: BaseInteractionContext,
    interaction: Extract<ValidInteraction, { type: InteractionType.MessageComponent }>
  ) {
    const interactionObj = new MessageComponentInteraction(this.api, interaction, ctx);
    const customId = interaction.data.custom_id;
    const prefix = parseCustomId(customId, true);

    // Find matching handler by prefix
    const handler = this.componentHandlers.find((h) => h.matches(customId));

    if (handler) {
      try {
        await handler.execute(interactionObj);
      } catch (error) {
        console.error(`Error executing component handler for prefix "${prefix}":`, error);
        throw error;
      }
    }

    return interactionObj;
  }

  private async handleModalInteraction(
    ctx: BaseInteractionContext,
    interaction: Extract<ValidInteraction, { type: InteractionType.ModalSubmit }>
  ) {
    const interactionObj = new ModalInteraction(this.api, interaction, ctx);
    const customId = interaction.data.custom_id;
    const prefix = parseCustomId(customId, true);

    // Find matching handler by prefix
    const handler = this.modalHandlers.find((h) => h.matches(customId));

    if (handler) {
      try {
        await handler.execute(interactionObj);
      } catch (error) {
        console.error(`Error executing modal handler for prefix "${prefix}":`, error);
        throw error;
      }
    }

    return interactionObj;
  }

  private async createInteraction(ctx: BaseInteractionContext, interaction: ValidInteraction) {
    switch (interaction.type) {
      case InteractionType.ApplicationCommand:
        return await this.handleCommandInteraction(ctx, interaction);
      case InteractionType.MessageComponent:
        return await this.handleComponentInteraction(ctx, interaction);
      case InteractionType.ModalSubmit:
        return await this.handleModalInteraction(ctx, interaction);
      case InteractionType.ApplicationCommandAutocomplete:
        return await this.handleAutocompleteInteraction(ctx, interaction);
      default:
        throw new Error(`Unknown interaction type: ${(interaction as any).type} (${InteractionType[(interaction as any).type]})`);
    }
  }

  /**
   * Returns a Hono handler for POST Requests handling Discord interactions.
   *
   * It is important, that
   *
   * @example
   * ```typescript
   * import { Hono } from "hono";
   * import { HonoCord } from "honocord";
   *
   * const app = new Hono();
   * const honoCord = new HonoCord("YOUR_BOT_TOKEN_HERE");
   *
   * app.post("/interactions", honoCord.handle);
   *
   * export default app;
   * ```
   */
  handle = async (c: BaseInteractionContext) => {
    // Verify the request
    const { isValid, interaction } = await verifyDiscordRequest(c.req, (c.env as any).DISCORD_PUBLIC_KEY as string);
    if (!isValid) {
      return c.text("Bad request signature.", 401);
    } else if (!interaction) {
      console.log("No interaction found in request");
      return c.text("No interaction found.", 400);
    }

    if (interaction.type === InteractionType.Ping) {
      return c.json({ type: InteractionResponseType.Pong });
    }

    try {
      await this.createInteraction(c, interaction);
    } catch (error) {
      console.error("Error handling interaction:", error);
      return c.text("Internal server error.", 500);
    }
  };

  /**
   * Returns a Hono App instance with the interaction handler mounted at the root path and a GET Handler for all paths, which returns a simple Health response.
   *
   * @exampletypescript
   * ```typescript
   * import { HonoCord } from "honocord";
   *
   * const honoCord = new HonoCord("YOUR_BOT_TOKEN_HERE");
   *
   * export default honoCord.getApp();
   * ```
   */
  getApp() {
    const app = new Hono<{ Variables: BaseVariables }>();
    app.get("*", (c) => c.text("🔥 HonoCord is running!"));
    app.post("/", this.handle);
    return app;
  }
}
