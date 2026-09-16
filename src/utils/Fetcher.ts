import type { CachedChannel, CachedGuildMember } from "$types/caching";
import { API } from "@discordjs/core/http-only";
import type { APIGuild, APIGuildMember, APIRole, APIUser, ChannelType } from "discord-api-types/v10";
import { CacheManager } from "./CacheManager";

/**
 * Cache-first REST wrapper available on every interaction object as `interaction.fetcher`. Checks
 * the `CacheManager` before making a live Discord API request, and writes the result back to the
 * cache automatically. If no cache adapter is configured, bypasses the cache and always fetches
 * from the API.
 *
 * @example
 * ```ts
 * // Inside any handler or middleware
 * const user = await interaction.fetcher.users.get(userId);
 * ```
 */
export class Fetcher {
  /** Constructed internally by `BaseInteraction` — you do not construct this directly. */
  constructor(
    /** The raw `@discordjs/core` `API` instance. Use this for any Discord REST call not covered by the named accessors. */
    public readonly api: API,
    private getCache: () => CacheManager | undefined | null
  ) {}

  private get cache() {
    return this.getCache() ?? null;
  }

  private async fetchAndCache<T>(
    cacheGetter: () => Promise<T | undefined | null>,
    cacheSetter: (data: T) => Promise<void>,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cache = this.cache;
    if (cache) {
      const cached = await cacheGetter();
      if (cached) return cached;
    }

    const data = await fetcher();
    if (cache) {
      await cacheSetter(data);
    }
    return data;
  }

  /** Cache-first accessor for users. */
  readonly users = {
    /** Fetches a user by ID. Returns the cached value if available, otherwise fetches from Discord and caches the result. */
    get: (userId: string): Promise<APIUser> =>
      this.fetchAndCache(
        () => this.cache?.users.get(userId) ?? Promise.resolve(null),
        (user) => this.cache!.users.set(user),
        () => this.api.users.get(userId)
      ),
  };

  /** Cache-first accessor for channels. */
  readonly channels = {
    /** Fetches a channel by ID. Returns the cached value if available, otherwise fetches from Discord and caches the result. */
    get: (channelId: string): Promise<CachedChannel> =>
      this.fetchAndCache(
        () => this.cache?.channels.get(channelId) ?? Promise.resolve(null),
        (channel) => this.cache!.channels.set(channel),
        () => this.api.channels.get(channelId) as Promise<CachedChannel>
      ),
  };

  /** Cache-first accessor for DM channels. */
  readonly dmChannels = {
    /** Fetches a DM channel for a user. Returns the cached value if available, otherwise creates a new DM channel via Discord and caches the result. */
    get: (userId: string): Promise<Extract<CachedChannel, { type: ChannelType.DM | ChannelType.GroupDM }>> =>
      this.fetchAndCache(
        () => this.cache?.getDMChannel(userId) ?? Promise.resolve(null),
        (channel) => this.cache!.setDMChannel(userId, channel),
        () => this.api.users.createDM(userId) as Promise<Extract<CachedChannel, { type: ChannelType.DM | ChannelType.GroupDM }>>
      ),
  };

  /** Cache-first accessor for guilds. */
  readonly guilds = {
    /** Fetches a guild by ID. Returns the cached value if available, otherwise fetches from Discord and caches the result. */
    get: (guildId: string): Promise<APIGuild> =>
      this.fetchAndCache(
        () => this.cache?.guilds.get(guildId) ?? Promise.resolve(null),
        (guild) => this.cache!.guilds.set(guild),
        () => this.api.guilds.get(guildId)
      ),
  };

  /** Cache-first accessor for roles. */
  readonly roles = {
    /** Fetches a single role. If not cached, fetches **all** roles for the guild via `guilds.getRoles` and returns the matching one. */
    get: (guildId: string, roleId: string): Promise<APIRole> =>
      this.fetchAndCache(
        () => this.cache?.roles.get(roleId) ?? Promise.resolve(null),
        (role) => this.cache!.roles.set(role),
        async () => {
          const roles = await this.api.guilds.getRoles(guildId);
          return roles.find((r) => r.id === roleId)!;
        }
      ),
    /** Fetches **all** roles for a guild. Returns cached roles if available (via `CacheManager.getGuildRoles`), otherwise fetches from Discord and bulk-caches the result. */
    list: async (guildId: string): Promise<APIRole[]> => {
      const roles = await this.api.guilds.getRoles(guildId);
      if (this.cache) {
        await this.cache.setGuildRoles(guildId, roles);
      }
      return roles;
    },
  };

  /** Cache-first accessor for guild members. */
  readonly members = {
    /** Fetches a guild member by user ID. Returns the cached value if available, otherwise fetches from Discord and caches the result. */
    get: (guildId: string, userId: string): Promise<APIGuildMember | CachedGuildMember> =>
      this.fetchAndCache(
        () => this.cache?.members.get(guildId, userId) ?? Promise.resolve(null),
        (member) => this.cache!.members.set(guildId, member),
        () => this.api.guilds.getMember(guildId, userId)
      ),
  };
}
