// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { satteri } from "@astrojs/markdown-satteri";
import mermaid from "astro-mermaid";
import starlightLlmsTxt from "starlight-llms-txt";
import starlightContextualMenu from "starlight-contextual-menu";

// https://astro.build/config
export default defineConfig({
  // Explicit so Expressive Code uses its Satteri plugin (Astro 7 default processor).
  markdown: { processor: satteri() },

  trailingSlash: "ignore",

  site: "https://honocord.thelukez.com",

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
    "/examples": {
      destination: "https://github.com/The-LukeZ/honocord-examples",
      status: 302,
    },
  },
  integrations: [
    mermaid({ autoTheme: true, theme: "dark" }),
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
      sidebar: [
        {
          label: "Guides",
          items: [{ autogenerate: { directory: "guides" } }],
        },
        {
          label: "For LLMs",
          link: "/llms.txt",
        },
        {
          label: "Built With Honocord",
          slug: "built-with",
        },
        {
          label: "Reference",
          items: [
            { label: "Classes", items: [{ autogenerate: { directory: "reference/classes" } }] },
            { label: "Functions", items: [{ autogenerate: { directory: "reference/functions" } }] },
            { label: "Constants", items: [{ autogenerate: { directory: "reference/constants" } }] },
            { label: "Types", items: [{ autogenerate: { directory: "reference/types" } }] },
          ],
          collapsed: true,
        },
        {
          label: "Examples",
          link: "/examples",
        },
      ],
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
      expressiveCode: {
        // One dark theme for both modes: code blocks are always dark.
        themes: ["github-dark"],
        useStarlightDarkModeSwitch: false,
        useStarlightUiThemeColors: false,
        customizeTheme(theme) {
          // Flame for keywords, blurple for strings, types and functions.
          const swaps = { "#f97583": "#FF8C5A", "#9ecbff": "#A3ABFF", "#b392f0": "#A3ABFF" };
          for (const setting of theme.settings) {
            const color = setting.settings.foreground?.toLowerCase();
            if (color && swaps[color]) setting.settings.foreground = swaps[color];
          }
          return theme;
        },
        styleOverrides: {
          codeBackground: "var(--hc-code-bg)",
          borderRadius: "6px",
          borderColor: "transparent",
          codeFontFamily: "'JetBrains Mono', ui-monospace, monospace",
          uiFontFamily: "var(--sl-font)",
          frames: {
            editorTabBarBackground: "var(--hc-code-bg)",
            editorActiveTabBackground: "var(--hc-code-bg)",
            // Flat filename tab: no outlines or indicator bars.
            editorTabBarBorderColor: "transparent",
            editorTabBarBorderBottomColor: "#FFFFFF14",
            editorActiveTabBorderColor: "transparent",
            editorActiveTabIndicatorTopColor: "transparent",
            editorActiveTabIndicatorBottomColor: "transparent",
            editorActiveTabForeground: "#B5BAC1",
            terminalTitlebarBorderBottomColor: "#FFFFFF14",
            terminalTitlebarBackground: "var(--hc-code-bg)",
            terminalBackground: "var(--hc-code-bg)",
            frameBoxShadowCssValue: "none",
          },
        },
      },
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
