import {
  InteractionType,
  type APIChatInputApplicationCommandInteraction,
} from "discord-api-types/v10";
import { CommandInteractionOptionResolver } from "@resolvers/CommandOptionResolver";
import { API } from "@discordjs/core/http-only";
import { BaseInteractionContext } from "../types";
import { ModalCapableInteraction } from "./ModalCapableInteraction";

class ChatInputCommandInteraction<
  Context extends BaseInteractionContext = BaseInteractionContext,
> extends ModalCapableInteraction<InteractionType.ApplicationCommand, Context> {
  public readonly options: CommandInteractionOptionResolver;

  constructor(api: API, interaction: APIChatInputApplicationCommandInteraction, c: Context) {
    super(api, interaction, c);
    this.options = new CommandInteractionOptionResolver(interaction.data.options, interaction.data.resolved);
  }

  get commandName() {
    return this.data.data.name;
  }

  get commandId() {
    return this.data.data.id;
  }
}

export { ChatInputCommandInteraction };
