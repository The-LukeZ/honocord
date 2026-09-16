import type { ModalInteraction } from "@ctx/ModalInteraction";
import { parseCustomId } from "@utils/index";
import type { BaseInteractionContext } from "../types";

/**
 * Handler for modal submits based on custom ID prefix
 */
export class ModalHandler<Context extends BaseInteractionContext = BaseInteractionContext> {
  readonly handlerType = "modal";
  public readonly prefix: string;
  private handlerFn?: (interaction: ModalInteraction<Context>) => Promise<any> | any;

  /**
   * @param prefix - The custom ID prefix this handler matches against. See the [Custom ID System](/guides/custom-id-system) guide.
   * @param handler - Optional handler function, equivalent to calling `addHandler` afterwards
   */
  constructor(prefix: string, handler?: (interaction: ModalInteraction<Context>) => Promise<any> | any) {
    if (!prefix || typeof prefix !== "string") {
      throw new TypeError("Modal handler prefix must be a non-empty string");
    }

    this.prefix = prefix;
    if (handler) this.handlerFn = handler;
  }

  /**
   * Adds the modal handler function.
   *
   * @param handler - The function to handle the modal submit interaction
   * @returns The current ModalHandler instance
   */
  addHandler(handler: (interaction: ModalInteraction<Context>) => Promise<any> | any): ModalHandler<Context> {
    this.handlerFn = handler;
    return this;
  }

  /**
   * Executes the modal handler
   */
  async execute(interaction: ModalInteraction<Context>): Promise<void> {
    if (!this.handlerFn) {
      throw new Error(`Modal handler with prefix "${this.prefix}" does not have a handler`);
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
