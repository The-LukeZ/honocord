import { defineConfig } from "tsdown";

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
