// Short links to external sites. Used by astro.config.mjs and by the link
// hook in Head.astro, which opens them in a new tab like other external links.
// @ts-check
/** @type {NonNullable<import("astro").AstroUserConfig["redirects"]>} */
export const redirects = {
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
};
