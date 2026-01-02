import { beforeAll, describe, expect, test } from "vitest";

describe("Auth Model", () => {
	beforeAll(() => {
		process.env.BETTER_AUTH_SECRET = "test-secret-at-least-32-characters-long";
	});

	describe("Module Exports", () => {
		test("exports getAuthenticatedUser function", async () => {
			const authModel = await import("./auth");

			expect(authModel.getAuthenticatedUser).toBeDefined();
			expect(typeof authModel.getAuthenticatedUser).toBe("function");
		});

		test("exports isAuthenticated function", async () => {
			const authModel = await import("./auth");

			expect(authModel.isAuthenticated).toBeDefined();
			expect(typeof authModel.isAuthenticated).toBe("function");
		});

		test("exports expected keys", async () => {
			const authModel = await import("./auth");

			expect(Object.keys(authModel)).toContain("getAuthenticatedUser");
			expect(Object.keys(authModel)).toContain("isAuthenticated");
		});
	});

	describe("isAuthenticated", () => {
		test("returns false for null user", async () => {
			const { isAuthenticated } = await import("./auth");

			const result = isAuthenticated(null as never);

			expect(result).toBe(false);
		});

		test("returns true for valid user object", async () => {
			const { isAuthenticated } = await import("./auth");
			const mockUser = { _id: "user123", email: "test@example.com" };

			const result = isAuthenticated(mockUser as never);

			expect(result).toBe(true);
		});

		test("returns true for undefined (function only checks for null)", async () => {
			const { isAuthenticated } = await import("./auth");

			const result = isAuthenticated(undefined as never);

			expect(result).toBe(true);
		});

		test("returns true for user with minimal fields", async () => {
			const { isAuthenticated } = await import("./auth");
			const mockUser = { _id: "user123" };

			const result = isAuthenticated(mockUser as never);

			expect(result).toBe(true);
		});
	});
});

describe("Organizations Model", () => {
	beforeAll(() => {
		process.env.BETTER_AUTH_SECRET = "test-secret-at-least-32-characters-long";
	});

	describe("Module Exports", () => {
		test("exports getUserOrganizations function", async () => {
			const orgsModel = await import("./organizations");

			expect(orgsModel.getUserOrganizations).toBeDefined();
			expect(typeof orgsModel.getUserOrganizations).toBe("function");
		});

		test("exports hasUserOrganizations function", async () => {
			const orgsModel = await import("./organizations");

			expect(orgsModel.hasUserOrganizations).toBeDefined();
			expect(typeof orgsModel.hasUserOrganizations).toBe("function");
		});
	});

	describe("Type Exports", () => {
		test("module loads successfully with expected function exports", async () => {
			const orgsModel = await import("./organizations");

			expect(Object.keys(orgsModel)).toContain("getUserOrganizations");
			expect(Object.keys(orgsModel)).toContain("hasUserOrganizations");
		});
	});
});
