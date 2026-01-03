import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000";
const authFile = path.join(__dirname, "e2e/.auth/user.json");

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? "github" : "html",
	timeout: 30000,
	expect: {
		timeout: 10000,
	},
	use: {
		baseURL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "setup",
			testMatch: /.*\.setup\.ts/,
			use: { ...devices["Desktop Chrome"] },
			timeout: 120000,
		},
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				storageState: authFile,
			},
			dependencies: ["setup"],
			testIgnore: /.*\.setup\.ts/,
		},
	],
	webServer: {
		command: process.env.CI ? "bun run dev:all:ci" : "bun run dev:all",
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 180000,
		stdout: "pipe",
		stderr: "pipe",
		env: {
			CONVEX_AGENT_MODE: process.env.CI ? "anonymous" : "",
		},
	},
});
