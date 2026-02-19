import { defineCollection, z } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

export const collections = {
  docs: defineCollection({
    loader: docsLoader({
      generateId: ({ entry }) => entry.split(".").slice(0, -1).join("."),
    }),
    schema: docsSchema({
      extend: z.object({
        // Add a default value to the built-in `banner` field.
        banner: z.object({ content: z.string() }).default({
          content: "V2 has arrived! A lot has changed, so treat this as a fresh start.",
        }),
      }),
    }),
  }),
};
