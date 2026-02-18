// Test file for handlers if the types do work

import { AnyHandler, ComponentHandler, ContextCommandHandler, SlashCommandHandler, WebhookEventHandler } from "@handlers/index";
import {
  APIMessageTopLevelComponent,
  ApplicationWebhookEventType,
  ComponentType,
  RESTPostAPIChannelMessageFormDataBody,
} from "discord-api-types/v10";
import { BaseInteractionContext, ContextCommandType, JSONEncodable, ModalInteractionResponseCallbackData } from "../types";
import { ActionRowBuilder, ButtonBuilder, ContainerBuilder } from "@discordjs/builders";
import { AttachmentBuilder } from "../structures/AttachmentBuilder";
import { REST } from "@discordjs/rest";
import { API } from "@discordjs/core/http-only";

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
  const ar = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder({
      custom_id: "testButton",
      label: "Test Button",
    })
  );
  await ctx.reply({
    content: "Test command executed",
    components: [ar],
  });
});

const buttonHandler = new ComponentHandler<MyContext, ComponentType.Button>("test_button", ComponentType.Button);

buttonHandler.addHandler(async (ctx) => {
  console.log("Button clicked with custom ID:", ctx.customId);
const modalData: ModalInteractionResponseCallbackData = {
  title: "Test Modal",
  custom_id: "test_modal",
  components: [
    {
      type: ComponentType.Label,
      label: "This is a label",
      component: {
        type: ComponentType.Checkbox,
        custom_id: "checkbox_1",
      },
    },
    {
      type: ComponentType.Label,
      label: "This is a text input",
      component: {
        type: ComponentType.CheckboxGroup,
        custom_id: "checkbox_group_1",
        options: [
          {
            label: "Option 1",
            description: "This is option 1",
            value: "option_1",
          },
          {
            label: "Option 2",
            value: "option_2",
          },
        ],
      },
    },
    {
      type: ComponentType.Label,
      label: "This is a select menu",
      component: {
        type: ComponentType.RadioGroup,
        custom_id: "radio_group_1",
        options: [
          {
            label: "Option A",
            description: "This is option A",
            value: "option_a",
          },
          {
            label: "Option B",
            value: "option_b",
          },
        ],
      },
    },
  ],
};

  ctx.showModal(modalData);
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
    const ar = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder({
        custom_id: "testButton",
        label: "Test Button",
      })
    );
    await ctx.reply({
      content: "Button clicked",
      components: [ar],
    });
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
  ctx.reply({
    attachments: [
      new AttachmentBuilder(Buffer.from("Hello world"), {
        name: "hello.txt",
        description: "A hello world text file",
      }),
    ],
  });
});

const authorizedHandler = new WebhookEventHandler<ApplicationWebhookEventType.ApplicationAuthorized, MyEnv, MyVar>(
  ApplicationWebhookEventType.ApplicationAuthorized
).addHandler(async (c) => {
  const { data } = c.get("data");
  console.log("Received ApplicationAuthorized event with data:", data);
  return c.body(null, 200);
});

const deauthHandler = new WebhookEventHandler<ApplicationWebhookEventType.ApplicationDeauthorized, MyEnv, MyVar, true>(
  ApplicationWebhookEventType.ApplicationDeauthorized,
  true
).addHandler(async (c) => {
  const { data } = c.get("data");
  console.log("Received ApplicationDeauthorized event with data:", data);
  // No return needed in worker mode
});

function testAttachmentBuilder() {
  const rest = new REST().setToken("fake_token");
  const api = new API(rest);
  const attachment = new AttachmentBuilder(Buffer.from("Hello world"), {
    name: "hello.txt",
    description: "A hello world text file",
  })
    .setContentType("text/plain")
    .setKey("file1")
    .setSpoiler();

  console.log("Attachment metadata for REST API:", attachment.toRestAttachment(0));
  console.log("Raw file data for multipart upload:", attachment.toRawFile());

  api.channels.createMessage("channel_id", {
    content: "Here is an attachment",
    ...AttachmentBuilder.resolve(attachment),
  });

  // or directly with rest
  const { files, attachments } = AttachmentBuilder.resolve(attachment);
  rest.post("/channels/channel_id/messages", {
    body: {
      content: "Here is an attachment",
      attachments: attachments,
    } as RESTPostAPIChannelMessageFormDataBody,
    files: files,
  });
}

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
