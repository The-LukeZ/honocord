import { ApplicationCommandType } from "discord-api-types/v10";

export enum ContextCommandType {
  User = ApplicationCommandType.User,
  Message = ApplicationCommandType.Message,
}
