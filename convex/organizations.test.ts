import { describe, expect, test } from "vitest";
import { api, components } from "./_generated/api";
import { createTestContext } from "./test.setup";

const ONE_HOUR_MS = 3600000;

describe("Organizations Module", () => {
	describe("hasOrganizations query", () => {
		test("returns false when no identity is provided", async () => {
			const t = createTestContext();

			const result = await t.query(api.organizations.hasOrganizations);

			expect(result).toBe(false);
		});

		test("returns false when user has no organization memberships", async () => {
			const t = createTestContext();
			const now = Date.now();
			const validExpiresAt = now + ONE_HOUR_MS;

			const user = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "user",
					data: {
						name: "No Org User",
						email: "noorg@example.com",
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
						token: "noorg-token",
						expiresAt: validExpiresAt,
						createdAt: now,
						updatedAt: now,
					},
				},
			});

			const asNoOrgUser = t.withIdentity({
				subject: user._id,
				sessionId: session._id,
			});

			const result = await asNoOrgUser.query(api.organizations.hasOrganizations);

			expect(result).toBe(false);
		});

		test("returns true when user has at least one organization membership", async () => {
			const t = createTestContext();
			const now = Date.now();
			const validExpiresAt = now + ONE_HOUR_MS;

			const user = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "user",
					data: {
						name: "Org User",
						email: "orguser@example.com",
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
						token: "org-token",
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
						name: "Test Org",
						slug: "test-org",
						createdAt: now,
					},
				},
			});

			await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "member",
					data: {
						organizationId: org._id,
						userId: user._id,
						role: "owner",
						createdAt: now,
					},
				},
			});

			const asOrgUser = t.withIdentity({
				subject: user._id,
				sessionId: session._id,
			});

			const result = await asOrgUser.query(api.organizations.hasOrganizations);

			expect(result).toBe(true);
		});
	});

	describe("listUserOrganizations query", () => {
		test("returns empty array when no identity is provided", async () => {
			const t = createTestContext();

			const result = await t.query(api.organizations.listUserOrganizations);

			expect(result).toEqual([]);
		});

		test("returns empty array when user has no organization memberships", async () => {
			const t = createTestContext();
			const now = Date.now();
			const validExpiresAt = now + ONE_HOUR_MS;

			const user = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "user",
					data: {
						name: "No Org User",
						email: "noorg2@example.com",
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
						token: "noorg2-token",
						expiresAt: validExpiresAt,
						createdAt: now,
						updatedAt: now,
					},
				},
			});

			const asNoOrgUser = t.withIdentity({
				subject: user._id,
				sessionId: session._id,
			});

			const result = await asNoOrgUser.query(api.organizations.listUserOrganizations);

			expect(result).toEqual([]);
		});

		test("returns organizations when user is a member", async () => {
			const t = createTestContext();
			const now = Date.now();
			const validExpiresAt = now + ONE_HOUR_MS;

			const user = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "user",
					data: {
						name: "Member User",
						email: "member@example.com",
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
						token: "member-token",
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
						name: "Member Org",
						slug: "member-org",
						createdAt: now,
					},
				},
			});

			await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "member",
					data: {
						organizationId: org._id,
						userId: user._id,
						role: "member",
						createdAt: now,
					},
				},
			});

			const asMemberUser = t.withIdentity({
				subject: user._id,
				sessionId: session._id,
			});

			const result = await asMemberUser.query(api.organizations.listUserOrganizations);

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				id: org._id,
				name: "Member Org",
				slug: "member-org",
			});
		});

		test("returns multiple organizations when user has multiple memberships", async () => {
			const t = createTestContext();
			const now = Date.now();
			const validExpiresAt = now + ONE_HOUR_MS;

			const user = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "user",
					data: {
						name: "Multi Org User",
						email: "multiorg@example.com",
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
						token: "multiorg-token",
						expiresAt: validExpiresAt,
						createdAt: now,
						updatedAt: now,
					},
				},
			});

			const org1 = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "organization",
					data: {
						name: "Org One",
						slug: "org-one",
						createdAt: now,
					},
				},
			});

			const org2 = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "organization",
					data: {
						name: "Org Two",
						slug: "org-two",
						createdAt: now + 1,
					},
				},
			});

			await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "member",
					data: {
						organizationId: org1._id,
						userId: user._id,
						role: "owner",
						createdAt: now,
					},
				},
			});

			await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "member",
					data: {
						organizationId: org2._id,
						userId: user._id,
						role: "member",
						createdAt: now,
					},
				},
			});

			const asMultiOrgUser = t.withIdentity({
				subject: user._id,
				sessionId: session._id,
			});

			const result = await asMultiOrgUser.query(api.organizations.listUserOrganizations);

			expect(result).toHaveLength(2);
			const orgNames = result.map((o: { name: string }) => o.name);
			expect(orgNames).toContain("Org One");
			expect(orgNames).toContain("Org Two");
		});

		test("does not return organizations where user is not a member", async () => {
			const t = createTestContext();
			const now = Date.now();
			const validExpiresAt = now + ONE_HOUR_MS;

			const user = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "user",
					data: {
						name: "Selective User",
						email: "selective@example.com",
						emailVerified: true,
						createdAt: now,
						updatedAt: now,
					},
				},
			});

			const otherUser = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "user",
					data: {
						name: "Other User",
						email: "other@example.com",
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
						token: "selective-token",
						expiresAt: validExpiresAt,
						createdAt: now,
						updatedAt: now,
					},
				},
			});

			const myOrg = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "organization",
					data: {
						name: "My Org",
						slug: "my-org",
						createdAt: now,
					},
				},
			});

			const notMyOrg = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "organization",
					data: {
						name: "Not My Org",
						slug: "not-my-org",
						createdAt: now,
					},
				},
			});

			await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "member",
					data: {
						organizationId: myOrg._id,
						userId: user._id,
						role: "owner",
						createdAt: now,
					},
				},
			});

			await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "member",
					data: {
						organizationId: notMyOrg._id,
						userId: otherUser._id,
						role: "owner",
						createdAt: now,
					},
				},
			});

			const asSelectiveUser = t.withIdentity({
				subject: user._id,
				sessionId: session._id,
			});

			const result = await asSelectiveUser.query(api.organizations.listUserOrganizations);

			expect(result).toHaveLength(1);
			expect(result[0]?.name).toBe("My Org");
		});
	});

	describe("Module Exports", () => {
		test("exports hasOrganizations query", async () => {
			const orgsModule = await import("./organizations");

			expect(orgsModule.hasOrganizations).toBeDefined();
		});

		test("exports listUserOrganizations query", async () => {
			const orgsModule = await import("./organizations");

			expect(orgsModule.listUserOrganizations).toBeDefined();
		});
	});
});
