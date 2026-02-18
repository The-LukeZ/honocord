import {
  APIApplicationCommandAutocompleteInteraction,
  APIApplicationCommandInteraction,
  APIInteraction,
  APIWebhookEvent,
  ApplicationCommandType,
  ApplicationWebhookType,
  ComponentType,
  InteractionResponseType,
  InteractionType,
} from "discord-api-types/v10";
import { ChatInputCommandInteraction } from "@ctx/ChatInputInteraction";
import { API } from "@discordjs/core/http-only";
import { REST } from "@discordjs/rest";
import { Context, Hono } from "hono";
import { verifyDiscordRequest } from "@utils/discordVerify";
import { parseCustomId } from "@utils/index";
import type {
  BaseVariables,
  BaseInteractionContext,
  ValidInteraction,
  MessageComponentInteractionPayload,
  MessageComponentType,
  FlatOrNestedArray,
  MiddlewareFunction,
  ApplicationWebhookEventType,
} from "$types/index";
import { UserContextInteraction } from "@ctx/UserContextCommandInteraction";
import { MessageContextInteraction } from "@ctx/MessageContextCommandInteraction";
import { ModalInteraction } from "@ctx/ModalInteraction";
import { AutocompleteInteraction } from "@ctx/AutocompleteInteraction";
import {
  SlashCommandHandler,
  ContextCommandHandler,
  ComponentHandler,
  ModalHandler,
  type Handler,
  type AnyHandler,
  WebhookEventHandler,
} from "@handlers/index";
import { ButtonInteraction } from "@ctx/ButtonInteraction";
import { StringSelectInteraction } from "@ctx/StringSelectInteraction";
import { UserSelectInteraction } from "@ctx/UserSelectInteraction";
import { RoleSelectInteraction } from "@ctx/RoleSelectInteraction";
import { MentionableSelectInteraction } from "@ctx/MentionableSelectInteraction";
import { ChannelSelectInteraction } from "@ctx/ChannelSelectInteraction";
import { BaseCacheAdapter, NullCacheAdapter } from "@honocord/cache-base";
import { CacheManager } from "@utils/CacheManager";

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

interface HonocordAppOptions {
  interactionsPath?: `/${string}`;
  webhookPath?: `/${string}`;
}

export class Honocord {
  /**
   * Map of commandName to CommandHandler instances for global commands.
   */
  private globalCommandHandlers = new Map<string, SlashCommandHandler | ContextCommandHandler>();
  /**
   * Map of `guildId:commandName` to CommandHandler instances for guild-specific commands.
   */
  private guildCommandHandlers = new Map<string, SlashCommandHandler | ContextCommandHandler>();
  private componentHandlers = new Map<string, ComponentHandler>();
  private modalHandlers = new Map<string, ModalHandler>();
  private middleware = new Array<MiddlewareFunction<any>>();
  private webhookHandlers = new Map<ApplicationWebhookEventType, WebhookEventHandler<any>>();
  private isCFWorker: boolean;
  private debugRest: boolean;
  private _cacheAdapterFactory: (env: any) => BaseCacheAdapter = () => new NullCacheAdapter();
  private _cacheManager: CacheManager | null = null;
  private _defaultCacheTtlMs: number | undefined = undefined; // ← add this

