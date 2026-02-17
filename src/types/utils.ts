import Stream from "node:stream";

export type BufferSource = ArrayBufferView | ArrayBuffer;

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

export type BufferResolvable = Buffer | string;

export interface AttachmentPayload {
  attachment: BufferResolvable | Stream;
  description?: string;
  duration?: number;
  name?: string;
  title?: string;
  waveform?: string;
}
