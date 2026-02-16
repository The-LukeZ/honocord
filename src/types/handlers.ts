import type { BaseInteractionContext } from "./context";
import type { AnyInteraction } from "./interactions";

export type HandlerFunction<
  Context extends BaseInteractionContext = BaseInteractionContext,
  InteractionArg extends AnyInteraction<Context> = AnyInteraction<Context>,
> = (interaction: InteractionArg) => Promise<any> | any;

/**
 * Middleware function type for processing interaction contexts.
 *
 * Helpful for implementing cross-cutting concerns such as logging, authentication, setting of the DB, etc.
 */
export type MiddlewareFunction<Context extends BaseInteractionContext = BaseInteractionContext> = (
  context: Context,
  next: () => Promise<void>
) => Promise<Response | void> | Response | void;
