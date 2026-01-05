import { describe, it, expect } from "vitest";
import { AutocompleteHelper } from "./Autocomplete";
import type { APIUser } from "discord-api-types/v10";

describe("AutocompleteHelper", () => {
  it("manages choices via addChoices, setChoices and clear", () => {
    const helper = new AutocompleteHelper<string>("x");
    expect(helper.choices).toHaveLength(0);

    helper.addChoices({ name: "One", value: "1" }, { name: "Two", value: "2" });
    expect(helper.choices).toHaveLength(2);

    helper.setChoices({ name: "Three", value: "3" });
    expect(helper.choices).toHaveLength(1);
    expect(helper.choices[0].name).toBe("Three");

    helper.clear();
    expect(helper.choices).toHaveLength(0);
  });

  it("filters by name when filterFields includes 'name' (case-insensitive)", () => {
    const helper = new AutocompleteHelper<string>("CHO");
    helper.addChoices({ name: "Choice One", value: "choice_1" }, { name: "Another", value: "choice_2" });

    const byName = helper.response(["name"]);
    expect(byName).toHaveLength(1);
    expect(byName[0].name).toBe("Choice One");
  });

  it("filters by value when filterFields includes 'value' (case-insensitive)", () => {
    const helper = new AutocompleteHelper<string>("choice_2");
    helper.addChoices({ name: "Choice One", value: "choice_1" }, { name: "Another", value: "CHOICE_2" });

    const byValue = helper.response(["value"]);
    expect(byValue).toHaveLength(1);
    expect(byValue[0].value).toBe("CHOICE_2");
  });

  it("when no user locale is provided, response() (no filterFields) returns all choices regardless of match (current behavior)", () => {
    const helper = new AutocompleteHelper<string>("nomatch");
    helper.addChoices({ name: "Alpha", value: "a" }, { name: "Beta", value: "b" });

    // Due to implementation, when userLocale is undefined the fallback branch returns true,
    // causing response() with default filterFields to include all choices.
    const res = helper.response();
    expect(res).toHaveLength(2);
  });

  it("uses localized name for matching when user locale is provided and localization exists", () => {
    const user = { locale: "es-ES" } as APIUser;
    const helper = new AutocompleteHelper<string>("hola", user);
    helper.addChoices(
      { name: "Hello", value: "h1", name_localizations: { "es-ES": "Hola amigo" } },
      { name: "Hello2", value: "h2", name_localizations: { "es-ES": "Adios" } }
    );

    const res = helper.response();
    expect(res).toHaveLength(1);
    expect(res[0].name_localizations?.["es-ES"]).toContain("Hola");
  });

  it("filterFields including 'name_localizations' only matches when localization exists for user locale", () => {
    const user = { locale: "fr" } as APIUser;
    const helper = new AutocompleteHelper<string>("bonjour", user);
    helper.addChoices(
      { name: "Hi", value: "1", name_localizations: { fr: "Bonjour tout le monde" } },
      { name: "Hi2", value: "2" } // no localization
    );

    const res = helper.response(["name_localizations"]);
    expect(res).toHaveLength(1);
    expect(res[0].name_localizations?.fr).toContain("Bonjour");
  });

  it("matches numeric values correctly when filtering by 'value'", () => {
    const helper = new AutocompleteHelper<number>(99);
    helper.addChoices({ name: "Ninety nine", value: 99 }, { name: "Hundred", value: 100 });

    const res = helper.response(["value"]);
    expect(res).toHaveLength(1);
    expect(res[0].value).toBe(99);
  });
});
