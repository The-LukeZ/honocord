import { APIRole, ComponentType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import type { BaseInteractionContext, MessageComponentInteractionPayload } from "../types";
import { MessageComponentInteraction } from "./MessageComponentInteraction";
import { Collection } from "@discordjs/collection";

class RoleSelectInteraction<Context extends BaseInteractionContext = BaseInteractionContext> extends MessageComponentInteraction<
  Context,
  ComponentType.RoleSelect
> {
  public readonly roles: Collection<string, APIRole>;
  constructor(api: API, interaction: MessageComponentInteractionPayload<ComponentType.RoleSelect>, c: Context) {
    super(api, interaction, c);
    this.roles = new Collection(interaction.data.resolved.roles ? Object.entries(interaction.data.resolved.roles) : []);
  }
}

export { RoleSelectInteraction };
