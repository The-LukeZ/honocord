import { SlashCommandHandler } from "@ctx/handlers";
import { BaseInteractionContext, HandlerFunction } from "../types";
import { MessageFlags } from "discord-api-types/v10";
import { ContainerBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction } from "@ctx/ChatInputInteraction";
import { handlers } from "./handlers";
import { Honocord } from "../Honocord";
import { Hono } from "hono/tiny";

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

new SlashCommandHandler<MyContext>().addHandler(testHandle);
const bot = new Honocord().use<MyContext>();
bot.loadHandlers(...handlers);

const app = new Hono<{ Bindings: MyEnv; Variables: MyVar }>();
app.post("/interactions", bot.handle);
