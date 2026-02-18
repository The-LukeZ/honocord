import { BaseCacheAdapter, CacheOptions } from "@honocord/cache-base";

interface MemoryEntry {
  value: unknown;
  expiresAt: Date | null;
}

export class MemoryCacheAdapter extends BaseCacheAdapter {
  private store = new Map<string, MemoryEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: Omit<CacheOptions, "namespace"> = {}) {
    super();
    if (!!options.cleanupInterval) {
      this.cleanupInterval = setInterval(() => this.cleanup(), (options.cleanupInterval ?? 60) * 1000);
    }
  }

  private cleanup() {
    const now = new Date();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt !== null && entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && new Date() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlMs !== undefined ? new Date(Date.now() + ttlMs) : null,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    return entry.expiresAt === null || new Date() <= entry.expiresAt;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
