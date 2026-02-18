import {
  APIAttachment,
  APIInteractionDataResolved,
  APIInteractionDataResolvedChannel,
  APIInteractionDataResolvedGuildMember,
  APIModalSubmitCheckboxComponent,
  APIModalSubmitCheckboxGroupComponent,
  APIModalSubmitFileUploadComponent,
  APIModalSubmitRadioGroupComponent,
  APIRole,
  APIUser,
  ComponentType,
  ModalSubmitLabelComponent,
  ModalSubmitTextDisplayComponent,
  Snowflake,
} from "discord-api-types/v10";
import { APIInteractionDataResolvedCollections, ResolvedSelectedGuildMember } from "../types";
import { Collection, ReadonlyCollection } from "@discordjs/collection";

export interface BaseModalData<Type extends ComponentType> {
  id?: number;
  type: Type;
}

export interface TextInputModalData extends BaseModalData<ComponentType.TextInput> {
  custom_id: string;
  value: string;
}

export interface SelectMenuModalData extends BaseModalData<
  | ComponentType.ChannelSelect
  | ComponentType.MentionableSelect
  | ComponentType.RoleSelect
  | ComponentType.StringSelect
  | ComponentType.UserSelect
> {
  custom_id: string;
  channels?: ReadonlyCollection<Snowflake, APIInteractionDataResolvedChannel>;
  members?: ReadonlyCollection<Snowflake, APIInteractionDataResolvedGuildMember>;
  roles?: ReadonlyCollection<Snowflake, APIRole>;
  users?: ReadonlyCollection<Snowflake, APIUser>;
  /**
   * The raw values selected by the user.
   */
  values: readonly string[];
}

// Technically, we had to add file uploads too, but we ain't using them anyway
type APIModalData =
  | TextInputModalData
  | SelectMenuModalData
  | APIModalSubmitCheckboxComponent
  | APIModalSubmitCheckboxGroupComponent
  | APIModalSubmitRadioGroupComponent
  | APIModalSubmitFileUploadComponent;

export class ModalComponentResolver {
  private _resolved: APIInteractionDataResolvedCollections;
  private hoistedComponents: Collection<string, APIModalData>;

  constructor(
    private components: (ModalSubmitLabelComponent | ModalSubmitTextDisplayComponent)[],
    resolved?: APIInteractionDataResolved
  ) {
    this._resolved = Object.keys(resolved ?? {}).reduce((acc, key) => {
      const resolvedData = resolved?.[key as keyof APIInteractionDataResolved];
      if (key === "members") {
        // get users and combine them with members for easy access; a user is expected to ALWAYS be present if a member is
        const users = resolved?.users ? new Collection(Object.entries(resolved.users)) : new Collection();
        const members = resolvedData ? new Collection(Object.entries(resolvedData)) : new Collection();
        const combined = new Collection([...members.entries()].map(([id, member]) => [id, { ...member, user: users.get(id)! }]));
        acc[key] = combined;
        return acc;
      }
      const collection = new Collection(resolvedData ? Object.entries(resolvedData) : []);
      acc[key] = collection;
      return acc;
    }, {} as any);

    this.hoistedComponents = this.components.reduce(
      (accumulator, next) => {
        // For label components
        if (next.type === ComponentType.Label) {
          accumulator.set(next.component.custom_id, next.component);
        }

        return accumulator;
      },
      new Collection() as Collection<string, APIModalData>
    );
  }

  public get data() {
    return this.hoistedComponents.map((component) => component);
  }

  /**
   * Checks if a component with the given custom ID exists in the modal.
   * @param custom_id The custom ID of the component to check for.
   * @returns True if a component with the given custom ID exists, false otherwise.
   */
  fieldExists(custom_id: string): boolean {
    return this.hoistedComponents.has(custom_id);
  }

  getComponent(custom_id: string): APIModalData {
    const component = this.hoistedComponents.get(custom_id);

    if (!component) throw new TypeError("No component found with the provided custom_id.");

    return component;
  }

