import type { ChatInputCommandInteraction } from "./ChatInputInteraction";
import type { AutocompleteInteraction } from "./AutocompleteInteraction";
import type { MessageComponentInteraction } from "./MessageComponentInteraction";
import type { ModalInteraction } from "./ModalInteraction";
import { ContextMenuCommandBuilder, SlashCommandBuilder } from "@discordjs/builders";
import { ApplicationCommandType } from "discord-api-types/v10";
import { MessageCommandInteraction } from "./MessageContextCommandInteraction";
import { UserCommandInteraction } from "./UserContextCommandInteraction";

/**
 * Handler for chat input commands with optional autocomplete support
 */
export class SlashCommandHandler extends SlashCommandBuilder {
  private handlerFn?: (interaction: ChatInputCommandInteraction) => Promise<void> | void;
  private autocompleteFn?: (interaction: AutocompleteInteraction) => Promise<void> | void;

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
}

export class ContextCommandHandler<
  T extends ApplicationCommandType = ApplicationCommandType,
  InteractionData = T extends ApplicationCommandType.User ? UserCommandInteraction : MessageCommandInteraction,
> extends ContextMenuCommandBuilder {
  private handlerFn?: (interaction: InteractionData) => Promise<void> | void;

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
export class ComponentHandler {
  public readonly prefix: string;
  private handlerFn: (interaction: MessageComponentInteraction) => Promise<void> | void;

  constructor(prefix: string, handler: (interaction: MessageComponentInteraction) => Promise<void> | void) {
    if (!prefix || typeof prefix !== "string") {
      throw new TypeError("Component handler prefix must be a non-empty string");
    }
    if (typeof handler !== "function") {
      throw new TypeError("Component handler must be a function");
    }

    this.prefix = prefix;
    this.handlerFn = handler;
  }

  /**
   * Executes the component handler
   */
  async execute(interaction: MessageComponentInteraction): Promise<void> {
    await this.handlerFn(interaction);
  }

  /**
   * Checks if this handler matches the given custom ID
   */
  matches(customId: string): boolean {
    // Extract prefix from custom ID (everything before first / or ?)
    const match = customId.match(/^(.+?)(\/|\?|$)/);
    const prefix = match ? match[1] : customId;
    return prefix === this.prefix;
  }
}

/**
 * Handler for modal submits based on custom ID prefix
 */
export class ModalHandler {
  public readonly prefix: string;
  private handlerFn: (interaction: ModalInteraction) => Promise<void> | void;

  constructor(prefix: string, handler: (interaction: ModalInteraction) => Promise<void> | void) {
    if (!prefix || typeof prefix !== "string") {
      throw new TypeError("Modal handler prefix must be a non-empty string");
    }
    if (typeof handler !== "function") {
      throw new TypeError("Modal handler must be a function");
    }

    this.prefix = prefix;
    this.handlerFn = handler;
  }

  /**
   * Executes the modal handler
   */
  async execute(interaction: ModalInteraction): Promise<void> {
    await this.handlerFn(interaction);
  }

  /**
   * Checks if this handler matches the given custom ID
   */
  matches(customId: string): boolean {
    // Extract prefix from custom ID (everything before first / or ?)
    const match = customId.match(/^(.+?)(\/|\?|$)/);
    const prefix = match ? match[1] : customId;
    return prefix === this.prefix;
  }
}

/**
 * Union type of all possible handlers
 */
export type Handler = SlashCommandHandler | ContextCommandHandler | ComponentHandler | ModalHandler;
