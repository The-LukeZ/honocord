import { ComponentType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import type { BaseInteractionContext, MessageComponentInteractionPayload } from "../types";
import { MessageComponentInteraction } from "./MessageComponentInteraction";

class ButtonInteraction<Context extends BaseInteractionContext = BaseInteractionContext> extends MessageComponentInteraction<
  Context,
  ComponentType.Button
> {
  constructor(api: API, interaction: MessageComponentInteractionPayload<ComponentType.Button>, c: Context) {
    super(api, interaction, c);
  }
}

export { ButtonInteraction };
