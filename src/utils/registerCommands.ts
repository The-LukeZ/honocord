import { Handler } from "@ctx/handlers";
import { API } from "@discordjs/core/http-only";
import { REST } from "@discordjs/rest";
import { FlatOrNestedArray } from "../types";

export async function registerCommands(
  token: string | undefined,
  applicationId: string | undefined,
  ...handlers: FlatOrNestedArray<Handler>
) {
  const flatCommands = handlers.flat(Infinity) as Handler[];
  const commands = flatCommands
    .map((handler) => {
      if (handler.handlerType === "slash" || handler.handlerType === "context") {
        return handler.toJSON();
      }
      return undefined;
    })
    .filter((cmd) => cmd !== undefined);

  if (!token || !applicationId) {
    console.warn("Token or Application ID not provided, skipping command registration.");
    return;
  }

  const api = new API(new REST({ version: "10" }).setToken(token));
  try {
    await api.applicationCommands.bulkOverwriteGlobalCommands(applicationId, commands);
    console.log("---- ✅ Successfully registered global commands ----");
  } catch (error) {
    console.error("---- ❌ Error registering global commands ----");
    throw error;
  }
}
