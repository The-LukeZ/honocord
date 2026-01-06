import { Handler } from "@ctx/handlers";
import { API } from "@discordjs/core/http-only";
import { REST } from "@discordjs/rest";

export default async function registerCommands(
  token: string | undefined,
  applicationId: string | undefined,
  ...handlers: Handler[]
) {
  const commands = handlers
    .map((handler) => {
      if (handler.handlerType === "slash" || handler.handlerType === "context") {
        return handler.toJSON();
      }
    })
    .filter((cmd) => cmd !== undefined);

  if (!token || !applicationId) {
    console.warn("Token or Application ID not provided, skipping command registration.");
    return;
  }

  const api = new API(new REST({ version: "10" }).setToken(token));
  try {
    await api.applicationCommands.bulkOverwriteGlobalCommands(applicationId, commands);
    console.log("✅ Successfully registered commands.");
  } catch (error) {
    console.error("❌ Error registering commands");
    throw error;
  }
}
