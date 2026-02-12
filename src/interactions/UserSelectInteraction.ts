import { APIUser, ComponentType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import type { BaseInteractionContext, MessageComponentInteractionPayload, ResolvedSelectedGuildMember } from "../types";
import { MessageComponentInteraction } from "./MessageComponentInteraction";
import { Collection } from "@discordjs/collection";

class UserSelectInteraction<Context extends BaseInteractionContext = BaseInteractionContext> extends MessageComponentInteraction<
  Context,
  ComponentType.UserSelect
> {
  public readonly values: string[];
  public readonly users: Collection<string, APIUser>;
  public readonly members: Collection<string, ResolvedSelectedGuildMember> = new Collection();
  constructor(api: API, interaction: MessageComponentInteractionPayload<ComponentType.UserSelect>, c: Context) {
    super(api, interaction, c);
    this.values = interaction.data.values;
    this.users = new Collection(interaction.data.resolved.users ? Object.entries(interaction.data.resolved.users) : []);
    if (this.inGuild()) {
      this.members = new Collection(
        this.values
          .map((id) => {
            // We can technically assume that the member and user will always be present if the ID is in the values array, but we should still check just in case
            const member = interaction.data.resolved.members?.[id];
            if (member) {
              const user = this.users.get(id);
              if (user) {
                return [id, { ...member, user } as ResolvedSelectedGuildMember] as const;
              }
            }
            return null;
          })
          .filter((entry) => entry !== null)
      );
    }
  }
}

export { UserSelectInteraction };
