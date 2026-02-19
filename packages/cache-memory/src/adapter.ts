import { BaseCacheAdapter, CacheOptions } from "@honocord/cache-base";

interface MemoryEntry {
  value: unknown;
  /**
   * MS until expiry, or null for no expiry.
   */
  expiresAt: number | null;
}

export class MemoryCacheAdapter extends BaseCacheAdapter {
  private store = new Map<string, MemoryEntry>();
  /**
   * Min-sorted list of [expiresAt, key] pairs.
   * Keeping it sorted lets cleanup stop as soon as it reaches a non-expired
   * entry instead of scanning every key.
   */
  private expiringKeys: Array<[number, string]> = [];
  private cleanupIntervalHandle: NodeJS.Timeout | null = null;

  constructor(private options: Omit<CacheOptions, "namespace"> = {}) {
    super();
    this.startCleanup();
  }

  /** Insert [expiresAt, key] into the sorted array via binary search. */
  private insertExpiring(key: string, expiresAt: number) {
    let lowerBound = 0;
    let highest = this.expiringKeys.length;
    while (lowerBound < highest) {
      const centerIndex = (lowerBound + highest) >>> 1;
      if (this.expiringKeys[centerIndex][0] <= expiresAt) lowerBound = centerIndex + 1;
      else highest = centerIndex;
    }
    this.expiringKeys.splice(lowerBound, 0, [expiresAt, key]);
  }

  /** Remove the first entry with the given key from the sorted array. */
  private removeExpiring(key: string) {
    const idx = this.expiringKeys.findIndex(([, k]) => k === key);
    if (idx !== -1) this.expiringKeys.splice(idx, 1);
  }

  /** Walk from the front and stop at the first non-expired entry. */
  private cleanup() {
    const now = Date.now();
    let i = 0;
    while (i < this.expiringKeys.length && this.expiringKeys[i][0] <= now) {
      this.store.delete(this.expiringKeys[i][1]);
      i++;
    }
    if (i > 0) this.expiringKeys.splice(0, i);
  }

  private startCleanup() {
    if (this.options.cleanupInterval) {
      this.cleanupIntervalHandle = setInterval(() => this.cleanup(), this.options.cleanupInterval * 1000);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.removeExpiring(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    const expiresAt = ttlMs !== undefined ? Date.now() + ttlMs : null;
    // Remove stale expiry entry for this key before potentially re-inserting.
    this.removeExpiring(key);
    this.store.set(key, { value, expiresAt });
    if (expiresAt !== null) {
      this.insertExpiring(key, expiresAt);
    }
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    this.removeExpiring(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    return entry.expiresAt === null || Date.now() <= entry.expiresAt;
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.expiringKeys = [];
    if (this.cleanupIntervalHandle) {
      clearInterval(this.cleanupIntervalHandle);
      this.cleanupIntervalHandle = null;
    }
  }
}
