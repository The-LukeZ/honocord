import { InteractionType } from "discord-api-types/v10";
import { ModalBuilder } from "@discordjs/builders";
import { BaseInteraction } from "./BaseInteraction";
import type { BaseInteractionContext, ModalInteractionResponseCallbackData } from "../types";

class ModalCapableInteraction<
  Type extends InteractionType,
  Context extends BaseInteractionContext = BaseInteractionContext,
> extends BaseInteraction<Type, Context> {
  /**
   * Responds to the interaction with a modal.
   *
   * @param data - The modal data to send
   */
  showModal(data: ModalInteractionResponseCallbackData | ModalBuilder) {
    const responseData = {
      ...(data instanceof ModalBuilder ? data.toJSON() : data),
      components:
        data instanceof ModalBuilder
          ? data.components.map((row) => row.toJSON())
          : data.components.map((row) => (this.isJSONEncodable(row) ? row.toJSON() : row)),
    };
    return this.api.interactions.createModal(this.id, this.token, responseData);
  }
}

export { ModalCapableInteraction };
