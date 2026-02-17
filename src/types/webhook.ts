import type { APIWebhookEventBody, ApplicationWebhookEventType } from "discord-api-types/v10";
import type { BlankEnv } from "hono/types";
import type { Context } from "hono";

export type { ApplicationWebhookEventType } from "discord-api-types/v10";

export type APIWebhookEventPayload = Extract<APIWebhookEventBody, { type: ApplicationWebhookEventType }>;

/**
 * A function type for handling webhook events, where the context includes typed variables for the event data.
 * The return type is a Response or a Promise that resolves to a Response, which is suitable for standard server environments.
 */
export type WebhookEventHandlerFnWithRequest<
  Data extends APIWebhookEventPayload,
  Env extends BlankEnv,
  Variables extends { data: Data },
  ContextWithData = Context<{ Bindings: Env; Variables: Variables }>,
> = (c: ContextWithData) => Promise<Response> | Response;

/**
 * A version of WebhookEventHandlerFn that is designed for Cloudflare Workers, where it doesn't matter what the return type is, since the response is handled by the worker's execution context.
 */
export type WebhookEventHandlerFnForWorkers<
  Data extends APIWebhookEventPayload,
  Env extends BlankEnv,
  Variables extends { data: Data },
  ContextWithData = Context<{ Bindings: Env; Variables: Variables }>,
> = (c: ContextWithData) => Promise<any> | any;

export type WebhookEventHandlerFn<Data extends APIWebhookEventPayload, Env extends BlankEnv, Variables extends { data: Data }> =
  | WebhookEventHandlerFnForWorkers<Data, Env, Variables>
  | WebhookEventHandlerFnWithRequest<Data, Env, Variables>;
