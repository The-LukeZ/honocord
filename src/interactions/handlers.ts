import type { ChatInputCommandInteraction } from "./ChatInputInteraction";
import type { AutocompleteInteraction } from "./AutocompleteInteraction";
import type { MessageComponentInteraction } from "./MessageComponentInteraction";
import type { ModalInteraction } from "./ModalInteraction";
import { ContextMenuCommandBuilder, SlashCommandBuilder } from "@discordjs/builders";
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
import { ApplicationCommandType } from "discord-api-types/v10";
import { MessageCommandInteraction } from "./MessageContextCommandInteraction";
import { UserCommandInteraction } from "./UserContextCommandInteraction";
import { parseCustomId } from "@utils/index";
import { MessageComponentInteractionPayload, MessageComponentType } from "../types";

/**
 * Handler for chat input commands with optional autocomplete support
 */
export class SlashCommandHandler extends SlashCommandBuilder {
  readonly handlerType = "slash";
  private handlerFn?: (interaction: ChatInputCommandInteraction) => Promise<void> | void;
  private autocompleteFn?: (interaction: AutocompleteInteraction) => Promise<void> | void;

  /**
   * Adds the command handler function.
   *
   * @param handler The function to handle the command interaction
   * @returns The current SlashCommandHandler instance
   */
  public addHandler(handler: (interaction: ChatInputCommandInteraction) => Promise<void> | void): SlashCommandHandler {
    this.handlerFn = handler;
    return this;
  }

  /**
   * Adds the autocomplete handler function.
   *
   * @param handler The function to handle the autocomplete interaction
   * @returns The current SlashCommandHandler instance
   */
  public addAutocompleteHandler(handler: (interaction: AutocompleteInteraction) => Promise<void> | void): SlashCommandHandler {
    this.autocompleteFn = handler;
    return this;
  }

  /**
   * Executes the command handler
   */
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.handlerFn) {
      throw new Error(`Command "${this.name}" does not have a handler`);
    }
    await this.handlerFn(interaction);
  }

  /**
   * Executes the autocomplete handler if it exists
   */
  async executeAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
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
      | SlashCommandSubcommandGroupBuilder
      | ((group: SlashCommandSubcommandGroupBuilder) => SlashCommandSubcommandGroupBuilder)
  ): this {
    super.addSubcommandGroup(input);
    return this;
  }
}

export class ContextCommandHandler<
  T extends ApplicationCommandType = ApplicationCommandType,
  InteractionData = T extends ApplicationCommandType.User ? UserCommandInteraction : MessageCommandInteraction,
> extends ContextMenuCommandBuilder {
  readonly handlerType = "context";
  private handlerFn?: (interaction: InteractionData) => Promise<void> | void;

  public addHandler(handler: (interaction: InteractionData) => Promise<void> | void): ContextCommandHandler<T, InteractionData> {
    this.handlerFn = handler;
    return this;
  }

  /**
   * Executes the command handler
   */
  async execute(interaction: InteractionData): Promise<void> {
    if (!this.handlerFn) {
      throw new Error(`Command "${this.name}" does not have a handler`);
    }
    await this.handlerFn(interaction);
  }
}

/**
 * Handler for message components (buttons, select menus) based on custom ID prefix
 */
export class ComponentHandler<T extends MessageComponentType = MessageComponentType> {
  readonly handlerType = "component";
  public readonly prefix: string;
  private handlerFn?: (interaction: MessageComponentInteraction<T>) => Promise<void> | void;

  constructor(prefix: string, handler?: (interaction: MessageComponentInteraction<T>) => Promise<void> | void) {
    if (!prefix || typeof prefix !== "string") {
      throw new TypeError("Component handler prefix must be a non-empty string");
    }

    this.prefix = prefix;
    if (handler) this.handlerFn = handler;
  }

  addHandler(handler: (interaction: MessageComponentInteraction<T>) => Promise<void> | void): ComponentHandler<T> {
    this.handlerFn = handler;
    return this;
  }

  /**
   * Executes the component handler
   */
  async execute(interaction: MessageComponentInteraction<T>): Promise<void> {
    if (!this.handlerFn) {
      throw new Error(`Component handler with prefix "${this.prefix}" does not have a handler`);
    }
    await this.handlerFn(interaction);
  }

  /**
   * Checks if this handler matches the given custom ID
   */
  matches(customId: string): boolean {
    const prefix = parseCustomId(customId, true);
    return prefix === this.prefix;
  }
}

/**
 * Handler for modal submits based on custom ID prefix
 */
export class ModalHandler {
  readonly handlerType = "modal";
  public readonly prefix: string;
  private handlerFn?: (interaction: ModalInteraction) => Promise<void> | void;

  constructor(prefix: string, handler?: (interaction: ModalInteraction) => Promise<void> | void) {
    if (!prefix || typeof prefix !== "string") {
      throw new TypeError("Modal handler prefix must be a non-empty string");
    }

    this.prefix = prefix;
    if (handler) this.handlerFn = handler;
  }

  addHandler(handler: (interaction: ModalInteraction) => Promise<void> | void): ModalHandler {
    this.handlerFn = handler;
    return this;
  }

  /**
   * Executes the modal handler
   */
  async execute(interaction: ModalInteraction): Promise<void> {
    if (!this.handlerFn) {
      throw new Error(`Modal handler with prefix "${this.prefix}" does not have a handler`);
    }
    await this.handlerFn(interaction);
  }

  /**
   * Checks if this handler matches the given custom ID
   */
  matches(customId: string): boolean {
    const prefix = parseCustomId(customId, true);
    return prefix === this.prefix;
  }
}

/**
 * Union type of all possible handlers
 */
export type Handler = SlashCommandHandler | ContextCommandHandler | ComponentHandler | ModalHandler;
