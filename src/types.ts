import type { ChatInputCommandInteraction } from "@ctx/ChatInputInteraction";
import type { MessageComponentInteraction } from "@ctx/MessageComponentInteraction";
import type { ModalInteraction } from "@ctx/ModalInteraction";
import type { Collection } from "@discordjs/collection";
import type { Snowflake } from "discord-api-types/globals";
import {
  APIApplicationCommandAutocompleteInteraction,
  APIApplicationCommandInteractionData,
  APIAttachment,
  APIInteraction,
  APIInteractionDataResolvedChannel,
  APIInteractionDataResolvedGuildMember,
  APIMessageButtonInteractionData,
  APIMessageChannelSelectInteractionData,
  APIMessageMentionableSelectInteractionData,
  APIMessageRoleSelectInteractionData,
  APIMessageStringSelectInteractionData,
  APIMessageUserSelectInteractionData,
  APIPingInteraction,
  APIRole,
  APIUser,
  ApplicationCommandType,
  ComponentType,
  InteractionType,
} from "discord-api-types/v10";
import type { Context } from "hono";
import type { Bindings, BlankEnv, BlankInput, BlankSchema, Variables } from "hono/types";

/**
 * Base bindings that your library requires
 */
export interface BaseBindings {
  DISCORD_PUBLIC_KEY: string;
  DISCORD_TOKEN: string;
  IS_CF_WORKER?: "true" | "false";
}

/**
 * Base variables that your library uses
 */
export interface BaseVariables {
  autocomplete?: ChatInputCommandInteraction;
  command?: ChatInputCommandInteraction;
  modal?: ModalInteraction;
  component?: MessageComponentInteraction;
}

/**
 * Base context environment
 */
export interface BaseHonocordEnv<TBindings extends Bindings = any, TVariables extends Variables = any> {
  /**
   * Bindings available in the environment (from the worker)
   */
  Bindings: BaseBindings & TBindings;
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
 * interface MyEnv {
 *   DISCORD_TOKEN: string;
 *   DISCORD_PUBLIC_KEY: string;
 *   DATABASE: D1Database;
 * }
 *
 * export type MyHonoEnv = BaseHonocordEnv<MyEnv>;
 * export type MyContext = BaseInteractionContext<MyEnv>;
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

/**
 * Generic handler function type for Discord interactions.
 *
 * @template T - The specific interaction type from Discord's InteractionType enum
 */
type InteractionHandler<T extends InteractionType> = (
  interaction: Extract<ValidInteraction, { type: T }>
) => void | Promise<void>;

/**
 * Handler function type for application command interactions (slash commands, user commands, message commands).
 *
 * @template Data - The command data type (optional, defaults to generic command interaction data)
 */
export type CommandInteractionHandler<Data = APIApplicationCommandInteractionData> = (
  interaction: Extract<
    Exclude<ValidInteraction, APIApplicationCommandAutocompleteInteraction>,
    { type: InteractionType.ApplicationCommand; data: Data }
  >
) => void | Promise<void>;

/**
 * Handler function type for autocomplete interactions.
 *
 * Called when a user is typing in a command option that has autocomplete enabled.
 */
export type AutocompleteInteractionHandler = InteractionHandler<InteractionType.ApplicationCommandAutocomplete>;

/**
 * Handler function type for modal submit interactions.
 *
 * Called when a user submits a modal (form).
 */
export type ModalSubmitInteractionHandler = InteractionHandler<InteractionType.ModalSubmit>;

/**
 * Handler function type for message component interactions.
 *
 * Called when a user interacts with a button, select menu, or other message component.
 */
export type MessageComponentInteractionHandler = InteractionHandler<InteractionType.MessageComponent>;

/**
 * Map of interaction types to their corresponding handler function types.
 *
 * Useful for creating type-safe handler registries or middleware systems.
 */
export type InteractionHandlers = {
  [InteractionType.ApplicationCommand]: CommandInteractionHandler<InteractionType.ApplicationCommand>;
  [InteractionType.ApplicationCommandAutocomplete]: AutocompleteInteractionHandler;
  [InteractionType.ModalSubmit]: ModalSubmitInteractionHandler;
  [InteractionType.MessageComponent]: MessageComponentInteractionHandler;
};

/**
 * Generic handler function type for any Discord interaction.
 *
 * @template T - The specific API interaction type (defaults to any interaction)
 */
export type InteractionHandlerFunction<T extends APIInteraction = APIInteraction> = (interaction: T) => void | Promise<void>;

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
    data: MessageComponentDataTypes[T];
  }
>;

export enum ContextCommandType {
  User = ApplicationCommandType.User,
  Message = ApplicationCommandType.Message,
}

export type BufferSource = ArrayBufferView | ArrayBuffer;

export type FlatOrNestedArray<T> = T[] | T[][];