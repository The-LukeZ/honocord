import libPkg from "honocord/package.json" with { type: "json" };
import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { docsmith } from "svelte-docsmith/vite";
import { defineConfig } from "vite";
import { builtWith } from "./plugins/built-with.ts";
import { SITE_URL } from "./src/site.ts";

export default defineConfig({
  plugins: [
    builtWith(),
    docsmith({
      site: {
        title: "Honocord",
        description: "Build an HTTP interactions Discord bot with Hono. Runs on Cloudflare Workers, Bun and Node.js.",
        url: SITE_URL,
        github: "https://github.com/The-LukeZ/honocord",
        editUrl: "https://github.com/The-LukeZ/honocord/edit/main/docs",
        version: libPkg.version,
        logo: "/logo.svg",
        ogImage: "/og.png",
        // Every doc page's own OG image, served by src/routes/og/[...slug].png.
        ogImages: "/og",
        announcement: {
          tag: "v4",
          text: "Honocord v4 has arrived. Read the migration guide.",
          href: "/docs/migrating-to-v4",
        },
        nav: [
          { label: "Guides", href: "/docs/getting-started" },
          { label: "Reference", href: "/reference" },
          { label: "Changelog", href: "/changelog" },
          { label: "Discord", href: "https://discord.gg/X4DjpZj6Nz", external: true },
        ],
        footer: {
          copyright: "MIT licensed. Made by LukeZ.",
          columns: [
            {
              title: "Docs",
              links: [
                { label: "Getting started", href: "/docs/getting-started" },
                { label: "Reference", href: "/reference" },
                { label: "Changelog", href: "/changelog" },
              ],
            },
            {
              title: "Community",
              links: [
                { label: "Discord", href: "https://discord.gg/X4DjpZj6Nz", external: true },
                { label: "GitHub", href: "https://github.com/The-LukeZ/honocord", external: true },
                { label: "npm", href: "https://www.npmjs.com/package/honocord", external: true },
                { label: "Examples", href: "https://github.com/The-LukeZ/honocord-examples", external: true },
              ],
            },
          ],
        },
      },
      theme: "./src/theme.css",
      // Scan every route: the guides live under /docs, the API reference under /reference.
      content: "src/routes",
      // The package's changesets CHANGELOG.md feeds the /changelog page and the /changelog.xml feed.
      changelog: { file: "../CHANGELOG.md" },
      // Short links to other sites in doc pages. static/_redirects answers them (Cloudflare Pages) before the app does.
      links: { outside: ["/github", "/discord", "/npm", "/examples", "/lukez"] },
    }),
    tailwindcss(),
    sveltekit({
      extensions: [".svelte", ".md"],
      preprocess: [vitePreprocess()],
      // Every route prerenders into `build`. Cloudflare Pages serves 404.html (with status 404) for an unknown path.
      adapter: adapter({ fallback: "404.html" }),
    }),
  ],
  // Prebundling svelte-docsmith inlines its fallback modules, which throw without the plugin, instead of the virtual
  // modules docsmith() serves.
  optimizeDeps: { exclude: ["svelte-docsmith"] },
});
