import { ComponentHandler, SlashCommandHandler } from "@ctx/handlers";
import { BaseInteractionContext, HandlerFunction } from "../types";
import { ApplicationCommandType, ComponentType } from "discord-api-types/v10";

interface MyEnv {
  DISCORD_PUBLIC_KEY: string;
  DISCORD_TOKEN: string;
  DISCOR_APPLICATION_ID: string;
}

interface MyVar {
  variable: string;
}

type MyContext = BaseInteractionContext<MyEnv, MyVar>;

const testHandle: HandlerFunction<MyContext> = async (ctx) => {
  if (ctx.isCommand() && ctx.isUserContextCommand()) {
    console.log("It's a user context command!", ctx);
  }
};

new SlashCommandHandler<MyContext>().addHandler(async (ctx) => {
  console.log("Hello world");
  if (ctx.isChatInputCommand()) {
    ctx;
  }
  return ctx.reply("Hello world!", true);
});

new ComponentHandler<ComponentType.Button, MyContext>("some_id").addHandler(async (ctx) => {
  console.log("Button clicked");
  await ctx.update("Button clicked!");
  await ctx.editReply("Edited reply!");
});
