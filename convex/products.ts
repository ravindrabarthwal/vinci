import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, type QueryCtx, query } from "./_generated/server";
import { getAuthenticatedUser } from "./model/auth";
import { getUserOrganizations } from "./model/organizations";

export const criticalityValidator = v.union(
	v.literal("low"),
	v.literal("medium"),
	v.literal("high"),
);

export const surfaceTypeValidator = v.union(
	v.literal("repo"),
	v.literal("service"),
	v.literal("webapp"),
	v.literal("worker"),
	v.literal("infra"),
);

export const featureStatusValidator = v.union(
	v.literal("draft"),
	v.literal("ready"),
	v.literal("in_progress"),
	v.literal("completed"),
);

export const featureSourceValidator = v.union(v.literal("manual"), v.literal("jira"));

const productValidator = v.object({
	_id: v.id("product"),
	_creationTime: v.number(),
	organizationId: v.string(),
	name: v.string(),
	description: v.optional(v.union(v.null(), v.string())),
	criticality: criticalityValidator,
	owners: v.array(v.string()),
	createdAt: v.number(),
	updatedAt: v.number(),
});

const surfaceValidator = v.object({
	_id: v.id("surface"),
	_creationTime: v.number(),
	productId: v.id("product"),
	organizationId: v.string(),
	name: v.string(),
	type: surfaceTypeValidator,
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
});

const featureValidator = v.object({
	_id: v.id("feature"),
	_creationTime: v.number(),
	productId: v.id("product"),
	organizationId: v.string(),
	title: v.string(),
	description: v.optional(v.union(v.null(), v.string())),
	acceptanceCriteria: v.array(v.string()),
	source: featureSourceValidator,
	sourceKey: v.optional(v.union(v.null(), v.string())),
	status: featureStatusValidator,
	createdAt: v.number(),
	updatedAt: v.number(),
});

type Ctx = QueryCtx | MutationCtx;

async function requireOrgAccess(ctx: Ctx, organizationId: string): Promise<void> {
	const user = await getAuthenticatedUser(ctx);
	if (!user) {
		throw new Error("Unauthorized");
	}
	const { organizations } = await getUserOrganizations(ctx);
	const hasAccess = organizations.some((org) => org.id === organizationId);
	if (!hasAccess) {
		throw new Error("Access denied to organization");
	}
}

async function getProductWithAccess(ctx: Ctx, productId: Id<"product">, organizationId: string) {
	await requireOrgAccess(ctx, organizationId);
	const product = await ctx.db.get(productId);
	if (!product || product.organizationId !== organizationId) {
		return null;
	}
	return product;
}

async function requireProductAccess(ctx: Ctx, productId: Id<"product">, organizationId: string) {
	const product = await getProductWithAccess(ctx, productId, organizationId);
	if (!product) {
		throw new Error("Product not found");
	}
	return product;
}

async function requireSurfaceAccess(ctx: Ctx, surfaceId: Id<"surface">, organizationId: string) {
	await requireOrgAccess(ctx, organizationId);
	const surface = await ctx.db.get(surfaceId);
	if (!surface || surface.organizationId !== organizationId) {
		throw new Error("Surface not found");
	}
	return surface;
}

async function requireFeatureAccess(ctx: Ctx, featureId: Id<"feature">, organizationId: string) {
	await requireOrgAccess(ctx, organizationId);
	const feature = await ctx.db.get(featureId);
	if (!feature || feature.organizationId !== organizationId) {
		throw new Error("Feature not found");
	}
	return feature;
}

export const list = query({
	args: {
		organizationId: v.string(),
	},
	returns: v.array(productValidator),
	handler: async (ctx, args) => {
		await requireOrgAccess(ctx, args.organizationId);
		return await ctx.db
			.query("product")
			.withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
			.collect();
	},
});

export const get = query({
	args: {
		productId: v.id("product"),
		organizationId: v.string(),
	},
	returns: v.union(v.null(), productValidator),
	handler: async (ctx, args) => {
		return await getProductWithAccess(ctx, args.productId, args.organizationId);
	},
});

