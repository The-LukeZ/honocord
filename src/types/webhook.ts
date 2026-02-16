import type { APIWebhookEventBody, ApplicationWebhookEventType } from "discord-api-types/v10";
import type { BlankEnv } from "hono/types";
import type { Context } from "hono";

export type WebhookEventTypeResolvable = keyof typeof ApplicationWebhookEventType | ApplicationWebhookEventType;

export type APIWebhookEventPayload = APIWebhookEventBody;

export type WebhookEventHandlerFn<
  Data extends APIWebhookEventPayload,
  Env extends BlankEnv,
  Variables extends { data: Data },
  ContextWithData = Context<{ Bindings: Env; Variables: Variables }>,
> = (c: ContextWithData) => Promise<any> | any;
