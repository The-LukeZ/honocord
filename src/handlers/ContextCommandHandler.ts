import { ContextMenuCommandBuilder } from "@discordjs/builders";
import { MessageContextInteraction } from "@ctx/MessageContextCommandInteraction";
import { UserContextInteraction } from "@ctx/UserContextCommandInteraction";
import { BaseInteractionContext, ContextCommandType } from "../types";

/**
 * Handler for user and message context menu commands.
 *
 * @template Context - Interaction context type
 * @template T - Which context command type this handler serves (`User` or `Message`)
 * @template InteractionData - The interaction type passed to the handler function, inferred from `T`
 */
export class ContextCommandHandler<
  Context extends BaseInteractionContext = BaseInteractionContext,
  T extends ContextCommandType = ContextCommandType,
  InteractionData = T extends ContextCommandType.User ? UserContextInteraction<Context> : MessageContextInteraction<Context>,
> extends ContextMenuCommandBuilder {
  constructor(public readonly commandType: T) {
    super();
    this.setType(commandType as any); // ContextMenuCommandType is a type, not an enum so the values of the enum ContextCommandType isn't assignable to it directly
  }

  readonly handlerType = "context";
  private handlerFn?: (interaction: InteractionData) => Promise<any> | any;
  /**
   * Set of guild IDs where this command is registered (empty for global commands)
   */
  readonly guildIds = new Set<string>();

  /** Whether this command is registered per-guild (`true`) or globally (`false`, the default). */
  isGuildCommand(): boolean {
    return this.guildIds.size > 0;
  }

  /** Replaces `guildIds` with the given list, making this a guild-scoped command. */
  setGuildIds(guildIds: string[]): this {
    this.guildIds.clear();
    for (const guildId of guildIds) {
      this.guildIds.add(guildId);
    }
    return this;
  }

  /** Adds one or more guild IDs to `guildIds`, making this a guild-scoped command. */
  addGuildIds(...guildIds: string[]): this {
    for (const guildId of guildIds) {
      this.guildIds.add(guildId);
    }
    return this;
  }

  /** Removes one or more guild IDs from `guildIds`. */
  removeGuildIds(...guildIds: string[]): this {
    for (const guildId of guildIds) {
      this.guildIds.delete(guildId);
    }
    return this;
  }

  /**
   * Adds the command handler function.
   *
   * @param handler - The function to handle the context command interaction
   * @returns The current ContextCommandHandler instance
   */
  public addHandler(
    handler: (interaction: InteractionData) => Promise<any> | any
  ): ContextCommandHandler<Context, T, InteractionData> {
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
