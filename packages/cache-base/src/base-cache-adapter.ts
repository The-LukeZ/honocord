export abstract class BaseCacheAdapter {
  /**
   * Retrieve a value by key. Returns `null` if not found or expired.
   */
  abstract get<T>(key: string): Promise<T | null>;

  /**
   * Store a value by key with an optional TTL in milliseconds.
   */
  abstract set<T>(key: string, value: T, ttlMs?: number): Promise<void>;

  /**
   * Store multiple entries at once. Each entry can have its own optional TTL. This should be more efficient than multiple `set` calls for adapters that support bulk operations (e.g. Redis MSET, MongoDB bulkWrite).
   * @param entries An array of entries to set, each with a key, value, and optional TTL in milliseconds.
   */
  abstract mset(entries: { key: string; value: unknown; ttlMs?: number }[]): Promise<void>;

  /**
   * Delete a single key.
   */
  abstract delete(key: string): Promise<void>;

  /**
   * Check if a key exists and is not expired.
   */
  abstract has(key: string): Promise<boolean>;

  /**
   * Clear all keys managed by this adapter.
   */
  abstract clear(): Promise<void>;

  /**
   * Optional lifecycle hook — called once before the adapter is first used.
   * Override this for adapters that require async initialization (e.g. DB connections).
   */
  async connect(): Promise<this> {
    return this;
  }
}
