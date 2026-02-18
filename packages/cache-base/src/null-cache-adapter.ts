import { BaseCacheAdapter } from "@honocord/cache-base";

/**
 * A cache adapter that does nothing. Useful for testing or if you don't want to use caching.
 */
export class NullCacheAdapter extends BaseCacheAdapter {
  async get(_key: string): Promise<null> {
    return null;
  }
  async set(..._args: any[]): Promise<void> {}

  async delete(_key: string): Promise<void> {}

  async has(_key: string): Promise<boolean> {
    return false;
  }

  async clear(): Promise<void> {}
}
