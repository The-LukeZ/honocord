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
      return obj; // These have their own JSON serialization
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
    const restored: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      restored[key] = restoreFromStorage(value);
    }
    return restored;
  }
  return obj;
}

export class HonocordCacheDO extends DurableObject {
  private store = new Map<string, { value: unknown; expiresAt: number | null }>();

  constructor(state: DurableObjectState, env: Cloudflare.Env) {
    super(state, env);
    // Note: The in-memory store is per-instance. To persist cache across instance restarts,
    // values are stored individually in persistent storage via set/mset methods.
  }

  async get(key: string): Promise<unknown> {
    const entry = this.store.get(key);
    if (!entry) {
      // Try to restore from persistent storage
      const stored = await this.ctx.storage.get<unknown>(key);
      if (!stored) return null;
      // Restore BigInt values from their sanitized form
      const restored = restoreFromStorage(stored);
      if (typeof restored === "object" && restored !== null && "value" in restored && "expiresAt" in restored) {
        const restoredEntry = restored as { value: unknown; expiresAt: number | null };
        // Check expiry
        if (restoredEntry.expiresAt !== null && Date.now() > restoredEntry.expiresAt) {
          await this.ctx.storage.delete(key);
          return null;
        }
        // Cache it in memory
        this.store.set(key, restoredEntry);
        return restoredEntry.value;
      }
      return restored;
    }
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      await this.ctx.storage.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    const expiresAt = ttlMs !== undefined ? Date.now() + ttlMs : null;
    this.store.set(key, { value, expiresAt });
    // Sanitize for storage to handle BigInt values (Discord API sends member.permissions as bigint)
    const sanitized = sanitizeForStorage({ value, expiresAt });
    await this.ctx.storage.put(key, sanitized);
    if (ttlMs !== undefined) {
      const current = await this.ctx.storage.getAlarm();
      if (current === null || Date.now() + ttlMs < current) {
        await this.ctx.storage.setAlarm(Date.now() + ttlMs);
      }
    }
  }

  /**
   * Set multiple entries at once. This is more efficient than calling `set` multiple times since it only requires one storage write and can set a single alarm for the earliest expiry among the entries.
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
    await this.ctx.storage.put(storageOps);
    if (nextAlarm !== null) {
      const current = await this.ctx.storage.getAlarm();
      if (current === null || nextAlarm < current) {
        await this.ctx.storage.setAlarm(nextAlarm);
      }
    }
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    await this.ctx.storage.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      await this.ctx.storage.delete(key);
      return false;
    }
    return true;
  }

  async clear(): Promise<void> {
    this.store.clear();
    await this.ctx.storage.deleteAll();
    await this.ctx.storage.deleteAlarm();
  }

  async alarm(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt !== null && now >= entry.expiresAt) {
        this.store.delete(key);
        await this.ctx.storage.delete(key);
      }
    }
    let nextExpiry: number | null = null;
    for (const entry of this.store.values()) {
      if (entry.expiresAt !== null) {
        nextExpiry = nextExpiry === null ? entry.expiresAt : Math.min(nextExpiry, entry.expiresAt);
      }
    }
    if (nextExpiry !== null) {
      await this.ctx.storage.setAlarm(nextExpiry);
    }
  }
}
