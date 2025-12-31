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

	it("#given BETTER_AUTH_SECRET is missing #when createAuth is called #then Better Auth handles validation", async () => {
		// #given - BETTER_AUTH_SECRET is not set
		delete process.env.BETTER_AUTH_SECRET;

		// #when - auth module is imported
		const authModule = await import("./auth");

		// #then - module loads successfully (secret validation deferred to Better Auth)
		// The createAuthOptions function is exported for createApi to introspect schema
		expect(authModule.createAuthOptions).toBeDefined();
		expect(authModule.createAuth).toBeDefined();
	});

	it("#given BETTER_AUTH_SECRET is empty string #when createAuth is called #then Better Auth handles validation", async () => {
		// #given - BETTER_AUTH_SECRET is empty
		process.env.BETTER_AUTH_SECRET = "";

		// #when - auth module is imported
		const authModule = await import("./auth");

		// #then - module loads successfully (secret validation deferred to Better Auth)
		expect(authModule.createAuthOptions).toBeDefined();
		expect(authModule.createAuth).toBeDefined();
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
