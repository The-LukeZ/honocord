import { BaseCacheAdapter } from "@honocord/cache-base";
// DurableObjectNamespace / DurableObjectStub come from @cloudflare/workers-types, which is a
// global ambient declaration file — importing from it breaks .d.ts bundling.
import type { HonocordCacheDO } from "./do";

export class DurableObjectCacheAdapter extends BaseCacheAdapter {
  private readonly namespace: DurableObjectNamespace<HonocordCacheDO>;

  constructor(namespace: DurableObjectNamespace<HonocordCacheDO>) {
    super();
    if (!namespace) {
      throw new Error(
        "[honocord] DurableObjectCacheAdapter requires a DurableObjectNamespace. " +
          "Ensure you have bound HonocordCacheDO in your wrangler.toml."
      );
    }
    this.namespace = namespace;
  }

  // Create the stub per-call so it is always bound to the current request's I/O context.
  // Reusing a stub across requests causes "Cannot perform I/O on behalf of a different request".
  private getStub(): DurableObjectStub<HonocordCacheDO> {
    return this.namespace.get(this.namespace.idFromName("honocord-cache"));
  }

  async get<T>(key: string): Promise<T | null> {
    return this.getStub().get(key) as Promise<T | null>;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    await this.getStub().set(key, value, ttlMs);
  }

  async mset(entries: { key: string; value: unknown; ttlMs?: number }[]): Promise<void> {
    await this.getStub().mset(entries);
  }

  async delete(key: string): Promise<void> {
    await this.getStub().delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.getStub().has(key);
  }

  async clear(): Promise<void> {
    await this.getStub().clear();
  }
}