export const getWithRelations = query({
	args: {
		productId: v.id("product"),
		organizationId: v.string(),
	},
	returns: v.union(
		v.null(),
		v.object({
			...productValidator.fields,
			surfaces: v.array(surfaceValidator),
			features: v.array(featureValidator),
		}),
	),
	handler: async (ctx, args) => {
		const product = await getProductWithAccess(ctx, args.productId, args.organizationId);
		if (!product) {
			return null;
		}

		const surfaces = await ctx.db
			.query("surface")
			.withIndex("by_productId", (q) => q.eq("productId", args.productId))
			.collect();

		const features = await ctx.db
			.query("feature")
			.withIndex("by_productId", (q) => q.eq("productId", args.productId))
			.collect();

		return {
			...product,
			surfaces,
			features,
		};
	},
});

export const create = mutation({
	args: {
		organizationId: v.string(),
		name: v.string(),
		description: v.optional(v.union(v.null(), v.string())),
		criticality: criticalityValidator,
		owners: v.array(v.string()),
	},
	returns: v.id("product"),
	handler: async (ctx, args) => {
		await requireOrgAccess(ctx, args.organizationId);
		const now = Date.now();
		return await ctx.db.insert("product", {
			organizationId: args.organizationId,
			name: args.name,
			description: args.description ?? null,
			criticality: args.criticality,
			owners: args.owners,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const update = mutation({
	args: {
		productId: v.id("product"),
		organizationId: v.string(),
		name: v.optional(v.string()),
		description: v.optional(v.union(v.null(), v.string())),
		criticality: v.optional(criticalityValidator),
		owners: v.optional(v.array(v.string())),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireProductAccess(ctx, args.productId, args.organizationId);

		const updates: Partial<{
			name: string;
			description: string | null;
			criticality: "low" | "medium" | "high";
			owners: string[];
		}> = {};

		if (args.name !== undefined) updates.name = args.name;
		if (args.description !== undefined) updates.description = args.description;
		if (args.criticality !== undefined) updates.criticality = args.criticality;
		if (args.owners !== undefined) updates.owners = args.owners;

		await ctx.db.patch(args.productId, {
			...updates,
			updatedAt: Date.now(),
		});

		return null;
	},
});

export const remove = mutation({
	args: {
		productId: v.id("product"),
		organizationId: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireProductAccess(ctx, args.productId, args.organizationId);

		const surfaces = await ctx.db
			.query("surface")
			.withIndex("by_productId", (q) => q.eq("productId", args.productId))
			.collect();
		for (const surface of surfaces) {
			await ctx.db.delete(surface._id);
		}

		const features = await ctx.db
			.query("feature")
			.withIndex("by_productId", (q) => q.eq("productId", args.productId))
			.collect();
		for (const feature of features) {
			await ctx.db.delete(feature._id);
		}

		await ctx.db.delete(args.productId);
		return null;
	},
});

export const listSurfaces = query({
	args: {
		productId: v.id("product"),
		organizationId: v.string(),
	},
	returns: v.array(surfaceValidator),
	handler: async (ctx, args) => {
		await requireProductAccess(ctx, args.productId, args.organizationId);
		return await ctx.db
			.query("surface")
			.withIndex("by_productId", (q) => q.eq("productId", args.productId))
			.collect();
	},
});

export const createSurface = mutation({
	args: {
		productId: v.id("product"),
		organizationId: v.string(),
		name: v.string(),
		type: surfaceTypeValidator,
		location: v.optional(v.union(v.null(), v.string())),
		environments: v.optional(
			v.object({
				dev: v.optional(v.string()),
				test: v.optional(v.string()),
				staging: v.optional(v.string()),
				prod: v.optional(v.string()),
			}),
		),
		externalId: v.optional(v.union(v.null(), v.string())),
	},
	returns: v.id("surface"),
	handler: async (ctx, args) => {
		await requireProductAccess(ctx, args.productId, args.organizationId);
		const now = Date.now();
		return await ctx.db.insert("surface", {
			productId: args.productId,
			organizationId: args.organizationId,
			name: args.name,
			type: args.type,
			location: args.location ?? null,
			environments: args.environments ?? {},
			externalId: args.externalId ?? null,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const updateSurface = mutation({
	args: {
		surfaceId: v.id("surface"),
		organizationId: v.string(),
		name: v.optional(v.string()),
		type: v.optional(surfaceTypeValidator),
		location: v.optional(v.union(v.null(), v.string())),
		environments: v.optional(
			v.object({
				dev: v.optional(v.string()),
				test: v.optional(v.string()),
				staging: v.optional(v.string()),
				prod: v.optional(v.string()),
			}),
		),
		externalId: v.optional(v.union(v.null(), v.string())),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireSurfaceAccess(ctx, args.surfaceId, args.organizationId);

		const updates: Partial<{
			name: string;
			type: "repo" | "service" | "webapp" | "worker" | "infra";
			location: string | null;
			environments: {
				dev?: string;
				test?: string;
				staging?: string;
				prod?: string;
			};
			externalId: string | null;
		}> = {};

		if (args.name !== undefined) updates.name = args.name;
		if (args.type !== undefined) updates.type = args.type;
		if (args.location !== undefined) updates.location = args.location;
		if (args.environments !== undefined) updates.environments = args.environments;
		if (args.externalId !== undefined) updates.externalId = args.externalId;

		await ctx.db.patch(args.surfaceId, {
			...updates,
			updatedAt: Date.now(),
		});

		return null;
	},
});

export const removeSurface = mutation({
	args: {
		surfaceId: v.id("surface"),
		organizationId: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireSurfaceAccess(ctx, args.surfaceId, args.organizationId);
		await ctx.db.delete(args.surfaceId);
		return null;
	},
});

export const listFeatures = query({
	args: {
		productId: v.id("product"),
		organizationId: v.string(),
	},
	returns: v.array(featureValidator),
	handler: async (ctx, args) => {
		await requireProductAccess(ctx, args.productId, args.organizationId);
		return await ctx.db
			.query("feature")
			.withIndex("by_productId", (q) => q.eq("productId", args.productId))
			.collect();
	},
});

export const createFeature = mutation({
	args: {
		productId: v.id("product"),
		organizationId: v.string(),
		title: v.string(),
		description: v.optional(v.union(v.null(), v.string())),
		acceptanceCriteria: v.optional(v.array(v.string())),
		source: v.optional(featureSourceValidator),
		sourceKey: v.optional(v.union(v.null(), v.string())),
		status: v.optional(featureStatusValidator),
	},
	returns: v.id("feature"),
	handler: async (ctx, args) => {
		await requireProductAccess(ctx, args.productId, args.organizationId);
		const now = Date.now();
		return await ctx.db.insert("feature", {
			productId: args.productId,
			organizationId: args.organizationId,
			title: args.title,
			description: args.description ?? null,
			acceptanceCriteria: args.acceptanceCriteria ?? [],
			source: args.source ?? "manual",
			sourceKey: args.sourceKey ?? null,
			status: args.status ?? "draft",
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const updateFeature = mutation({
	args: {
		featureId: v.id("feature"),
		organizationId: v.string(),
		title: v.optional(v.string()),
		description: v.optional(v.union(v.null(), v.string())),
		acceptanceCriteria: v.optional(v.array(v.string())),
		source: v.optional(featureSourceValidator),
		sourceKey: v.optional(v.union(v.null(), v.string())),
		status: v.optional(featureStatusValidator),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireFeatureAccess(ctx, args.featureId, args.organizationId);

		const updates: Partial<{
			title: string;
			description: string | null;
			acceptanceCriteria: string[];
			source: "manual" | "jira";
			sourceKey: string | null;
			status: "draft" | "ready" | "in_progress" | "completed";
		}> = {};

		if (args.title !== undefined) updates.title = args.title;
		if (args.description !== undefined) updates.description = args.description;
		if (args.acceptanceCriteria !== undefined) updates.acceptanceCriteria = args.acceptanceCriteria;
		if (args.source !== undefined) updates.source = args.source;
		if (args.sourceKey !== undefined) updates.sourceKey = args.sourceKey;
		if (args.status !== undefined) updates.status = args.status;

		await ctx.db.patch(args.featureId, {
			...updates,
			updatedAt: Date.now(),
		});

		return null;
	},
});

export const removeFeature = mutation({
	args: {
		featureId: v.id("feature"),
		organizationId: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireFeatureAccess(ctx, args.featureId, args.organizationId);
		await ctx.db.delete(args.featureId);
		return null;
	},
});
