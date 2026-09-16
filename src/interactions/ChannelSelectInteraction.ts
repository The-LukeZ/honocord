import { APIInteractionDataResolvedChannel, ComponentType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import type { BaseInteractionContext, MessageComponentInteractionPayload } from "../types";
import { MessageComponentInteraction } from "./MessageComponentInteraction";
import { Collection } from "@discordjs/collection";

/** A channel select menu interaction. Passed to a `ComponentHandler` registered for `ComponentType.ChannelSelect`. */
class ChannelSelectInteraction<
  Context extends BaseInteractionContext = BaseInteractionContext,
> extends MessageComponentInteraction<Context, ComponentType.ChannelSelect> {
  /** IDs of the selected channels. */
  public readonly values: string[];
  /** The selected channels, keyed by ID. Partial objects — only `id`, `type`, and `permissions` (plus a few type-specific fields) are populated. */
  public readonly channels: Collection<string, APIInteractionDataResolvedChannel>;
  constructor(api: API, interaction: MessageComponentInteractionPayload<ComponentType.ChannelSelect>, c: Context) {
    super(api, interaction, c);
    this.values = interaction.data.values;
    this.channels = new Collection(interaction.data.resolved.channels ? Object.entries(interaction.data.resolved.channels) : []);
  }
}

export { ChannelSelectInteraction };
