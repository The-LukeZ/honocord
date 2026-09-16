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

/** A modal submit interaction. Passed to `ModalHandler.execute`. */
class ModalInteraction<Context extends BaseInteractionContext = BaseInteractionContext> extends BaseInteraction<
  InteractionType.ModalSubmit,
  Context
> {
  /** Resolver for reading the submitted modal field values. */
  public readonly fields: ModalComponentResolver;
  /** The message the modal was opened from, if it was opened in response to a message component interaction. */
  public readonly message?: APIMessage;
  /** The modal's custom ID, as set when it was built. See the [Custom ID System](/guides/custom-id-system) guide. */
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
