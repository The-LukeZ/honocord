import type {
  APIInteraction,
  APIMessageButtonInteractionData,
  APIMessageChannelSelectInteractionData,
  APIMessageMentionableSelectInteractionData,
  APIMessageRoleSelectInteractionData,
  APIMessageStringSelectInteractionData,
  APIMessageUserSelectInteractionData,
  APIPingInteraction,
  ComponentType,
  InteractionType,
} from "discord-api-types/v10";
import { ButtonInteraction } from "@ctx/ButtonInteraction";
import { StringSelectInteraction } from "@ctx/StringSelectInteraction";
import { UserSelectInteraction } from "@ctx/UserSelectInteraction";
import { MentionableSelectInteraction } from "@ctx/MentionableSelectInteraction";
import { RoleSelectInteraction } from "@ctx/RoleSelectInteraction";
import { ChannelSelectInteraction } from "@ctx/ChannelSelectInteraction";
import { ValidInteraction } from "./interactions";
import { BaseInteractionContext } from "./context";

/** Union of every typed message component interaction class Honocord provides. */
export type TMessageComponentInteraction<Context extends BaseInteractionContext = BaseInteractionContext> =
  | ButtonInteraction<Context>
  | StringSelectInteraction<Context>
  | UserSelectInteraction<Context>
  | RoleSelectInteraction<Context>
  | MentionableSelectInteraction<Context>
  | ChannelSelectInteraction<Context>;

/** Narrows {@link TMessageComponentInteraction} to the interaction class matching a specific component type `T`. */
export type MessageComponentInteractionObj<
  Context extends BaseInteractionContext = BaseInteractionContext,
  T extends MessageComponentType = MessageComponentType,
> = Extract<
  TMessageComponentInteraction<Context>,
  {
    componentType: T;
  }
>;

/** The message component types Honocord provides typed interaction classes for. */
export type MessageComponentType =
  | ComponentType.Button
  | ComponentType.StringSelect
  | ComponentType.UserSelect
  | ComponentType.RoleSelect
  | ComponentType.MentionableSelect
  | ComponentType.ChannelSelect;

/** Maps each {@link MessageComponentType} to its raw Discord interaction data shape. */
export type MessageComponentDataTypes = {
  [ComponentType.Button]: APIMessageButtonInteractionData;
  [ComponentType.StringSelect]: APIMessageStringSelectInteractionData;
  [ComponentType.UserSelect]: APIMessageUserSelectInteractionData;
  [ComponentType.RoleSelect]: APIMessageRoleSelectInteractionData;
  [ComponentType.MentionableSelect]: APIMessageMentionableSelectInteractionData;
  [ComponentType.ChannelSelect]: APIMessageChannelSelectInteractionData;
};

/** The raw message component interaction payload, narrowed to a specific component type `T`. */
export type MessageComponentInteractionPayload<T extends MessageComponentType = MessageComponentType> = Extract<
  ValidInteraction,
  {
    type: InteractionType.MessageComponent;
  }
> & {
  data: MessageComponentDataTypes[T];
};
