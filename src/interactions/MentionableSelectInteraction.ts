import { APIRole, APIUser, ComponentType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import type { BaseInteractionContext, MessageComponentInteractionPayload } from "../types";
import { MessageComponentInteraction } from "./MessageComponentInteraction";
import { Collection } from "@discordjs/collection";

/** A mentionable (user + role) select menu interaction. Passed to a `ComponentHandler` registered for `ComponentType.MentionableSelect`. */
class MentionableSelectInteraction<
  Context extends BaseInteractionContext = BaseInteractionContext,
> extends MessageComponentInteraction<Context, ComponentType.MentionableSelect> {
  /** IDs of the selected users and roles. */
  public readonly values: string[];
  /** The selected roles, keyed by ID. Empty if only users were selected. */
  public readonly roles: Collection<string, APIRole>;
  /** The selected users, keyed by ID. Empty if only roles were selected. */
  public readonly users: Collection<string, APIUser>;
  constructor(api: API, interaction: MessageComponentInteractionPayload<ComponentType.MentionableSelect>, c: Context) {
    super(api, interaction, c);
    this.values = interaction.data.values;
    this.roles = new Collection(interaction.data.resolved.roles ? Object.entries(interaction.data.resolved.roles) : []);
    this.users = new Collection(interaction.data.resolved.users ? Object.entries(interaction.data.resolved.users) : []);
  }
}

export { MentionableSelectInteraction };
