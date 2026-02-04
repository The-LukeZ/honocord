import { ComponentType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import type { BaseInteractionContext, MessageComponentInteractionPayload } from "../types";
import { MessageComponentInteraction } from "./MessageComponentInteraction";

class StringSelectInteraction<
  Context extends BaseInteractionContext = BaseInteractionContext,
> extends MessageComponentInteraction<Context, ComponentType.StringSelect> {
  public readonly values: string[];
  constructor(api: API, interaction: MessageComponentInteractionPayload<ComponentType.StringSelect>, c: Context) {
    super(api, interaction, c);
    this.values = interaction.data.values;
  }
}

export { StringSelectInteraction };
