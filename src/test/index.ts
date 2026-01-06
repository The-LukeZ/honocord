import { ComponentHandler, SlashCommandHandler } from "@ctx/handlers";
import { BaseInteractionContext } from "../types";
import { ComponentType } from "discord-api-types/v10";

interface MyEnv {
  DISCORD_PUBLIC_KEY: string;
  DISCORD_TOKEN: string;
  DISCOR_APPLICATION_ID: string;
}

interface MyVar {
  variable: string;
}

type MyContext = BaseInteractionContext<MyEnv, MyVar>;

new SlashCommandHandler<MyContext>().addHandler(async (ctx) => {
  console.log("Hello world");
  return ctx.reply("Hello world!", true);
});

new ComponentHandler<ComponentType.Button, MyContext>("some_id").addHandler(async (ctx) => {
  console.log("Button clicked");
  await ctx.update("Button clicked!");
  await ctx.editReply("Edited reply!");
});
