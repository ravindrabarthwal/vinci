import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Auth Environment Validation", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("#given BETTER_AUTH_SECRET is missing #when auth module loads #then throws descriptive error", async () => {
		// #given - BETTER_AUTH_SECRET is not set
		delete process.env.BETTER_AUTH_SECRET;

		// #when - auth module is imported
		// #then - should throw with helpful error message
		await expect(async () => {
			await import("./auth");
		}).rejects.toThrow("BETTER_AUTH_SECRET is required");
	});

	it("#given BETTER_AUTH_SECRET is empty string #when auth module loads #then throws descriptive error", async () => {
		// #given - BETTER_AUTH_SECRET is empty
		process.env.BETTER_AUTH_SECRET = "";

		// #when - auth module is imported
		// #then - should throw with helpful error message
		await expect(async () => {
			await import("./auth");
		}).rejects.toThrow("BETTER_AUTH_SECRET is required");
	});

	it("#given BETTER_AUTH_SECRET is set #when auth module loads #then exports createAuth function", async () => {
		// #given - BETTER_AUTH_SECRET is properly set
		process.env.BETTER_AUTH_SECRET = "test-secret-at-least-32-characters-long";

		// #when - auth module is imported
		const authModule = await import("./auth");

		// #then - should export createAuth function
		expect(authModule.createAuth).toBeDefined();
		expect(typeof authModule.createAuth).toBe("function");
	});
});
