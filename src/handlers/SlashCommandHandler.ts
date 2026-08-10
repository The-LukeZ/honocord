import type { ChatInputCommandInteraction } from "@ctx/ChatInputInteraction";
import type { AutocompleteInteraction } from "@ctx/AutocompleteInteraction";
import { SlashCommandBuilder } from "@discordjs/builders";
import type {
  SlashCommandBooleanOption,
  SlashCommandUserOption,
  SlashCommandChannelOption,
  SlashCommandRoleOption,
  SlashCommandAttachmentOption,
  SlashCommandMentionableOption,
  SlashCommandStringOption,
  SlashCommandIntegerOption,
  SlashCommandNumberOption,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "@discordjs/builders";
import type { BaseInteractionContext } from "../types";

/**
 * Handler for chat input commands with optional autocomplete support
 */
export class SlashCommandHandler<Context extends BaseInteractionContext = BaseInteractionContext> extends SlashCommandBuilder {
  readonly handlerType = "slash";
  private handlerFn?: (interaction: ChatInputCommandInteraction<Context>) => Promise<any> | any;
  private autocompleteFn?: (interaction: AutocompleteInteraction<Context>) => Promise<any> | any;
  /**
   * Set of guild IDs where this command is registered (empty for global commands)
   */
  readonly guildIds = new Set<string>();

  isGuildCommand(): boolean {
    return this.guildIds.size > 0;
  }

  setGuildIds(guildIds: string[]): this {
    this.guildIds.clear();
    for (const guildId of guildIds) {
      this.guildIds.add(guildId);
    }
    return this;
  }

  addGuildIds(...guildIds: string[]): this {
    for (const guildId of guildIds) {
      this.guildIds.add(guildId);
    }
    return this;
  }

  removeGuildIds(...guildIds: string[]): this {
    for (const guildId of guildIds) {
      this.guildIds.delete(guildId);
    }
    return this;
  }

  /**
   * Adds the command handler function.
   *
   * @param handler The function to handle the command interaction
   * @returns The current SlashCommandHandler instance
   */
  public addHandler(
    handler: (interaction: ChatInputCommandInteraction<Context>) => Promise<any> | any
  ): SlashCommandHandler<Context> {
    this.handlerFn = handler;
    return this;
  }

  /**
   * Adds the autocomplete handler function.
   *
   * @param handler The function to handle the autocomplete interaction
   * @returns The current SlashCommandHandler instance
   */
  public addAutocompleteHandler(
    handler: (interaction: AutocompleteInteraction<Context>) => Promise<any> | any
  ): SlashCommandHandler<Context> {
    this.autocompleteFn = handler;
    return this;
  }

  /**
   * Executes the command handler
   */
  async execute(interaction: ChatInputCommandInteraction<Context>): Promise<void> {
    if (!this.handlerFn) {
      throw new Error(`Command "${this.name}" does not have a handler`);
    }
    await this.handlerFn(interaction);
  }

  /**
   * Executes the autocomplete handler if it exists
   */
  async executeAutocomplete(interaction: AutocompleteInteraction<Context>): Promise<void> {
    if (this.autocompleteFn == undefined) {
      throw new Error(`Command "${this.name}" does not have an autocomplete handler`);
    }
    await this.autocompleteFn(interaction);
  }

  /**
   * Override option/subcommand adders so they return `this` (the handler),
   * preserving chaining when options/subcommands are added.
   */
  addBooleanOption(input: SlashCommandBooleanOption | ((builder: SlashCommandBooleanOption) => SlashCommandBooleanOption)): this {
    super.addBooleanOption(input);
    return this;
  }

  addUserOption(input: SlashCommandUserOption | ((builder: SlashCommandUserOption) => SlashCommandUserOption)): this {
    super.addUserOption(input);
    return this;
  }

  addChannelOption(input: SlashCommandChannelOption | ((builder: SlashCommandChannelOption) => SlashCommandChannelOption)): this {
    super.addChannelOption(input);
    return this;
  }

  addRoleOption(input: SlashCommandRoleOption | ((builder: SlashCommandRoleOption) => SlashCommandRoleOption)): this {
    super.addRoleOption(input);
    return this;
  }

  addAttachmentOption(
    input: SlashCommandAttachmentOption | ((builder: SlashCommandAttachmentOption) => SlashCommandAttachmentOption)
  ): this {
    super.addAttachmentOption(input);
    return this;
  }

  addMentionableOption(
    input: SlashCommandMentionableOption | ((builder: SlashCommandMentionableOption) => SlashCommandMentionableOption)
  ): this {
    super.addMentionableOption(input);
    return this;
  }

  addStringOption(input: SlashCommandStringOption | ((builder: SlashCommandStringOption) => SlashCommandStringOption)): this {
    super.addStringOption(input);
    return this;
  }

  addIntegerOption(input: SlashCommandIntegerOption | ((builder: SlashCommandIntegerOption) => SlashCommandIntegerOption)): this {
    super.addIntegerOption(input);
    return this;
  }

  addNumberOption(input: SlashCommandNumberOption | ((builder: SlashCommandNumberOption) => SlashCommandNumberOption)): this {
    super.addNumberOption(input);
    return this;
  }

  addSubcommand(
    input: SlashCommandSubcommandBuilder | ((sub: SlashCommandSubcommandBuilder) => SlashCommandSubcommandBuilder)
  ): this {
    super.addSubcommand(input);
    return this;
  }

  addSubcommandGroup(
    input:
      SlashCommandSubcommandGroupBuilder | ((group: SlashCommandSubcommandGroupBuilder) => SlashCommandSubcommandGroupBuilder)
  ): this {
    super.addSubcommandGroup(input);
    return this;
  }
}
