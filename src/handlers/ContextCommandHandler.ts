import { ContextMenuCommandBuilder } from "@discordjs/builders";
import { MessageContextInteraction } from "@ctx/MessageContextCommandInteraction";
import { UserContextInteraction } from "@ctx/UserContextCommandInteraction";
import { BaseInteractionContext, ContextCommandType } from "../types";

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
