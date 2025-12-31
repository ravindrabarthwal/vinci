import { beforeAll, describe, expect, it } from "vitest";

describe("Auth Model", () => {
	beforeAll(() => {
		process.env.BETTER_AUTH_SECRET = "test-secret-at-least-32-characters-long";
	});

	describe("Module Exports", () => {
		it("#given model/auth module #when imported #then exports getAuthenticatedUser", async () => {
			// #given - model/auth module exists
			// #when - module is imported
			const authModel = await import("./auth");

			// #then - should export getAuthenticatedUser
			expect(authModel.getAuthenticatedUser).toBeDefined();
			expect(typeof authModel.getAuthenticatedUser).toBe("function");
		});

		it("#given model/auth module #when imported #then exports isAuthenticated", async () => {
			// #given - model/auth module exists
			// #when - module is imported
			const authModel = await import("./auth");

			// #then - should export isAuthenticated
			expect(authModel.isAuthenticated).toBeDefined();
			expect(typeof authModel.isAuthenticated).toBe("function");
		});

		it("#given model/auth module #when imported #then exports AuthUser type", async () => {
			// #given - model/auth module exists
			// #when - module is imported (type exports don't show at runtime but module should load)
			const authModel = await import("./auth");

			// #then - module loaded successfully with expected exports
			expect(Object.keys(authModel)).toContain("getAuthenticatedUser");
			expect(Object.keys(authModel)).toContain("isAuthenticated");
		});
	});

	describe("isAuthenticated", () => {
		it("#given null user #when isAuthenticated called #then returns false", async () => {
			// #given - null user (getAuthUser returns null when not authenticated)
			const { isAuthenticated } = await import("./auth");

			// #when - check authentication
			const result = isAuthenticated(null as never);

			// #then - returns false
			expect(result).toBe(false);
		});

		it("#given user object #when isAuthenticated called #then returns true", async () => {
			// #given - mock user object
			const { isAuthenticated } = await import("./auth");
			const mockUser = { _id: "user123", email: "test@example.com" };

			// #when - check authentication
			const result = isAuthenticated(mockUser as never);

			// #then - returns true
			expect(result).toBe(true);
		});
	});
});

describe("Organizations Model", () => {
	beforeAll(() => {
		process.env.BETTER_AUTH_SECRET = "test-secret-at-least-32-characters-long";
	});

	describe("Module Exports", () => {
		it("#given model/organizations module #when imported #then exports getUserOrganizations", async () => {
			// #given - model/organizations module exists
			// #when - module is imported
			const orgsModel = await import("./organizations");

			// #then - should export getUserOrganizations
			expect(orgsModel.getUserOrganizations).toBeDefined();
			expect(typeof orgsModel.getUserOrganizations).toBe("function");
		});

		it("#given model/organizations module #when imported #then exports hasUserOrganizations", async () => {
			// #given - model/organizations module exists
			// #when - module is imported
			const orgsModel = await import("./organizations");

			// #then - should export hasUserOrganizations
			expect(orgsModel.hasUserOrganizations).toBeDefined();
			expect(typeof orgsModel.hasUserOrganizations).toBe("function");
		});
	});

	describe("Type Exports", () => {
		it("#given model/organizations module #when imported #then module loads successfully", async () => {
			// #given - model/organizations module exists
			// #when - module is imported
			const orgsModel = await import("./organizations");

			// #then - has expected function exports
			expect(Object.keys(orgsModel)).toContain("getUserOrganizations");
			expect(Object.keys(orgsModel)).toContain("hasUserOrganizations");
		});
	});
});
