export type BufferSource = ArrayBufferView | ArrayBuffer;

export type FlatOrNestedArray<T> = T[] | T[][];

/**
 * Represents an object capable of representing itself as a JSON object
 *
 * @typeParam Value - The JSON type corresponding to {@link JSONEncodable.toJSON} outputs.
 */
export interface JSONEncodable<Value> {
  /**
   * Transforms this object to its JSON format
   */
  toJSON(): Value;
}
