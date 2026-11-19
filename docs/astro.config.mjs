// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { redirects } from "./src/config/redirects.mjs";
import { sidebar } from "./src/config/sidebar.mjs";
import { satteri } from "@astrojs/markdown-satteri";
import starlightLlmsTxt from "starlight-llms-txt";
import starlightContextualMenu from "starlight-contextual-menu";

// https://astro.build/config
export default defineConfig({
  // Explicit so Expressive Code uses its Satteri plugin (Astro 7 default processor).
  markdown: { processor: satteri() },

  trailingSlash: "ignore",

  site: "https://honocord.thelukez.com",

  redirects,
  integrations: [
    starlight({
      plugins: [
        starlightLlmsTxt({
          projectName: "Honocord",
          promote: [
            "index*",
            "guides*",
            "reference/classes*",
            "reference/functions*",
            "reference/constants*",
            "reference/types*",
          ],
        }),
        starlightContextualMenu({
          actions: ["copy", "view", "claude", "chatgpt", "lechat"],
        }),
      ],
      title: "Honocord Docs",
      description: "Documentation for Honocord — Imagine a Discord HTTP interactions bot for Hono",
      favicon: "/favicon.ico",
      logo: {
        src: "./src/assets/logo.svg",
        alt: "Honocord",
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
      sidebar,
      customCss: [
        "@fontsource/instrument-sans/400.css",
        "@fontsource/instrument-sans/600.css",
        "@fontsource/instrument-sans/700.css",
        "@fontsource/jetbrains-mono/400.css",
        "./src/styles/tokens.css",
        "./src/styles/global.css",
        "./src/styles/components.css",
      ],
      credits: true,
      // Expressive Code options live in ec.config.mjs (needed by the <Code> component).
      expressiveCode: true,
      pagefind: true,
      editLink: { baseUrl: "https://github.com/The-LukeZ/honocord/tree/main/docs" },
      lastUpdated: true,
      prerender: true,
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 4,
      },
      components: {
        Head: "./src/components/overrides/Head.astro",
        MarkdownContent: "./src/components/overrides/MarkdownContent.astro",
        PageTitle: "./src/components/overrides/PageTitle.astro",
        ThemeProvider: "./src/components/overrides/ThemeProvider.astro",
        ThemeSelect: "./src/components/overrides/ThemeSelect.astro",
      },
      head: [
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "https://honocord.thelukez.com/og.png",
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
