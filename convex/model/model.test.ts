import { describe, expect, test } from "vitest";
import { components } from "../_generated/api";
import { createTestContext } from "../test.setup";
import { isAuthenticated } from "./auth";
import type { AuthUser } from "./auth";

const ONE_HOUR_MS = 3600000;

type TestAuthUser = NonNullable<AuthUser>;

function createMockUser(overrides: Partial<TestAuthUser> = {}): TestAuthUser {
	const now = Date.now();
	return {
		_id: "test-user-id" as TestAuthUser["_id"],
		_creationTime: now,
		name: "Test User",
		email: "test@example.com",
		emailVerified: true,
		createdAt: now,
		updatedAt: now,
		...overrides,
	};
}

describe("Auth Model", () => {
	describe("isAuthenticated", () => {
		test("returns false for undefined user", () => {
			const result = isAuthenticated(undefined);

			expect(result).toBe(false);
		});

		test("returns true for valid user object", () => {
			const mockUser = createMockUser();

			const result = isAuthenticated(mockUser);

			expect(result).toBe(true);
		});

		test("type narrows user when true", () => {
			const maybeUser: AuthUser = createMockUser({ _id: "user123" as TestAuthUser["_id"] });

			if (isAuthenticated(maybeUser)) {
				expect(maybeUser._id).toBe("user123");
				expect(maybeUser.email).toBe("test@example.com");
			}
		});
	});

	describe("getAuthenticatedUser (via t.run with component data)", () => {
		test("returns null when no identity provided", async () => {
			const t = createTestContext();

			const result = await t.run(async (ctx) => {
				const { getAuthenticatedUser } = await import("./auth");
				return await getAuthenticatedUser(ctx);
			});

			expect(result).toBeNull();
		});

		test("returns user when valid session exists in component", async () => {
			const t = createTestContext();
			const now = Date.now();
			const validExpiresAt = now + ONE_HOUR_MS;

			const user = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "user",
					data: {
						name: "Auth Model User",
						email: "authmodel@example.com",
						emailVerified: true,
						createdAt: now,
						updatedAt: now,
					},
				},
			});

			const session = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "session",
					data: {
						userId: user._id,
						token: "auth-model-token",
						expiresAt: validExpiresAt,
						createdAt: now,
						updatedAt: now,
					},
				},
			});

			const asUser = t.withIdentity({
				subject: user._id,
				sessionId: session._id,
			});

			const result = await asUser.run(async (ctx) => {
				const { getAuthenticatedUser } = await import("./auth");
				return await getAuthenticatedUser(ctx);
			});

			expect(result).not.toBeNull();
			expect(result?._id).toBe(user._id);
			expect(result?.email).toBe("authmodel@example.com");
		});
	});
});

