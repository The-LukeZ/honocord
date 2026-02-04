import { APIUser, ComponentType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import type { BaseInteractionContext, MessageComponentInteractionPayload } from "../types";
import { MessageComponentInteraction } from "./MessageComponentInteraction";
import { Collection } from "@discordjs/collection";

class UserSelectInteraction<Context extends BaseInteractionContext = BaseInteractionContext> extends MessageComponentInteraction<
  Context,
  ComponentType.UserSelect
> {
  public readonly values: string[];
  public readonly users: Collection<string, APIUser>;
  constructor(api: API, interaction: MessageComponentInteractionPayload<ComponentType.UserSelect>, c: Context) {
    super(api, interaction, c);
    this.values = interaction.data.values;
    this.users = new Collection(interaction.data.resolved.users ? Object.entries(interaction.data.resolved.users) : []);
  }
}

export { UserSelectInteraction };
