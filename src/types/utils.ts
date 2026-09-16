import Stream from "node:stream";

/** A binary source usable wherever the platform accepts raw buffer-like data. */
export type BufferSource = ArrayBufferView | ArrayBuffer;

/** Accepts either a flat array of `T`, or an array of arrays of `T` (flattened one level by `loadHandlers`). */
export type FlatOrNestedArray<T> = T[] | T[][];

/**
 * Represents an object capable of representing itself as a JSON object
 */
export interface JSONEncodable<Value> {
  /**
   * Transforms this object to its JSON format
   */
  toJSON(): Value;
}

/** A value resolvable to file content — either an already-read `Buffer` or a file path string. */
export type BufferResolvable = Buffer | string;

/** Plain object shape accepted by `AttachmentBuilder.from` as an alternative to an existing builder. */
export interface AttachmentPayload {
  attachment: BufferResolvable | Stream;
  description?: string;
  duration?: number;
  name?: string;
  title?: string;
  waveform?: string;
}
