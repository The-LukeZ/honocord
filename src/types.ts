import type { ChatInputCommandInteraction } from "@ctx/ChatInputInteraction";
import type { MessageComponentInteraction } from "@ctx/MessageComponentInteraction";
import type { ModalInteraction } from "@ctx/ModalInteraction";
import type { Collection } from "@discordjs/collection";
import type { Snowflake } from "discord-api-types/globals";
import {
  APIAttachment,
  APIInteractionDataResolvedChannel,
  APIInteractionDataResolvedGuildMember,
  APIRole,
  APIUser,
  ApplicationCommandOptionType,
} from "discord-api-types/v10";
import type { Context } from "hono";
import type { BlankInput } from "hono/types";

/**
 * Base bindings that your library requires
 */
export interface BaseBindings {}

/**
 * Base variables that your library uses
 */
export interface BaseVariables {
  command?: ChatInputCommandInteraction;
  modal?: ModalInteraction;
  component?: MessageComponentInteraction;
}

/**
 * Base context environment
 */
export interface BaseContextEnv<TBindings extends BaseBindings = BaseBindings, TVariables extends BaseVariables = BaseVariables> {
  /**
   * Bindings available in the environment (from the worker)
   */
  Bindings: TBindings;
  /**
   * Variables available in the context (from Hono)
   */
  Variables: TVariables;
}

/**
 * Generic context type that users can extend
 */
export type InteractionContext<
  TBindings extends BaseBindings = BaseBindings,
  TVariables extends BaseVariables = BaseVariables,
  TPath extends string = "/",
> = Context<BaseContextEnv<TBindings, TVariables>, TPath, BlankInput>;

export interface APIInteractionDataResolvedCollections {
  users?: Collection<Snowflake, APIUser>;
  roles?: Collection<Snowflake, APIRole>;
  members?: Collection<Snowflake, APIInteractionDataResolvedGuildMember>;
  channels?: Collection<Snowflake, APIInteractionDataResolvedChannel>;
  attachments?: Collection<Snowflake, APIAttachment>;
}
