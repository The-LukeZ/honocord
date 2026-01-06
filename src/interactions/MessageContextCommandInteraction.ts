import { APIMessage, APIMessageApplicationCommandInteraction, ApplicationCommandType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import { BaseInteractionContext } from "../types";
import { CommandInteraction } from "./CommandInteraction";

class MessageContextInteraction<Context extends BaseInteractionContext = BaseInteractionContext> extends CommandInteraction<
  ApplicationCommandType.Message,
  Context
> {
  public readonly targetMessage: APIMessage;

  constructor(api: API, interaction: APIMessageApplicationCommandInteraction, c: Context) {
    super(api, interaction, c);
    this.targetMessage = interaction.data.resolved.messages[interaction.data.target_id];
  }
}

export { MessageContextInteraction };
