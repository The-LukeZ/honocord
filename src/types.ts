import { AutocompleteInteraction } from "@ctx/AutocompleteInteraction";
import type { ChatInputCommandInteraction } from "@ctx/ChatInputInteraction";
import type { ModalInteraction } from "@ctx/ModalInteraction";
import type { UserContextInteraction } from "@ctx/UserContextCommandInteraction";
import type { MessageContextInteraction } from "@ctx/MessageContextCommandInteraction";
import type { Collection } from "@discordjs/collection";
import type { Snowflake } from "discord-api-types/globals";
import {
  APIAttachment,
  APIEmbed,
  APIInteraction,
  APIInteractionDataResolvedChannel,
  APIInteractionDataResolvedGuildMember,
  APIInteractionResponseCallbackData,
  APILabelComponent,
  APIMessageButtonInteractionData,
  APIMessageChannelSelectInteractionData,
  APIMessageMentionableSelectInteractionData,
  APIMessageRoleSelectInteractionData,
  APIMessageStringSelectInteractionData,
  APIMessageTopLevelComponent,
  APIMessageUserSelectInteractionData,
  APIModalInteractionResponseCallbackData,
  APIPingInteraction,
  APIRole,
  APIUser,
  ApplicationCommandType,
  ComponentType,
  InteractionType,
} from "discord-api-types/v10";
import type { Context } from "hono";
import type { Bindings, BlankInput, Variables } from "hono/types";
import { ButtonInteraction } from "@ctx/ButtonInteraction";
import { StringSelectInteraction } from "@ctx/StringSelectInteraction";
import { UserSelectInteraction } from "@ctx/UserSelectInteraction";
import { MentionableSelectInteraction } from "@ctx/MentionableSelectInteraction";
import { RoleSelectInteraction } from "@ctx/RoleSelectInteraction";
import { ChannelSelectInteraction } from "@ctx/ChannelSelectInteraction";

/**
 * Base variables that the library uses
 */
export interface BaseVariables {
  autocomplete?: ChatInputCommandInteraction;
  command?: ChatInputCommandInteraction;
  modal?: ModalInteraction;
  component?: TMessageComponentInteraction;
}

export type TMessageComponentInteraction<Context extends BaseInteractionContext = BaseInteractionContext> =
  | ButtonInteraction<Context>
  | StringSelectInteraction<Context>
  | UserSelectInteraction<Context>
  | RoleSelectInteraction<Context>
  | MentionableSelectInteraction<Context>
  | ChannelSelectInteraction<Context>;

export type MessageComponentInteractionObj<
  Context extends BaseInteractionContext = BaseInteractionContext,
  T extends MessageComponentType = MessageComponentType,
> = Extract<
  TMessageComponentInteraction<Context>,
  {
    componentType: T;
  }
>;

/**
 * Base context environment
 */
export interface BaseHonocordEnv<TBindings extends Bindings = any, TVariables extends Variables = any> {
  /**
   * Bindings available in the environment (from the worker)
   */
  Bindings: TBindings;
  /**
   * Variables available in the context (from Hono + Honocord)
   */
  Variables: BaseVariables & TVariables;
}

/**
 * Generic context type that users can extend for type-safe access to environment bindings and variables.
 *
 * @template TBindings - Custom environment bindings (e.g., Cloudflare Workers env)
 * @template TVariables - Custom Hono variables
 * @template TPath - The path type for the context
 *
 * @example
 * ```ts
 * // types.ts
 * import type { BaseHonocordEnv, BaseInteractionContext } from "honocord";
 *
 * // Define your custom environment
 * import type { BaseHonocordEnv, BaseInteractionContext } from "honocord";
 *
 * // Define your custom environment bindings (e.g., Cloudflare Workers env)
 * export interface MyEnv {
 *   DISCORD_TOKEN: string;
 *   DISCORD_PUBLIC_KEY: string;
 *   DATABASE: D1Database; // Example Cloudflare D1
 * }
 *
 * // Define your custom Hono variables (can be populated by middleware)
 * export interface MyVariables {
 *   user_id: string;
 *   is_admin: boolean;
 * }
 *
 * // Create a reusable context type
 * export type MyContext = BaseInteractionContext<MyEnv, MyVariables>;
 *
 * // index.ts
 * import { Honocord, SlashCommandHandler } from "honocord";
 * import type { MyContext } from "./types";
 *
 * const bot = new Honocord();
 *
 * const command = new SlashCommandHandler()
 *   .setName("query")
 *   .setDescription("Query the database");
 *
 * command.addHandler(async (interaction: MyContext) => {
 *   // Type-safe access to your environment
 *   const db = interaction.env.DATABASE;
 *   const result = await db.prepare("SELECT * FROM users").all();
 *   await interaction.reply(`Found ${result.results.length} users`);
 * });
 *
 * bot.loadHandlers([command]);
 * ```
 */
export type BaseInteractionContext<
  TBindings extends Bindings = any,
  TVariables extends Variables = any,
  TPath extends string = "/",
> = Context<BaseHonocordEnv<TBindings, TVariables>, TPath, BlankInput>;

