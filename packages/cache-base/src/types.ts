export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  /**
   * Optional prefix for all cache keys. This can help avoid key collisions when using multiple cache managers or sharing a cache store with other applications.
   */
  prefix?: string;
  /**
   * Interval in seconds to clean up expired entries. Default is 60 seconds. Set to 0 or null to disable automatic cleanup.
   */
  cleanupInterval?: number;
}

export interface CacheSetOptions {
  ttl?: number;
}

export interface CacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}
