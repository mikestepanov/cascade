import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node", // Key difference from frontend config - Convex needs Node.js environment
		include: ["convex/**/*.test.ts"],
		exclude: ["convex/_generated/**"],
		root: ".",
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"convex/_generated/**",
				"convex/**/*.config.ts",
				"convex/testSetup.ts",
				"convex/test-utils.ts",
			],
		},
	},
});
