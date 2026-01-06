import { APIMessage, InteractionType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import type { BaseInteractionContext, MessageComponentInteractionPayload, MessageComponentType } from "../types";
import { ModalCapableInteraction } from "./ModalCapableInteraction";

class MessageComponentInteraction<
  T extends MessageComponentType = MessageComponentType,
  Context extends BaseInteractionContext = BaseInteractionContext,
> extends ModalCapableInteraction<InteractionType.MessageComponent, Context> {
  public readonly message?: APIMessage;
  public readonly customId: string;
  constructor(api: API, interaction: MessageComponentInteractionPayload<T>, c: Context) {
    super(api, interaction, c);
    this.customId = interaction.data.custom_id;

    if ("message" in interaction && interaction.message) {
      this.message = interaction.message;
    }
  }
}

export { MessageComponentInteraction };
