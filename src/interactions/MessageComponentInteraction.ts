import { APIMessage, InteractionType } from "discord-api-types/v10";
import { API } from "@discordjs/core/http-only";
import type { BaseInteractionContext, MessageComponentInteractionPayload, MessageComponentType } from "../types";
import { ModalCapableInteraction } from "./ModalCapableInteraction";

/**
 * Base class for message component interactions (buttons and select menus). Extended by
 * {@link ButtonInteraction}, {@link StringSelectInteraction}, and the other select menu interactions.
 */
abstract class MessageComponentInteraction<
  Context extends BaseInteractionContext = BaseInteractionContext,
  T extends MessageComponentType = MessageComponentType,
> extends ModalCapableInteraction<InteractionType.MessageComponent, Context> {
  /** The message the component is attached to. */
  public readonly message: APIMessage;
  /** The component's custom ID, as set when it was built. See the [Custom ID System](/guides/custom-id-system) guide. */
  public readonly customId: string;
  /** The message component's type (button, string select, etc). */
  public readonly componentType: T;

  constructor(api: API, interaction: MessageComponentInteractionPayload<T>, c: Context) {
    super(api, interaction, c);
    this.customId = interaction.data.custom_id;
    this.message = interaction.message;
    this.componentType = interaction.data.component_type as T;
  }
}

export { MessageComponentInteraction };
