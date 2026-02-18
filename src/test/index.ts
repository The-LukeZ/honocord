import { SlashCommandHandler } from "@handlers/index";
import { BaseInteractionContext, HandlerFunction } from "../types";
import { MessageFlags } from "discord-api-types/v10";
import { ContainerBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction } from "@ctx/ChatInputInteraction";
import { handlers } from "./handlers";
import { Honocord } from "../Honocord";
import { Hono } from "hono/tiny";
import { AutocompleteHelper } from "@utils/Autocomplete";
import { registerCommands } from "@utils/registerCommands";

// ! Caching can't be tested here as it needs a full workers environment to be properly tested, and that's out of scope for this test file.
// Those "tests" are in the examples repository.

interface MyEnv {
  DISCORD_PUBLIC_KEY: string;
  DISCORD_TOKEN: string;
  DISCORD_APPLICATION_ID: string;
  DATABASE: D1Database;
}

interface MyVar {
  variable: string;
}

type MyContext = BaseInteractionContext<MyEnv, MyVar>;

const testHandle: HandlerFunction<MyContext, ChatInputCommandInteraction> = async (ctx) => {
  console.log(!!ctx.context.env.DATABASE);
  await ctx.reply({
    flags: MessageFlags.IsComponentsV2,
    components: [new ContainerBuilder().addTextDisplayComponents((t) => t.setContent("Hello world"))],
  });
};

new SlashCommandHandler<MyContext>().addHandler(testHandle).addAutocompleteHandler(async (ctx) => {
  const option = ctx.options.getFocused()!; // autocomplete is triggered on any option - so we need to filter
  if (option?.name === "option-1") {
    await ctx.respond([
      { name: "Option 1", value: "option_1" },
      { name: "Option 2", value: "option_2" },
    ]);
    return;
  }

  // Autocomplete with integrated class
  const autocomplete = new AutocompleteHelper(option?.value).setChoices(
    { name: "Choice 1", value: "choice_1" },
    { name: "Choice 2", value: "choice_2" },
    { name: "Choice 3", value: "choice_3" }
  );
  return ctx.respond(autocomplete.response(["name", "value"])); // Filter by name and value (name_localizations is also supported)
});

const bot = new Honocord().use<MyContext>(async (c, next) => {
  console.log("Middleware before", c.get("variable"));
  await next();
  console.log("Middleware after");
});
bot.loadHandlers(...handlers);

const app = new Hono<{ Bindings: MyEnv; Variables: MyVar }>();
app.post("/interactions", bot.interactionsHandler);

// other file
const register = () => registerCommands("asd", "123123123", ...handlers);
