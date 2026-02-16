import type { ChatInputCommandInteraction } from "@ctx/ChatInputInteraction";
import type { ModalInteraction } from "@ctx/ModalInteraction";
import type { TMessageComponentInteraction } from "./messageComponents.ts";
import { Bindings, BlankInput, Variables } from "hono/types";
import { Context } from "hono";

/**
 * Base variables that the library uses
 */
export interface BaseVariables {
  autocomplete?: ChatInputCommandInteraction;
  command?: ChatInputCommandInteraction;
  modal?: ModalInteraction;
  component?: TMessageComponentInteraction;
}

/**
 * Base context environment
 */
export interface BaseHonocordEnv<TBindings extends Bindings = any, TVariables extends Variables = any> {
  /**
   * Bindings available in the environment (from the worker)
   */
  Bindings: TBindings;
  /**
   * Variables available in the context (from Hono + Honocord)
   */
  Variables: BaseVariables & TVariables;
}

/**
 * Generic context type that users can extend for type-safe access to environment bindings and variables.
 *
 * @template TBindings - Custom environment bindings (e.g., Cloudflare Workers env)
 * @template TVariables - Custom Hono variables
 * @template TPath - The path type for the context
 *
 * @example
 * ```ts
 * // types.ts
 * import type { BaseHonocordEnv, BaseInteractionContext } from "honocord";
 *
 * // Define your custom environment
 * import type { BaseHonocordEnv, BaseInteractionContext } from "honocord";
 *
 * // Define your custom environment bindings (e.g., Cloudflare Workers env)
 * export interface MyEnv {
 *   DISCORD_TOKEN: string;
 *   DISCORD_PUBLIC_KEY: string;
 *   DATABASE: D1Database; // Example Cloudflare D1
 * }
 *
 * // Define your custom Hono variables (can be populated by middleware)
 * export interface MyVariables {
 *   user_id: string;
 *   is_admin: boolean;
 * }
 *
 * // Create a reusable context type
 * export type MyContext = BaseInteractionContext<MyEnv, MyVariables>;
 *
 * // index.ts
 * import { Honocord, SlashCommandHandler } from "honocord";
 * import type { MyContext } from "./types";
 *
 * const bot = new Honocord();
 *
 * const command = new SlashCommandHandler()
 *   .setName("query")
 *   .setDescription("Query the database");
 *
 * command.addHandler(async (interaction: MyContext) => {
 *   // Type-safe access to your environment
 *   const db = interaction.env.DATABASE;
 *   const result = await db.prepare("SELECT * FROM users").all();
 *   await interaction.reply(`Found ${result.results.length} users`);
 * });
 *
 * bot.loadHandlers([command]);
 * ```
 */
export type BaseInteractionContext<
  TBindings extends Bindings = any,
  TVariables extends Variables = any,
  TPath extends string = "/",
> = Context<{ Bindings: TBindings; Variables: TVariables & BaseVariables }, TPath, BlankInput>;