/**
 * Collections of resolved data from Discord API interactions.
 *
 * When users or roles are mentioned in command options, Discord resolves them and provides
 * the full data in these collections for easy access.
 */
export interface APIInteractionDataResolvedCollections {
  /** Map of user IDs to user objects */
  users?: Collection<Snowflake, APIUser>;
  /** Map of role IDs to role objects */
  roles?: Collection<Snowflake, APIRole>;
  /** Map of user IDs to guild member objects */
  members?: Collection<Snowflake, APIInteractionDataResolvedGuildMember>;
  /** Map of channel IDs to channel objects */
  channels?: Collection<Snowflake, APIInteractionDataResolvedChannel>;
  /** Map of attachment IDs to attachment objects */
  attachments?: Collection<Snowflake, APIAttachment>;
}

/** Represents an interaction which the lib user can handle themselves (ping is handled internally) */
export type ValidInteraction = Exclude<APIInteraction, APIPingInteraction>;

export type MessageComponentType =
  | ComponentType.Button
  | ComponentType.StringSelect
  | ComponentType.UserSelect
  | ComponentType.RoleSelect
  | ComponentType.MentionableSelect
  | ComponentType.ChannelSelect;

export type MessageComponentDataTypes = {
  [ComponentType.Button]: APIMessageButtonInteractionData;
  [ComponentType.StringSelect]: APIMessageStringSelectInteractionData;
  [ComponentType.UserSelect]: APIMessageUserSelectInteractionData;
  [ComponentType.RoleSelect]: APIMessageRoleSelectInteractionData;
  [ComponentType.MentionableSelect]: APIMessageMentionableSelectInteractionData;
  [ComponentType.ChannelSelect]: APIMessageChannelSelectInteractionData;
};

export type MessageComponentInteractionPayload<T extends MessageComponentType = MessageComponentType> = Extract<
  ValidInteraction,
  {
    type: InteractionType.MessageComponent;
  }
> & {
  data: MessageComponentDataTypes[T];
};

export enum ContextCommandType {
  User = ApplicationCommandType.User,
  Message = ApplicationCommandType.Message,
}

export type BufferSource = ArrayBufferView | ArrayBuffer;

export type FlatOrNestedArray<T> = T[] | T[][];

/**
 * Represents an object capable of representing itself as a JSON object
 *
 * @typeParam Value - The JSON type corresponding to {@link JSONEncodable.toJSON} outputs.
 */
export interface JSONEncodable<Value> {
  /**
   * Transforms this object to its JSON format
   */
  toJSON(): Value;
}

export type AnyInteraction<Context extends BaseInteractionContext = BaseInteractionContext> =
  | ChatInputCommandInteraction<Context>
  | UserContextInteraction<Context>
  | MessageContextInteraction<Context>
  | TMessageComponentInteraction<Context>
  | ModalInteraction<Context>
  | AutocompleteInteraction<Context>;

export type HandlerFunction<
  Context extends BaseInteractionContext = BaseInteractionContext,
  InteractionArg extends AnyInteraction<Context> = AnyInteraction<Context>,
> = (interaction: InteractionArg) => Promise<any> | any;

/**
 * Middleware function type for processing interaction contexts.
 *
 * Helpful for implementing cross-cutting concerns such as logging, authentication, setting of the DB, etc.
 */
export type MiddlewareFunction<Context extends BaseInteractionContext = BaseInteractionContext> = (
  context: Context,
  next: () => Promise<void>
) => Promise<Response | void> | Response | void;

// ---------------------------------------------------------------------------------------------
// The following types are typings which are derived from discord-api-types but we are using Builders so be have to redefine them
// ---------------------------------------------------------------------------------------------

export interface InteractionResponseCallbackData extends Omit<APIInteractionResponseCallbackData, "components" | "embeds"> {
  /**
   * The components to include with the message
   *
   * Application-owned webhooks can always send components. Non-application-owned webhooks cannot send interactive components, and the `components` field will be ignored unless they set the `with_components` query param.
   *
   * Can be `ActionRowBuilder` or raw APIMessageActionRowComponent
   *
   * If using Components V2, ensure that `flags` includes `MessageFlags.IsComponentsV2` is set.
   *
   * @see {@link https://discord.com/developers/docs/components/reference}
   */
  components?: (JSONEncodable<APIMessageTopLevelComponent> | APIMessageTopLevelComponent)[];
  /**
   * Embedded `rich` content
   *
   * Can be `EmbedBuilder` or raw APIEmbed
   *
   * @see {@link https://discord.com/developers/docs/resources/channel#embed-object}
   */
  embeds?: (JSONEncodable<APIEmbed> | APIEmbed)[];
}

export interface ModalInteractionResponseCallbackData extends Omit<APIModalInteractionResponseCallbackData, "components"> {
  /**
   * The components to include with the modal
   *
   * Can be `LabelBuilder` or raw APILabelComponent.
   *
   * @see {@link https://discord.com/developers/docs/interactions/message-components#action-rows}
   */
  components: (JSONEncodable<APILabelComponent> | APILabelComponent)[];
}
