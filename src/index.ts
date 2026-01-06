export { Honocord } from "./Honocord";

export { BaseInteraction } from "@ctx/BaseInteraction";
export { ChatInputCommandInteraction } from "@ctx/ChatInputInteraction";
export { ModalInteraction } from "@ctx/ModalInteraction";
export { MessageComponentInteraction } from "@ctx/MessageComponentInteraction";

export { CommandInteractionOptionResolver } from "@resolvers/CommandOptionResolver";
export { ModalComponentResolver } from "@resolvers/ModalComponentResolver";

export { SlashCommandHandler, ContextCommandHandler, ComponentHandler, ModalHandler, type Handler } from "@ctx/handlers";

export * from "@utils/Colors";
export * from "@utils/index";
export * from "@utils/register";

// Re-export commonly used types from dependencies
export type {
  APIInteraction,
  APIChatInputApplicationCommandInteraction,
  APIModalSubmitInteraction,
  APIMessageComponentInteraction,
} from "discord-api-types/v10";

export type { BaseHonocordEnv, BaseVariables, BaseInteractionContext } from "./types";
