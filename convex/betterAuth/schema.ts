/**
 * Better Auth Schema for Local Install with Organization Plugin
 *
 * Based on:
 * - https://github.com/get-convex/better-auth/blob/main/src/component/schema.ts
 * - https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/plugins/organization/schema.ts
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const tables = {
	user: defineTable({
		name: v.string(),
		email: v.string(),
		emailVerified: v.boolean(),
		image: v.optional(v.union(v.null(), v.string())),
		createdAt: v.number(),
		updatedAt: v.number(),
		twoFactorEnabled: v.optional(v.union(v.null(), v.boolean())),
		isAnonymous: v.optional(v.union(v.null(), v.boolean())),
		username: v.optional(v.union(v.null(), v.string())),
		displayUsername: v.optional(v.union(v.null(), v.string())),
		phoneNumber: v.optional(v.union(v.null(), v.string())),
		phoneNumberVerified: v.optional(v.union(v.null(), v.boolean())),
		userId: v.optional(v.union(v.null(), v.string())),
	})
		.index("email_name", ["email", "name"])
		.index("name", ["name"])
		.index("userId", ["userId"])
		.index("username", ["username"])
		.index("phoneNumber", ["phoneNumber"]),

	session: defineTable({
		expiresAt: v.number(),
		token: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
		ipAddress: v.optional(v.union(v.null(), v.string())),
		userAgent: v.optional(v.union(v.null(), v.string())),
		userId: v.string(),
		activeOrganizationId: v.optional(v.union(v.null(), v.string())),
	})
		.index("expiresAt", ["expiresAt"])
		.index("expiresAt_userId", ["expiresAt", "userId"])
		.index("token", ["token"])
		.index("userId", ["userId"]),

	account: defineTable({
		accountId: v.string(),
		providerId: v.string(),
		userId: v.string(),
		accessToken: v.optional(v.union(v.null(), v.string())),
		refreshToken: v.optional(v.union(v.null(), v.string())),
		idToken: v.optional(v.union(v.null(), v.string())),
		accessTokenExpiresAt: v.optional(v.union(v.null(), v.number())),
		refreshTokenExpiresAt: v.optional(v.union(v.null(), v.number())),
		scope: v.optional(v.union(v.null(), v.string())),
		password: v.optional(v.union(v.null(), v.string())),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("accountId", ["accountId"])
		.index("accountId_providerId", ["accountId", "providerId"])
		.index("providerId_userId", ["providerId", "userId"])
		.index("userId", ["userId"]),

	verification: defineTable({
		identifier: v.string(),
		value: v.string(),
		expiresAt: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("expiresAt", ["expiresAt"])
		.index("identifier", ["identifier"]),

	organization: defineTable({
		name: v.string(),
		slug: v.string(),
		logo: v.optional(v.union(v.null(), v.string())),
		metadata: v.optional(v.union(v.null(), v.string())),
		createdAt: v.number(),
		updatedAt: v.optional(v.union(v.null(), v.number())),
	})
		.index("slug", ["slug"])
		.index("name", ["name"]),

	member: defineTable({
		organizationId: v.string(),
		userId: v.string(),
		role: v.string(),
		createdAt: v.number(),
	})
		.index("organizationId", ["organizationId"])
		.index("userId", ["userId"])
		.index("organizationId_userId", ["organizationId", "userId"]),

	invitation: defineTable({
		organizationId: v.string(),
		email: v.string(),
		role: v.string(),
		status: v.string(),
		expiresAt: v.number(),
		createdAt: v.number(),
		inviterId: v.string(),
	})
		.index("organizationId", ["organizationId"])
		.index("email", ["email"])
		.index("status", ["status"])
		.index("organizationId_email", ["organizationId", "email"]),

	twoFactor: defineTable({
		secret: v.string(),
		backupCodes: v.string(),
		userId: v.string(),
	}).index("userId", ["userId"]),

	passkey: defineTable({
		name: v.optional(v.union(v.null(), v.string())),
		publicKey: v.string(),
		userId: v.string(),
		credentialID: v.string(),
		counter: v.number(),
		deviceType: v.string(),
		backedUp: v.boolean(),
		transports: v.optional(v.union(v.null(), v.string())),
		createdAt: v.optional(v.union(v.null(), v.number())),
		aaguid: v.optional(v.union(v.null(), v.string())),
	})
		.index("credentialID", ["credentialID"])
		.index("userId", ["userId"]),

	jwks: defineTable({
		publicKey: v.string(),
		privateKey: v.string(),
		createdAt: v.number(),
	}),

	rateLimit: defineTable({
		key: v.optional(v.union(v.null(), v.string())),
		count: v.optional(v.union(v.null(), v.number())),
		lastRequest: v.optional(v.union(v.null(), v.number())),
	}).index("key", ["key"]),
};

const schema = defineSchema(tables);

export default schema;
