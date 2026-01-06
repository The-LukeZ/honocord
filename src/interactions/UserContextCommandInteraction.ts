import { APIUserApplicationCommandInteraction, APIUser, ApplicationCommandType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import { BaseInteractionContext } from "../types";
import { CommandInteraction } from "./CommandInteraction";

class UserContextInteraction<Context extends BaseInteractionContext = BaseInteractionContext> extends CommandInteraction<
  ApplicationCommandType.User,
  Context
> {
  public readonly targetUser: APIUser;

  constructor(api: API, interaction: APIUserApplicationCommandInteraction, c: Context) {
    super(api, interaction, c);
    this.targetUser = interaction.data.resolved.users[interaction.data.target_id];
  }
}

export { UserContextInteraction };
