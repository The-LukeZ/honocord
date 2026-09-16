import { ApplicationCommandType } from "discord-api-types/v10";

/** The context menu command types Honocord supports — `ApplicationCommandType.User` and `ApplicationCommandType.Message`. */
export enum ContextCommandType {
  User = ApplicationCommandType.User,
  Message = ApplicationCommandType.Message,
}
