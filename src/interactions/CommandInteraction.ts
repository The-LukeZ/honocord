import { APIApplicationCommandInteraction, ApplicationCommandType, InteractionType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import { BaseInteractionContext } from "../types";
import { ModalCapableInteraction } from "./ModalCapableInteraction";

abstract class CommandInteraction<
  CType extends ApplicationCommandType = ApplicationCommandType,
  Context extends BaseInteractionContext = BaseInteractionContext,
> extends ModalCapableInteraction<InteractionType.ApplicationCommand, Context> {
  public readonly commandType: CType;

  constructor(api: API, interaction: Extract<APIApplicationCommandInteraction, { data: { type: CType } }>, c: Context) {
    super(api, interaction, c);
    this.commandType = interaction.data.type;
  }

  get commandName() {
    return this.raw.data.name;
  }

  get commandId() {
    return this.raw.data.id;
  }

  isOfType<T extends ApplicationCommandType>(type: T): this is CommandInteraction<T, Context> {
    return (this.commandType as ApplicationCommandType) === type;
  }
}

export { CommandInteraction };
