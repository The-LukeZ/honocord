export { Honocord } from "./Honocord";

export { BaseInteraction } from "@ctx/BaseInteraction";
export { ChatInputCommandInteraction } from "@ctx/ChatInputInteraction";
export { ModalInteraction } from "@ctx/ModalInteraction";
export { MessageComponentInteraction } from "@ctx/MessageComponentInteraction";
export type { ButtonInteraction } from "@ctx/ButtonInteraction";
export type { StringSelectInteraction } from "@ctx/StringSelectInteraction";
export type { RoleSelectInteraction } from "@ctx/RoleSelectInteraction";
export type { UserSelectInteraction } from "@ctx/UserSelectInteraction";
export type { MentionableSelectInteraction } from "@ctx/MentionableSelectInteraction";
export type { ChannelSelectInteraction } from "@ctx/ChannelSelectInteraction";

export { CommandInteractionOptionResolver } from "@resolvers/CommandOptionResolver";
export { ModalComponentResolver } from "@resolvers/ModalComponentResolver";

export * from "@handlers/index";
export type * from "@handlers/index";

export * from "@utils/index";
export type * from "./types";
export { ContextCommandType } from "./types";

// Re-export commonly used types from dependencies
export type {
  APIInteraction,
  APIChatInputApplicationCommandInteraction,
  APIModalSubmitInteraction,
  APIMessageComponentInteraction,
  Snowflake,
  // TODO: include more as needed
} from "discord-api-types/v10";

export {
  MessageFlags,
  ComponentType,
  InteractionType,
  ApplicationCommandType,
  ChannelType,
  ButtonStyle,
  TextInputStyle,
  ApplicationCommandOptionType,
  InteractionContextType,
} from "discord-api-types/v10";

export {
  LabelBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  FileBuilder,
  ModalBuilder,
  TextInputBuilder,
  RoleSelectMenuBuilder,
  UserSelectMenuBuilder,
  MentionableSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  SectionBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  TextDisplayBuilder,
  EmbedBuilder,
  FileUploadBuilder,
  SelectMenuOptionBuilder,
  ThumbnailBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  // Want more? Install the package yourself then.
} from "@discordjs/builders";
export { REST } from "@discordjs/rest";
export { API } from "@discordjs/core/http-only";
export { Collection, type ReadonlyCollection } from "@discordjs/collection";
export * from "./structures";
export { CacheManager } from "@utils/CacheManager";
export { Fetcher } from "@utils/Fetcher";
