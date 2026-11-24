/** @type {import("prettier").Config} */
const config = {
  printWidth: 130,
  useTabs: false,
  semi: true,
  tabWidth: 2,
  endOfLine: "lf",
  trailingComma: "es5",
  singleQuote: false,
  // The Tailwind plugin has to come last, after the plugins whose parsers it extends.
  plugins: ["prettier-plugin-svelte", "prettier-plugin-tailwindcss"],
  overrides: [{ files: "*.svelte", options: { parser: "svelte" } }],
  // Tailwind v4 has no config file: class order comes from the docs site's stylesheet.
  tailwindStylesheet: "./docs/src/app.css",
};

export default config;
