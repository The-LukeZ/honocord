import { APIChannel, APIGuildMember, APIUser, ChannelType } from "discord-api-types/v10";

/** A guild member as stored in the cache. Like `APIGuildMember` but with `user` required (never partial). */
export type CachedGuildMember = Omit<APIGuildMember, "user" | "deaf" | "mute"> & { user: APIUser } & Partial<
    Pick<APIGuildMember, "deaf" | "mute">
  >;

/** A DM or group DM channel as stored in the cache. */
export type CachedDMChannel = Pick<Extract<APIChannel, { type: ChannelType.DM | ChannelType.GroupDM }>, "id" | "type" | "name">;
/** A thread channel as stored in the cache. */
export type CachedThreadChannel = Pick<
  Extract<APIChannel, { type: ChannelType.PublicThread | ChannelType.PrivateThread | ChannelType.AnnouncementThread }>,
  "id" | "type" | "name" | "rate_limit_per_user" | "parent_id" | "guild_id" | "nsfw"
>;
/** A text or announcement guild channel as stored in the cache. */
export type CachedTextGuildChannel = Pick<
  Extract<
    APIChannel,
    {
      type: ChannelType.GuildText | ChannelType.GuildAnnouncement;
    }
  >,
  "id" | "type" | "name" | "guild_id" | "nsfw" | "parent_id" | "permission_overwrites" | "topic"
>;
/** A voice or stage guild channel as stored in the cache. */
export type CachedVoiceGuildChannel = Pick<
  Extract<
    APIChannel,
    {
      type: ChannelType.GuildVoice | ChannelType.GuildStageVoice;
    }
  >,
  | "id"
  | "type"
  | "name"
  | "guild_id"
  | "parent_id"
  | "permission_overwrites"
  | "bitrate"
  | "user_limit"
  | "video_quality_mode"
  | "rtc_region"
>;

/** Prefix used for cache keys of a given entity kind, in the form `{namespace}:{...parts}`. */
export type CacheNamespace = "channel" | "dm-channel" | "role" | "user" | "member" | "guild" | "guild-roles";
/** A channel as stored in the cache — a reduced, kind-specific subset of `APIChannel`'s fields. */
export type CachedChannel = CachedDMChannel | CachedThreadChannel | CachedTextGuildChannel | CachedVoiceGuildChannel;

/** Namespace-scoped CRUD accessor for a single cached entity kind (channels, roles, users, guilds). */
export interface NamespaceAccessor<T> {
  /** Retrieve a cached entity by its ID. Returns `null` if not found or expired. */
  get(id: string): Promise<T | null>;
  /** Cache an entity. Falls back to the CacheManager's default TTL if not specified. */
  set(data: T, ttlMs?: number): Promise<void>;
  /** Remove a cached entity by its ID. */
  delete(id: string): Promise<void>;
  /** Check whether a non-expired entry exists for this ID. */
  has(id: string): Promise<boolean>;
  /** Cache multiple entities in one call. */
  mset: (entries: { value: T; ttlMs?: number }[]) => Promise<void>;
}

/** Namespace-scoped CRUD accessor for cached guild members, keyed by both `guildId` and `userId`. */
// Members are a special case since they are scoped to a guild and identified by both guildId and userId
export interface MemberNamespaceAccessor {
  /** Retrieve a cached guild member. Returns `null` if not found or expired. */
  get(guildId: string, userId: string): Promise<CachedGuildMember | null>;
  /** Cache a guild member. Falls back to the CacheManager's default TTL if not specified. */
  set(guildId: string, member: CachedGuildMember, ttlMs?: number): Promise<void>;
  /** Remove a cached guild member. */
  delete(guildId: string, userId: string): Promise<void>;
  /** Check whether a non-expired entry exists for this member. */
  has(guildId: string, userId: string): Promise<boolean>;
  /** Cache multiple guild members in one call, all scoped to the same guild. */
  mset: (guildId: string, entries: { value: CachedGuildMember; ttlMs?: number }[]) => Promise<void>;
}
