import { AutocompleteInteraction } from "@ctx/AutocompleteInteraction";
import type { ChatInputCommandInteraction } from "@ctx/ChatInputInteraction";
import type { ModalInteraction } from "@ctx/ModalInteraction";
import type { UserContextInteraction } from "@ctx/UserContextCommandInteraction";
import type { MessageContextInteraction } from "@ctx/MessageContextCommandInteraction";
import type { Collection } from "@discordjs/collection";
import type { Snowflake } from "discord-api-types/globals";
import type {
  APIAttachment,
  APIInteraction,
  APIInteractionDataResolvedChannel,
  APIInteractionDataResolvedGuildMember,
  APIPingInteraction,
  APIRole,
  APIUser,
} from "discord-api-types/v10";
import type { BaseInteractionContext } from "./context";
import type { TMessageComponentInteraction } from "./messageComponents";

/**
 * Represents a guild member resolved from an interaction, including the associated user data.
 *
 * To be used by user selects.
 */
export type ResolvedSelectedGuildMember = APIInteractionDataResolvedGuildMember & { user: APIUser };

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
  members?: Collection<Snowflake, ResolvedSelectedGuildMember>;
  /** Map of channel IDs to channel objects */
  channels?: Collection<Snowflake, APIInteractionDataResolvedChannel>;
  /** Map of attachment IDs to attachment objects */
  attachments?: Collection<Snowflake, APIAttachment>;
}

/** Represents an interaction which the lib user can handle themselves (ping is handled internally) */
export type ValidInteraction = Exclude<APIInteraction, APIPingInteraction>;

export type AnyInteraction<Context extends BaseInteractionContext = BaseInteractionContext> =
  | ChatInputCommandInteraction<Context>
  | UserContextInteraction<Context>
  | MessageContextInteraction<Context>
  | TMessageComponentInteraction<Context>
  | ModalInteraction<Context>
  | AutocompleteInteraction<Context>;
