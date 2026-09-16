import type { AttachmentPayload, BufferResolvable } from "$types/utils";
import Stream from "node:stream";
import { basename } from "./utils";
import { AttachmentData, RawFile } from "$types/responses";
import { RESTAPIAttachment } from "discord-api-types/v10";

/**
 * Builder for message attachments, which can be used in several response methods across the library.
 */
export class AttachmentBuilder {
  private attachment: BufferResolvable | Stream;
  private name?: string;
  private description?: string;
  private contentType?: string;
  private key?: string; // Not really needed but allows users to set a custom key for their own reference if they want

  /**
   * @param attachment - The file content — a Buffer, Uint8Array, string path, or readable stream.
   * @param data - Optional metadata (name, description, content type, reference key).
   */
  constructor(attachment: BufferResolvable | Stream, data: AttachmentData = {}) {
    this.attachment = attachment;
    this.name = data.name;
    this.description = data.description;
    this.contentType = data.contentType;
    this.key = data.key;
  }

  /** Sets the attachment's alt-text description. */
  setDescription(description: string): this {
    this.description = description;
    return this;
  }
  /** Sets the attachment's MIME content type. */
  setContentType(contentType: string): this {
    this.contentType = contentType;
    return this;
  }
  /** Sets a custom reference key for your own use — not sent to Discord. */
  setKey(key: string): this {
    this.key = key;
    return this;
  }
  /** Replaces the attachment's file content. */
  setFile(attachment: BufferResolvable | Stream): this {
    this.attachment = attachment;
    return this;
  }
  /** Sets the attachment's filename. */
  setName(name: string): this {
    this.name = name;
    return this;
  }

  /** Marks (or unmarks) the attachment as a spoiler by prefixing/stripping `SPOILER_` from its filename. */
  setSpoiler(spoiler = true): this {
    if (!this.name) return this;
    if (spoiler === this.spoiler) return this;
    if (!spoiler) {
      while (this.spoiler) this.name = this.name.slice("SPOILER_".length);
      return this;
    }
    this.name = `SPOILER_${this.name}`;
    return this;
  }

  /** Whether the attachment's filename is currently marked as a spoiler. */
  get spoiler() {
    return this.name ? basename(this.name).startsWith("SPOILER_") : false;
  }

  /** Produces the multipart file part (files[n]) */
  toRawFile(): RawFile {
    return {
      name: this.name ?? "file",
      data: this.attachment as Buffer | Uint8Array | string,
      contentType: this.contentType,
      key: this.key,
    };
  }

  /** Produces the attachments[] entry for the JSON payload */
  toRestAttachment(index: number): RESTAPIAttachment {
    return {
      id: index,
      filename: this.name ?? "file",
      ...(this.description && { description: this.description }),
    };
  }

  /**
   * Resolves this builder into the parallel `files` and `attachments` arrays ready to spread into your API call options.
   *
   * @example
   * const { files, attachments } = builder.resolve();
   * await interaction.reply({ content: "Here!", files, attachments });
   * // or even shorter:
   * await interaction.reply({ content: "Here!", ...builder.resolve() });
   */
  resolve(): { files: RawFile[]; attachments: RESTAPIAttachment[] } {
    return AttachmentBuilder.resolve(this);
  }

  /**
   * Resolves an array of AttachmentBuilders into parallel `files` and
   * `attachments` arrays ready to spread into your API call options.
   *
   * @example
   * const { files, attachments } = AttachmentBuilder.resolve(builder1, builder2);
   * await interaction.reply({ content: "Here!", files, attachments });
   */
  static resolve(...builders: AttachmentBuilder[]): {
    files: RawFile[];
    attachments: RESTAPIAttachment[];
  } {
    return {
      files: builders.map((b) => b.toRawFile()),
      attachments: builders.map((b, i) => b.toRestAttachment(i)),
    };
  }

  /** Creates a new `AttachmentBuilder` from an existing builder or a plain `AttachmentPayload` object. */
  static from(other: AttachmentBuilder | AttachmentPayload): AttachmentBuilder {
    if (other instanceof AttachmentBuilder) {
      return new AttachmentBuilder(other.attachment, {
        name: other.name,
        description: other.description,
        contentType: other.contentType,
        key: other.key,
      });
    }
    return new AttachmentBuilder(other.attachment, {
      name: other.name,
      description: other.description,
    });
  }
}
