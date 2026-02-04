// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightCatppuccin from "@catppuccin/starlight";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightCatppuccin({
          dark: {
            flavor: "mocha",
            accent: "sapphire",
          },
          light: {
            flavor: "latte",
            accent: "sapphire",
          },
        }),
      ],
      title: "Honocord Docs",
      description: "Documentation for Honocord — Imagine a Discord HTTP interactions bot for Hono",
      logo: {
        src: "./public/logo.png",
        alt: "Honocord Logo",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/The-LukeZ/honocord",
        },
        {
          icon: "discord",
          label: "Discord",
          href: "https://discord.gg/X4DjpZj6Nz", // this is unique
        },
      ],
      sidebar: [
        {
          label: "Guides",
          autogenerate: { directory: "guides" },
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
      ],
      customCss: [
        "@fontsource/poppins/400.css",
        "@fontsource/poppins/500.css",
        "@fontsource/poppins/600.css",
        "@fontsource/poppins/700.css",
        "./src/styles/global.css",
      ],
      credits: true,
      expressiveCode: true,
      pagefind: true,
      editLink: { baseUrl: "https://github.com/The-LukeZ/honocord/tree/main/docs/src/content" },
      lastUpdated: true,
      prerender: true,
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 4,
      },
      components: {
        MarkdownContent: "./src/components/overrides/MarkdownContent.astro",
      },
      head: [
        {
          tag: "script",
          attrs: {
            src: "/src/scripts/utils.js",
          },
        },
      ],
    }),
  ],
});
