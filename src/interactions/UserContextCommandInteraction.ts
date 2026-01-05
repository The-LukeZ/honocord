import {
  APIUserApplicationCommandInteraction,
  APIUser,
  InteractionType,
  type APIModalInteractionResponseCallbackData,
} from "discord-api-types/v10";
import { ModalBuilder } from "@discordjs/builders";
import { API } from "@discordjs/core/http-only";
import { BaseInteraction } from "./BaseInteraction";
import { BaseInteractionContext } from "../types";

class UserCommandInteraction extends BaseInteraction<InteractionType.ApplicationCommand> {
  public readonly targetUser: APIUser;

  constructor(api: API, interaction: APIUserApplicationCommandInteraction, c: BaseInteractionContext) {
    super(api, interaction, c);
    this.targetUser = interaction.data.resolved.users[interaction.data.target_id];
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

export { UserCommandInteraction };
