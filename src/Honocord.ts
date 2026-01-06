import {
  APIApplicationCommandAutocompleteInteraction,
  APIApplicationCommandInteraction,
  ApplicationCommandType,
  InteractionResponseType,
  InteractionType,
} from "discord-api-types/v10";
import { ChatInputCommandInteraction } from "@ctx/ChatInputInteraction";
import { API } from "@discordjs/core/http-only";
import { REST } from "@discordjs/rest";
import { Hono } from "hono";
import { verifyDiscordRequest } from "@utils/discordVerify";
import { parseCustomId } from "@utils/index";
import type {
  BaseVariables,
  BaseInteractionContext,
  ValidInteraction,
  MessageComponentInteractionPayload,
  MessageComponentType,
  FlatOrNestedArray,
} from "./types";
import { UserContextInteraction } from "@ctx/UserContextCommandInteraction";
import { MessageContextInteraction } from "@ctx/MessageContextCommandInteraction";
import { MessageComponentInteraction } from "@ctx/MessageComponentInteraction";
import { ModalInteraction } from "@ctx/ModalInteraction";
import { AutocompleteInteraction } from "@ctx/AutocompleteInteraction";
import { SlashCommandHandler, ContextCommandHandler, ComponentHandler, ModalHandler, type Handler } from "@ctx/handlers";

interface HonocordOptions {
  /**
   * Indicates whether the Honocord instance is running on Cloudflare Workers.
   *
   * This affects how interactions are processed, allowing for asynchronous handling using the Workers' execution context.
   *
   * @default c.env.IS_CF_WORKER === "true" # later determined from environment variable
   */
  isCFWorker?: boolean;
  /**
   * Whether to turn on debug logging for REST API requests.
   *
   * @default false
   */
  debugRest?: boolean;
}

export class Honocord {
  private commandHandlers: Map<string, SlashCommandHandler | ContextCommandHandler> = new Map();
  private componentHandlers: ComponentHandler[] = [];
  private modalHandlers: ModalHandler[] = [];
  private isCFWorker: boolean;
  private debugRest: boolean;

  constructor({ isCFWorker, debugRest }: HonocordOptions = {}) {
    this.isCFWorker = isCFWorker ?? false;
    this.debugRest = debugRest ?? false;
  }

