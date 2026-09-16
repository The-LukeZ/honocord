import type { ChatInputCommandInteraction } from "@ctx/ChatInputInteraction";
import type { AutocompleteInteraction } from "@ctx/AutocompleteInteraction";
import type { BaseInteractionContext } from "../types";

abstract class DynamicSlashCommandHandlerBase<Context extends BaseInteractionContext = BaseInteractionContext> {
  abstract readonly scope: "guild" | "global";
  readonly handlerType = "dynamic-slash";
  private handlerFn?: (interaction: ChatInputCommandInteraction<Context>) => Promise<any> | any;
  private autocompleteFn?: (interaction: AutocompleteInteraction<Context>) => Promise<any> | any;

  /**
   * Adds the command handler function.
   *
   * @param handler - The function to handle the command interaction
   */
  addHandler(handler: (interaction: ChatInputCommandInteraction<Context>) => Promise<any> | any): this {
    this.handlerFn = handler;
    return this;
  }

  /**
   * Adds the autocomplete handler function.
   *
   * @param handler - The function to handle the autocomplete interaction
   */
  addAutocompleteHandler(handler: (interaction: AutocompleteInteraction<Context>) => Promise<any> | any): this {
    this.autocompleteFn = handler;
    return this;
  }

  /**
   * Executes the command handler
   */
  async execute(interaction: ChatInputCommandInteraction<Context>): Promise<void> {
    if (!this.handlerFn) {
      throw new Error(`Dynamic ${this.scope} slash command handler does not have a handler`);
    }
    await this.handlerFn(interaction);
  }

  /**
   * Executes the autocomplete handler if it exists
   */
  async executeAutocomplete(interaction: AutocompleteInteraction<Context>): Promise<void> {
    if (!this.autocompleteFn) {
      throw new Error(`Dynamic ${this.scope} slash command handler does not have an autocomplete handler`);
    }
    await this.autocompleteFn(interaction);
  }
}

/**
 * Fallback handler for guild-scoped slash commands whose name isn't known ahead of time
 * (e.g. per-guild custom commands), or that don't match any registered `SlashCommandHandler`.
 *
 * When an invocation has a `guild_id`, this handler is tried before {@link DynamicGlobalSlashCommandHandler}.
 * Only one instance may be registered per `Honocord` instance via `loadHandlers`.
 */
export class DynamicGuildSlashCommandHandler<
  Context extends BaseInteractionContext = BaseInteractionContext,
> extends DynamicSlashCommandHandlerBase<Context> {
  readonly scope = "guild" as const;
}

/**
 * Fallback handler for global slash commands whose name isn't known ahead of time, or that
 * don't match any registered `SlashCommandHandler`. Also catches unmatched guild-scoped
 * invocations when no {@link DynamicGuildSlashCommandHandler} is registered.
 *
 * Only one instance may be registered per `Honocord` instance via `loadHandlers`.
 */
export class DynamicGlobalSlashCommandHandler<
  Context extends BaseInteractionContext = BaseInteractionContext,
> extends DynamicSlashCommandHandlerBase<Context> {
  readonly scope = "global" as const;
}
