import { ComponentType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import type { BaseInteractionContext, MessageComponentInteractionPayload } from "../types";
import { MessageComponentInteraction } from "./MessageComponentInteraction";

/** A string select menu interaction. Passed to a `ComponentHandler` registered for `ComponentType.StringSelect`. */
class StringSelectInteraction<
  Context extends BaseInteractionContext = BaseInteractionContext,
> extends MessageComponentInteraction<Context, ComponentType.StringSelect> {
  /** The selected option values. */
  public readonly values: string[];
  constructor(api: API, interaction: MessageComponentInteractionPayload<ComponentType.StringSelect>, c: Context) {
    super(api, interaction, c);
    this.values = interaction.data.values;
  }
}

export { StringSelectInteraction };
