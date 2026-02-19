import { DurableObject } from "cloudflare:workers";

export class HonocordCacheDO extends DurableObject {
  private store = new Map<string, { value: unknown; expiresAt: number | null }>();

  constructor(state: DurableObjectState, env: Cloudflare.Env) {
    super(state, env);
    this.ctx.blockConcurrencyWhile(async () => {
      const stored = await this.ctx.storage.get<typeof this.store>("store");
      if (stored) this.store = stored;
    });
  }

  async get(key: string): Promise<unknown> {
    const entry = this.store.get(key);
    if (!entry) return null;
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
    await this.ctx.storage.put(key, { value, expiresAt });
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
    const storageOps: Record<string, { value: unknown; expiresAt: number | null }> = {};
    let nextAlarm: number | null = null;
    for (const { key, value, ttlMs } of entries) {
      const expiresAt = ttlMs !== undefined ? now + ttlMs : null;
      this.store.set(key, { value, expiresAt });
      storageOps[key] = { value, expiresAt };
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
