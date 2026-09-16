import { ApplicationCommandType, type APIChatInputApplicationCommandInteraction } from "discord-api-types/v10";
import { CommandInteractionOptionResolver } from "@resolvers/CommandOptionResolver";
import { API } from "@discordjs/core/http-only";
import { BaseInteractionContext } from "../types";
import { CommandInteraction } from "./CommandInteraction";

/** A slash command interaction. Passed to `SlashCommandHandler.execute`. */
class ChatInputCommandInteraction<Context extends BaseInteractionContext = BaseInteractionContext> extends CommandInteraction<
  ApplicationCommandType.ChatInput,
  Context
> {
  /** Resolver for reading the command's option values. */
  public readonly options: CommandInteractionOptionResolver;
  constructor(api: API, interaction: APIChatInputApplicationCommandInteraction, c: Context) {
    super(api, interaction, c);
    this.options = new CommandInteractionOptionResolver(interaction.data.options, interaction.data.resolved);
  }
}

export { ChatInputCommandInteraction };
