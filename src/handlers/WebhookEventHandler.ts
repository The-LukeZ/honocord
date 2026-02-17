import { Hono, type Context } from "hono";
import { APIWebhookEvent, ApplicationWebhookEventType, ApplicationWebhookType } from "discord-api-types/v10";
import type { APIWebhookEventPayload, WebhookEventHandlerFnForWorkers, WebhookEventHandlerFnWithRequest } from "$types/webhook";
import { verifyDiscordRequest } from "@utils/discordVerify";

type BlankVariables = Record<string, any>;

/**
 * Represents a webhook event handler to be used by an Honocord instance or standalone fetch handler or Hono app.
 *
 * @template T - Discord webhook event type
 * @template Env - Environment bindings type
 * @template Variables - Additional context variables
 * @template ForWorker - Set to `true` for Cloudflare Workers mode (no return type required), `false` for standard mode (must return Response)
 * @template Data - Typed webhook event data
 */
export class WebhookEventHandler<
  T extends ApplicationWebhookEventType,
  Env extends { DISCORD_PUBLIC_KEY?: string } = {},
  Variables extends BlankVariables = BlankVariables,
  ForWorker extends boolean = false,
  Data extends APIWebhookEventPayload<T> = APIWebhookEventPayload<T>,
> {
  readonly handlerType = "webhook";
  public readonly eventType: T;
  private handlerFn?: ForWorker extends true
    ? WebhookEventHandlerFnForWorkers<Data, Env, BlankVariables & { data: Data }>
    : WebhookEventHandlerFnWithRequest<Data, Env, BlankVariables & { data: Data }>;
  private app = new Hono<{ Bindings: Env; Variables: Omit<Variables, "data"> & { data: Data } }>();
  private isForWorker: boolean;

  constructor(eventType: T, forWorker?: ForWorker) {
    this.eventType = eventType;
    this.isForWorker = forWorker ?? false;
  }

  /**
   * Internal wrapper that handles Discord request verification and delegates to the user-defined handler.
   * This is used by the standalone `fetch` and `getApp()` methods.
   *
   * @private
   * @internal
   */
  private handlerWrapper = async (c: Context<{ Bindings: Env; Variables: BlankVariables & { data: Data } }>) => {
    if (!this.handlerFn) {
      console.error("No handler function defined for webhook event handler.");
      return c.body(null, 500);
    } else if (!c.env.DISCORD_PUBLIC_KEY) {
      console.error("No Discord public key provided in environment variables.");
      return c.body(null, 500);
    }

    // validate request body and type
    const { isValid, data } = await verifyDiscordRequest<APIWebhookEvent>(c.req, c.env.DISCORD_PUBLIC_KEY);
    if (!isValid || !data) {
      console.error("Invalid request signature or body.");
      return c.body(null, 401);
    }

    if (data.type === ApplicationWebhookType.Ping) {
      return c.json({ type: ApplicationWebhookType.Ping }, 200);
    } else if (data.event.type !== this.eventType) {
      console.error(
        `Received event type ${data.event.type} does not match handler event type ${this.eventType}. How did this happen?`
      );
      return c.body(null, 400);
    }

    c.set("data", data.event as Data);

    try {
      return await this.handlerFn(c);
    } catch (error) {
      console.error("Error executing webhook event handler:", error);
      return c.body(null, 500);
    }
  };

  /**
   * Registers the handler function for this webhook event.
   *
   * @param handlerFn - The function to execute when this webhook event is received
   *
   * @example
   * Standard mode (must return Response):
   * ```typescript
   * const handler = new WebhookEventHandler(ApplicationWebhookEventType.MessageCreate);
   *
   * handler.addHandler(async (c) => {
   *   const message = c.var.data;
   *   console.log("Received message:", message.content);
   *   return c.json({ success: true }); // Must return Response
   * });
   * ```
   *
   * @example
   * Worker mode (no return required):
   * ```typescript
   * const handler = new WebhookEventHandler(ApplicationWebhookEventType.MessageCreate, true);
   *
   * handler.addHandler(async (c) => {
   *   const message = c.var.data;
   *   console.log("Received message:", message.content);
   *   // No return required in worker mode
   * });
   * ```
   */
  addHandler(
    handlerFn: ForWorker extends true
      ? WebhookEventHandlerFnForWorkers<Data, Env, BlankVariables & { data: Data }>
      : WebhookEventHandlerFnWithRequest<Data, Env, BlankVariables & { data: Data }>
  ) {
    this.handlerFn = handlerFn as any;
    if (!this.isForWorker) {
      this.app.post("/", this.handlerWrapper);
    }
    return this;
  }

  /**
   * Execute the handler with pre-verified event data.
   *
   * **When to use:** This method is automatically called when the handler is registered with Honocord via `loadHandlers()`.
   * The Honocord instance handles request verification and ping events once, then delegates to this method.
   *
   * **You typically don't call this directly** - it's used internally by Honocord's `webhookHandler`.
   *
   * @param eventData - The pre-verified webhook event data
   * @param c - The Hono context
   * @returns The response from the handler function
   *
   * @example
   * ```typescript
   * // This is handled automatically when using Honocord:
   * const bot = new Honocord();
   * const handler = new WebhookEventHandler(ApplicationWebhookEventType.MessageCreate);
   * handler.addHandler(async (c) => c.json({ ok: true }));
   *
   * bot.loadHandlers(handler); // execute() is called internally
   * export default bot.getApp(); // POST /webhook
   * ```
   */
  async execute(eventData: Data, c: Context<{ Bindings: Env; Variables: BlankVariables & { data: Data } }>) {
    if (!this.handlerFn) {
      console.error("No handler function defined for webhook event handler.");
      return c.body(null, 500);
    }

    c.set("data", eventData);

    try {
      return await this.handlerFn(c);
    } catch (error) {
      console.error("Error executing webhook event handler:", error);
      return c.body(null, 500);
    }
  }

  /**
   * Returns the fetch handler for standalone usage.
   *
   * **Note:** This method is only available in standard mode (`ForWorker = false`).
   * When using worker mode, this method returns `never` and will throw a runtime error.
   *
   * **When to use:** Use this when you want a self-contained webhook endpoint that handles its own
   * Discord request verification and ping events, independent of a Honocord instance.
   *
   * This is ideal for:
   * - Microservices architecture where webhooks are separate from interaction handlers
   * - Multiple bots with different webhook endpoints
   * - Testing individual webhook handlers in isolation
   * - Deploying webhooks on different paths or domains
   *
   * @returns A fetch-compatible handler function
   *
   * @example
   * ```typescript
   * import { Hono } from "hono";
   * import { WebhookEventHandler } from "honocord/handlers";
   * import { ApplicationWebhookEventType } from "discord-api-types/v10";
   *
   * const app = new Hono();
   *
   * // Standalone webhook handler with built-in verification
   * const messageHandler = new WebhookEventHandler(
   *   ApplicationWebhookEventType.MessageCreate
   * );
   *
   * messageHandler.addHandler(async (c) => {
   *   const message = c.var.data;
   *   return c.json({ received: true });
   * });
   *
   * // Use as a standalone endpoint
   * app.post("/discord-webhook", messageHandler.fetch);
   *
   * export default app;
   * ```
   */
  get fetch(): ForWorker extends true ? never : typeof this.app.fetch {
    if (this.isForWorker) {
      throw new Error(
        "fetch() is not available when handler is configured for Cloudflare Workers mode. Use it with Honocord's webhookHandler instead."
      );
    }
    return this.app.fetch as any;
  }

  /**
   * Returns the internal Hono app for standalone usage.
   *
   * **Note:** This method is only available in standard mode (`ForWorker = false`).
   * When using worker mode, this method returns `never` and will throw a runtime error.
   *
   * **When to use:** Similar to `fetch`, but allows you to mount the handler on a route prefix.
   * This provides the same self-contained verification as `fetch`.
   *
   * @returns A Hono app instance
   *
   * @example
   * ```typescript
   * import { Hono } from "hono";
   * import { WebhookEventHandler } from "honocord/handlers";
   * import { ApplicationWebhookEventType } from "discord-api-types/v10";
   *
   * const app = new Hono();
   *
   * const messageHandler = new WebhookEventHandler(
   *   ApplicationWebhookEventType.MessageCreate
   * );
   *
   * messageHandler.addHandler(async (c) => {
   *   return c.json({ ok: true });
   * });
   *
   * // Mount on a prefix
   * app.route("/discord", messageHandler.getApp());
   * // Available at POST /discord
   *
   * export default app;
   * ```
   */
  getApp(): ForWorker extends true ? never : typeof this.app {
    if (this.isForWorker) {
      throw new Error(
        "getApp() is not available when handler is configured for Cloudflare Workers mode. Use it with Honocord's webhookHandler instead."
      );
    }
    return this.app as any;
  }
}
