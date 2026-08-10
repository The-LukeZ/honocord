import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@utils": resolve(import.meta.dirname, "src/utils"),
      "@ctx": resolve(import.meta.dirname, "src/interactions"),
      "@resolvers": resolve(import.meta.dirname, "src/resolvers"),
      "@handlers": resolve(import.meta.dirname, "src/handlers"),
      $types: resolve(import.meta.dirname, "src/types"),
    },
  },
  test: {
    environment: "node",
  },
});
