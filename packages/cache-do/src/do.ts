import { DurableObject } from "cloudflare:workers";

/**
 * Recursively sanitizes an object to handle BigInt values that cannot be JSON serialized.
 * Converts BigInt values to strings with a "__bigint__" prefix so they can be restored later.
 */
function sanitizeForStorage(obj: unknown): unknown {
  if (typeof obj === "bigint") {
    return `__bigint__${obj}`;
  }
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map(sanitizeForStorage);
    }
    if (obj instanceof Date || obj instanceof Map || obj instanceof Set) {
      return obj; // These have their own serialization via structured clone
    }
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeForStorage(value);
    }
    return sanitized;
  }
  return obj;
}

/**
 * Restores BigInt values from their sanitized string form.
 * Used when values are restored from persistent storage.
 */
function restoreFromStorage(obj: unknown): unknown {
  if (typeof obj === "string" && obj.startsWith("__bigint__")) {
    return BigInt(obj.slice("__bigint__".length));
  }
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map(restoreFromStorage);
    }
    // FIX: mirror the guard from sanitizeForStorage — these types were previously
    // silently destroyed by Object.entries() returning [] and replaced with {}
    if (obj instanceof Date || obj instanceof Map || obj instanceof Set) {
      return obj;
    }
    const restored: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      restored[key] = restoreFromStorage(value);
    }
    return restored;
  }
  return obj;
}

type CacheEntry = { value: unknown; expiresAt: number | null };

function isCacheEntry(obj: unknown): obj is CacheEntry {
  return typeof obj === "object" && obj !== null && "value" in obj && "expiresAt" in obj;
}

export class HonocordCacheDO extends DurableObject {
  private store = new Map<string, CacheEntry>();

  constructor(state: DurableObjectState, env: Cloudflare.Env) {
    super(state, env);
    // Note: The in-memory store is per-instance. To persist cache across instance restarts,
    // values are stored individually in persistent storage via set/mset methods.
  }

  async get(key: string): Promise<unknown> {
    const entry = this.store.get(key);
    if (!entry) {
      // Try to restore from persistent storage
      let stored: unknown;
      try {
        stored = await this.ctx.storage.get<unknown>(key);
      } catch (err) {
        console.error(`[HonocordCacheDO] storage.get failed for key "${key}":`, err);
        return null;
      }

      if (!stored) return null;

      const restored = restoreFromStorage(stored);
      if (isCacheEntry(restored)) {
        // Check expiry
        if (restored.expiresAt !== null && Date.now() > restored.expiresAt) {
          try {
            await this.ctx.storage.delete(key);
          } catch (err) {
            console.error(`[HonocordCacheDO] storage.delete failed for key "${key}":`, err);
          }
          return null;
        }
        // Cache in memory
        this.store.set(key, restored);
        return restored.value;
      }

      // FIX: value didn't match the expected shape — cache it anyway to avoid
      // hitting persistent storage on every subsequent call
      const fallback: CacheEntry = { value: restored, expiresAt: null };
      this.store.set(key, fallback);
      return restored;
    }

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      try {
        await this.ctx.storage.delete(key);
      } catch (err) {
        console.error(`[HonocordCacheDO] storage.delete failed for key "${key}":`, err);
      }
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    const expiresAt = ttlMs !== undefined ? Date.now() + ttlMs : null;
    this.store.set(key, { value, expiresAt });
    // Sanitize for storage to handle BigInt values (Discord API sends member.permissions as bigint)
    const sanitized = sanitizeForStorage({ value, expiresAt });
    try {
      await this.ctx.storage.put(key, sanitized);
    } catch (err) {
      console.error(`[HonocordCacheDO] storage.put failed for key "${key}":`, err);
    }
    if (ttlMs !== undefined) {
      try {
        const current = await this.ctx.storage.getAlarm();
        if (current === null || Date.now() + ttlMs < current) {
          await this.ctx.storage.setAlarm(Date.now() + ttlMs);
        }
      } catch (err) {
        console.error(`[HonocordCacheDO] alarm update failed for key "${key}":`, err);
      }
    }
  }

  /**
   * Set multiple entries at once. This is more efficient than calling `set` multiple times
   * since it only requires one storage write and can set a single alarm for the earliest
   * expiry among the entries.
   * @param entries An array of entries to set, each with a key, value, and optional TTL in milliseconds
   */
  async mset(entries: { key: string; value: unknown; ttlMs?: number }[]): Promise<void> {
    const now = Date.now();
    const storageOps: Record<string, unknown> = {};
    let nextAlarm: number | null = null;

    for (const { key, value, ttlMs } of entries) {
      const expiresAt = ttlMs !== undefined ? now + ttlMs : null;
      this.store.set(key, { value, expiresAt });
      // Sanitize for storage to handle BigInt values
      storageOps[key] = sanitizeForStorage({ value, expiresAt });
      if (expiresAt !== null && (nextAlarm === null || expiresAt < nextAlarm)) {
        nextAlarm = expiresAt;
      }
    }

    try {
      await this.ctx.storage.put(storageOps);
    } catch (err) {
      console.error(`[HonocordCacheDO] storage.put (mset) failed:`, err);
    }

    if (nextAlarm !== null) {
      try {
        const current = await this.ctx.storage.getAlarm();
        if (current === null || nextAlarm < current) {
          await this.ctx.storage.setAlarm(nextAlarm);
        }
      } catch (err) {
        console.error(`[HonocordCacheDO] alarm update failed (mset):`, err);
      }
    }
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    try {
      await this.ctx.storage.delete(key);
    } catch (err) {
      console.error(`[HonocordCacheDO] storage.delete failed for key "${key}":`, err);
    }
  }

  // FIX: previously only checked the in-memory store, returning false for keys that
  // exist in persistent storage after an instance restart. Delegating to get() handles
  // both the cold-miss and expiry cases correctly.
  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  async clear(): Promise<void> {
    this.store.clear();
    try {
      await this.ctx.storage.deleteAll();
      await this.ctx.storage.deleteAlarm();
    } catch (err) {
      console.error(`[HonocordCacheDO] clear failed:`, err);
    }
  }

  // FIX: previously only iterated the in-memory store, which is empty after an instance
  // restart — making the alarm a no-op and allowing expired entries to accumulate in
  // persistent storage indefinitely. Now reads from storage directly.
  async alarm(): Promise<void> {
    const now = Date.now();
    let all: Map<string, unknown>;

    try {
      all = await this.ctx.storage.list<unknown>();
    } catch (err) {
      console.error(`[HonocordCacheDO] storage.list failed in alarm:`, err);
      return;
    }

    const toDelete: string[] = [];
    let nextExpiry: number | null = null;

    for (const [key, raw] of all) {
      const entry = restoreFromStorage(raw);
      if (!isCacheEntry(entry)) continue;

      if (entry.expiresAt !== null && now >= entry.expiresAt) {
        this.store.delete(key);
        toDelete.push(key);
      } else if (entry.expiresAt !== null) {
        nextExpiry = nextExpiry === null ? entry.expiresAt : Math.min(nextExpiry, entry.expiresAt);
      }
    }

    if (toDelete.length > 0) {
      try {
        await this.ctx.storage.delete(toDelete);
      } catch (err) {
        console.error(`[HonocordCacheDO] storage.delete (alarm eviction) failed:`, err);
      }
    }

    if (nextExpiry !== null) {
      try {
        await this.ctx.storage.setAlarm(nextExpiry);
      } catch (err) {
        console.error(`[HonocordCacheDO] setAlarm failed in alarm handler:`, err);
      }
    }
  }
}
