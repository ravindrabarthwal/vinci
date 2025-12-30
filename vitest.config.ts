import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["convex/**/*.test.ts"],
		environment: "edge-runtime",
		server: {
			deps: {
				inline: ["convex-test"],
			},
		},
		setupFiles: ["./convex/test.setup.ts"],
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
});
