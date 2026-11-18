import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  outDir: "dist",
  entry: {
    index: "src/index.ts",
    "cache/index": "src/cache/index.ts",
    "cache/memory/index": "src/cache/memory/index.ts",
    "cache/do/index": "src/cache/do/index.ts",
    "cache/mongo/index": "src/cache/mongo/index.ts",
  },
  // cloudflare:workers is provided by the Workers runtime; mongoose is an optional peer dependency.
  deps: { neverBundle: ["cloudflare:workers", "mongoose"] },
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
