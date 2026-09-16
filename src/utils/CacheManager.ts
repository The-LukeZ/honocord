import { CachedChannel, CachedGuildMember, CacheNamespace, MemberNamespaceAccessor, NamespaceAccessor } from "$types/caching";
import { ValidInteraction } from "$types/interactions";
import type { BaseCacheAdapter } from "@honocord/cache-base";
import {
  APIInteractionDataResolved,
  APIMessageApplicationCommandInteractionDataResolved,
  APIUserInteractionDataResolved,
  ApplicationCommandType,
  ChannelType,
  ComponentType,
  InteractionType,
  type APIGuild,
  type APIRole,
  type APIUser,
} from "discord-api-types/v10";

function key(ns: CacheNamespace, ...parts: string[]): string {
  return `${ns}:${parts.join(":")}`;
}

/**
 * Provides a structured, namespace-aware layer on top of a `BaseCacheAdapter`. Set on the Hono
 * context by `Honocord` after calling `withCache()` and accessible in middleware and handlers as
 * `c.var.cache`, or via `interaction.fetcher`.
 *
 * @example
 * ```ts
 * const cache = c.var.cache; // CacheManager | null
 * ```
 */
export class CacheManager {
  /**
   * Cached channel objects. Note: channels resolved from raw interaction payloads are **not**
   * populated here automatically — Discord only provides partial objects (`id` + `type`) in those cases.
   */
  readonly channels: NamespaceAccessor<CachedChannel>;
  /** Cached role objects. Roles resolved from interaction data are populated automatically. */
  readonly roles: NamespaceAccessor<APIRole>;
  /** Cached user objects. Users found in interaction resolved data and `interaction.user`/`interaction.member.user` are populated automatically. */
  readonly users: NamespaceAccessor<APIUser>;
  /** Cached guild objects. **Not** populated automatically — the guild object on interactions is partial and only carries `id`, `features`, and `locale`. */
  readonly guilds: NamespaceAccessor<APIGuild>;
  /** Cached guild member objects, scoped by `guildId`. Members resolved from interaction data are populated automatically. */
  readonly members: MemberNamespaceAccessor;

  /**
   * @param adapter - The cache backend to use
   * @param defaultTtlMs - Fallback TTL in milliseconds for all `set`/`mset` calls that don't supply their own TTL. Defaults to 5 minutes.
   */
  constructor(
    private adapter: BaseCacheAdapter,
    private defaultTtlMs: number = 5 * 60 * 1000 /* 5 minutes */
  ) {
    this.channels = {
      get: (id) => this.adapter.get<CachedChannel>(key("channel", id)),
      set: (channel, ttlMs) => this.adapter.set(key("channel", channel.id), channel, ttlMs ?? this.defaultTtlMs),
      delete: (id) => this.adapter.delete(key("channel", id)),
      has: (id) => this.adapter.has(key("channel", id)),
      mset: (entries) => this.adapter.mset(entries.map((e) => ({ ...e, key: key("channel", e.value.id) }))),
    };

    this.roles = {
      get: (id) => this.adapter.get<APIRole>(key("role", id)),
      set: (role, ttlMs) => this.adapter.set(key("role", role.id), role, ttlMs ?? this.defaultTtlMs),
      delete: (id) => this.adapter.delete(key("role", id)),
      has: (id) => this.adapter.has(key("role", id)),
      mset: (entries) => this.adapter.mset(entries.map((e) => ({ ...e, key: key("role", e.value.id) }))),
    };

    this.users = {
      get: (id) => this.adapter.get<APIUser>(key("user", id)),
      set: (user, ttlMs) => this.adapter.set(key("user", user.id), user, ttlMs ?? this.defaultTtlMs),
      delete: (id) => this.adapter.delete(key("user", id)),
      has: (id) => this.adapter.has(key("user", id)),
      mset: (entries) => this.adapter.mset(entries.map((e) => ({ ...e, key: key("user", e.value.id) }))),
    };

    this.guilds = {
      get: (id) => this.adapter.get<APIGuild>(key("guild", id)),
      set: (guild, ttlMs) => this.adapter.set(key("guild", guild.id), guild, ttlMs ?? this.defaultTtlMs),
      delete: (id) => this.adapter.delete(key("guild", id)),
      has: (id) => this.adapter.has(key("guild", id)),
      mset: (entries) => this.adapter.mset(entries.map((e) => ({ ...e, key: key("guild", e.value.id) }))),
    };

    // Members are guild-scoped: key = "member:{guildId}:{userId}"
    this.members = {
      get: (guildId, userId) => this.adapter.get<CachedGuildMember>(key("member", guildId, userId)),
      set: (guildId, member, ttlMs) =>
        this.adapter.set(key("member", guildId, member.user!.id), member, ttlMs ?? this.defaultTtlMs),
      delete: (guildId, userId) => this.adapter.delete(key("member", guildId, userId)),
      has: (guildId, userId) => this.adapter.has(key("member", guildId, userId)),
      mset: (guildId, entries) => this.adapter.mset(entries.map((e) => ({ ...e, key: key("member", guildId, e.value.user.id) }))),
    };
  }

  /**
   * Returns all cached roles for the given guild.
   *
   * Reads a stored index of role IDs and resolves each one from the role namespace. Returns an
   * empty array if none are cached.
   */
  async getGuildRoles(guildId: string): Promise<APIRole[]> {
    const roleIds = await this.adapter.get<string[]>(key("guild-roles", guildId));
    if (!roleIds) return [];
    const roles = await Promise.all(roleIds.map((roleId) => this.roles.get(roleId)));
    return roles.filter(Boolean) as APIRole[];
  }

