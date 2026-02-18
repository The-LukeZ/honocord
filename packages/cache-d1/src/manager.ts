import { BaseCacheManager, CacheOptions, CacheSetOptions } from "@honocord/cache-base";

export class D1CacheManager extends BaseCacheManager {
  private db: D1Database;
  constructor(db: D1Database, options: CacheOptions = {}) {
    super(options);
    this.db = db;
  }

  async get<T>(key: string): Promise<T | null> {
    // dummy
    return null;
  }

  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    // dummy
  }

  async delete(key: string): Promise<boolean> {
    // dummy
    return false;
  }

  async clear(): Promise<void> {
    // dummy
  }

  async has(key: string): Promise<boolean> {
    // dummy
    return false;
  }
}
