import { describe, expect, test } from "vitest";
import { api, components } from "./_generated/api";
import { createTestContext } from "./test.setup";

/**
 * Future edge case to consider:
 * - Testing `getCurrentUser` when session exists but user was deleted (orphaned session)
 *   This scenario would test how the system handles data inconsistencies.
 */

const ONE_SECOND_MS = 1000;
const ONE_HOUR_MS = 3600000;

describe("Auth Module", () => {
	describe("getCurrentUser query", () => {
		test("returns null when no identity is provided", async () => {
			const t = createTestContext();

			const result = await t.query(api.auth.getCurrentUser);

			expect(result).toBeNull();
		});

		test("returns null when identity exists but no matching session in component", async () => {
			const t = createTestContext();

			const asUnknown = t.withIdentity({
				subject: "non-existent-user-id",
				sessionId: "non-existent-session-id",
			});

			const result = await asUnknown.query(api.auth.getCurrentUser);

			expect(result).toBeNull();
		});

		test("returns null when session exists but is expired", async () => {
			const t = createTestContext();
			const now = Date.now();
			const expiredAt = now - ONE_SECOND_MS;

			const user = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "user",
					data: {
						name: "Expired User",
						email: "expired@example.com",
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
						token: "expired-token",
						expiresAt: expiredAt,
						createdAt: now - ONE_HOUR_MS,
						updatedAt: now - ONE_HOUR_MS,
					},
				},
			});

			const asExpiredUser = t.withIdentity({
				subject: user._id,
				sessionId: session._id,
			});

			const result = await asExpiredUser.query(api.auth.getCurrentUser);

			expect(result).toBeNull();
		});

		test("returns user when valid session and user exist", async () => {
			const t = createTestContext();
			const now = Date.now();
			const validExpiresAt = now + ONE_HOUR_MS;

			const user = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "user",
					data: {
						name: "Valid User",
						email: "valid@example.com",
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
						token: "valid-token",
						expiresAt: validExpiresAt,
						createdAt: now,
						updatedAt: now,
					},
				},
			});

			const asValidUser = t.withIdentity({
				subject: user._id,
				sessionId: session._id,
			});

			const result = await asValidUser.query(api.auth.getCurrentUser);

			expect(result).not.toBeNull();
			expect(result).toMatchObject({
				_id: user._id,
				name: "Valid User",
				email: "valid@example.com",
				emailVerified: true,
			});
		});

		test("returns user with all optional fields populated", async () => {
			const t = createTestContext();
			const now = Date.now();
			const validExpiresAt = now + ONE_HOUR_MS;

			const user = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "user",
					data: {
						name: "Full User",
						email: "full@example.com",
						emailVerified: true,
						image: "https://example.com/avatar.png",
						username: "fulluser",
						displayUsername: "FullUser",
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
						token: "full-token",
						expiresAt: validExpiresAt,
						createdAt: now,
						updatedAt: now,
						ipAddress: "127.0.0.1",
						userAgent: "Test Agent",
					},
				},
			});

			const asFullUser = t.withIdentity({
				subject: user._id,
				sessionId: session._id,
			});

			const result = await asFullUser.query(api.auth.getCurrentUser);

			expect(result).toMatchObject({
				name: "Full User",
				email: "full@example.com",
				emailVerified: true,
				image: "https://example.com/avatar.png",
				username: "fulluser",
				displayUsername: "FullUser",
			});
		});
	});

	describe("Module Exports", () => {
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

		test("exports authComponent", async () => {
			const authModule = await import("./auth");

			expect(authModule.authComponent).toBeDefined();
		});
	});
});
