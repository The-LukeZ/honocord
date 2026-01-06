export { Honocord } from "./Honocord";

export { BaseInteraction } from "@ctx/BaseInteraction";
export { ChatInputCommandInteraction } from "@ctx/ChatInputInteraction";
export { ModalInteraction } from "@ctx/ModalInteraction";
export { MessageComponentInteraction } from "@ctx/MessageComponentInteraction";

export { CommandInteractionOptionResolver } from "@resolvers/CommandOptionResolver";
export { ModalComponentResolver } from "@resolvers/ModalComponentResolver";

export {
  SlashCommandHandler,
  ContextCommandHandler,
  ComponentHandler,
  ModalHandler,
  type Handler,
  type CommandHandler,
} from "@ctx/handlers";

export * from "@utils/index";

// Re-export commonly used types from dependencies
export type {
  APIInteraction,
  APIChatInputApplicationCommandInteraction,
  APIModalSubmitInteraction,
  APIMessageComponentInteraction,
  Snowflake,
  // TODO: include more as needed
} from "discord-api-types/v10";

export { ComponentType, InteractionType, ApplicationCommandType, ChannelType } from "discord-api-types/v10";

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
export type { REST } from "@discordjs/rest";
export type { API } from "@discordjs/core/http-only";
export { Collection, type ReadonlyCollection } from "@discordjs/collection";

export type * from "./types";
