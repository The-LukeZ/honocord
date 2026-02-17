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

  constructor(attachment: BufferResolvable | Stream, data: AttachmentData = {}) {
    this.attachment = attachment;
    this.name = data.name;
    this.description = data.description;
    this.contentType = data.contentType;
    this.key = data.key;
  }

  setDescription(description: string): this {
    this.description = description;
    return this;
  }
  setContentType(contentType: string): this {
    this.contentType = contentType;
    return this;
  }
  setKey(key: string): this {
    this.key = key;
    return this;
  }
  setFile(attachment: BufferResolvable | Stream): this {
    this.attachment = attachment;
    return this;
  }
  setName(name: string): this {
    this.name = name;
    return this;
  }

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
