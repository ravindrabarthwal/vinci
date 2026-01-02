import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

describe("Auth Module", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("Environment Handling", () => {
		test("loads module when BETTER_AUTH_SECRET is missing (validation deferred to Better Auth)", async () => {
			delete process.env.BETTER_AUTH_SECRET;

			const authModule = await import("./auth");

			expect(authModule.createAuthOptions).toBeDefined();
			expect(authModule.createAuth).toBeDefined();
		});

		test("loads module when BETTER_AUTH_SECRET is empty string", async () => {
			process.env.BETTER_AUTH_SECRET = "";

			const authModule = await import("./auth");

			expect(authModule.createAuthOptions).toBeDefined();
			expect(authModule.createAuth).toBeDefined();
		});

		test("loads module when BETTER_AUTH_SECRET is properly set", async () => {
			process.env.BETTER_AUTH_SECRET = "test-secret-at-least-32-characters-long";

			const authModule = await import("./auth");

			expect(authModule.createAuth).toBeDefined();
			expect(typeof authModule.createAuth).toBe("function");
		});
	});

	describe("Module Exports", () => {
		beforeEach(() => {
			process.env.BETTER_AUTH_SECRET = "test-secret-at-least-32-characters-long";
		});

		test("exports createAuth function", async () => {
			const authModule = await import("./auth");

			expect(authModule.createAuth).toBeDefined();
			expect(typeof authModule.createAuth).toBe("function");
		});

		test("exports createAuthOptions function", async () => {
			const authModule = await import("./auth");

			expect(authModule.createAuthOptions).toBeDefined();
			expect(typeof authModule.createAuthOptions).toBe("function");
		});
	});
});
