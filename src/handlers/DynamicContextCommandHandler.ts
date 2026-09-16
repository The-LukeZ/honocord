import type { UserContextInteraction } from "@ctx/UserContextCommandInteraction";
import type { MessageContextInteraction } from "@ctx/MessageContextCommandInteraction";
import type { BaseInteractionContext } from "../types";

/** Interaction type passed to a dynamic context command handler — narrow with `interaction.isOfType(...)`. */
export type DynamicContextInteraction<Context extends BaseInteractionContext = BaseInteractionContext> =
  UserContextInteraction<Context> | MessageContextInteraction<Context>;

abstract class DynamicContextCommandHandlerBase<Context extends BaseInteractionContext = BaseInteractionContext> {
  abstract readonly scope: "guild" | "global";
  readonly handlerType = "dynamic-context";
  private handlerFn?: (interaction: DynamicContextInteraction<Context>) => Promise<any> | any;

  /**
   * Adds the command handler function.
   *
   * @param handler - The function to handle the context command interaction. Receives both
   * User and Message context interactions — narrow with `interaction.isOfType(...)`.
   */
  addHandler(handler: (interaction: DynamicContextInteraction<Context>) => Promise<any> | any): this {
    this.handlerFn = handler;
    return this;
  }

  /**
   * Executes the command handler
   */
  async execute(interaction: DynamicContextInteraction<Context>): Promise<void> {
    if (!this.handlerFn) {
      throw new Error(`Dynamic ${this.scope} context command handler does not have a handler`);
    }
    await this.handlerFn(interaction);
  }
}

/**
 * Fallback handler for guild-scoped user/message context commands whose name isn't known
 * ahead of time (e.g. per-guild custom commands), or that don't match any registered
 * `ContextCommandHandler`.
 *
 * When an invocation has a `guild_id`, this handler is tried before {@link DynamicGlobalContextCommandHandler}.
 * Only one instance may be registered per `Honocord` instance via `loadHandlers`.
 */
export class DynamicGuildContextCommandHandler<
  Context extends BaseInteractionContext = BaseInteractionContext,
> extends DynamicContextCommandHandlerBase<Context> {
  readonly scope = "guild" as const;
}

/**
 * Fallback handler for global user/message context commands whose name isn't known ahead of
 * time, or that don't match any registered `ContextCommandHandler`. Also catches unmatched
 * guild-scoped invocations when no {@link DynamicGuildContextCommandHandler} is registered.
 *
 * Only one instance may be registered per `Honocord` instance via `loadHandlers`.
 */
export class DynamicGlobalContextCommandHandler<
  Context extends BaseInteractionContext = BaseInteractionContext,
> extends DynamicContextCommandHandlerBase<Context> {
  readonly scope = "global" as const;
}
