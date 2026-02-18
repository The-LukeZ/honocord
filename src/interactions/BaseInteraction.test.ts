import { describe, it, expect } from "vitest";
import {
  InteractionType,
  ApplicationCommandType,
  ButtonStyle,
  ComponentType,
  type APIChatInputApplicationCommandInteraction,
  Locale,
} from "discord-api-types/v10";
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from "@discordjs/builders";
import { API } from "@discordjs/core/http-only";
import { REST } from "@discordjs/rest";
import { BaseInteraction } from "./BaseInteraction";
import { AttachmentBuilder } from "../structures/AttachmentBuilder";
import type { BaseInteractionContext, InteractionResponseCallbackData } from "$types/index";

// ── Minimal stub data ────────────────────────────────────────────────────────

const MINIMAL_INTERACTION: APIChatInputApplicationCommandInteraction = {
  id: "1",
  application_id: "2",
  token: "tok",
  version: 1,
  type: InteractionType.ApplicationCommand,
  locale: Locale.EnglishUS,
  entitlements: [],
  authorizing_integration_owners: {},
  context: undefined as any,
  data: {
    id: "3",
    name: "test",
    type: ApplicationCommandType.ChatInput,
    options: [],
  },
  channel_id: "4",
  channel: { id: "4", type: 0 } as any,
  app_permissions: "0",
  attachment_size_limit: 8_000_000, // 8 MB
};

// ── Testable subclass ────────────────────────────────────────────────────────

class TestInteraction extends BaseInteraction<InteractionType.ApplicationCommand> {
  /** Expose the protected method for unit-testing */
  public prepare(options: InteractionResponseCallbackData) {
    return this.prepareResponsePayload(options);
  }
}

function makeInteraction(): TestInteraction {
  const rest = new REST({ version: "10" });
  const api = new API(rest);
  const context = {} as BaseInteractionContext;
  return new TestInteraction(api, MINIMAL_INTERACTION as any, context);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("prepareResponsePayload", () => {
  it("passes plain content through as-is", () => {
    const ix = makeInteraction();
    const { body, files } = ix.prepare({ content: "Hello!" });

    expect(body.content).toBe("Hello!");
    expect(files).toHaveLength(0);
  });

  it("serialises JSONEncodable components (ActionRowBuilder)", () => {
    const ix = makeInteraction();
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("btn").setLabel("Click").setStyle(ButtonStyle.Primary)
    );

    const { body } = ix.prepare({ content: "Hi", components: [row] });

    expect(body.components).toBeDefined();
    expect(body.components).toHaveLength(1);
    // The ActionRow should be serialised to a plain object, not the builder instance
    expect(typeof body.components![0]).toBe("object");
    expect((body.components![0] as any).type).toBe(ComponentType.ActionRow);
  });

  it("passes raw component objects through without double-wrapping", () => {
    const ix = makeInteraction();
    const rawRow = {
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.Button,
          custom_id: "btn",
          label: "Click",
          style: ButtonStyle.Primary,
        },
      ],
    } as any;

    const { body } = ix.prepare({ content: "Hi", components: [rawRow] });

    expect(body.components).toHaveLength(1);
    expect((body.components![0] as any).type).toBe(ComponentType.ActionRow);
  });

  it("serialises JSONEncodable embeds (EmbedBuilder)", () => {
    const ix = makeInteraction();
    const embed = new EmbedBuilder().setTitle("Test").setDescription("Hello embed");

    const { body } = ix.prepare({ embeds: [embed] });

    expect(body.embeds).toBeDefined();
    expect(body.embeds).toHaveLength(1);
    expect((body.embeds![0] as any).title).toBe("Test");
    expect((body.embeds![0] as any).description).toBe("Hello embed");
  });

  it("omits components key when components array is empty", () => {
    const ix = makeInteraction();
    const { body } = ix.prepare({ content: "Hi", components: [] });

    expect(body.components).toBeUndefined();
  });

  it("omits embeds key when embeds array is empty", () => {
    const ix = makeInteraction();
    const { body } = ix.prepare({ content: "Hi", embeds: [] });

    expect(body.embeds).toBeUndefined();
  });

  it("resolves AttachmentBuilder into files and attachments", () => {
    const ix = makeInteraction();
    const builder = new AttachmentBuilder(Buffer.from("data"), { name: "test.txt" });

    const { body, files } = ix.prepare({ content: "With file", files: [builder] });

    expect(files).toHaveLength(1);
    expect(files[0].name).toBe("test.txt");
    expect(body.attachments).toHaveLength(1);
    expect((body.attachments![0] as any).filename).toBe("test.txt");
    // files key must be stripped from the body
    expect((body as any).files).toBeUndefined();
  });

  it("passes RawFile instances directly into files array", () => {
    const ix = makeInteraction();
    const raw = { name: "raw.txt", data: Buffer.from("raw") };

    const { body, files } = ix.prepare({ content: "Raw file", files: [raw] });

    expect(files).toHaveLength(1);
    expect(files[0].name).toBe("raw.txt");
    // No attachments metadata for raw files
    expect(body.attachments).toBeUndefined();
  });

  it("mixes AttachmentBuilders and RawFiles correctly", () => {
    const ix = makeInteraction();
    const builder = new AttachmentBuilder(Buffer.from("a"), { name: "a.png" });
    const raw = { name: "b.txt", data: Buffer.from("b") };

    const { body, files } = ix.prepare({ files: [builder, raw] });

    expect(files).toHaveLength(2);
    // Only the builder produces an attachments[] entry
    expect(body.attachments).toHaveLength(1);
    expect((body.attachments![0] as any).filename).toBe("a.png");
  });

  it("converts camelCase option keys to snake_case", () => {
    const ix = makeInteraction();
    // allowedMentions → allowed_mentions
    const { body } = ix.prepare({
      content: "hi",
      allowed_mentions: { parse: [] },
    });

    expect((body as any).allowed_mentions).toBeDefined();
    expect((body as any).allowedMentions).toBeUndefined();
  });

  it("content + components do not produce an empty-message error payload", () => {
    const ix = makeInteraction();
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("confirm").setLabel("Confirm").setStyle(ButtonStyle.Primary)
    );

    const { body } = ix.prepare({ content: "Hello, world! 👋", components: [row] });

    // Both fields must reach the payload so Discord accepts the message
    expect(body.content).toBe("Hello, world! 👋");
    expect(body.components).toHaveLength(1);
  });
});
