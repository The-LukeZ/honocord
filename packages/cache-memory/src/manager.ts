import { BaseCacheManager, CacheOptions, CacheSetOptions } from "@honocord/cache-base";

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

export class MemoryCacheManager extends BaseCacheManager {
  private store: Map<string, CacheEntry<any>>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor(options: CacheOptions = {}) {
    super(options);
    this.store = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  private startCleanup(): void {
    // Clean expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.removeExpired();
    }, 60000);
  }

  private removeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.store.delete(key);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.buildKey(key);
    const entry = this.store.get(fullKey);

    if (!entry) return null;

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(fullKey);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    const fullKey = this.buildKey(key);
    const ttl = options?.ttl ?? this.options.ttl;

    const expiresAt = ttl ? Date.now() + ttl * 1000 : null;

    this.store.set(fullKey, {
      value,
      expiresAt,
    });
  }

  async delete(key: string): Promise<boolean> {
    const fullKey = this.buildKey(key);
    return this.store.delete(fullKey);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async has(key: string): Promise<boolean> {
    const fullKey = this.buildKey(key);
    const entry = this.store.get(fullKey);

    if (!entry) return false;

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(fullKey);
      return false;
    }

    return true;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}
