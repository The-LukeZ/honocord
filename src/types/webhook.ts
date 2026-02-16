import { ApplicationWebhookEventType } from "discord-api-types/v10";

export type WebhookEventTypeResolvable = keyof typeof ApplicationWebhookEventType | ApplicationWebhookEventType;

export type WebhookEventHandler = 