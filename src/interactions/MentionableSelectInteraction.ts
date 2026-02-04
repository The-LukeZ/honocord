import { APIRole, APIUser, ComponentType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import type { BaseInteractionContext, MessageComponentInteractionPayload } from "../types";
import { MessageComponentInteraction } from "./MessageComponentInteraction";
import { Collection } from "@discordjs/collection";

class MentionableSelectInteraction<
  Context extends BaseInteractionContext = BaseInteractionContext,
> extends MessageComponentInteraction<ComponentType.MentionableSelect, Context> {
  public readonly roles: Collection<string, APIRole>;
  public readonly users: Collection<string, APIUser>;
  constructor(api: API, interaction: MessageComponentInteractionPayload<ComponentType.MentionableSelect>, c: Context) {
    super(api, interaction, c);
    this.roles = new Collection(interaction.data.resolved.roles ? Object.entries(interaction.data.resolved.roles) : []);
    this.users = new Collection(interaction.data.resolved.users ? Object.entries(interaction.data.resolved.users) : []);
  }
}

export { MentionableSelectInteraction };
