import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Product Management Tables (Issue #27)
// These tables are in the root schema (not betterAuth component) so they can be
// accessed via ctx.db in regular Convex queries/mutations.

export default defineSchema({
	product: defineTable({
		organizationId: v.string(), // References organization._id (stored as string)
		name: v.string(),
		description: v.optional(v.union(v.null(), v.string())),
		criticality: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
		owners: v.array(v.string()), // References user._id (stored as string)
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_organizationId", ["organizationId"])
		.index("by_organizationId_and_name", ["organizationId", "name"]),

	surface: defineTable({
		productId: v.id("product"),
		organizationId: v.string(), // Denormalized for authorization
		name: v.string(),
		type: v.union(
			v.literal("repo"),
			v.literal("service"),
			v.literal("webapp"),
			v.literal("worker"),
			v.literal("infra"),
		),
		location: v.optional(v.union(v.null(), v.string())),
		environments: v.object({
			dev: v.optional(v.string()),
			test: v.optional(v.string()),
			staging: v.optional(v.string()),
			prod: v.optional(v.string()),
		}),
		externalId: v.optional(v.union(v.null(), v.string())),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_productId", ["productId"])
		.index("by_organizationId", ["organizationId"]),

	feature: defineTable({
		productId: v.id("product"),
		organizationId: v.string(), // Denormalized for authorization
		title: v.string(),
		description: v.optional(v.union(v.null(), v.string())),
		acceptanceCriteria: v.array(v.string()),
		source: v.union(v.literal("manual"), v.literal("jira")),
		sourceKey: v.optional(v.union(v.null(), v.string())),
		status: v.union(
			v.literal("draft"),
			v.literal("ready"),
			v.literal("in_progress"),
			v.literal("completed"),
		),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_productId", ["productId"])
		.index("by_organizationId", ["organizationId"])
		.index("by_productId_and_status", ["productId", "status"]),
});
