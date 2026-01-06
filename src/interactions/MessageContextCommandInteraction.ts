import { APIMessage, APIMessageApplicationCommandInteraction, InteractionType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import { BaseInteractionContext } from "../types";
import { ModalCapableInteraction } from "./ModalCapableInteraction";

class MessageCommandInteraction<Context extends BaseInteractionContext = BaseInteractionContext> extends ModalCapableInteraction<
  InteractionType.ApplicationCommand,
  Context
> {
  public readonly targetMessage: APIMessage;

  constructor(api: API, interaction: APIMessageApplicationCommandInteraction, c: Context) {
    super(api, interaction, c);
    this.targetMessage = interaction.data.resolved.messages[interaction.data.target_id];
  }

  get commandName() {
    return this.data.data.name;
  }

  get commandId() {
    return this.data.data.id;
  }
}

export { MessageCommandInteraction };
