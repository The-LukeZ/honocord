import { Collection } from "@discordjs/collection";
import {
  APIApplicationCommandInteractionDataOption,
  APIAttachment,
  APIInteractionDataResolved,
  APIInteractionDataResolvedChannel,
  APIInteractionDataResolvedGuildMember,
  APIRole,
  APIUser,
  ApplicationCommandOptionType,
  ChannelType,
  InteractionType,
} from "discord-api-types/v10";
import { APIInteractionDataResolvedCollections } from "../types";

type AutocompleteFocusedOption = {
  /**
   * The name of the option.
   */
  name: string;
  /**
   * The type of the application command option.
   */
  type: ApplicationCommandOptionType;
  /**
   * The value of the option.
   */
  value: string;
  /**
   * Whether the option is focused.
   */
  focused: boolean;
};

/**
 * A resolver for command interaction options.
 */
class CommandInteractionOptionResolver {
  /**
   * The name of the subcommand group.
   */
  private _group: string | null = null;
  /**
   * The name of the subcommand.
   */
  private _subcommand: string | null = null;
  /**
   * The bottom-level options for the interaction.
   * If there is a subcommand (or subcommand and group), this is the options for the subcommand.
   */
  private _hoistedOptions: APIApplicationCommandInteractionDataOption<
    InteractionType.ApplicationCommand | InteractionType.ApplicationCommandAutocomplete
  >[];

  private _resolved: APIInteractionDataResolvedCollections;

  constructor(
    options:
      | APIApplicationCommandInteractionDataOption<
          InteractionType.ApplicationCommand | InteractionType.ApplicationCommandAutocomplete
        >[]
      | undefined,
    resolved: APIInteractionDataResolved | undefined
  ) {
    this._hoistedOptions = options ?? [];
    this._resolved = Object.keys(resolved ?? {}).reduce((acc, key) => {
      const resolvedData = resolved?.[key as keyof APIInteractionDataResolved];
      const collection = new Collection(resolvedData ? Object.entries(resolvedData) : []);
      acc[key as keyof APIInteractionDataResolvedCollections] = collection;
      return acc;
    }, {} as Partial<APIInteractionDataResolvedCollections>);

    // Hoist subcommand group if present
    if (this._hoistedOptions[0]?.type === ApplicationCommandOptionType.SubcommandGroup) {
      this._group = this._hoistedOptions[0].name;
      this._hoistedOptions = this._hoistedOptions[0].options ?? [];
    }

    // Hoist subcommand if present
    if (this._hoistedOptions[0]?.type === ApplicationCommandOptionType.Subcommand) {
      this._subcommand = this._hoistedOptions[0].name;
      this._hoistedOptions = this._hoistedOptions[0].options ?? [];
    }
  }

  public get data() {
    return this._hoistedOptions;
  }

  /**
   * Gets an option by its name.
   *
   * @param name The name of the option.
   * @param type The expected type of the option.
   * @param required Whether to throw an error if the option is not found.
   * @returns The option, if found.
   */
  get<T extends ApplicationCommandOptionType>(name: string, type: T, required = false) {
    const option = this._hoistedOptions.find((opt) => opt.name === name);
    if (!option) {
      if (required) {
        throw new TypeError("Option not found", { cause: { name } });
      }

      return null;
    }

    if (option.type !== type) {
      throw new TypeError("Option type mismatch", { cause: { name, type: option.type, expected: type } });
    }

    return option as Extract<APIApplicationCommandInteractionDataOption<InteractionType.ApplicationCommand>, { type: T }>;
  }

  /**
   * Gets the selected subcommand.
   *
   * @param {boolean} [required=true] Whether to throw an error if there is no subcommand.
   * @returns {?string} The name of the selected subcommand, or null if not set and not required.
   */
  getSubcommand(): string | null;
  getSubcommand(required: true): string;
  getSubcommand(required: boolean = true): string | null {
    if (required && !this._subcommand) {
      throw new TypeError("No subcommand selected");
    }

    return this._subcommand;
  }

  /**
   * Gets the selected subcommand group.
   *
   * @param required Whether to throw an error if there is no subcommand group.
   * @returns The name of the selected subcommand group, or null if not set and not required.
   */
  getSubcommandGroup(required?: boolean): string | null;
  getSubcommandGroup(required: true): string;
  getSubcommandGroup(required: boolean = false): string | null {
    if (required && !this._group) {
      throw new TypeError("No subcommand group selected");
    }

    return this._group;
  }

  getFocused(): AutocompleteFocusedOption | null {
    return (this._hoistedOptions as AutocompleteFocusedOption[]).find((option) => option.focused) || null;
  }

  /**
   * Gets a boolean option.
   *
   * @param name The name of the option.
   * @param required Whether to throw an error if the option is not found.
   * @returns The value of the option, or null if not set and not required.
   */
  getBoolean(name: string, required?: boolean): boolean | null;
  getBoolean(name: string, required: true): boolean;
  getBoolean(name: string, required: boolean = false): boolean | null {
    const option = this.get(name, ApplicationCommandOptionType.Boolean, required);
    return option ? option.value : null;
  }

