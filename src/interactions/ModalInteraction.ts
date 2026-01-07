import {
  APIMessage,
  APIModalSubmitInteraction,
  InteractionType,
  ModalSubmitLabelComponent,
  ModalSubmitTextDisplayComponent,
} from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import { ModalComponentResolver } from "@resolvers/ModalComponentResolver";
import { BaseInteraction } from "./BaseInteraction";
import { BaseInteractionContext } from "../types";

class ModalInteraction<Context extends BaseInteractionContext = BaseInteractionContext> extends BaseInteraction<
  InteractionType.ModalSubmit,
  Context
> {
  public readonly fields: ModalComponentResolver;
  public readonly message?: APIMessage;
  public readonly customId: string;

  constructor(api: API, interaction: APIModalSubmitInteraction, c: Context) {
    super(api, interaction, c);
    this.customId = interaction.data.custom_id;
    this.fields = new ModalComponentResolver(
      interaction.data.components as (ModalSubmitLabelComponent | ModalSubmitTextDisplayComponent)[],
      interaction.data.resolved
    );
    if ("message" in interaction && interaction.message) {
      this.message = interaction.message;
    }
  }
}

export { ModalInteraction };
