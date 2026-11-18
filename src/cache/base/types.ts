export interface CacheOptions {
  /**
   * Default time to live in seconds, used when an entry is stored without its own TTL.
   */
  ttl?: number;
  /**
   * Optional namespace for all cache keys. This can help avoid key collisions when using multiple cache managers or sharing a cache store with other applications.
   */
  namespace?: string;
  /**
   * Interval in seconds to clean up expired entries. Default is 60 seconds. Set to 0 or omit to disable automatic cleanup.
   *
   * Should stay between 10 seconds and 1 hour to balance performance and memory usage. Adapters that don't support automatic cleanup will ignore this option.
   *
   * **Supported Adapters**: MemoryCacheAdapter
   */
  cleanupInterval?: number;
}

/**
 * A single entry passed to {@link BaseCacheAdapter.mset}.
 */
export interface CacheEntry {
  key: string;
  value: unknown;
  /**
   * Optional time to live in milliseconds.
   */
  ttlMs?: number;
}
