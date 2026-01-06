import {
  APIApplicationCommandAutocompleteInteraction,
  APIApplicationCommandOptionChoice,
  InteractionType,
  type APIChatInputApplicationCommandInteraction,
} from "discord-api-types/v10";
import { CommandInteractionOptionResolver } from "@resolvers/CommandOptionResolver";
import { API } from "@discordjs/core/http-only";
import { BaseInteraction } from "./BaseInteraction";
import { BaseInteractionContext } from "../types";

class AutocompleteInteraction<Context extends BaseInteractionContext = BaseInteractionContext> extends BaseInteraction<
  InteractionType.ApplicationCommandAutocomplete,
  Context
> {
  public readonly options: CommandInteractionOptionResolver;
  public responded = false;

  constructor(api: API, interaction: APIApplicationCommandAutocompleteInteraction, c: Context) {
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
