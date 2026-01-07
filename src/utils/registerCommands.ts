import { Handler } from "@ctx/handlers";
import { API } from "@discordjs/core/http-only";
import { REST } from "@discordjs/rest";
import { FlatOrNestedArray } from "../types";
import type { RESTPostAPIApplicationCommandsJSONBody, RESTPostAPIApplicationGuildCommandsJSONBody } from "discord-api-types/v10";

export async function registerCommands(
  token: string | undefined,
  applicationId: string | undefined,
  ...handlers: FlatOrNestedArray<Handler>
) {
  const flatCommands = handlers.flat(Infinity) as Handler[];
  const { globalCommands, guildCommands } = flatCommands
    .map((handler) => {
      if (handler.handlerType === "slash" || handler.handlerType === "context") {
        return handler;
      }
      return undefined;
    })
    .filter((cmd) => cmd !== undefined)
    .reduce(
      (acc, cmd) => {
        if (cmd.isGuildCommand()) {
          for (const guildId of cmd.guildIds.values()) {
            if (!acc.guildCommands[guildId]) {
              acc.guildCommands[guildId] = [];
            }
            acc.guildCommands[guildId].push(cmd.toJSON());
          }
        } else {
          acc.globalCommands.push(cmd.toJSON());
        }
        return acc;
      },
      {
        globalCommands: [] as RESTPostAPIApplicationCommandsJSONBody[],
        guildCommands: {} as Record<string, RESTPostAPIApplicationGuildCommandsJSONBody[]>,
      }
    );

  if (!token || !applicationId) {
    console.warn("Token or Application ID not provided, skipping command registration.");
    return;
  }

  const api = new API(new REST({ version: "10" }).setToken(token));
  try {
    await api.applicationCommands.bulkOverwriteGlobalCommands(applicationId, globalCommands);
    console.log(`---- ✅ Successfully registered ${globalCommands.length} global commands ----`);
  } catch (error) {
    console.error("---- ❌ Error registering global commands ----");
    throw error;
  }

  if (Object.keys(guildCommands).length === 0) {
    return;
  }

  const guildCommandsArray = Object.entries(guildCommands).map(([guildId, commands]) => ({ guildId, commands }));

  for (const { guildId, commands } of guildCommandsArray) {
    try {
      await api.applicationCommands.bulkOverwriteGuildCommands(applicationId, guildId, commands);
      console.log(`---- ✅ Successfully registered ${commands.length} guild commands for guild ${guildId} ----`);
    } catch (error) {
      console.error(`---- ❌ Error registering guild commands for guild ${guildId} ----`);
      throw error;
    }
  }
}