  /**
   * Registers handlers for interactions.
   *
   * @param handlers - Array of CommandHandler, ComponentHandler, or ModalHandler instances
   *
   * For an example of usage, see the [Example Repository](https://github.com/The-LukeZ/honocord-examples).
   */
  loadHandlers(...handlers: FlatOrNestedArray<Handler>): void {
    const flattenedHandlers = handlers.flat(Infinity) as Handler[];

    for (const handler of flattenedHandlers) {
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

  private createCommandInteraction(ctx: BaseInteractionContext, interaction: APIApplicationCommandInteraction, api: API) {
    switch (interaction.data.type) {
      case ApplicationCommandType.ChatInput:
        return new ChatInputCommandInteraction(api, interaction as any, ctx);
      case ApplicationCommandType.User:
        return new UserContextInteraction(api, interaction as any, ctx);
      case ApplicationCommandType.Message:
        return new MessageContextInteraction(api, interaction as any, ctx);
      default:
        throw new Error(
          `Unsupported application command type: ${interaction.data.type} (${ApplicationCommandType[interaction.data.type]})`
        );
    }
  }

  private async handleCommandInteraction(ctx: BaseInteractionContext, interaction: APIApplicationCommandInteraction, api: API) {
    const interactionObj = this.createCommandInteraction(ctx, interaction, api);
    const commandName = interaction.data.name;
    const handler = this.commandHandlers.get(commandName);

    if (handler) {
      try {
        if (handler instanceof SlashCommandHandler && interaction.data.type === ApplicationCommandType.ChatInput) {
          await handler.execute(interactionObj as ChatInputCommandInteraction);
        } else if (handler instanceof ContextCommandHandler) {
          if (interaction.data.type === ApplicationCommandType.User) {
            await handler.execute(interactionObj as UserContextInteraction);
          } else if (interaction.data.type === ApplicationCommandType.Message) {
            await handler.execute(interactionObj as MessageContextInteraction);
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
    interaction: APIApplicationCommandAutocompleteInteraction,
    api: API
  ) {
    const interactionObj = new AutocompleteInteraction(api, interaction, ctx);
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

  private async handleComponentInteraction<T extends MessageComponentType>(
    ctx: BaseInteractionContext,
    interaction: MessageComponentInteractionPayload<T>,
    api: API
  ) {
    const interactionObj = new MessageComponentInteraction<T>(api, interaction, ctx);
    const prefix = parseCustomId(interaction.data.custom_id, true);

    // Find matching handler by prefix
    const handler = this.componentHandlers.find((h) => h.matches(prefix));
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
    interaction: Extract<ValidInteraction, { type: InteractionType.ModalSubmit }>,
    api: API
  ) {
    const interactionObj = new ModalInteraction(api, interaction, ctx);
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
    const rest = new REST({ authPrefix: "Bot" }).setToken(ctx.env.DISCORD_TOKEN as string);
    if (this.debugRest) {
      rest
        .addListener("response", (request, response) => {
          console.debug(
            `[REST] ${request.method} ${request.path} -> ${response.status} ${response.statusText} (${request.route})`
          );
        })
        .addListener("restDebug", (info) => {
          console.debug(`[REST DEBUG] ${info}`);
        });
    }
    const api = new API(rest);

    switch (interaction.type) {
      case InteractionType.ApplicationCommand:
        return await this.handleCommandInteraction(ctx, interaction, api);
      case InteractionType.MessageComponent:
        return await this.handleComponentInteraction(ctx, interaction, api);
      case InteractionType.ModalSubmit:
        return await this.handleModalInteraction(ctx, interaction, api);
      case InteractionType.ApplicationCommandAutocomplete:
        return await this.handleAutocompleteInteraction(ctx, interaction, api);
      default:
        throw new Error(`Unknown interaction type: ${(interaction as any).type} (${InteractionType[(interaction as any).type]})`);
    }
  }

  /**
   * Returns a Hono handler for POST Requests handling Discord interactions.
   *
   * @example
   * ```typescript
   * import { Hono } from "hono";
   * import { HonoCord } from "honocord";
   *
   * const app = new Hono();
   * const bot = new Honocord();
   *
   * app.get("/", (c) => c.text("🔥 HonoCord is running!"));
   * app.post("/interactions", bot.handle);
   *
   * export default app;
   * ```
   */
  handle = async (c: BaseInteractionContext) => {
    // Check if running on CF Workers
    const isCFWorker = this.isCFWorker || c.env.IS_CF_WORKER === "true";

    // Verify the request
    const { isValid, interaction } = await verifyDiscordRequest(c.req, c.env.DISCORD_PUBLIC_KEY as string);
    if (!isValid) {
      return c.text("Bad request signature.", 401);
    } else if (!interaction) {
      console.log("No interaction found in request");
      return c.text("No interaction found.", 400);
    }

    if (interaction.type === InteractionType.Ping) {
      console.log("Received Discord Ping");
      return c.json({ type: InteractionResponseType.Pong });
    }

    // Handle CF Workers execution context
    if (isCFWorker && c.executionCtx?.waitUntil) {
      // Process interaction asynchronously
      c.executionCtx.waitUntil(
        new Promise(async (resolve) => {
          try {
            await this.createInteraction(c, interaction);
          } catch (error) {
            console.error("Error handling interaction:", error);
          }
          resolve(undefined);
        })
      );
      return c.json({}, 202); // Accepted for processing
    }

    // Standard non-CF Workers execution
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
   * @example
   * ```typescript
   * import { Honocord } from "honocord";
   *
   * const honoCord = new Honocord();
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
