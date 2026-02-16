import { Hono, type Context } from "hono";
import { APIWebhookEvent, ApplicationWebhookEventType, ApplicationWebhookType } from "discord-api-types/v10";
import type { APIWebhookEventPayload, WebhookEventHandlerFn } from "$types/webhook";
import { verifyDiscordRequest } from "@utils/discordVerify";

type BlankVariables = Record<string, any>;

/**
 * Represents a webhook event handler to be used by an Honocord instance or standalone fetch handler or Hono app.
 */
export class WebhookEventHandler<
  Env extends { DISCORD_PUBLIC_KEY?: string },
  Variables extends BlankVariables = BlankVariables,
  T extends ApplicationWebhookEventType = ApplicationWebhookEventType,
  Data extends Extract<APIWebhookEventPayload, { type: T }> = Extract<APIWebhookEventPayload, { type: T }>,
> {
  readonly handlerType = "webhook";
  public readonly eventType: T;
  private handlerFn?: WebhookEventHandlerFn<Data, Env, BlankVariables & { data: Data }>;
  private app = new Hono<{ Bindings: Env; Variables: Omit<Variables, "data"> & { data: Data } }>();

  constructor(eventType: T) {
    this.eventType = eventType;
  }

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

  addHandler(handlerFn: WebhookEventHandlerFn<Data, Env, BlankVariables & { data: Data }>) {
    this.handlerFn = handlerFn;
    this.app.post("/", this.handlerWrapper);
  }

  get fetch() {
    return this.app.fetch;
  }

  getApp() {
    return this.app;
  }

  // TODO: Is this really needed?
  // get execute() {
  //   return this.fetch();
  // }
}
