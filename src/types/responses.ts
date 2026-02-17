import type {
  APIAttachment,
  APIEmbed,
  APIInteractionResponseCallbackData,
  APILabelComponent,
  APIMessageTopLevelComponent,
  APIModalInteractionResponseCallbackData,
} from "discord-api-types/v10";
import type { JSONEncodable } from "./utils";
import AttachmentBuilder from "../structures/AttachmentBuilder";

export interface InteractionResponseCallbackData extends Omit<
  APIInteractionResponseCallbackData,
  "components" | "embeds" | "attachments"
> {
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
  /**
   * Attachments to include with the message.
   */
  attachments?: (AttachmentBuilder | APIAttachment)[];
  /**
   * Resolves an array of `AttachmentBuilder` into `files` and `attachments` arrays ready to be sent with the API call.
   */
  files?: (AttachmentBuilder | RawFile)[];
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

/** The raw file part placed in multipart/form-data as files[n] */
export interface RawFile {
  contentType?: string;
  data: Buffer | Uint8Array | string;
  /** Defaults to `files[${index}]` when omitted */
  key?: string;
  name: string;
}

/** The JSON metadata object placed in the attachments[] array */
export interface AttachmentMetadata {
  /** Matches the index n in files[n], or a custom snowflake */
  id: number | string;
  filename: string;
  description?: string;
}

export interface AttachmentData {
  name?: string;
  description?: string;
  contentType?: string;
  key?: string;
}

/** Resolved pair ready to be handed off to the API call */
export interface ResolvedAttachment {
  file: RawFile;
  metadata: AttachmentMetadata;
}
