import { APIApplicationCommandOptionChoice, APIUser, Locale } from "discord-api-types/v10";

/**
 * Represents an autocomplete response for Discord API application commands.
 * Manages a collection of command option choices and filters them based on user input.
 *
 * **IMPORTANT:** If you use this class, you HAVE to set the type for the generic parameter `T`.
 * Like `AutocompleteHelper<string>()` or `AutocompleteHelper<number>()`.
 *
 * This is because Typescript cannot infer the type of `T` from the constructor argument `value` somehow.
 *
 * @template T - The type of choice values, must be either `string` or `number`.
 *
 * @example
 * ```typescript
 * const helper = new AutocompleteHelper('choice', user)
 *     .addChoices(
 *       { name: 'Choice One', value: 'choice_1' },
 *       { name: 'Choice Two', value: 'choice_2' }
 *     );
 * const filteredByName = helper.response(['name']);
 * const filteredByValue = helper.response(['value']);
 * const filteredByAll = helper.response();
 * ```
 */
export class AutocompleteHelper<T extends string | number = string | number> {
  private _choices = Array<APIApplicationCommandOptionChoice<T>>();
  private value: T;
  private userLocale?: Locale;

  constructor(value: T, user?: APIUser) {
    this.value = (typeof value === "string" ? value.toLowerCase() : value) as T;
    this.userLocale = user?.locale as Locale | undefined;
  }

  get choices() {
    return this._choices;
  }

  addChoices(...choices: APIApplicationCommandOptionChoice<T>[]) {
    this._choices.push(...choices);
    return this;
  }

  setChoices(...choices: APIApplicationCommandOptionChoice<T>[]) {
    this._choices = choices;
    return this;
  }

  clear() {
    this._choices = [];
    return this;
  }

  private stringifyLowercase(str: string | number): string {
    return typeof str === "string" ? str.toLowerCase() : String(str).toLowerCase();
  }

  private choiceMatchesValue(
    choice: APIApplicationCommandOptionChoice<T>,
    filterFields: (keyof APIApplicationCommandOptionChoice<T>)[]
  ) {
    if (filterFields.length === 0) {
      return (
        this.stringifyLowercase(choice.name).includes(this.value as string) ||
        this.stringifyLowercase(choice.value).includes(this.value as string) ||
        (this.userLocale && choice.name_localizations?.[this.userLocale]
          ? !!this.stringifyLowercase(choice.name_localizations[this.userLocale] as string).includes(this.value as string)
          : true)
      );
    } else {
      return filterFields.some((fieldname) => {
        if (fieldname === "name_localizations" && this.userLocale && choice.name_localizations?.[this.userLocale]) {
          return !!this.stringifyLowercase(choice.name_localizations[this.userLocale] as string).includes(this.value as string);
        } else if (fieldname === "name_localizations") {
          return false;
        } else {
          return this.stringifyLowercase(choice[fieldname]).includes(this.value as string);
        }
      });
    }
  }

  /**
   * Filters choices based on the value provided in the constructor.
   *
   * @param filterFields An array of fields to filter by. Defaults to an empty array.
   * @returns An array of filtered choices.
   *
   * If `filterFields` is omitted, it will be filtered by all fields.
   */
  response(filterFields: (keyof APIApplicationCommandOptionChoice<T>)[] = []) {
    return this._choices.filter((choice) => this.choiceMatchesValue(choice, filterFields));
  }
}
