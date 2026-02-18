import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  outDir: "dist",
  entry: {
    index: "src/index.ts",
  },
  alias: {
    "@utils": "src/utils",
    "@ctx": "src/interactions",
    "@resolvers": "src/resolvers",
    $types: "src/types",
    "@handlers": "src/handlers",
  },
  sourcemap: true,
  dts: { build: true },
  format: ["esm", "cjs"],
  minify: false,
});
