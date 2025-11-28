import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "edge-runtime",
    include: ["convex/**/*.test.ts"],
    exclude: ["convex/_generated/**"],
    root: ".",
    server: {
      deps: {
        inline: ["convex-test"],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "convex/_generated/**",
        "convex/**/*.config.ts",
        "convex/testSetup.ts",
        "convex/testUtils.ts",
      ],
    },
  },
});
