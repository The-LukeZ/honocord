import {
  APIMessage,
  APIMessageComponentInteraction,
  APIModalInteractionResponseCallbackData,
  InteractionType,
} from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import { BaseInteraction } from "./BaseInteraction";
import { ModalBuilder } from "@discordjs/builders";
import type { InteractionContext } from "../types";

class MessageComponentInteraction extends BaseInteraction<InteractionType.MessageComponent> {
  public readonly message?: APIMessage;
  public readonly custom_id: string;
  constructor(api: API, interaction: APIMessageComponentInteraction, c: InteractionContext) {
    super(api, interaction, c);
    this.custom_id = interaction.data.custom_id;

    if ("message" in interaction && interaction.message) {
      this.message = interaction.message;
    }
  }

  showModal(data: APIModalInteractionResponseCallbackData | ModalBuilder) {
    return this.api.interactions.createModal(this.id, this.token, data instanceof ModalBuilder ? data.toJSON() : data);
  }
}

export { MessageComponentInteraction };
