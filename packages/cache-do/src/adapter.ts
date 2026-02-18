import { BaseCacheAdapter } from "@honocord/cache-base";
import { DurableObjectNamespace } from "@cloudflare/workers-types";
import type { HonocordCacheDO } from "./do";

export class DurableObjectCacheAdapter extends BaseCacheAdapter {
  private readonly stub: DurableObjectStub<HonocordCacheDO>;

  constructor(namespace: DurableObjectNamespace<HonocordCacheDO>) {
    super();
    if (!namespace)
      throw new Error(
        "[honocord] DurableObjectCacheAdapter requires a DurableObjectNamespace. " +
          "Ensure you have bound HonocordCacheDO in your wrangler.toml."
      );
    // Single named instance — all cache lives in one DO
    this.stub = namespace.get(namespace.idFromName("honocord-cache"));
  }

  async get<T>(key: string): Promise<T | null> {
    return this.stub.get(key) as Promise<T | null>;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    await this.stub.set(key, value, ttlMs);
  }

  async delete(key: string): Promise<void> {
    await this.stub.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.stub.has(key);
  }

  async clear(): Promise<void> {
    await this.stub.clear();
  }
}
