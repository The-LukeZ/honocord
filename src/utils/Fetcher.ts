import type { CachedChannel, CachedGuildMember } from "$types/caching";
import { API } from "@discordjs/core/http-only";
import type { APIGuild, APIGuildMember, APIRole, APIUser, ChannelType } from "discord-api-types/v10";
import { CacheManager } from "./CacheManager";

export class Fetcher {
  constructor(
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

  readonly users = {
    get: (userId: string): Promise<APIUser> =>
      this.fetchAndCache(
        () => this.cache?.users.get(userId) ?? Promise.resolve(null),
        (user) => this.cache!.users.set(user),
        () => this.api.users.get(userId)
      ),
  };

  readonly channels = {
    get: (channelId: string): Promise<CachedChannel> =>
      this.fetchAndCache(
        () => this.cache?.channels.get(channelId) ?? Promise.resolve(null),
        (channel) => this.cache!.channels.set(channel),
        () => this.api.channels.get(channelId) as Promise<CachedChannel>
      ),
  };

  readonly dmChannels = {
    get: (userId: string): Promise<Extract<CachedChannel, { type: ChannelType.DM | ChannelType.GroupDM }>> =>
      this.fetchAndCache(
        () => this.cache?.getDMChannel(userId) ?? Promise.resolve(null),
        (channel) => this.cache!.setDMChannel(userId, channel),
        () => this.api.users.createDM(userId) as Promise<Extract<CachedChannel, { type: ChannelType.DM | ChannelType.GroupDM }>>
      ),
  };

  readonly guilds = {
    get: (guildId: string): Promise<APIGuild> =>
      this.fetchAndCache(
        () => this.cache?.guilds.get(guildId) ?? Promise.resolve(null),
        (guild) => this.cache!.guilds.set(guild),
        () => this.api.guilds.get(guildId)
      ),
  };

  readonly roles = {
    get: (guildId: string, roleId: string): Promise<APIRole> =>
      this.fetchAndCache(
        () => this.cache?.roles.get(roleId) ?? Promise.resolve(null),
        (role) => this.cache!.roles.set(role),
        async () => {
          const roles = await this.api.guilds.getRoles(guildId);
          return roles.find((r) => r.id === roleId)!;
        }
      ),
    list: async (guildId: string): Promise<APIRole[]> => {
      const roles = await this.api.guilds.getRoles(guildId);
      if (this.cache) {
        await this.cache.setGuildRoles(guildId, roles);
      }
      return roles;
    },
  };

  readonly members = {
    get: (guildId: string, userId: string): Promise<APIGuildMember | CachedGuildMember> =>
      this.fetchAndCache(
        () => this.cache?.members.get(guildId, userId) ?? Promise.resolve(null),
        (member) => this.cache!.members.set(guildId, member),
        () => this.api.guilds.getMember(guildId, userId)
      ),
  };
}
