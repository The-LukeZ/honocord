import { parseCustomId } from "@utils/index";
import { BaseInteractionContext, MessageComponentInteractionObj, MessageComponentType } from "../types";

/**
 * Handler for message components (buttons, select menus) based on custom ID prefix
 */
export class ComponentHandler<
  Context extends BaseInteractionContext = BaseInteractionContext,
  CType extends MessageComponentType = MessageComponentType,
> {
  readonly handlerType = "component";
  public readonly prefix: string;
  public readonly componentType: CType;
  private handlerFn?: (interaction: MessageComponentInteractionObj<Context, CType>) => Promise<any> | any;

  /**
   * @param prefix - The custom ID prefix this handler matches against. See the [Custom ID System](/guides/custom-id-system) guide.
   * @param componentType - The message component type this handler is registered for
   * @param handler - Optional handler function, equivalent to calling `addHandler` afterwards
   */
  constructor(
    prefix: string,
    componentType: CType,
    handler?: (interaction: MessageComponentInteractionObj<Context, CType>) => Promise<any> | any
  ) {
    this.componentType = componentType;
    if (!prefix || typeof prefix !== "string") {
      throw new TypeError("Component handler prefix must be a non-empty string");
    }

    this.prefix = prefix;
    if (handler) this.handlerFn = handler;
  }

  /**
   * Adds the component handler function.
   *
   * @param handler - The function to handle the component interaction
   * @returns The current ComponentHandler instance
   */
  addHandler(
    handler: (interaction: MessageComponentInteractionObj<Context, CType>) => Promise<any> | any
  ): ComponentHandler<Context, CType> {
    this.handlerFn = handler;
    return this;
  }

  /**
   * Executes the component handler
   */
  async execute(interaction: MessageComponentInteractionObj<Context, CType>): Promise<void> {
    if (!this.handlerFn) {
      throw new Error(`Component handler with prefix "${this.prefix}" does not have a handler`);
    }
    await this.handlerFn(interaction);
  }

  /**
   * Checks if this handler matches the given custom ID
   */
  matches(customId: string): boolean {
    const prefix = parseCustomId(customId, true);
    return prefix === this.prefix;
  }
}
