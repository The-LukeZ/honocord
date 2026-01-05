import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  alias: {
    "@utils": "src/utils",
    "@ctx": "src/interactions",
    "@resolvers": "src/resolvers",
  },
});
