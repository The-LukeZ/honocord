import {
  InteractionType,
  type APIChatInputApplicationCommandInteraction,
  type APIModalInteractionResponseCallbackData,
} from "discord-api-types/v10";
import { CommandInteractionOptionResolver } from "@resolvers/CommandOptionResolver";
import { ModalBuilder } from "@discordjs/builders";
import { API } from "@discordjs/core/http-only";
import { BaseInteraction } from "./BaseInteraction";
import { InteractionContext } from "../types";

class ChatInputCommandInteraction extends BaseInteraction<InteractionType.ApplicationCommand> {
  public readonly options: CommandInteractionOptionResolver;

  constructor(api: API, interaction: APIChatInputApplicationCommandInteraction, c: InteractionContext) {
    super(api, interaction, c);
    this.options = new CommandInteractionOptionResolver(interaction.data.options, interaction.data.resolved);
  }

  get commandName() {
    return this.data.data.name;
  }

  get commandId() {
    return this.data.data.id;
  }

  showModal(data: APIModalInteractionResponseCallbackData | ModalBuilder) {
    return this.api.interactions.createModal(this.id, this.token, data instanceof ModalBuilder ? data.toJSON() : data);
  }
}

export { ChatInputCommandInteraction };
