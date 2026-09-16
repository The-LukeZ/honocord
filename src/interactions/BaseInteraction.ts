import {
  type Snowflake,
  APIInteractionResponseCallbackData,
  APIPartialInteractionGuild,
  APIUser,
  ApplicationCommandType,
  InteractionType,
  Locale,
  APIApplicationCommandInteraction,
  ComponentType,
  APIMessage,
} from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import { REST } from "@discordjs/rest";
import { ModalInteraction } from "./ModalInteraction";
import type {
  BaseInteractionContext,
  InteractionResponseCallbackData,
  JSONEncodable,
  MessageComponentType,
  PreparedResponseOptions,
  RawFile,
  ValidInteraction,
} from "$types/index";
import { MessageComponentInteraction } from "./MessageComponentInteraction";
import { AutocompleteInteraction } from "./AutocompleteInteraction";
import { CommandInteraction } from "./CommandInteraction";
import { ChatInputCommandInteraction } from "./ChatInputInteraction";
import { UserContextInteraction } from "./UserContextCommandInteraction";
import { MessageContextInteraction } from "./MessageContextCommandInteraction";
import { ButtonInteraction } from "./ButtonInteraction";
import { StringSelectInteraction } from "./StringSelectInteraction";
import { UserSelectInteraction } from "./UserSelectInteraction";
import { RoleSelectInteraction } from "./RoleSelectInteraction";
import { MentionableSelectInteraction } from "./MentionableSelectInteraction";
import { ChannelSelectInteraction } from "./ChannelSelectInteraction";
import { AttachmentBuilder } from "../structures/AttachmentBuilder";
import { Fetcher } from "@utils/Fetcher";

function snakeCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

/**
 * Transforms camel-cased keys into snake cased keys
 *
 * @param {*} obj The object to transform
 * @returns {*} The transformed object
 */
function toSnakeCase(obj: any): any {
  if (typeof obj !== "object" || !obj) return obj;
  if (obj instanceof Date) return obj;
  if (isJSONEncodable(obj)) return toSnakeCase(obj.toJSON());
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [snakeCase(key), toSnakeCase(value)]));
}

/**
 * Indicates if an object is encodable or not.
 *
 * @param maybeEncodable - The object to check against
 */
function isJSONEncodable(maybeEncodable: unknown): maybeEncodable is JSONEncodable<unknown> {
  return (
    maybeEncodable !== null &&
    typeof maybeEncodable === "object" &&
    "toJSON" in maybeEncodable &&
    typeof maybeEncodable["toJSON"] === "function"
  );
}

/**
 * Base class for all typed Discord interactions. Wraps the raw interaction payload with
 * response helpers (`reply`, `editReply`, `followUp`, ...), type guards (`isButton`, `isModal`, ...),
 * and convenience getters mirroring the raw payload's fields.
 *
 * Not instantiated directly — use one of the concrete subclasses (`ChatInputCommandInteraction`,
 * `ButtonInteraction`, `ModalInteraction`, etc.), which `Honocord` constructs and passes to handlers.
 */
export abstract class BaseInteraction<
  Type extends InteractionType,
  Context extends BaseInteractionContext = BaseInteractionContext,
