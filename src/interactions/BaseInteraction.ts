import {
  type Snowflake,
  APIInteraction,
  APIInteractionResponseCallbackData,
  APIMessageApplicationCommandInteraction,
  APIMessageComponentInteraction,
  APIPartialInteractionGuild,
  APIUser,
  ComponentType,
  InteractionType,
  Locale,
} from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import { REST } from "@discordjs/rest";
import { ChatInputCommandInteraction } from "./ChatInputInteraction";
import { ModalInteraction } from "./ModalInteraction";
import type { BaseInteractionContext, InteractionResponseCallbackData, JSONEncodable } from "../types";

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

abstract class BaseInteraction<Type extends InteractionType, Context extends BaseInteractionContext = BaseInteractionContext> {
  public readonly type: Type;
  protected readonly data: Extract<APIInteraction, { type: Type }>;
  public readonly rest: REST;
  protected _ephemeral: boolean | null = null;
  protected replied: boolean = false;
  protected deferred: boolean = false;
  public readonly context: Context;

  constructor(
    protected api: API,
    data: typeof this.data,
    context: Context
  ) {
    this.type = data.type as Type;
    this.data = data;
    this.rest = api.rest;
    this.context = context;
  }

  get applicationId() {
    return this.data.application_id;
  }

  get entitlements() {
    return this.data.entitlements;
  }

  get channelId() {
    return this.data.channel?.id;
  }

  get channel() {
    return this.data.channel;
  }

  get guildId() {
    return this.data.guild_id;
  }

  get guild() {
    return this.data.guild;
  }

  get userId() {
    return this.data.user?.id;
  }

  get user() {
    return (this.data.member?.user || this.data.user) as APIUser; // One is always given.
  }

  get member() {
    return this.data.member;
  }

  get locale() {
    return this.data.guild_locale;
  }

  get guildLocale() {
    return this.data.guild_locale;
  }

  get token() {
    return this.data.token;
  }

  get id() {
    return this.data.id;
  }

  get appPermissions() {
    return this.data.app_permissions;
  }

  get version() {
    return this.data.version;
  }

  protected isJSONEncodable(obj: unknown): obj is JSONEncodable<unknown> {
    return isJSONEncodable(obj);
  }

  protected toSnakeCase(obj: unknown): unknown {
    return toSnakeCase(obj);
  }

  inGuild(): this is BaseInteraction<Type> & { guild_id: Snowflake; guild: APIPartialInteractionGuild; guild_locale: Locale } {
    return Boolean(this.data.guild_id && this.data.guild && this.data.guild_locale);
  }

  inDM(): this is BaseInteraction<Type> & { guild_id: undefined; guild: undefined; guild_locale: undefined } {
    return !this.inGuild();
  }

  getAppEntitlements() {
    return this.entitlements.filter((entitlement) => entitlement.application_id === this.applicationId);
  }

  guildHavePremium(): boolean {
    return (
      this.getAppEntitlements().filter(
        (entitlement) =>
          entitlement.guild_id === this.guildId && (!entitlement.ends_at || new Date(entitlement.ends_at) > new Date())
      ).length > 0
    );
  }

  userHavePremium(): boolean {
    return (
      this.getAppEntitlements().filter(
        (entitlement) =>
          entitlement.user_id === this.userId && (!entitlement.ends_at || new Date(entitlement.ends_at) > new Date())
      ).length > 0
    );
  }

  private prepareResponsePayload(options: InteractionResponseCallbackData) {
    return this.toSnakeCase({
      ...options,
      components: options.components?.map((component) => (this.isJSONEncodable(component) ? component.toJSON() : component)),
      embeds: options.embeds?.map((embed) => (this.isJSONEncodable(embed) ? embed.toJSON() : embed)),
    }) as APIInteractionResponseCallbackData;
  }

  async reply(options: InteractionResponseCallbackData | string, forceEphemeral = true) {
    const replyOptions = typeof options === "string" ? { content: options } : options;
    if (forceEphemeral) {
      replyOptions.flags = (replyOptions.flags ?? 0) | 64;
    }
    const response = await this.api.interactions.reply(this.id, this.token, this.prepareResponsePayload(replyOptions), {
      signal: AbortSignal.timeout(5000),
    });
    this.replied = true;
    return response;
  }

  async deferReply(forceEphemeral = true) {
    const response = await this.api.interactions.defer(this.id, this.token, {
      flags: forceEphemeral ? 64 : undefined,
    });
    this.deferred = true;
    return response;
  }

  deferUpdate() {
    return this.api.interactions.deferMessageUpdate(this.id, this.token);
  }

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

  deleteReply(messageId?: Snowflake | "@original") {
    return this.api.interactions.deleteReply(this.applicationId, this.token, messageId);
  }

  async update(options: InteractionResponseCallbackData | string) {
    const updateOptions = typeof options === "string" ? { content: options } : options;
    const response = await this.api.interactions.updateMessage(this.id, this.token, this.prepareResponsePayload(updateOptions), {
      signal: AbortSignal.timeout(5000),
    });
    this.replied = true;
    return response;
  }

  // Typeguards
  isChatInputCommand(): this is ChatInputCommandInteraction {
    return this.type === InteractionType.ApplicationCommand;
  }

  isMessageContext(): this is APIMessageApplicationCommandInteraction {
    return this.type === InteractionType.ApplicationCommand && "message" in this.data;
  }

  isModal(): this is ModalInteraction {
    return this.type === InteractionType.ModalSubmit;
  }

  isMessageComponent(): this is APIMessageComponentInteraction {
    return this.type === InteractionType.MessageComponent;
  }

  isButton(): this is APIMessageComponentInteraction & { data: { component_type: ComponentType.Button } } {
    return this.isMessageComponent() && this.data.component_type === ComponentType.Button;
  }

  isStringSelect(): this is APIMessageComponentInteraction & {
    data: { component_type: Exclude<ComponentType, ComponentType.StringSelect> };
  } {
    return this.isMessageComponent() && this.data.component_type === ComponentType.StringSelect;
  }
}

export { BaseInteraction };