  /**
   * Executes all registered middleware in sequence.
   *
   * @param ctx - The interaction context
   * @param finalHandler - The final handler to execute after all middleware
   */
  private async runMiddleware(ctx: BaseInteractionContext, finalHandler: () => Promise<void>): Promise<void> {
    if (this.middleware.length === 0) {
      return await finalHandler();
    }

    /**
     * Executes the next middleware in the chain.
     */
    const dispatch = async (i: number = 0): Promise<void> => {
      if (i >= this.middleware.length) {
        return await finalHandler();
      }

      await this.middleware[i](ctx, () => dispatch(i + 1));
    };

    await dispatch();
  }

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
  loadHandlers(...handlers: FlatOrNestedArray<AnyHandler>): void {
    const flattenedHandlers = handlers.flat(Infinity) as Handler[];

    for (const handler of flattenedHandlers) {
      if (handler instanceof SlashCommandHandler || handler instanceof ContextCommandHandler) {
        if (handler.isGuildCommand()) {
          for (const guildId of handler.guildIds.values()) {
            const key = `${guildId}:${handler.name}`;
            if (this.guildCommandHandlers.has(key)) {
              console.warn(`Guild command handler for "${handler.name}" in guild "${guildId}" already exists. Overwriting.`);
            }
            this.guildCommandHandlers.set(key, handler as SlashCommandHandler | ContextCommandHandler);
          }
          continue;
        }

        if (this.globalCommandHandlers.has(handler.name)) {
          console.warn(`Command handler for "${handler.name}" already exists. Overwriting.`);
        }
        this.globalCommandHandlers.set(handler.name, handler as SlashCommandHandler | ContextCommandHandler);
      } else if (handler instanceof ComponentHandler) {
        const prefix = handler.prefix;
        if (this.componentHandlers.has(prefix)) {
          console.warn(`Component handler with prefix "${prefix}" already exists. Overwriting.`);
        }
        this.componentHandlers.set(prefix, handler as ComponentHandler<any>);
      } else if (handler instanceof ModalHandler) {
        const prefix = handler.prefix;
        if (this.modalHandlers.has(prefix)) {
          console.warn(`Modal handler with prefix "${prefix}" already exists. Overwriting.`);
        }
        this.modalHandlers.set(prefix, handler);
      } else if (handler instanceof WebhookEventHandler) {
        if (this.webhookHandlers.has(handler.eventType)) {
          console.warn(`Webhook handler for event type "${handler.eventType}" already exists. Overwriting.`);
        }
        this.webhookHandlers.set(handler.eventType, handler);
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

  private executeCommandHandler(
    handler: SlashCommandHandler | ContextCommandHandler,
    interactionObj: ReturnType<typeof this.createCommandInteraction>,
    commandType: ApplicationCommandType
  ) {
    if (handler instanceof SlashCommandHandler && commandType === ApplicationCommandType.ChatInput) {
      return handler.execute(interactionObj as ChatInputCommandInteraction);
    } else if (handler instanceof ContextCommandHandler) {
      if (commandType === ApplicationCommandType.User) {
        return handler.execute(interactionObj as UserContextInteraction);
      } else if (commandType === ApplicationCommandType.Message) {
        return handler.execute(interactionObj as MessageContextInteraction);
      }
    }
  }

  private async handleCommandInteraction(ctx: BaseInteractionContext, interaction: APIApplicationCommandInteraction, api: API) {
    const interactionObj = this.createCommandInteraction(ctx, interaction, api);
    const commandName = interaction.data.name;
    const handler = this.globalCommandHandlers.get(commandName);

    // Store interaction in context for middleware access
    ctx.set("command", interactionObj as any);

    await this.runMiddleware(ctx, async () => {
      if (handler) {
        try {
          await this.executeCommandHandler(handler, interactionObj, interaction.data.type);
        } catch (error) {
          console.error(`Error executing command handler for "${commandName}"`, error);
          throw error;
        }
      }

      // Could be a guild command
      const guildId = interaction.guild_id;
      if (guildId) {
        const key = `${guildId}:${commandName}`;
        const guildHandler = this.guildCommandHandlers.get(key);
        if (guildHandler) {
          try {
            await this.executeCommandHandler(guildHandler, interactionObj, interaction.data.type);
          } catch (error) {
            console.error(`Error executing guild command handler for "${commandName}" in guild "${guildId}"`, error);
            throw error;
          }
        }
      }
    });

    return interactionObj;
  }

  private async handleAutocompleteInteraction(
    ctx: BaseInteractionContext,
    interaction: APIApplicationCommandAutocompleteInteraction,
    api: API
  ) {
    const interactionObj = new AutocompleteInteraction(api, interaction, ctx);
    const commandName = interaction.data.name;
    const handler = this.globalCommandHandlers.get(commandName);

    // Store interaction in context for middleware access
    ctx.set("autocomplete", interactionObj as any);

    await this.runMiddleware(ctx, async () => {
      if (handler && handler instanceof SlashCommandHandler) {
        try {
          await handler.executeAutocomplete(interactionObj);
        } catch (error) {
          console.error(`Error executing autocomplete handler for "${commandName}"`, error);
          throw error;
        }
      }

      // Could be a guild command
      const guildId = interaction.guild_id;
      if (guildId) {
        const key = `${guildId}:${commandName}`;
        const guildHandler = this.guildCommandHandlers.get(key);
        if (guildHandler && guildHandler instanceof SlashCommandHandler) {
          try {
            await guildHandler.executeAutocomplete(interactionObj);
          } catch (error) {
            console.error(`Error executing guild autocomplete handler for "${commandName}" in guild "${guildId}"`, error);
            throw error;
          }
        }
      }
    });
  }

  private createMessageComponentInteraction<T extends MessageComponentType>(
    ctx: BaseInteractionContext,
    interactionObj: MessageComponentInteractionPayload<T>,
    api: API
  ) {
    switch (interactionObj.data.component_type) {
      case ComponentType.Button:
        return new ButtonInteraction(api, interactionObj as any, ctx);
      case ComponentType.StringSelect:
        return new StringSelectInteraction(api, interactionObj as any, ctx);
      case ComponentType.UserSelect:
        return new UserSelectInteraction(api, interactionObj as any, ctx);
      case ComponentType.RoleSelect:
        return new RoleSelectInteraction(api, interactionObj as any, ctx);
      case ComponentType.MentionableSelect:
        return new MentionableSelectInteraction(api, interactionObj as any, ctx);
      case ComponentType.ChannelSelect:
        return new ChannelSelectInteraction(api, interactionObj as any, ctx);
      default:
        throw new Error(`Unsupported message component type: ${(interactionObj.data as any).component_type}`);
    }
  }

  private async handleComponentInteraction<T extends MessageComponentType>(
    ctx: BaseInteractionContext,
    interaction: MessageComponentInteractionPayload<T>,
    api: API
  ) {
    const interactionObj = this.createMessageComponentInteraction(ctx, interaction, api);
    const prefix = parseCustomId(interaction.data.custom_id, true);

    // Store interaction in context for middleware access
    ctx.set("component", interactionObj as any);

    await this.runMiddleware(ctx, async () => {
      // Lookup handler by prefix
      const handler = this.componentHandlers.get(prefix);
      if (handler?.componentType === interaction.data.component_type) {
        try {
          await handler.execute(interactionObj);
        } catch (error) {
          console.error(`Error executing component handler for prefix "${prefix}"`, error);
          throw error;
        }
      } else {
        throw new Error(
          `No component handler found for prefix "${prefix}" and component type "${interaction.data.component_type}"`
        );
      }
    });

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

    // Store interaction in context for middleware access
    ctx.set("modal", interactionObj);

    await this.runMiddleware(ctx, async () => {
      // Lookup handler by prefix
      const handler = this.modalHandlers.get(prefix);

      if (handler) {
        try {
          await handler.execute(interactionObj);
        } catch (error) {
          console.error(`Error executing modal handler for prefix "${prefix}"`, error);
          throw error;
        }
      }
    });

    return interactionObj;
  }

  private async createInteraction(ctx: BaseInteractionContext, interaction: ValidInteraction) {
    ctx.set("cache", this._getCacheManager(ctx.env));

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
   * import { Honocord } from "honocord";
   *
   * const app = new Hono();
   * const bot = new Honocord();
   *
   * app.get("/", (c) => c.text("🔥 Honocord is running!"));
   * app.post("/interactions", bot.interactionsHandler);
   *
   * export default app;
   * ```
   */
  interactionsHandler = async (c: BaseInteractionContext) => {
    // Check if running on CF Workers
    const isCFWorker = this.isCFWorker || c.env.IS_CF_WORKER === "true";

    // Verify the request
    const { isValid, data: interaction } = await verifyDiscordRequest<APIInteraction>(c.req, c.env.DISCORD_PUBLIC_KEY as string);
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
   * // Supports both "/" and "/interactions" for the interactions handler, if any are loaded
   * // And `/webhook` for the webhook handler if any are loaded
   * ```
   */
  getApp(options: HonocordAppOptions = {}) {
    options = {
      interactionsPath: "/interactions",
      webhookPath: "/webhook",
      ...options,
    };
    const app = new Hono<{ Variables: BaseVariables }>();
    app.get("*", (c) => c.text("🔥 Honocord is running!"));
    if (this.globalCommandHandlers.size > 0 || this.guildCommandHandlers.size > 0) {
      app.post("/", this.interactionsHandler);
      app.post(options.interactionsPath || "/interactions", this.interactionsHandler);
    }
    if (this.webhookHandlers.size > 0) app.post(options.webhookPath || "/webhook", this.webhookHandler);
    return app;
  }

  /**
   * Registers a middleware function to process interaction contexts.
   *
   * Middleware receives the Hono context and a `next` callback:
   * - Access/modify context variables via `c.get()` and `c.set()`
   * - Access the interaction object via `c.var.command`, `c.var.component`, `c.var.modal`, or `c.var.autocomplete`
   * - Access environment bindings via `c.env`
   * - Call `await next()` to continue to the next middleware or handler
   *
   * The context is passed by reference, so all modifications persist through the middleware chain and into handlers.
   *
   * @example
   * ```typescript
   * bot.use(async (c, next) => {
   *   // Set custom data in context
   *   c.set('startTime', Date.now());
   *
   *   // Continue to next middleware/handler
   *   // you can also return next() directly if no post-processing is needed
   *   await next();
   *
   *   // Code here runs after the handler completes
   *   console.log('Duration:', Date.now() - c.get('startTime'));
   * });
   * ```
   *
   * @param middleware - The middleware function(s) to register.
   * @returns The Honocord instance for chaining.
   */
  use<Context extends BaseInteractionContext = BaseInteractionContext>(...middleware: MiddlewareFunction<Context>[]): this {
    this.middleware.push(...middleware);
    return this;
  }

  /**
   * Returns a Hono handler for POST requests handling Discord webhook events.
   *
   * On Cloudflare Workers, webhook events are processed asynchronously using `waitUntil`,
   * allowing immediate response to Discord while extending the worker's lifetime to complete processing.
   *
   * @example
   * ```typescript
   * import { Hono } from "hono";
   * import { Honocord } from "honocord";
   *
   * const app = new Hono();
   * const bot = new Honocord();
   *
   * app.post("/webhook", bot.webhookHandler);
   *
   * export default app;
   * ```
   */
  webhookHandler = async (c: Context) => {
    const isCFWorker = this.isCFWorker || c.env.IS_CF_WORKER === "true";

    if (typeof c.env.DISCORD_PUBLIC_KEY !== "string") {
      console.error("No Discord public key provided in environment variables.");
      return c.body(null, 500);
    }
    const { isValid, data } = await verifyDiscordRequest<APIWebhookEvent>(c.req, c.env.DISCORD_PUBLIC_KEY);

    if (!isValid || !data) {
      return c.text("Bad request signature.", 401);
    }

    if (data.type === ApplicationWebhookType.Ping) {
      return c.json({ type: ApplicationWebhookType.Ping }, 200);
    }

    const handler = this.webhookHandlers.get(data.event.type);
    if (!handler) {
      return c.text("No handler found for this event type.", 404);
    }

    // CF Workers async processing
    if (isCFWorker && c.executionCtx?.waitUntil) {
      c.executionCtx.waitUntil(
        new Promise(async (resolve) => {
          try {
            await handler.execute(data.event, c);
          } catch (error) {
            console.error(`Error handling webhook event ${data.event.type}:`, error);
          }
          resolve(undefined);
        })
      );
      return c.json({ ok: true }, 200);
    }

    // Standard execution for other platforms
    return handler.execute(data.event, c);
  };

  /**
   * Registers a cache adapter factory for use throughout the bot.
   * The factory receives the request environment and returns a `BaseCacheAdapter` instance.
   *
   * On Cloudflare Workers, use `DurableObjectCacheAdapter`.
   * On self-hosted environments, use `MemoryCacheAdapter`, `MongoCacheAdapter`, or `RedisAdapter`.
   *
   * @example
   * ```typescript
   * // Cloudflare Workers
   * bot.withCache((env) => new DurableObjectCacheAdapter(env.MY_CACHE));
   *
   * // Self-hosted (pre-initialized)
   * const cache = new MongoCacheAdapter(process.env.MONGO_URI!);
   * await cache.connect();
   * bot.withCache(() => cache);
   * ```
   *
   * @param factory - A function that receives the environment and returns a cache adapter.
   * @returns The Honocord instance for chaining.
   */
  withCache<TheEnv = any>(factory: (env: TheEnv) => BaseCacheAdapter, defaultTtlMs?: number): this {
    this._cacheAdapterFactory = factory;
    this._defaultCacheTtlMs = defaultTtlMs;
    this._cacheManager = null;
    return this;
  }

  /**
   * Returns the cache manager for the given environment.
   * If no cache manager exists for the environment, a new one is created.
   * @param env - The environment to get the cache manager for.
   * @returns The cache manager for the given environment.
   */
  private _getCacheManager(env: unknown): CacheManager {
    if (!this._cacheManager) {
      this._cacheManager = new CacheManager(this._cacheAdapterFactory(env), this._defaultCacheTtlMs);
    }
    return this._cacheManager;
  }

  /**
   * Clears all registered middleware functions.
   * @returns The Honocord instance for chaining.
   */
  clearMiddleware(): this {
    this.middleware = [];
    return this;
  }
}