  /**
   * Gets the value of a text input component.
   *
   * @param custom_id The custom ID of the component.
   * @param required Whether to throw an error if the component is not found or not a text input.
   * @returns The value of the text input, or null if not set and not required.
   */
  getString(custom_id: string, required?: boolean): string | null;
  getString(custom_id: string, required: true): string;
  getString(custom_id: string, required: boolean = false): string | null {
    const component = this.getComponent(custom_id);
    if (component.type !== ComponentType.TextInput) {
      throw new TypeError("Component is not a text input", { cause: { custom_id, type: component.type } });
    }
    return component.value;
  }

  /**
   * Gets the selected values of a select menu component.
   *
   * @param custom_id The custom ID of the component.
   * @param required Whether to throw an error if the component is not found or not a select menu.
   * @returns The selected values, or null if not set and not required.
   */
  getSelectedValues(custom_id: string, required?: boolean): readonly string[] | null;
  getSelectedValues(custom_id: string, required: true): readonly string[];
  getSelectedValues(custom_id: string, required: boolean = false): readonly string[] | null {
    const component = this.getComponent(custom_id);
    if (!("values" in component)) {
      throw new TypeError("Component is not a select menu", { cause: { custom_id, type: component.type } });
    }
    return component.values;
  }

  /**
   * Gets the selected channels from a channel select menu.
   *
   * @param custom_id The custom ID of the component.
   * @param required Whether to throw an error if the component is not found or not a channel select.
   * @returns The selected channels, or null if not set and not required.
   */
  getSelectedChannels(custom_id: string, required?: boolean): Collection<string, APIInteractionDataResolvedChannel> | null;
  getSelectedChannels(custom_id: string, required: true): Collection<string, APIInteractionDataResolvedChannel>;
  getSelectedChannels(
    custom_id: string,
    required: boolean = false
  ): Collection<string, APIInteractionDataResolvedChannel> | null {
    const component = this.getComponent(custom_id);
    if (component.type !== ComponentType.ChannelSelect) {
      throw new TypeError("Component is not a channel select", { cause: { custom_id, type: component.type } });
    }
    const values = component.values;
    const channels = values.map((id) => this._resolved.channels?.get(id)).filter(Boolean) as APIInteractionDataResolvedChannel[];
    return channels.length > 0
      ? new Collection(channels.map((channel) => [channel.id, channel]))
      : required
        ? new Collection()
        : null;
  }

  /**
   * Gets the selected users from a user select menu.
   *
   * @param custom_id The custom ID of the component.
   * @param required Whether to throw an error if the component is not found or not a user select.
   * @returns The selected users, or null if not set and not required.
   */
  getSelectedUsers(custom_id: string, required?: boolean): Collection<string, APIUser> | null;
  getSelectedUsers(custom_id: string, required: true): Collection<string, APIUser>;
  getSelectedUsers(custom_id: string, required: boolean = false): Collection<string, APIUser> | null {
    const component = this.getComponent(custom_id);
    if (component.type !== ComponentType.UserSelect) {
      throw new TypeError("Component is not a user select", { cause: { custom_id, type: component.type } });
    }
    const values = component.values;
    const users = values.map((id) => this._resolved.users?.get(id)).filter(Boolean) as APIUser[];
    return users.length > 0 ? new Collection(users.map((user) => [user.id, user])) : required ? new Collection() : null;
  }

  /**
   * Gets the selected members from a user select menu (if in guild).
   *
   * @param custom_id The custom ID of the component.
   * @param required Whether to throw an error if the component is not found or not a user select.
   * @returns The selected members, or null if not set and not required.
   */
  getSelectedMembers(custom_id: string, required?: boolean): Collection<string, ResolvedSelectedGuildMember> | null;
  getSelectedMembers(custom_id: string, required: true): Collection<string, ResolvedSelectedGuildMember>;
  getSelectedMembers(custom_id: string, required: boolean = false): Collection<string, ResolvedSelectedGuildMember> | null {
    const component = this.getComponent(custom_id);
    if (component.type !== ComponentType.UserSelect) {
      throw new TypeError("Component is not a user select", { cause: { custom_id, type: component.type } });
    }
    const values = component.values;
    const members = values.map((id) => this._resolved.members?.get(id)).filter(Boolean) as ResolvedSelectedGuildMember[];
    return members.length > 0
      ? new Collection(members.map((member) => [member.user.id, member]))
      : required
        ? new Collection()
        : null;
  }

