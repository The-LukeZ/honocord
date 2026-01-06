import { SlashCommandHandler } from "@ctx/handlers";
import { BaseInteractionContext } from "../types";

interface MyEnv {
  DISCORD_PUBLIC_KEY: string;
  DISCORD_TOKEN: string;
  DISCOR_APPLICATION_ID: string;
}

interface MyVar {
  variable: string;
}

type MyContext = BaseInteractionContext<MyEnv, MyVar>;

new SlashCommandHandler<MyContext>().addHandler((ctx) => {
  ctx.context.var;
  ctx.context.env;
});
