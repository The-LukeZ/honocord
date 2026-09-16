import { APIUserApplicationCommandInteraction, APIUser, ApplicationCommandType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import { BaseInteractionContext } from "../types";
import { CommandInteraction } from "./CommandInteraction";

/** A user context menu command interaction. Passed to a `ContextCommandHandler` registered for `ContextCommandType.User`. */
class UserContextInteraction<Context extends BaseInteractionContext = BaseInteractionContext> extends CommandInteraction<
  ApplicationCommandType.User,
  Context
> {
  /** The user the command was invoked on. */
  public readonly targetUser: APIUser;

  constructor(api: API, interaction: APIUserApplicationCommandInteraction, c: Context) {
    super(api, interaction, c);
    this.targetUser = interaction.data.resolved.users[interaction.data.target_id];
  }
}

export { UserContextInteraction };
