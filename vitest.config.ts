import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@utils": resolve(__dirname, "src/utils"),
      "@ctx": resolve(__dirname, "src/interactions"),
      "@resolvers": resolve(__dirname, "src/resolvers"),
      "@handlers": resolve(__dirname, "src/handlers"),
      $types: resolve(__dirname, "src/types"),
    },
  },
  test: {
    environment: "node",
  },
});