  /**
   * Gets the selected roles from a role select menu.
   *
   * @param custom_id The custom ID of the component.
   * @param required Whether to throw an error if the component is not found or not a role select.
   * @returns The selected roles, or null if not set and not required.
   */
  getSelectedRoles(custom_id: string, required?: boolean): Collection<string, APIRole> | null;
  getSelectedRoles(custom_id: string, required: true): Collection<string, APIRole>;
  getSelectedRoles(custom_id: string, required: boolean = false): Collection<string, APIRole> | null {
    const component = this.getComponent(custom_id);
    if (component.type !== ComponentType.RoleSelect) {
      throw new TypeError("Component is not a role select", { cause: { custom_id, type: component.type } });
    }
    const values = component.values;
    const roles = values.map((id) => this._resolved.roles?.get(id)).filter(Boolean) as APIRole[];
    return roles.length > 0 ? new Collection(roles.map((role) => [role.id, role])) : required ? new Collection() : null;
  }

  /**
   * Gets the selected mentionables from a mentionable select menu.
   *
   * @param custom_id The custom ID of the component.
   * @param required Whether to throw an error if the component is not found or not a mentionable select.
   * @returns The selected mentionables (users, members, or roles), or null if not set and not required.
   */
  getSelectedMentionables(custom_id: string, required?: boolean): (ResolvedSelectedGuildMember | APIUser | APIRole)[] | null;
  getSelectedMentionables(custom_id: string, required: true): (ResolvedSelectedGuildMember | APIUser | APIRole)[];
  getSelectedMentionables(
    custom_id: string,
    required: boolean = false
  ): (ResolvedSelectedGuildMember | APIUser | APIRole)[] | null {
    const component = this.getComponent(custom_id);
    if (component.type !== ComponentType.MentionableSelect) {
      throw new TypeError("Component is not a mentionable select", { cause: { custom_id, type: component.type } });
    }
    const values = component.values;
    const mentionables: (ResolvedSelectedGuildMember | APIUser | APIRole)[] = [];
    for (const id of values) {
      const member = this._resolved.members?.get(id);
      if (member) mentionables.push(member);
      else {
        const user = this._resolved.users?.get(id);
        if (user) mentionables.push(user);
        else {
          const role = this._resolved.roles?.get(id);
          if (role) mentionables.push(role);
        }
      }
    }
    return mentionables.length > 0 ? mentionables : required ? [] : null;
  }

  getRadioGroupValue(custom_id: string, required?: boolean): string | null;
  getRadioGroupValue(custom_id: string, required: true): string;
  getRadioGroupValue(custom_id: string, required?: boolean): string | null {
    const component = this.getComponent(custom_id);
    if (component.type !== ComponentType.RadioGroup) {
      throw new TypeError("Component is not a radio group", { cause: { custom_id, type: component.type } });
    }
    return component.value ?? (required ? "" : null);
  }

  getCheckboxGroupValues(custom_id: string, required?: boolean): string[] | null;
  getCheckboxGroupValues(custom_id: string, required: true): string[];
  getCheckboxGroupValues(custom_id: string, required?: boolean): string[] | null {
    const component = this.getComponent(custom_id);
    if (component.type !== ComponentType.CheckboxGroup) {
      throw new TypeError("Component is not a checkbox group", { cause: { custom_id, type: component.type } });
    }
    return component.values.length > 0 ? component.values : required ? [] : null;
  }

  getCheckboxValue(custom_id: string, required?: boolean): boolean | null;
  getCheckboxValue(custom_id: string, required: true): boolean;
  getCheckboxValue(custom_id: string, required?: boolean): boolean | null {
    const component = this.getComponent(custom_id);
    if (component.type !== ComponentType.Checkbox) {
      throw new TypeError("Component is not a checkbox", { cause: { custom_id, type: component.type } });
    }
    return component.value ?? (required ? false : null);
  }

  getAllComponents(): APIModalData[] {
    return this.hoistedComponents.map((component) => component);
  }
}
