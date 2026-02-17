// Test file for handlers if the types do work

import { AnyHandler, ComponentHandler, ContextCommandHandler, SlashCommandHandler, WebhookEventHandler } from "@handlers/index";
import { ApplicationWebhookEventType, ComponentType } from "discord-api-types/v10";
import { BaseInteractionContext, ContextCommandType } from "../types";
import { ButtonBuilder, ContainerBuilder } from "@discordjs/builders";

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

const commandHandler = new SlashCommandHandler<MyContext>().setName("test").setDescription("A test command");

commandHandler.addHandler(async (ctx) => {
  console.log("Test command executed");
  await ctx.reply({
    content: "Test command executed",
  });
});

const buttonHandler = new ComponentHandler<MyContext, ComponentType.Button>("test_button", ComponentType.Button);

buttonHandler.addHandler(async (ctx) => {
  if (ctx.isButton()) {
    console.log("Button clicked with custom ID:", ctx.customId);
  }
});

const userContextCommandHandler = new ContextCommandHandler<MyContext, ContextCommandType.User>(ContextCommandType.User)
  .setName("user_command")
  .addHandler(async (ctx) => {
    console.log("User context command executed");
  });

const messageContextCommandHandler = new ContextCommandHandler<MyContext, ContextCommandType.Message>(ContextCommandType.Message)
  .setName("message_command")
  .addHandler(async (ctx) => {
    console.log("Message context command executed");
  });

// all component interaction handlers
const buttonComponentHandler = new ComponentHandler<MyContext, ComponentType.Button>("some_id", ComponentType.Button).addHandler(
  async (ctx) => {
    console.log("Button clicked");
    const ar = new ContainerBuilder().addActionRowComponents<ButtonBuilder>((ar) =>
      ar.addComponents(
        new ButtonBuilder({
          custom_id: "testButton",
          label: "Test Button",
        })
      )
    );
  }
);

const stringSelectComponentHandler = new ComponentHandler<MyContext, ComponentType.StringSelect>(
  "select_1",
  ComponentType.StringSelect
).addHandler(async (ctx) => {
  console.log("Select menu used with values:", ctx.values);
});

const userSelectComponentHandler = new ComponentHandler<MyContext, ComponentType.UserSelect>(
  "user_select",
  ComponentType.UserSelect
).addHandler(async (ctx) => {
  console.log("User select used with values:", ctx.users);
});

const roleSelectComponentHandler = new ComponentHandler<MyContext, ComponentType.RoleSelect>(
  "role_select",
  ComponentType.RoleSelect
).addHandler(async (ctx) => {
  console.log("Role select used with values:", ctx.roles);
});

const mentionableSelectComponentHandler = new ComponentHandler<MyContext, ComponentType.MentionableSelect>(
  "mentionable_select",
  ComponentType.MentionableSelect
).addHandler(async (ctx) => {
  console.log("Mentionable select used with users:", ctx.users);
  console.log("Mentionable select used with roles:", ctx.roles);
});

const channelSelectComponentHandler = new ComponentHandler<MyContext, ComponentType.ChannelSelect>(
  "channel_select",
  ComponentType.ChannelSelect
).addHandler(async (ctx) => {
  console.log("Channel select used with values:", ctx.channels);
});

const authorizedHandler = new WebhookEventHandler(ApplicationWebhookEventType.ApplicationAuthorized).addHandler(async (c) => {
  const { data } = c.get("data");
  console.log("Received ApplicationAuthorized event with data:", data);
  return c.body(null, 200);
});

const deauthHandler = new WebhookEventHandler(ApplicationWebhookEventType.ApplicationDeauthorized, true).addHandler(async (c) => {
  const { data } = c.get("data");
  console.log("Received ApplicationDeauthorized event with data:", data);
  // No return needed in worker mode
});

const handlers: AnyHandler[] = [
  commandHandler,
  buttonHandler,
  userContextCommandHandler,
  messageContextCommandHandler,
  buttonComponentHandler,
  stringSelectComponentHandler,
  userSelectComponentHandler,
  roleSelectComponentHandler,
  mentionableSelectComponentHandler,
  channelSelectComponentHandler,
  authorizedHandler,
  deauthHandler,
];

export { handlers };
