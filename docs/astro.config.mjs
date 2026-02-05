// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightCatppuccin from "@catppuccin/starlight";

// https://astro.build/config
export default defineConfig({
  trailingSlash: "ignore",
  redirects: {
    "/github": {
      destination: "https://github.com/The-LukeZ/honocord",
      status: 302,
    },
    "/discord": {
      destination: "https://discord.gg/X4DjpZj6Nz", // this is unique
      status: 302,
    },
    "/lukez": {
      destination: "https://thelukez.com",
      status: 302,
    },
    "/npm": {
      destination: "https://www.npmjs.com/package/honocord",
      status: 302,
    },
  },
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
          icon: "npm",
          label: "NPM",
          href: "/npm",
        },
        {
          icon: "github",
          label: "GitHub",
          href: "/github",
        },
        {
          icon: "discord",
          label: "Discord",
          href: "/discord",
        },
      ],
      sidebar: [
        {
          label: "Guides",
          autogenerate: { directory: "guides" },
        },
        {
          label: "Reference",
          items: [
            { label: "Classes", autogenerate: { directory: "reference/classes" } },
            { label: "Functions", autogenerate: { directory: "reference/functions" } },
            { label: "Constants", autogenerate: { directory: "reference/constants" } },
            { label: "Types", autogenerate: { directory: "reference/types" } },
          ],
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
        Head: "./src/components/overrides/Head.astro",
      },
      head: [
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "https://honocord.thelukez.com/favicon.svg",
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "twitter:card",
            content: "-", // Reset because of SEO issues
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "theme-color",
            content: "#FF3300",
          },
        },
      ],
    }),
  ],
});
