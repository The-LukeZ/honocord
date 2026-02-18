import type { APIChannel, APIGuild, APIGuildMember, APIRole, APIUser } from "discord-api-types/v10";
import type { BaseCacheAdapter } from "@honocord/cache-base";

type CacheNamespace = "channel" | "role" | "user" | "member" | "guild";

function key(ns: CacheNamespace, ...parts: string[]): string {
  return `${ns}:${parts.join(":")}`;
}

interface NamespaceAccessor<T> {
  /** Retrieve a cached entity by its ID. Returns `null` if not found or expired. */
  get(id: string): Promise<T | null>;
  /** Cache an entity. Falls back to the CacheManager's default TTL if not specified. */
  set(data: T, ttlMs?: number): Promise<void>;
  /** Remove a cached entity by its ID. */
  delete(id: string): Promise<void>;
  /** Check whether a non-expired entry exists for this ID. */
  has(id: string): Promise<boolean>;
}

// Members are a special case since they are scoped to a guild and identified by both guildId and userId
interface MemberNamespaceAccessor {
  /** Retrieve a cached guild member. Returns `null` if not found or expired. */
  get(guildId: string, userId: string): Promise<APIGuildMember | null>;
  /** Cache a guild member. Falls back to the CacheManager's default TTL if not specified. */
  set(guildId: string, member: APIGuildMember, ttlMs?: number): Promise<void>;
  /** Remove a cached guild member. */
  delete(guildId: string, userId: string): Promise<void>;
  /** Check whether a non-expired entry exists for this member. */
  has(guildId: string, userId: string): Promise<boolean>;
}

export class CacheManager {
  readonly channels: NamespaceAccessor<APIChannel>;
  readonly roles: NamespaceAccessor<APIRole>;
  readonly users: NamespaceAccessor<APIUser>;
  readonly guilds: NamespaceAccessor<APIGuild>;
  readonly members: MemberNamespaceAccessor;

  constructor(
    private adapter: BaseCacheAdapter,
    private defaultTtlMs?: number
  ) {
    this.channels = {
      get: (id) => adapter.get<APIChannel>(key("channel", id)),
      set: (channel, ttlMs) => adapter.set(key("channel", channel.id), channel, ttlMs ?? this.defaultTtlMs),
      delete: (id) => adapter.delete(key("channel", id)),
      has: (id) => adapter.has(key("channel", id)),
    };

    this.roles = {
      get: (id) => adapter.get<APIRole>(key("role", id)),
      set: (role, ttlMs) => adapter.set(key("role", role.id), role, ttlMs ?? this.defaultTtlMs),
      delete: (id) => adapter.delete(key("role", id)),
      has: (id) => adapter.has(key("role", id)),
    };

    this.users = {
      get: (id) => adapter.get<APIUser>(key("user", id)),
      set: (user, ttlMs) => adapter.set(key("user", user.id), user, ttlMs ?? this.defaultTtlMs),
      delete: (id) => adapter.delete(key("user", id)),
      has: (id) => adapter.has(key("user", id)),
    };

    this.guilds = {
      get: (id) => adapter.get<APIGuild>(key("guild", id)),
      set: (guild, ttlMs) => adapter.set(key("guild", guild.id), guild, ttlMs ?? this.defaultTtlMs),
      delete: (id) => adapter.delete(key("guild", id)),
      has: (id) => adapter.has(key("guild", id)),
    };

    // Members are guild-scoped: key = "member:{guildId}:{userId}"
    this.members = {
      get: (guildId, userId) => adapter.get<APIGuildMember>(key("member", guildId, userId)),
      set: (guildId, member, ttlMs) => adapter.set(key("member", guildId, member.user!.id), member, ttlMs ?? this.defaultTtlMs),
      delete: (guildId, userId) => adapter.delete(key("member", guildId, userId)),
      has: (guildId, userId) => adapter.has(key("member", guildId, userId)),
    };
  }
}
