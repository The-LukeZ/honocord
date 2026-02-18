import {
  ApplicationCommandType,
  ChannelType,
  InteractionType,
  type APIGuild,
  type APIRole,
  type APIUser,
} from "discord-api-types/v10";
import type { BaseCacheAdapter } from "@honocord/cache-base";
import { ValidInteraction } from "$types/interactions";
import { CachedChannel, CachedGuildMember, CacheNamespace, MemberNamespaceAccessor, NamespaceAccessor } from "$types/caching";

function key(ns: CacheNamespace, ...parts: string[]): string {
  return `${ns}:${parts.join(":")}`;
}

export class CacheManager {
  readonly channels: NamespaceAccessor<CachedChannel>;
  readonly roles: NamespaceAccessor<APIRole>;
  readonly users: NamespaceAccessor<APIUser>;
  readonly guilds: NamespaceAccessor<APIGuild>;
  readonly members: MemberNamespaceAccessor;

  constructor(
    private adapter: BaseCacheAdapter,
    private defaultTtlMs?: number
  ) {
    this.channels = {
      get: (id) => this.adapter.get<CachedChannel>(key("channel", id)),
      set: (channel, ttlMs) => this.adapter.set(key("channel", channel.id), channel, ttlMs ?? this.defaultTtlMs),
      delete: (id) => this.adapter.delete(key("channel", id)),
      has: (id) => this.adapter.has(key("channel", id)),
    };

    this.roles = {
      get: (id) => this.adapter.get<APIRole>(key("role", id)),
      set: (role, ttlMs) => this.adapter.set(key("role", role.id), role, ttlMs ?? this.defaultTtlMs),
      delete: (id) => this.adapter.delete(key("role", id)),
      has: (id) => this.adapter.has(key("role", id)),
    };

    this.users = {
      get: (id) => this.adapter.get<APIUser>(key("user", id)),
      set: (user, ttlMs) => this.adapter.set(key("user", user.id), user, ttlMs ?? this.defaultTtlMs),
      delete: (id) => this.adapter.delete(key("user", id)),
      has: (id) => this.adapter.has(key("user", id)),
    };

    this.guilds = {
      get: (id) => this.adapter.get<APIGuild>(key("guild", id)),
      set: (guild, ttlMs) => this.adapter.set(key("guild", guild.id), guild, ttlMs ?? this.defaultTtlMs),
      delete: (id) => this.adapter.delete(key("guild", id)),
      has: (id) => this.adapter.has(key("guild", id)),
    };

    // Members are guild-scoped: key = "member:{guildId}:{userId}"
    this.members = {
      get: (guildId, userId) => this.adapter.get<CachedGuildMember>(key("member", guildId, userId)),
      set: (guildId, member, ttlMs) =>
        this.adapter.set(key("member", guildId, member.user!.id), member, ttlMs ?? this.defaultTtlMs),
      delete: (guildId, userId) => this.adapter.delete(key("member", guildId, userId)),
      has: (guildId, userId) => this.adapter.has(key("member", guildId, userId)),
    };
  }

  populate(i: ValidInteraction) {
    switch (i.type) {
      case InteractionType.ApplicationCommand: // Chat Input Command
        this.populateCommand(i);
        break;
      case InteractionType.MessageComponent: // Message Component
        // this.populateResolved(i);
        break;
      case InteractionType.ApplicationCommandAutocomplete: // Autocomplete
        // this.populateResolved(i);
        break;
      case InteractionType.ModalSubmit: // Modal Submit
        // this.populateResolved(i);
        break;
    }
  }

  private async populateCommand(i: Extract<ValidInteraction, { type: InteractionType.ApplicationCommand }>) {
    if (i.data.type === ApplicationCommandType.PrimaryEntryPoint) return; // Doesnt have any data

    if (i.data.resolved) {
      // channels can't be used as the partial objects are only ID and type
      if ("users" in i.data.resolved && i.data.resolved.users) {
        for (const user of Object.values(i.data.resolved.users)) {
          await this.users.set(user);
        }
      }
      if ("roles" in i.data.resolved && i.data.resolved.roles) {
        for (const role of Object.values(i.data.resolved.roles)) {
          await this.roles.set(role);
        }
      }
      if ("members" in i.data.resolved && i.data.resolved.members && i.guild_id) {
        for (const [userId, member] of Object.entries(i.data.resolved.members)) {
          // We need the guildId to cache members, but it's not included in the resolved data. We can only cache the member if we also have the user object, which includes the ID.
          const user = i.data.resolved.users?.[userId]!;
          if (user) {
            await this.members.set(i.guild_id, { ...member, user });
          }
        }
      }
    }

    // i.guild is somehow only the APIPartialInteractioGuild which only carries id, features and preferred_locale/locale (buggy)

    if (i.user) {
      await this.users.set(i.user);
    }
    if (i.member && i.guild_id) {
      await this.users.set(i.member.user);
      await this.members.set(i.guild_id, i.member);
    }
    if (i.channel && i.channel.type !== ChannelType.DM && i.channel.type !== ChannelType.GroupDM) {
      await this.channels.set(i.channel as CachedChannel);
    }
  }
}
