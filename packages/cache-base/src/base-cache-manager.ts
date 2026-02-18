import type { CacheManager, CacheOptions, CacheSetOptions } from "./types";

export abstract class BaseCacheManager implements CacheManager {
  protected options: CacheOptions;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: 3600,
      prefix: "",
      ...options,
    };
  }

  protected buildKey(key: string): string {
    return this.options.prefix ? `${this.options.prefix}:${key}` : key;
  }

  abstract get<T>(key: string): Promise<T | null>;
  abstract set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
  abstract delete(key: string): Promise<boolean>;
  abstract clear(): Promise<void>;
  abstract has(key: string): Promise<boolean>;
}
