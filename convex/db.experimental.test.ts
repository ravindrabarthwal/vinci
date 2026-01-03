import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./betterAuth/schema";
import { modules } from "./test.setup";

describe("Database Operations (convex-test pattern demo)", () => {
	test("direct database insert and query via t.run", async () => {
		const t = convexTest(schema, modules);

		await t.run(async (ctx) => {
			await ctx.db.insert("user", {
				name: "Test User",
				email: "test@example.com",
				emailVerified: true,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		const users = await t.run(async (ctx) => {
			return await ctx.db.query("user").collect();
		});

		expect(users).toHaveLength(1);
		expect(users[0]).toMatchObject({
			name: "Test User",
			email: "test@example.com",
			emailVerified: true,
		});
	});

	test("organization table insert and query via t.run", async () => {
		const t = convexTest(schema, modules);
		const now = Date.now();

		const orgId = await t.run(async (ctx) => {
			return await ctx.db.insert("organization", {
				name: "Acme Corp",
				slug: "acme-corp",
				createdAt: now,
			});
		});

		expect(orgId).toBeDefined();

		const org = await t.run(async (ctx) => {
			return await ctx.db.get(orgId);
		});

		expect(org).toMatchObject({
			name: "Acme Corp",
			slug: "acme-corp",
		});
	});

	test("user-organization membership via t.run", async () => {
		const t = convexTest(schema, modules);
		const now = Date.now();

		const { userId, orgId } = await t.run(async (ctx) => {
			const userId = await ctx.db.insert("user", {
				name: "Member User",
				email: "member@example.com",
				emailVerified: true,
				createdAt: now,
				updatedAt: now,
			});

			const orgId = await ctx.db.insert("organization", {
				name: "Test Org",
				slug: "test-org",
				createdAt: now,
			});

			await ctx.db.insert("member", {
				userId: userId,
				organizationId: orgId,
				role: "admin",
				createdAt: now,
			});

			return { userId, orgId };
		});

		const memberships = await t.run(async (ctx) => {
			return await ctx.db
				.query("member")
				.withIndex("userId", (q) => q.eq("userId", userId))
				.collect();
		});

		expect(memberships).toHaveLength(1);
		expect(memberships[0]).toMatchObject({
			role: "admin",
			organizationId: orgId,
		});
	});

	test("authenticated context with t.withIdentity", async () => {
		const t = convexTest(schema, modules);

		const asSarah = t.withIdentity({ name: "Sarah" });

		const identity = await asSarah.run(async (ctx) => {
			return await ctx.auth.getUserIdentity();
		});

		expect(identity).not.toBeNull();
		expect(identity?.name).toBe("Sarah");
		expect(identity?.tokenIdentifier).toBeTypeOf("string");
	});

	test("multiple users with isolated data via t.withIdentity", async () => {
		const t = convexTest(schema, modules);
		const now = Date.now();

		const asSarah = t.withIdentity({ name: "Sarah", subject: "sarah-id" });
		const asLee = t.withIdentity({ name: "Lee", subject: "lee-id" });

		await asSarah.run(async (ctx) => {
			const identity = await ctx.auth.getUserIdentity();
			if (!identity?.name || !identity.subject) {
				throw new Error("Identity missing required fields");
			}
			await ctx.db.insert("user", {
				name: identity.name,
				email: "sarah@example.com",
				emailVerified: true,
				userId: identity.subject,
				createdAt: now,
				updatedAt: now,
			});
		});

		await asLee.run(async (ctx) => {
			const identity = await ctx.auth.getUserIdentity();
			if (!identity?.name || !identity.subject) {
				throw new Error("Identity missing required fields");
			}
			await ctx.db.insert("user", {
				name: identity.name,
				email: "lee@example.com",
				emailVerified: true,
				userId: identity.subject,
				createdAt: now,
				updatedAt: now,
			});
		});

		const sarahUser = await t.run(async (ctx) => {
			return await ctx.db
				.query("user")
				.withIndex("userId", (q) => q.eq("userId", "sarah-id"))
				.unique();
		});

		const leeUser = await t.run(async (ctx) => {
			return await ctx.db
				.query("user")
				.withIndex("userId", (q) => q.eq("userId", "lee-id"))
				.unique();
		});

		expect(sarahUser).toMatchObject({ name: "Sarah" });
		expect(leeUser).toMatchObject({ name: "Lee" });
	});

	test("schema validation rejects invalid data", async () => {
		const t = convexTest(schema, modules);

		await expect(async () => {
			await t.run(async (ctx) => {
				await ctx.db.insert("user", {
					name: 123,
					email: "invalid",
					emailVerified: "not-boolean",
					createdAt: "not-number",
					updatedAt: "not-number",
				} as never);
			});
		}).rejects.toThrow();
	});
});