> {
  /** The interaction's Discord interaction type. */
  public readonly type: Type;
  /** The raw interaction data */
  protected readonly raw: Extract<ValidInteraction, { type: Type }>;
  /** REST client used to make requests to the Discord API. */
  public readonly rest: REST;
  protected _ephemeral: boolean | null = null;
  protected replied: boolean = false;
  protected deferred: boolean = false;
  /** The Hono interaction context this interaction was created from. */
  public readonly context: Context;
  /** Cache-aware fetcher for resolving Discord entities referenced by this interaction. */
  public readonly fetcher: Fetcher;

  constructor(
    protected api: API,
    data: Extract<ValidInteraction, { type: Type }>,
    context: Context
  ) {
    this.type = data.type as Type;
    this.raw = { ...data };
    this.rest = api.rest;
    this.context = context;
    this.fetcher = new Fetcher(api, () => this.context.get("cache") as any);
  }

  /** The ID of the application this interaction was sent to. */
  get applicationId() {
    return this.raw.application_id;
  }

  /** Entitlements for the invoking user, for monetized apps. */
  get entitlements() {
    return this.raw.entitlements;
  }

  /** The ID of the channel the interaction was sent from, if any. */
  get channelId() {
    return this.raw.channel?.id;
  }

  /** The partial channel object the interaction was sent from, if any. Not cached — see {@link Honocord}'s runtime notes. */
  get channel() {
    return this.raw.channel;
  }

  /** The ID of the guild the interaction was sent from, if any. */
  get guildId() {
    return this.raw.guild_id;
  }

  /** The partial guild object the interaction was sent from, if any. Not cached. */
  get guild() {
    return this.raw.guild;
  }

  /** The ID of the user who triggered the interaction. */
  get userId() {
    return this.raw.user?.id;
  }

  /** The user who triggered the interaction (resolved from `member.user` in guilds, `user` in DMs). */
  get user() {
    return (this.raw.member?.user || this.raw.user) as APIUser; // One is always given.
  }

  /** The guild member who triggered the interaction, if sent from a guild. */
  get member() {
    return this.raw.member;
  }

  /** The invoking user's locale. */
  get locale() {
    return this.raw.guild_locale;
  }

  /** The guild's locale, if sent from a guild. */
  get guildLocale() {
    return this.raw.guild_locale;
  }

  /** The interaction token, used to send/edit/delete responses. */
  get token() {
    return this.raw.token;
  }

  /** The interaction's ID. */
  get id() {
    return this.raw.id;
  }

  /** Bitwise set of permissions the app has in the source location of the interaction. */
  get appPermissions() {
    return this.raw.app_permissions;
  }

  /** Discord's interaction payload version (always `1`). */
  get version() {
    return this.raw.version;
  }

  protected isJSONEncodable(obj: unknown): obj is JSONEncodable<unknown> {
    return isJSONEncodable(obj);
  }

  protected toSnakeCase<T = unknown>(obj: unknown): T {
    return toSnakeCase(obj) as T;
  }

  /** Type guard narrowing `guild_id`/`guild`/`guild_locale` to defined when the interaction was sent from a guild. */
  inGuild(): this is BaseInteraction<Type> & { guild_id: Snowflake; guild: APIPartialInteractionGuild; guild_locale: Locale } {
    return Boolean(this.raw.guild_id && this.raw.guild && this.raw.guild_locale);
  }

  /** Type guard narrowing `guild_id`/`guild`/`guild_locale` to `undefined` when the interaction was sent from a DM. */
  inDM(): this is BaseInteraction<Type> & { guild_id: undefined; guild: undefined; guild_locale: undefined } {
    return !this.inGuild();
  }

  /** Returns entitlements belonging to this interaction's application. */
  getAppEntitlements() {
    return this.entitlements.filter((entitlement) => entitlement.application_id === this.applicationId);
  }

  /** Whether the guild this interaction was sent from currently has an active, non-expired entitlement. */
  guildHavePremium(): boolean {
    return (
      this.getAppEntitlements().filter(
        (entitlement) =>
          entitlement.guild_id === this.guildId && (!entitlement.ends_at || new Date(entitlement.ends_at) > new Date())
      ).length > 0
    );
  }

  /** Whether the user who triggered this interaction currently has an active, non-expired entitlement. */
  userHavePremium(): boolean {
    return (
      this.getAppEntitlements().filter(
        (entitlement) =>
          entitlement.user_id === this.userId && (!entitlement.ends_at || new Date(entitlement.ends_at) > new Date())
      ).length > 0
    );
  }

  /** @internal */
  protected prepareResponsePayload<T extends PreparedResponseOptions = PreparedResponseOptions>(
    options: InteractionResponseCallbackData
  ): T {
    const builders = (options.files ?? []).filter((f): f is AttachmentBuilder => f instanceof AttachmentBuilder);
    const rawFiles = (options.files ?? []).filter((f): f is RawFile => !(f instanceof AttachmentBuilder));

    const { files: resolvedFiles, attachments: resolvedMeta } = AttachmentBuilder.resolve(...builders);

    delete options.files;

    const components = options.components?.map((c) => (this.isJSONEncodable(c) ? c.toJSON() : c));
    const embeds = options.embeds?.map((e) => (this.isJSONEncodable(e) ? e.toJSON() : e));
    const attachments = [...resolvedMeta, ...(options.attachments ?? [])];
    const finalFiles = [...resolvedFiles, ...rawFiles];

    const body: any = {};
    if (options.content) body.content = options.content;
    if (options.tts) body.tts = options.tts;
    if (options.allowed_mentions) body.allowed_mentions = options.allowed_mentions;
    if (options.flags) body.flags = options.flags;
    if (options.applied_tags) body.applied_tags = options.applied_tags;
    if (options.poll) body.poll = options.poll;
    if (options.thread_name) body.thread_name = options.thread_name;
    if (components?.length) body.components = components;
    if (embeds?.length) body.embeds = embeds;
    if (attachments?.length) body.attachments = attachments;

    const finalBody = this.toSnakeCase<APIInteractionResponseCallbackData>(body);
    if (finalFiles.length) {
      return { ...finalBody, files: finalFiles } as T;
    }
    return { ...finalBody } as T;
  }

  /**
   * Sends the initial response to the interaction.
   *
   * @param options - The message content, or a string shorthand for `{ content: options }`
   * @param forceEphemeral - Whether to force the response to be ephemeral (visible only to the invoking user). Defaults to `true`.
   * @returns The created interaction response, including the created message.
   */
  async reply(options: InteractionResponseCallbackData | string, forceEphemeral = true) {
    const replyOptions = typeof options === "string" ? { content: options } : options;
    if (forceEphemeral) {
      replyOptions.flags = (replyOptions.flags ?? 0) | 64;
    }
    const response = await this.api.interactions.reply(
      this.id,
      this.token,
      { ...this.prepareResponsePayload(replyOptions), with_response: true },
      {
        signal: AbortSignal.timeout(5000),
      }
    );
    this.replied = true;
    return response;
  }

  /**
   * Acknowledges the interaction without sending an initial response, showing a "thinking" state.
   * Use `editReply` afterwards to send the actual response, within the 15-minute interaction token lifetime.
   *
   * @param forceEphemeral - Whether the eventual response should be ephemeral. Defaults to `true`.
   */
  async deferReply(forceEphemeral = true) {
    const response = await this.api.interactions.defer(this.id, this.token, {
      flags: forceEphemeral ? 64 : undefined,
      with_response: true,
    });
    this.deferred = true;
    return response;
  }

  /**
   * Defers the update of a component interaction.
   *
   * @returns A promise that resolves when the update is deferred
   *
   * Responding to a component interaction via the deferUpdate() method acknowledges the interaction and resets the message state.
   * This method can be used to suppress the need for further responses, however it's encouraged to provide meaningful feedback to users via an update() or ephemeral reply() at least.\
   * Once deferUpdate() has been called, future messages can be sent by calling followUp() or edits can be made by calling editReply() on the component interaction.
   *
   * Example flow:
   * 1. User clicks a button.
   * 2. Bot calls `deferUpdate()` to acknowledge the interaction.
   * 3. Bot performs some processing.
   * 4. Bot calls `editReply()` to update the original message.
   *
   */
  deferUpdate() {
    return this.api.interactions.deferMessageUpdate(this.id, this.token, { with_response: true });
  }

  /**
   * Edits the original interaction response.
   *
   * @param options - The options to edit the message with
   * @param messageId - The message id to edit, defaults to `@original`
   * @returns The edited message
   *
   * This is used to edit the original interaction response message.
   *
   * Before using this method, the interaction needs to be replied to first before using this method - with `reply`, `deferReply` or `update`.
   */
  async editReply(options: InteractionResponseCallbackData | string, messageId: Snowflake | "@original" = "@original") {
    const replyOptions = typeof options === "string" ? { content: options } : options;
    const response = await this.api.interactions.editReply(
      this.applicationId,
      this.token,
      this.prepareResponsePayload(replyOptions),
      messageId,
      {
        signal: AbortSignal.timeout(5000),
      }
    );
    this.replied = true;
    return response;
  }

  /**
   * Deletes the original interaction response (or a follow-up message).
   *
   * @param messageId - The message id to delete, defaults to `@original`
   * @returns A promise that resolves when the message is deleted
   *
   * This is used to delete the original interaction response message or a follow-up message.
   */
  deleteReply(messageId?: Snowflake | "@original") {
    return this.api.interactions.deleteReply(this.applicationId, this.token, messageId);
  }

  /**
   * Updates the original interaction response.
   *
   * @param options - The options to update the message with
   * @returns The updated message
   *
   * This is mainly used for component interactions where you want to update the message the component is attached to OR for
   * moodal submit interactions to update the message that opened the modal.
   *
   * After calling this method, the interaction is considered replied and you need to use `editReply` to edit the original response.
   */
  async update(options: InteractionResponseCallbackData | string) {
    const updateOptions = typeof options === "string" ? { content: options } : options;
    const response = await this.api.interactions.updateMessage(
      this.id,
      this.token,
      { ...this.prepareResponsePayload(updateOptions), with_response: true },
      {
        signal: AbortSignal.timeout(5000),
      }
    );
    this.replied = true;
    return response;
  }

  /**
   * Sends a follow-up message to the interaction.
   *
   * @param options - The options to send the follow-up message with
   * @param forceEphemeral - Whether to force the message to be ephemeral
   * @returns The sent follow-up message
   *
   * This is used to send additional messages after the initial interaction response.
   */
  async followUp(options: InteractionResponseCallbackData | string, forceEphemeral = false) {
    const followUpOptions = typeof options === "string" ? { content: options } : options;
    if (forceEphemeral) {
      followUpOptions.flags = (followUpOptions.flags ?? 0) | 64;
    }
    const response = await this.api.interactions.followUp(
      this.applicationId,
      this.token,
      this.prepareResponsePayload(followUpOptions),
      {
        signal: AbortSignal.timeout(5000),
      }
    );
    return response;
  }

  // Typeguards

  /** Type guard: whether this is an application command interaction (slash command or context menu command). */
  isCommand(): this is CommandInteraction<ApplicationCommandType, Context> {
    return this.raw.type === InteractionType.ApplicationCommand;
  }

  /** Type guard: whether this is a chat input (slash) command interaction. */
  isChatInputCommand(): this is ChatInputCommandInteraction<Context> {
    return (
      this.raw.type === InteractionType.ApplicationCommand &&
      (this.raw as APIApplicationCommandInteraction).data.type === ApplicationCommandType.ChatInput
    );
  }

  /** Type guard: whether this is a user context menu command interaction. */
  isUserContextCommand(): this is UserContextInteraction<Context> {
    return (
      this.raw.type === InteractionType.ApplicationCommand &&
      (this.raw as APIApplicationCommandInteraction).data.type === ApplicationCommandType.User
    );
  }

  /** Type guard: whether this is a message context menu command interaction. */
  isMessageContextCommand(): this is MessageContextInteraction<Context> {
    return (
      this.raw.type === InteractionType.ApplicationCommand &&
      (this.raw as APIApplicationCommandInteraction).data.type === ApplicationCommandType.Message
    );
  }

  /** Type guard: whether this is a modal submit interaction. */
  isModal(): this is ModalInteraction {
    return this.raw.type === InteractionType.ModalSubmit;
  }

  /** Type guard: whether this is a modal submit interaction that opened from a message (not a slash command). */
  isMessageModal(): this is ModalInteraction<Context & { message: APIMessage }> {
    return this.isModal() && !!this.message;
  }

  /** Type guard: whether this is a message component interaction (button or select menu). */
  isMessageComponent(): this is MessageComponentInteraction<Context, MessageComponentType> {
    return this.raw.type === InteractionType.MessageComponent;
  }

  /** Type guard: whether this is a button click interaction. */
  isButton(): this is ButtonInteraction<Context> {
    return this.isMessageComponent() && this.raw.data.component_type === ComponentType.Button;
  }

  /** Type guard: whether this is a string select menu interaction. */
  isStringSelect(): this is StringSelectInteraction<Context> {
    return this.isMessageComponent() && this.raw.data.component_type === ComponentType.StringSelect;
  }

  /** Type guard: whether this is a user select menu interaction. */
  isUserSelect(): this is UserSelectInteraction<Context> {
    return this.isMessageComponent() && this.raw.data.component_type === ComponentType.UserSelect;
  }

  /** Type guard: whether this is a role select menu interaction. */
  isRoleSelect(): this is RoleSelectInteraction<Context> {
    return this.isMessageComponent() && this.raw.data.component_type === ComponentType.RoleSelect;
  }

  /** Type guard: whether this is a mentionable (user + role) select menu interaction. */
  isMentionableSelect(): this is MentionableSelectInteraction<Context> {
    return this.isMessageComponent() && this.raw.data.component_type === ComponentType.MentionableSelect;
  }

  /** Type guard: whether this is a channel select menu interaction. */
  isChannelSelect(): this is ChannelSelectInteraction<Context> {
    return this.isMessageComponent() && this.raw.data.component_type === ComponentType.ChannelSelect;
  }

  /** Type guard: whether this is an autocomplete request for a slash command option. */
  isAutocomplete(): this is AutocompleteInteraction<Context> & { type: InteractionType.ApplicationCommandAutocomplete } {
    return this.raw.type === InteractionType.ApplicationCommandAutocomplete;
  }
}
