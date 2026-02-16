import type {
  APIEmbed,
  APIInteractionResponseCallbackData,
  APILabelComponent,
  APIMessageTopLevelComponent,
  APIModalInteractionResponseCallbackData,
} from "discord-api-types/v10";
import type { JSONEncodable } from "./utils";

export interface InteractionResponseCallbackData extends Omit<APIInteractionResponseCallbackData, "components" | "embeds"> {
  /**
   * The components to include with the message
   *
   * Application-owned webhooks can always send components. Non-application-owned webhooks cannot send interactive components, and the `components` field will be ignored unless they set the `with_components` query param.
   *
   * Can be `ActionRowBuilder` or raw APIMessageActionRowComponent
   *
   * If using Components V2, ensure that `flags` includes `MessageFlags.IsComponentsV2` is set.
   *
   * @see {@link https://discord.com/developers/docs/components/reference}
   */
  components?: (JSONEncodable<APIMessageTopLevelComponent> | APIMessageTopLevelComponent)[];
  /**
   * Embedded `rich` content
   *
   * Can be `EmbedBuilder` or raw APIEmbed
   *
   * @see {@link https://discord.com/developers/docs/resources/channel#embed-object}
   */
  embeds?: (JSONEncodable<APIEmbed> | APIEmbed)[];
}

export interface ModalInteractionResponseCallbackData extends Omit<APIModalInteractionResponseCallbackData, "components"> {
  /**
   * The components to include with the modal
   *
   * Can be `LabelBuilder` or raw APILabelComponent.
   *
   * @see {@link https://discord.com/developers/docs/interactions/message-components#action-rows}
   */
  components: (JSONEncodable<APILabelComponent> | APILabelComponent)[];
}
