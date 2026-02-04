// Test file for handlers if the types do work

import { ComponentHandler, SlashCommandHandler } from "@ctx/handlers";
import { ComponentType } from "discord-api-types/v10";

const commandHandler = new SlashCommandHandler().setName("test").setDescription("A test command");

commandHandler.addHandler(async (ctx) => {
  console.log("Test command executed");
  await ctx.reply({
    content: "Test command executed",
    components: [],
  });
});

const buttonHandler = new ComponentHandler("test_button", ComponentType.Button).addHandler(async (ctx) => {
  if (ctx.isButton()) {
    console.log("Button clicked with custom ID:", ctx.customId);
  }
});
