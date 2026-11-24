---
title: Working with Modals
description: How to work with Modals in Honocord
section: Building your bot
order: 14
---

<script>
  import { Callout, Card, TabItem, Tabs } from "svelte-docsmith";
</script>

Modals can be sent when the interaction is a modal-capable interaction - a slash or context command, or a message component interaction.

## Sending a Modal

To send a modal, you can use the `interaction.showModal()` method. This method takes either a `ModalBuilder` instance or a raw `ModalInteractionResponseCallbackData` object.

<Callout variant="note">
  If you wanna send the new checkbox, checkbox-group and radio-group components, you **need** to use the raw object instead of the
  builder, as the builders from `@discordjs/builders` do not support these components yet. However receiving the data from these
  components works just fine.
</Callout>

<Tabs>

<TabItem value="builder" label="ModalBuilder">

```ts
import { ModalBuilder, LabelBuilder, TextInputStyle } from "honocord";

const modal = new ModalBuilder()
  .setCustomId("my-modal")
  .setTitle("My Modal")
  .addLabelComponents(
    new LabelBuilder()
      .setLabel("Name")
      .setDescription("Enter your name")
      .setTextInputComponent((tiBuilder) => tiBuilder.setCustomId("name").setStyle(TextInputStyle.Short).setRequired(true))
  );

interaction.showModal(modal);
```

</TabItem>

<TabItem value="raw" label="Raw Object">

```ts
import type { ModalInteractionResponseCallbackData } from "honocord";

const modalData: ModalInteractionResponseCallbackData = {
  title: "Test Modal",
  custom_id: "test_modal",
  components: [
    {
      type: ComponentType.Label,
      label: "This is a label",
      component: {
        type: ComponentType.Checkbox,
        custom_id: "checkbox_1",
      },
    },
    {
      type: ComponentType.Label,
      label: "This is a text input",
      component: {
        type: ComponentType.CheckboxGroup,
        custom_id: "checkbox_group_1",
        options: [
          {
            label: "Option 1",
            description: "This is option 1",
            value: "option_1",
          },
          {
            label: "Option 2",
            value: "option_2",
          },
        ],
      },
    },
    {
      type: ComponentType.Label,
      label: "This is a select menu",
      component: {
        type: ComponentType.RadioGroup,
        custom_id: "radio_group_1",
        options: [
          {
            label: "Option A",
            description: "This is option A",
            value: "option_a",
          },
          {
            label: "Option B",
            value: "option_b",
          },
        ],
      },
    },
  ],
};

interaction.showModal(modalData);
```

<Card title="Full Component Reference by Discord" href="https://docs.discord.com/developers/components/reference" external>Check out the full component reference by Discord for more details on the available components and their properties.</Card>

</TabItem>

</Tabs>