describe("Organizations Model", () => {
	describe("getUserOrganizations", () => {
		test("returns null user and empty orgs when no identity provided", async () => {
			const t = createTestContext();

			const result = await t.run(async (ctx) => {
				const { getUserOrganizations } = await import("./organizations");
				return await getUserOrganizations(ctx);
			});

			expect(result.user).toBeNull();
			expect(result.organizations).toEqual([]);
		});

		test("returns user with empty orgs when user has no memberships", async () => {
			const t = createTestContext();
			const now = Date.now();
			const validExpiresAt = now + ONE_HOUR_MS;

			const user = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "user",
					data: {
						name: "No Orgs User",
						email: "noorgs@example.com",
						emailVerified: true,
						createdAt: now,
						updatedAt: now,
					},
				},
			});

			const session = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "session",
					data: {
						userId: user._id,
						token: "noorgs-token",
						expiresAt: validExpiresAt,
						createdAt: now,
						updatedAt: now,
					},
				},
			});

			const asUser = t.withIdentity({
				subject: user._id,
				sessionId: session._id,
			});

			const result = await asUser.run(async (ctx) => {
				const { getUserOrganizations } = await import("./organizations");
				return await getUserOrganizations(ctx);
			});

			expect(result.user).not.toBeNull();
			expect(result.user?._id).toBe(user._id);
			expect(result.organizations).toEqual([]);
		});

		test("returns user with organizations when user has memberships", async () => {
			const t = createTestContext();
			const now = Date.now();
			const validExpiresAt = now + ONE_HOUR_MS;

			const user = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "user",
					data: {
						name: "Orgs User",
						email: "orgsuser@example.com",
						emailVerified: true,
						createdAt: now,
						updatedAt: now,
					},
				},
			});

			const session = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "session",
					data: {
						userId: user._id,
						token: "orgs-token",
						expiresAt: validExpiresAt,
						createdAt: now,
						updatedAt: now,
					},
				},
			});

			const org = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "organization",
					data: {
						name: "Model Test Org",
						slug: "model-test-org",
						createdAt: now,
					},
				},
			});

			await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "member",
					data: {
						userId: user._id,
						organizationId: org._id,
						role: "owner",
						createdAt: now,
					},
				},
			});

			const asUser = t.withIdentity({
				subject: user._id,
				sessionId: session._id,
			});

			const result = await asUser.run(async (ctx) => {
				const { getUserOrganizations } = await import("./organizations");
				return await getUserOrganizations(ctx);
			});

			expect(result.user).not.toBeNull();
			expect(result.organizations).toHaveLength(1);
			expect(result.organizations[0]).toMatchObject({
				id: org._id,
				name: "Model Test Org",
				slug: "model-test-org",
			});
		});
	});

	describe("hasUserOrganizations", () => {
		test("returns false when no identity provided", async () => {
			const t = createTestContext();

			const result = await t.run(async (ctx) => {
				const { hasUserOrganizations } = await import("./organizations");
				return await hasUserOrganizations(ctx);
			});

			expect(result).toBe(false);
		});

		test("returns false when user has no memberships", async () => {
			const t = createTestContext();
			const now = Date.now();
			const validExpiresAt = now + ONE_HOUR_MS;

			const user = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "user",
					data: {
						name: "Has No Orgs",
						email: "hasnoorgs@example.com",
						emailVerified: true,
						createdAt: now,
						updatedAt: now,
					},
				},
			});

			const session = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "session",
					data: {
						userId: user._id,
						token: "hasnoorgs-token",
						expiresAt: validExpiresAt,
						createdAt: now,
						updatedAt: now,
					},
				},
			});

			const asUser = t.withIdentity({
				subject: user._id,
				sessionId: session._id,
			});

			const result = await asUser.run(async (ctx) => {
				const { hasUserOrganizations } = await import("./organizations");
				return await hasUserOrganizations(ctx);
			});

			expect(result).toBe(false);
		});

		test("returns true when user has at least one membership", async () => {
			const t = createTestContext();
			const now = Date.now();
			const validExpiresAt = now + ONE_HOUR_MS;

			const user = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "user",
					data: {
						name: "Has Orgs",
						email: "hasorgs@example.com",
						emailVerified: true,
						createdAt: now,
						updatedAt: now,
					},
				},
			});

			const session = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "session",
					data: {
						userId: user._id,
						token: "hasorgs-token",
						expiresAt: validExpiresAt,
						createdAt: now,
						updatedAt: now,
					},
				},
			});

			const org = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "organization",
					data: {
						name: "Has Orgs Test",
						slug: "has-orgs-test",
						createdAt: now,
					},
				},
			});

			await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "member",
					data: {
						userId: user._id,
						organizationId: org._id,
						role: "member",
						createdAt: now,
					},
				},
			});

			const asUser = t.withIdentity({
				subject: user._id,
				sessionId: session._id,
			});

			const result = await asUser.run(async (ctx) => {
				const { hasUserOrganizations } = await import("./organizations");
				return await hasUserOrganizations(ctx);
			});

			expect(result).toBe(true);
		});
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
});
