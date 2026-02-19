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
    private defaultTtlMs: number = 5 * 60 * 1000 /* 5 minutes */
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

  async getGuildRoles(guildId: string): Promise<APIRole[]> {
    const roleIds = await this.adapter.get<string[]>(key("guild-roles", guildId));
    if (!roleIds) return [];
    const roles = await Promise.all(roleIds.map((roleId) => this.roles.get(roleId)));
    return roles.filter(Boolean) as APIRole[];
  }

  private async addRoleToGuild(guildId: string, roleId: string): Promise<void> {
    const existing = (await this.adapter.get<string[]>(key("guild-roles", guildId))) ?? [];
    if (!existing.includes(roleId)) {
      await this.adapter.set(key("guild-roles", guildId), [...existing, roleId], this.defaultTtlMs);
    }
  }

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
        for (const user of Object.values(resolved.users)) {
          await this.users.set(user);
        }
      }
      if ("roles" in resolved && resolved.roles) {
        for (const role of Object.values(resolved.roles)) {
          await this.roles.set(role);
          if (guildId) await this.addRoleToGuild(guildId, role.id);
        }
      }
      if ("members" in resolved && resolved.members && guildId) {
        for (const [userId, member] of Object.entries(resolved.members)) {
          // We need the guildId to cache members, but it's not included in the resolved data. We can only cache the member if we also have the user object, which includes the ID.
          const user = resolved.users?.[userId]!;
          if (user) {
            await this.members.set(guildId, { ...member, user });
          }
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
    if (i.channel && i.channel.type !== ChannelType.DM && i.channel.type !== ChannelType.GroupDM) {
      await this.channels.set(i.channel as CachedChannel);
    }
  }

  private async populateMessageComponent(i: Extract<ValidInteraction, { type: InteractionType.MessageComponent }>) {
    if (i.channel && i.channel.type !== ChannelType.DM && i.channel.type !== ChannelType.GroupDM) {
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
      if ("users" in i.data.resolved && i.data.resolved.users) {
        for (const userId in i.data.resolved.users) {
          await this.users.set(i.data.resolved.users[userId]);
        }
      }
      if ("roles" in i.data.resolved && i.data.resolved.roles) {
        for (const roleId in i.data.resolved.roles) {
          await this.roles.set(i.data.resolved.roles[roleId]);
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
  }
}
