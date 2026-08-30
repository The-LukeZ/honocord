import { BaseCacheAdapter } from "@honocord/cache-base";
import { InteractionType } from "discord-api-types/v10";
import { describe, expect, it } from "vitest";
import { CacheManager } from "../../utils/CacheManager";

class MemoryCacheAdapter extends BaseCacheAdapter {
  private store = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | null> {
    return (this.store.get(key) as T) ?? null;
  }

  async set<T>(key: string, value: T, _ttlMs?: number): Promise<void> {
    this.store.set(key, value);
  }

  async mset(entries: { key: string; value: unknown; ttlMs?: number }[]): Promise<void> {
    for (const entry of entries) {
      this.store.set(entry.key, entry.value);
    }
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

describe("CacheManager.populate", () => {
  it("does not treat interaction-resolved roles as a full guild role list", async () => {
    const adapter = new MemoryCacheAdapter();
    const cache = new CacheManager(adapter);

    const interaction = {
      type: InteractionType.ApplicationCommand,
      guild_id: "guild-1",
      data: {
        type: 1,
        resolved: {
          roles: {
            "1114938185542291466": {
              id: "1114938185542291466",
              name: "Support",
              position: 28,
            },
          },
        },
      },
      user: { id: "user-1" },
      member: { user: { id: "user-1" } },
    } as any;

    await cache.populate(interaction);

    expect(await adapter.get("guild-roles:guild-1")).toBeNull();
    expect(await adapter.get("role:1114938185542291466")).toEqual(
      expect.objectContaining({ id: "1114938185542291466", name: "Support" })
    );
  });
});
