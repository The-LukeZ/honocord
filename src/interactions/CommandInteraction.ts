import { APIApplicationCommandInteraction, ApplicationCommandType, InteractionType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import { BaseInteractionContext } from "../types";
import { ModalCapableInteraction } from "./ModalCapableInteraction";

/**
 * Base class for application command interactions (slash commands and context menu commands).
 * Extended by {@link ChatInputCommandInteraction}, `UserContextInteraction`, and `MessageContextInteraction`.
 */
abstract class CommandInteraction<
  CType extends ApplicationCommandType = ApplicationCommandType,
  Context extends BaseInteractionContext = BaseInteractionContext,
> extends ModalCapableInteraction<InteractionType.ApplicationCommand, Context> {
  /** The application command type (chat input, user, or message). */
  public readonly commandType: CType;

  constructor(api: API, interaction: Extract<APIApplicationCommandInteraction, { data: { type: CType } }>, c: Context) {
    super(api, interaction, c);
    this.commandType = interaction.data.type;
  }

  /** The invoked command's name. */
  get commandName() {
    return this.raw.data.name;
  }

  /** The invoked command's ID. */
  get commandId() {
    return this.raw.data.id;
  }

  /** Type guard narrowing `commandType` to the given application command type. */
  isOfType<T extends ApplicationCommandType>(type: T): this is CommandInteraction<T, Context> {
    return (this.commandType as ApplicationCommandType) === type;
  }
}

export { CommandInteraction };
