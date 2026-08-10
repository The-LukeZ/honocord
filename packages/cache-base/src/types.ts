export interface CacheOptions {
  ttl?: number; // Time to live in seconds
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

export interface CacheSetOptions {
  ttl?: number;
}

export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}
