import { APIInteractionDataResolvedChannel, ComponentType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import type { BaseInteractionContext, MessageComponentInteractionPayload } from "../types";
import { MessageComponentInteraction } from "./MessageComponentInteraction";
import { Collection } from "@discordjs/collection";

class ChannelSelectInteraction<
  Context extends BaseInteractionContext = BaseInteractionContext,
> extends MessageComponentInteraction<Context, ComponentType.ChannelSelect> {
  public readonly channels: Collection<string, APIInteractionDataResolvedChannel>;
  constructor(api: API, interaction: MessageComponentInteractionPayload<ComponentType.ChannelSelect>, c: Context) {
    super(api, interaction, c);
    this.channels = new Collection(interaction.data.resolved.channels ? Object.entries(interaction.data.resolved.channels) : []);
  }
}

export { ChannelSelectInteraction };
