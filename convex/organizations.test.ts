import { beforeAll, describe, expect, test } from "vitest";

describe("Organizations Module", () => {
	beforeAll(() => {
		process.env.BETTER_AUTH_SECRET = "test-secret-at-least-32-characters-long";
	});

	describe("Query Exports", () => {
		test("exports hasOrganizations query", async () => {
			const orgsModule = await import("./organizations");

			expect(orgsModule.hasOrganizations).toBeDefined();
		});

		test("exports listUserOrganizations query", async () => {
			const orgsModule = await import("./organizations");

			expect(orgsModule.listUserOrganizations).toBeDefined();
		});
	});

	describe("Query Types", () => {
		test("hasOrganizations is a function (Convex query wrapper)", async () => {
			const { hasOrganizations } = await import("./organizations");

			expect(typeof hasOrganizations).toBe("function");
		});

		test("listUserOrganizations is a function (Convex query wrapper)", async () => {
			const { listUserOrganizations } = await import("./organizations");

			expect(typeof listUserOrganizations).toBe("function");
		});
	});
});
