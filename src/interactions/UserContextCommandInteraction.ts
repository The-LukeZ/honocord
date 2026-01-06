import { APIUserApplicationCommandInteraction, APIUser, InteractionType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import { BaseInteractionContext } from "../types";
import { ModalCapableInteraction } from "./ModalCapableInteraction";

class UserCommandInteraction<Context extends BaseInteractionContext = BaseInteractionContext> extends ModalCapableInteraction<
  InteractionType.ApplicationCommand,
  Context
> {
  public readonly targetUser: APIUser;

  constructor(api: API, interaction: APIUserApplicationCommandInteraction, c: Context) {
    super(api, interaction, c);
    this.targetUser = interaction.data.resolved.users[interaction.data.target_id];
  }

  get commandName() {
    return this.data.data.name;
  }

  get commandId() {
    return this.data.data.id;
  }
}

export { UserCommandInteraction };