  /**
   * Gets a channel option.
   *
   * @param name The name of the option.
   * @param required Whether to throw an error if the option is not found.
   * @param channelTypes The allowed types of channels. If empty, all channel types are allowed.
   * @returns The value of the option, or null if not set and not required.
   */
  getChannel(name: string, required: false, channelTypes: ChannelType[]): APIInteractionDataResolvedChannel | null;
  getChannel(name: string, required: true, channelTypes: ChannelType[]): APIInteractionDataResolvedChannel;
  getChannel(
    name: string,
    required: boolean = false,
    channelTypes: ChannelType[] = []
  ): APIInteractionDataResolvedChannel | null {
    const option = this.get(name, ApplicationCommandOptionType.Channel, required);
    const channel = option ? this._resolved.channels?.get(option.value) || null : null;

    if (channel && channelTypes.length > 0 && !channelTypes.includes(channel.type)) {
      throw new TypeError("Invalid channel type", { cause: { name, type: channel.type, expected: channelTypes.join(", ") } });
    }

    return channel;
  }

  /**
   * Gets a string option.
   *
   * @param name The name of the option.
   * @param required Whether to throw an error if the option is not found.
   * @returns The value of the option, or null if not set and not required.
   */
  getString<T extends string = string>(name: string, required?: boolean): T | null;
  getString<T extends string = string>(name: string, required: true): T;
  getString<T extends string = string>(name: string, required: boolean = false): T | null {
    const option = this.get(name, ApplicationCommandOptionType.String, required);
    return (option?.value as T) ?? null;
  }

  /**
   * Gets an integer option.
   *
   * @param name The name of the option.
   * @param required Whether to throw an error if the option is not found.
   * @returns The value of the option, or null if not set and not required.
   */
  getInteger(name: string, required?: boolean): number | null;
  getInteger(name: string, required: true): number;
  getInteger(name: string, required: boolean = false): number | null {
    const option = this.get(name, ApplicationCommandOptionType.Integer, required);
    return option?.value ?? null;
  }

  /**
   * Gets a number option.
   *
   * @param name The name of the option.
   * @param required Whether to throw an error if the option is not found.
   * @returns The value of the option, or null if not set and not required.
   */
  getNumber(name: string, required?: boolean): number | null;
  getNumber(name: string, required: true): number;
  getNumber(name: string, required: boolean = false): number | null {
    const option = this.get(name, ApplicationCommandOptionType.Number, required);
    return option?.value ?? null;
  }

  /**
   * Gets a user option.
   *
   * @param name The name of the option.
   * @param required Whether to throw an error if the option is not found.
   * @returns The value of the option, or null if not set and not required.
   */
  getUser(name: string, required?: boolean): APIUser | null;
  getUser(name: string, required: true): APIUser;
  getUser(name: string, required: boolean = false): APIUser | null {
    const option = this.get(name, ApplicationCommandOptionType.User, required);
    const user = option ? this._resolved.users?.get(option.value) || null : null;
    return user;
  }

  /**
   * Gets a member option.
   *
   * @param name The name of the option.
   * @returns The value of the option, or null if the user is not present in the guild or the option is not set.
   */
  getMember(name: string, required?: boolean): APIInteractionDataResolvedGuildMember | null;
  getMember(name: string, required: true): APIInteractionDataResolvedGuildMember;
  getMember(name: string, required: boolean = false): APIInteractionDataResolvedGuildMember | null {
    const option = this.get(name, ApplicationCommandOptionType.User, required);
    const member = option ? this._resolved.members?.get(option.value) || null : null;
    return member;
  }

  /**
   * Gets a role option.
   *
   * @param name The name of the option.
   * @param required Whether to throw an error if the option is not found.
   * @returns The value of the option, or null if not set and not required.
   */
  getRole(name: string, required?: boolean): APIRole | null;
  getRole(name: string, required: true): APIRole;
  getRole(name: string, required: boolean = false): APIRole | null {
    const option = this.get(name, ApplicationCommandOptionType.Role, required);
    const role = option ? this._resolved.roles?.get(option.value) || null : null;
    return role;
  }

  /**
   * Gets an attachment option.
   *
   * @param name The name of the option.
   * @param required Whether to throw an error if the option is not found.
   * @returns The value of the option, or null if not set and not required.
   */
  getAttachment(name: string, required?: boolean): APIAttachment | null;
  getAttachment(name: string, required: true): APIAttachment;
  getAttachment(name: string, required: boolean = false): APIAttachment | null {
    const option = this.get(name, ApplicationCommandOptionType.Attachment, required);
    const attachment = option ? this._resolved.attachments?.get(option.value) || null : null;
    return attachment;
  }

  /**
   * Gets a mentionable option.
   *
   * @param name The name of the option.
   * @param required Whether to throw an error if the option is not found.
   * @returns The value of the option, or null if not set and not required.
   */
  getMentionable(name: string, required?: boolean): APIInteractionDataResolvedGuildMember | APIUser | APIRole | null;
  getMentionable(name: string, required: true): APIInteractionDataResolvedGuildMember | APIUser | APIRole;
  getMentionable(name: string, required: boolean = false): (APIInteractionDataResolvedGuildMember | APIUser | APIRole) | null {
    const option = this.get(name, ApplicationCommandOptionType.Mentionable, required);
    const user = option ? this._resolved.users?.get(option.value) || null : null;
    const member = option ? this._resolved.members?.get(option.value) || null : null;
    const role = option ? this._resolved.roles?.get(option.value) || null : null;
    return member ?? user ?? role ?? null;
  }
}

export { CommandInteractionOptionResolver };
