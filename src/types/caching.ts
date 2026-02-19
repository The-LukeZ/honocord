import { APIChannel, APIGuildMember, APIUser, ChannelType } from "discord-api-types/v10";

export type CachedGuildMember = Omit<APIGuildMember, "user" | "deaf" | "mute"> & { user: APIUser } & Partial<
    Pick<APIGuildMember, "deaf" | "mute">
  >;

type CachedDMChannel = Pick<Extract<APIChannel, { type: ChannelType.DM | ChannelType.GroupDM }>, "id" | "type" | "name">;
type CachedThreadChannel = Pick<
  Extract<APIChannel, { type: ChannelType.PublicThread | ChannelType.PrivateThread | ChannelType.AnnouncementThread }>,
  "id" | "type" | "name" | "rate_limit_per_user" | "parent_id" | "guild_id" | "nsfw"
>;
type CachedTextGuildChannel = Pick<
  Extract<
    APIChannel,
    {
      type: ChannelType.GuildText | ChannelType.GuildAnnouncement;
    }
  >,
  "id" | "type" | "name" | "guild_id" | "nsfw" | "parent_id" | "permission_overwrites" | "topic"
>;
type CachedVoiceGuildChannel = Pick<
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

export type CacheNamespace = "channel" | "role" | "user" | "member" | "guild" | "guild-roles";
export type CachedChannel = CachedDMChannel | CachedThreadChannel | CachedTextGuildChannel | CachedVoiceGuildChannel;

export interface NamespaceAccessor<T> {
  /** Retrieve a cached entity by its ID. Returns `null` if not found or expired. */
  get(id: string): Promise<T | null>;
  /** Cache an entity. Falls back to the CacheManager's default TTL if not specified. */
  set(data: T, ttlMs?: number): Promise<void>;
  /** Remove a cached entity by its ID. */
  delete(id: string): Promise<void>;
  /** Check whether a non-expired entry exists for this ID. */
  has(id: string): Promise<boolean>;
  mset: (entries: { value: T; ttlMs?: number }[]) => Promise<void>;
}

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
  mset: (guildId: string, entries: { value: CachedGuildMember; ttlMs?: number }[]) => Promise<void>;
}
