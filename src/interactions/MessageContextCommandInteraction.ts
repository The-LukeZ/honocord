import {
  APIMessage,
  APIMessageApplicationCommandInteraction,
  InteractionType,
  type APIModalInteractionResponseCallbackData,
} from "discord-api-types/v10";
import { ModalBuilder } from "@discordjs/builders";
import { API } from "@discordjs/core/http-only";
import { BaseInteraction } from "./BaseInteraction";
import { BaseInteractionContext } from "../types";

class MessageCommandInteraction extends BaseInteraction<InteractionType.ApplicationCommand> {
  public readonly targetMessage: APIMessage;

  constructor(api: API, interaction: APIMessageApplicationCommandInteraction, c: BaseInteractionContext) {
    super(api, interaction, c);
    this.targetMessage = interaction.data.resolved.messages[interaction.data.target_id];
  }

  get commandName() {
    return this.data.data.name;
  }

  get commandId() {
    return this.data.data.id;
  }

  showModal(data: APIModalInteractionResponseCallbackData | ModalBuilder) {
    return this.api.interactions.createModal(this.id, this.token, data instanceof ModalBuilder ? data.toJSON() : data);
  }
}

export { MessageCommandInteraction };
