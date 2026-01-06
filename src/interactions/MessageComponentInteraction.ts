import { APIMessage, ComponentType, InteractionType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import type { BaseInteractionContext, MessageComponentInteractionPayload, MessageComponentType } from "../types";
import { ModalCapableInteraction } from "./ModalCapableInteraction";

class MessageComponentInteraction<
  T extends MessageComponentType = MessageComponentType,
  Context extends BaseInteractionContext = BaseInteractionContext,
> extends ModalCapableInteraction<InteractionType.MessageComponent, Context> {
  public readonly message: APIMessage;
  public readonly customId: string;
  public readonly componentType: T;

  constructor(api: API, interaction: MessageComponentInteractionPayload<T>, c: Context) {
    super(api, interaction, c);
    this.customId = interaction.data.custom_id;
    this.message = interaction.message;
    this.componentType = interaction.data.component_type as T;
  }
}

export { MessageComponentInteraction };
