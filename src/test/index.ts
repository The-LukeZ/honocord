import { ComponentHandler, ContextCommandHandler, SlashCommandHandler } from "@ctx/handlers";
import { BaseInteractionContext, ContextCommandType, HandlerFunction } from "../types";
import { ComponentType, MessageFlags } from "discord-api-types/v10";
import { ContainerBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction } from "@ctx/ChatInputInteraction";

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

new ContextCommandHandler<MyContext>(ContextCommandType.User).setName("user_command").addHandler(async (ctx) => {
  console.log("User context command executed");
});

new ContextCommandHandler<MyContext>(ContextCommandType.Message).setName("message_command").addHandler(async (ctx) => {
  console.log("Message context command executed");
});

// all component interaction handlers
new ComponentHandler<MyContext>("some_id", ComponentType.Button).addHandler(async (ctx) => {
  console.log("Button clicked");
});

new ComponentHandler<MyContext, ComponentType.StringSelect>("select_1", ComponentType.StringSelect).addHandler(async (ctx) => {
  console.log("Select menu used with values:", ctx.values);
});

new ComponentHandler<MyContext, ComponentType.UserSelect>("user_select", ComponentType.UserSelect).addHandler(async (ctx) => {
  console.log("User select used with values:", ctx.users);
});

new ComponentHandler<MyContext, ComponentType.RoleSelect>("role_select", ComponentType.RoleSelect).addHandler(async (ctx) => {
  console.log("Role select used with values:", ctx.roles);
});

new ComponentHandler<MyContext, ComponentType.MentionableSelect>(
  "mentionable_select",
  ComponentType.MentionableSelect
).addHandler(async (ctx) => {
  console.log("Mentionable select used with users:", ctx.users);
  console.log("Mentionable select used with roles:", ctx.roles);
});

new ComponentHandler<MyContext, ComponentType.ChannelSelect>("channel_select", ComponentType.ChannelSelect).addHandler(
  async (ctx) => {
    console.log("Channel select used with values:", ctx.channels);
  }
);
