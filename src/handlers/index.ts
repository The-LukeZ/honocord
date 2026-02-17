// Re-export all handlers
export { SlashCommandHandler } from "./SlashCommandHandler";
export { ContextCommandHandler } from "./ContextCommandHandler";
export { ComponentHandler } from "./ComponentHandler";
export { ModalHandler } from "./ModalHandler";
export { WebhookEventHandler } from "./WebhookEventHandler";

// Import types needed for handler type definitions
import type { SlashCommandHandler } from "./SlashCommandHandler";
import type { ContextCommandHandler } from "./ContextCommandHandler";
import type { ComponentHandler } from "./ComponentHandler";
import type { ModalHandler } from "./ModalHandler";
import { ComponentType } from "discord-api-types/v10";
import type { MessageContextInteraction } from "@ctx/MessageContextCommandInteraction";
import type { UserContextInteraction } from "@ctx/UserContextCommandInteraction";
import type { ApplicationWebhookEventType, BaseInteractionContext, ContextCommandType } from "../types";
import { WebhookEventHandler } from "./WebhookEventHandler";

/**
 * Union type of all possible handlers
 */
export type Handler<Context extends BaseInteractionContext = BaseInteractionContext> =
  | SlashCommandHandler<Context>
  | ContextCommandHandler<Context, ContextCommandType.User, UserContextInteraction<Context>>
  | ContextCommandHandler<Context, ContextCommandType.Message, MessageContextInteraction<Context>>
  | ComponentHandler<Context, ComponentType.Button>
  | ComponentHandler<Context, ComponentType.StringSelect>
  | ComponentHandler<Context, ComponentType.UserSelect>
  | ComponentHandler<Context, ComponentType.RoleSelect>
  | ComponentHandler<Context, ComponentType.MentionableSelect>
  | ComponentHandler<Context, ComponentType.ChannelSelect>
  | ModalHandler<Context>
  | WebhookEventHandler<Context["env"], Context["var"], boolean, ApplicationWebhookEventType, any>;

/**
 * Helper type to allow handlers with any context extending BaseInteractionContext
 */
export type AnyHandler = Handler<any>;
