import { APIRole, ComponentType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import type { BaseInteractionContext, MessageComponentInteractionPayload } from "../types";
import { MessageComponentInteraction } from "./MessageComponentInteraction";
import { Collection } from "@discordjs/collection";

/** A role select menu interaction. Passed to a `ComponentHandler` registered for `ComponentType.RoleSelect`. */
class RoleSelectInteraction<Context extends BaseInteractionContext = BaseInteractionContext> extends MessageComponentInteraction<
  Context,
  ComponentType.RoleSelect
> {
  /** IDs of the selected roles. */
  public readonly values: string[];
  /** The selected roles, keyed by ID. */
  public readonly roles: Collection<string, APIRole>;
  constructor(api: API, interaction: MessageComponentInteractionPayload<ComponentType.RoleSelect>, c: Context) {
    super(api, interaction, c);
    this.values = interaction.data.values;
    this.roles = new Collection(interaction.data.resolved.roles ? Object.entries(interaction.data.resolved.roles) : []);
  }
}

export { RoleSelectInteraction };
