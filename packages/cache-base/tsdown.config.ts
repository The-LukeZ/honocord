import { defineConfig } from "tsdown";

/**
 * Standardized build configuration for @honocord/cache-* packages.
 *
 * All cache adapters (cache-base, cache-memory, cache-mongo, cache-do) share this
 * configuration pattern to ensure consistent build outputs across the monorepo.
 *
 * Note: cache-do adds an additional `external: ["cloudflare:workers"]` setting
 * to mark its DurableObject dependency as external.
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
});
