import { afterEach, beforeEach, describe, expect, it } from "bun:test";

describe("Environment Validation", () => {
	const originalEnv = { ...process.env };

	const validateEnv = () => {
		const required = ["NEXT_PUBLIC_CONVEX_URL", "NEXT_PUBLIC_CONVEX_SITE_URL"] as const;
		const missing = required.filter((key) => !process.env[key]);
		if (missing.length > 0) {
			throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
		}
		return {
			NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL as string,
			NEXT_PUBLIC_CONVEX_SITE_URL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL as string,
		};
	};

	beforeEach(() => {
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("#given required env vars are missing #when validateEnv called #then throws descriptive error", () => {
		// #given - required env vars are not set
		delete process.env.NEXT_PUBLIC_CONVEX_URL;
		delete process.env.NEXT_PUBLIC_CONVEX_SITE_URL;

		// #when/#then - validation should throw
		expect(validateEnv).toThrow("Missing required environment variables");
	});

	it("#given partial env vars are set #when validateEnv called #then throws listing missing vars", () => {
		// #given - only one env var is set
		process.env.NEXT_PUBLIC_CONVEX_URL = "http://localhost:3210";
		delete process.env.NEXT_PUBLIC_CONVEX_SITE_URL;

		// #when/#then - validation should throw mentioning the missing var
		expect(validateEnv).toThrow("NEXT_PUBLIC_CONVEX_SITE_URL");
	});

	it("#given all required env vars are set #when validateEnv called #then returns validated config", () => {
		// #given - all required env vars are set
		process.env.NEXT_PUBLIC_CONVEX_URL = "http://localhost:3210";
		process.env.NEXT_PUBLIC_CONVEX_SITE_URL = "http://localhost:3211";

		// #when - validation runs
		const env = validateEnv();

		// #then - should return validated config
		expect(env.NEXT_PUBLIC_CONVEX_URL).toBe("http://localhost:3210");
		expect(env.NEXT_PUBLIC_CONVEX_SITE_URL).toBe("http://localhost:3211");
	});
});
