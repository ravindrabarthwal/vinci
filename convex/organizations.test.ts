import { beforeAll, describe, expect, it } from "vitest";

describe("Organizations Module", () => {
	beforeAll(() => {
		process.env.BETTER_AUTH_SECRET = "test-secret-at-least-32-characters-long";
	});

	describe("Query Exports", () => {
		it("#given organizations module #when imported #then exports hasOrganizations query", async () => {
			// #given - organizations module exists
			// #when - module is imported
			const orgsModule = await import("./organizations");

			// #then - should export hasOrganizations
			expect(orgsModule.hasOrganizations).toBeDefined();
		});

		it("#given organizations module #when imported #then exports listUserOrganizations query", async () => {
			// #given - organizations module exists
			// #when - module is imported
			const orgsModule = await import("./organizations");

			// #then - should export listUserOrganizations
			expect(orgsModule.listUserOrganizations).toBeDefined();
		});
	});

	describe("Query Types", () => {
		it("#given hasOrganizations #when checked #then is a function (Convex query wrapper)", async () => {
			// #given - hasOrganizations export
			const { hasOrganizations } = await import("./organizations");

			// #when - we check its type
			// #then - should be a function (Convex wraps queries as callable)
			expect(typeof hasOrganizations).toBe("function");
		});

		it("#given listUserOrganizations #when checked #then is a function (Convex query wrapper)", async () => {
			// #given - listUserOrganizations export
			const { listUserOrganizations } = await import("./organizations");

			// #when - we check its type
			// #then - should be a function (Convex wraps queries as callable)
			expect(typeof listUserOrganizations).toBe("function");
		});
	});
});
