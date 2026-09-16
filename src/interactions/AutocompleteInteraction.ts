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

/** An autocomplete request for a slash command option. Passed to `SlashCommandHandler.executeAutocomplete`. */
class AutocompleteInteraction<Context extends BaseInteractionContext = BaseInteractionContext> extends BaseInteraction<
  InteractionType.ApplicationCommandAutocomplete,
  Context
> {
  /** Resolver for reading the command's option values, including the currently-focused option. */
  public readonly options: CommandInteractionOptionResolver;
  /** Whether `respond` has already been called for this interaction. */
  public responded = false;

  constructor(api: API, interaction: APIApplicationCommandAutocompleteInteraction, c: Context) {
    super(api, interaction, c);
    this.options = new CommandInteractionOptionResolver(interaction.data.options, interaction.data.resolved);
  }

  /** The invoked command's name. */
  get commandName() {
    return this.raw.data.name;
  }

  /** The invoked command's ID. */
  get commandId() {
    return this.raw.data.id;
  }

  /**
   * Sends autocomplete choices back to Discord.
   *
   * @param choices - Up to 25 choices to display to the user.
   */
  async respond(choices: APIApplicationCommandOptionChoice[]) {
    await this.api.interactions.createAutocompleteResponse(this.id, this.token, { choices });
    this.responded = true;
  }
}

export { AutocompleteInteraction };
