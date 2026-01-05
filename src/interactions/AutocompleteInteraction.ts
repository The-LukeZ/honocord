import {
  APIApplicationCommandOptionChoice,
  InteractionType,
  type APIChatInputApplicationCommandInteraction,
} from "discord-api-types/v10";
import { CommandInteractionOptionResolver } from "@resolvers/CommandOptionResolver";
import { API } from "@discordjs/core/http-only";
import { BaseInteraction } from "./BaseInteraction";
import { InteractionContext } from "../types";

class AutocompleteInteraction extends BaseInteraction<InteractionType.ApplicationCommand> {
  public readonly options: CommandInteractionOptionResolver;
  public responded = false;

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

  async respond(choices: APIApplicationCommandOptionChoice[]) {
    await this.api.interactions.createAutocompleteResponse(this.id, this.token, { choices });
    this.responded = true;
  }
}

export { AutocompleteInteraction };
