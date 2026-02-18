import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  outDir: "dist",
  entry: {
    index: "src/index.ts",
    // "memory-cache": "src/memory-cache/index.ts",
    // "mongo-cache": "src/mongo-cache/index.ts",
  },
  alias: {
    "@utils": "src/utils",
    "@ctx": "src/interactions",
    "@resolvers": "src/resolvers",
    $types: "src/types",
    "@handlers": "src/handlers",
  },
  sourcemap: true,
  dts: true,
  format: ["esm", "cjs"],
  minify: false,
});
