import { ComponentHandler, SlashCommandHandler } from "@ctx/handlers";
import { BaseInteractionContext, HandlerFunction } from "../types";
import { ComponentType, MessageFlags } from "discord-api-types/v10";
import { ContainerBuilder } from "@discordjs/builders";

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

const testHandle: HandlerFunction<MyContext> = async (ctx) => {
  console.log(!!ctx.context.env.DATABASE);
  await ctx.reply({
    flags: MessageFlags.IsComponentsV2,
    components: [new ContainerBuilder().addTextDisplayComponents((t) => t.setContent("Hello world"))],
  });
};

new SlashCommandHandler<MyContext>().addHandler(testHandle);

new ComponentHandler<ComponentType.Button, MyContext>("some_id").addHandler(async (ctx) => {
  console.log("Button clicked");
  await ctx.update("Button clicked!");
  await ctx.editReply("Edited reply!");
});
