import { defineConfig } from "tsdown";

/**
 * Shared configuration for cache adapters.
 * Matches the pattern defined in ../../tsdown.base.config.ts
 */
export default defineConfig({
  clean: true,
  outDir: "dist",
  entry: {
    index: "src/index.ts",
  },
  sourcemap: true,
  dts: { build: true },
  format: ["esm", "cjs"],
  minify: false,
  external: ["cloudflare:workers"], // DurableObject is can be seen as peer dependency that is mandatory for using this adapter, but the userto provide this.
});