  /**
   * Caches all roles for a guild, and stores an index of their IDs so `getGuildRoles` can look
   * them back up later.
   */
  async setGuildRoles(guildId: string, roles: APIRole[]): Promise<void> {
    await this.adapter.set(
      key("guild-roles", guildId),
      roles.map((role) => role.id),
      this.defaultTtlMs
    );
    await this.roles.mset(roles.map((role) => ({ value: role })));
  }

  /**
   * Fetches a cached DM channel for a user.
   *
   * Unlike other namespace accessors, DM channels are looked up by user ID rather than channel ID —
   * use this instead of `channels.get` when you only have the user ID.
   */
  async getDMChannel(
    userId: string
  ): Promise<Extract<CachedChannel, { type: ChannelType.DM | ChannelType.GroupDM }> | undefined> {
    const channelId = await this.adapter.get<string>(key("dm-channel", userId));
    const cachedChannel = channelId ? await this.channels.get(channelId) : undefined;
    if (cachedChannel && (cachedChannel.type === ChannelType.DM || cachedChannel.type === ChannelType.GroupDM)) {
      return cachedChannel;
    }
    return undefined; // We should never get here, but just in case
  }

  /**
   * Manually caches a DM channel for a user. Useful if you have a DM channel object from another
   * source and want to store it in the cache.
   *
   * DM channels are stored in two places: the `dm-channel` namespace keyed by user ID, and the
   * `channel` namespace keyed by channel ID. Both must be populated for the cache to function
   * properly — this method handles both automatically.
   */
  async setDMChannel(userId: string, channel: CachedChannel, ttlMs?: number): Promise<void> {
    await this.channels.set(channel, ttlMs);
    await this.adapter.set(key("dm-channel", userId), channel.id, ttlMs ?? this.defaultTtlMs);
  }

  /**
   * Extracts and caches users, roles, members, and channels from a raw interaction payload.
   * Called automatically by `Honocord` before dispatching to handlers when a cache adapter is registered.
   */
  populate(i: ValidInteraction) {
    switch (i.type) {
      case InteractionType.ApplicationCommand: // Chat Input Command
        return this.populateCommand(i);
      case InteractionType.MessageComponent: // Message Component
        return this.populateMessageComponent(i);
      case InteractionType.ModalSubmit: // Modal Submit
        if (i.data.resolved) {
          return this.populateResolved(i.data.resolved, i.guild_id);
        }
        break;
      default:
        break;
    }
    return Promise.resolve();
  }

  private async populateResolved(
    resolved: APIInteractionDataResolved | APIUserInteractionDataResolved | APIMessageApplicationCommandInteractionDataResolved,
    guildId?: string
  ) {
    if (resolved) {
      // channels can't be used as the partial objects are only ID and type
      if ("users" in resolved && resolved.users) {
        await this.users.mset(Object.values(resolved.users).map((user) => ({ value: user })));
      }
      if ("roles" in resolved && resolved.roles) {
        await this.roles.mset(Object.values(resolved.roles).map((role) => ({ value: role })));
      }
      if ("members" in resolved && resolved.members && guildId) {
        // We need the guildId to cache members, but it's not included in the resolved data. We can only cache the member if we also have the user object, which includes the ID.
        const entries = Object.entries(resolved.members).flatMap(([userId, member]) => {
          const user = resolved.users?.[userId];
          return user ? [{ value: { ...member, user } }] : [];
        });
        if (entries.length) {
          await this.members.mset(guildId, entries);
        }
      }
    }
  }

  private async populateCommand(i: Extract<ValidInteraction, { type: InteractionType.ApplicationCommand }>) {
    if (i.data.type === ApplicationCommandType.PrimaryEntryPoint) return; // Doesnt have any data

    // i.guild is somehow only the APIPartialInteractionGuild which only carries id, features and preferred_locale/locale (buggy)

    if (i.data.resolved) {
      await this.populateResolved(i.data.resolved, i.guild_id);
    }

    if (i.user) {
      await this.users.set(i.user);
    }
    if (i.member && i.guild_id) {
      await this.users.set(i.member.user);
      await this.members.set(i.guild_id, i.member);
    }
    if (i.channel) {
      await this.channels.set(i.channel as CachedChannel);
    }
  }

  private async populateMessageComponent(i: Extract<ValidInteraction, { type: InteractionType.MessageComponent }>) {
    if (i.channel) {
      await this.channels.set(i.channel as CachedChannel);
    }

    if (i.user) {
      await this.users.set(i.user);
    }
    if (i.member && i.guild_id) {
      await this.users.set(i.member.user);
      await this.members.set(i.guild_id, i.member);
    }

    if (
      i.data.component_type !== ComponentType.Button &&
      i.data.component_type !== ComponentType.StringSelect &&
      "resolved" in i.data &&
      i.data.resolved
    ) {
      const resolved = i.data.resolved;
      if ("users" in resolved && resolved.users) {
        await this.users.mset(Object.values(resolved.users).map((user) => ({ value: user })));
      }
      if ("roles" in resolved && resolved.roles) {
        await this.roles.mset(Object.values(resolved.roles).map((role) => ({ value: role })));
      }
      if ("members" in resolved && resolved.members && i.guild_id) {
        const resolvedUsers = "users" in resolved ? resolved.users : undefined;
        const entries = Object.entries(resolved.members).flatMap(([userId, member]) => {
          const user = resolvedUsers?.[userId];
          return user ? [{ value: { ...member, user } }] : [];
        });
        if (entries.length) {
          await this.members.mset(i.guild_id, entries);
        }
      }
    }
  }
}
