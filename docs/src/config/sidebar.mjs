// Sidebar, grouped by what the reader is trying to do. Guide URLs stay under
// /guides/; only the grouping lives here. A new guide must be added to a
// group below: `pnpm check:sidebar` fails until it is.
export const sidebar = [
  {
    label: "Start here",
    items: [
      "guides/getting-started",
      "guides/quickstart",
      { slug: "guides/discord-js-differences", label: "Coming from discord.js" },
      "guides/migrating-to-v4",
    ],
  },
  {
    label: "Building your bot",
    items: [
      "guides/handlers",
      "guides/typings",
      "guides/dynamic-commands",
      "guides/custom-id-system",
      { slug: "guides/modals", label: "Modals" },
      "guides/sending-files",
      "guides/webhook-events",
    ],
  },
  {
    label: "Going further",
    items: ["guides/caching", { slug: "guides/beta", label: "Beta features" }],
  },
  {
    label: "Deployment",
    items: ["guides/cloudflare-workers", { slug: "guides/cloudflare-tunnel", label: "Local development with Cloudflare Tunnel" }],
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
    label: "Resources",
    items: [
      { label: "Examples", link: "/examples" },
      { label: "Built with Honocord", slug: "built-with" },
      { label: "For LLMs", link: "/llms.txt" },
    ],
  },
];
