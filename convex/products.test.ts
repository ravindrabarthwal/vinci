import { describe, expect, test } from "vitest";
import { api, components } from "./_generated/api";
import { createTestContext } from "./test.setup";

const ONE_HOUR_MS = 3600000;

async function createTestUserWithOrg(t: ReturnType<typeof createTestContext>) {
	const now = Date.now();
	const validExpiresAt = now + ONE_HOUR_MS;

	const user = await t.mutation(components.betterAuth.adapter.create, {
		input: {
			model: "user",
			data: {
				name: "Test User",
				email: `test-${now}@example.com`,
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
				token: `token-${now}`,
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
				name: "Test Organization",
				slug: `test-org-${now}`,
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

	const authedContext = t.withIdentity({
		subject: user._id,
		sessionId: session._id,
	});

	return { user, session, org, authedContext };
}

describe("Products Module", () => {
	describe("Product CRUD", () => {
		test("can create a product", async () => {
			const t = createTestContext();
			const { org, authedContext } = await createTestUserWithOrg(t);

			const productId = await authedContext.mutation(api.products.create, {
				organizationId: org._id,
				name: "Test Product",
				description: "A test product",
				criticality: "medium",
				owners: ["owner@test.com"],
			});

			expect(productId).toBeTruthy();

			const product = await authedContext.query(api.products.get, {
				productId,
				organizationId: org._id,
			});

			expect(product).toMatchObject({
				name: "Test Product",
				description: "A test product",
				criticality: "medium",
				owners: ["owner@test.com"],
			});
		});

		test("can list products for organization", async () => {
			const t = createTestContext();
			const { org, authedContext } = await createTestUserWithOrg(t);

			await authedContext.mutation(api.products.create, {
				organizationId: org._id,
				name: "Product 1",
				criticality: "low",
				owners: [],
			});

			await authedContext.mutation(api.products.create, {
				organizationId: org._id,
				name: "Product 2",
				criticality: "high",
				owners: [],
			});

			const products = await authedContext.query(api.products.list, {
				organizationId: org._id,
			});

			expect(products).toHaveLength(2);
		});

		test("can update a product", async () => {
			const t = createTestContext();
			const { org, authedContext } = await createTestUserWithOrg(t);

			const productId = await authedContext.mutation(api.products.create, {
				organizationId: org._id,
				name: "Original Name",
				criticality: "low",
				owners: [],
			});

			await authedContext.mutation(api.products.update, {
				productId,
				organizationId: org._id,
				name: "Updated Name",
				criticality: "high",
			});

			const product = await authedContext.query(api.products.get, {
				productId,
				organizationId: org._id,
			});

			expect(product?.name).toBe("Updated Name");
			expect(product?.criticality).toBe("high");
		});

		test("can delete a product", async () => {
			const t = createTestContext();
			const { org, authedContext } = await createTestUserWithOrg(t);

			const productId = await authedContext.mutation(api.products.create, {
				organizationId: org._id,
				name: "To Delete",
				criticality: "low",
				owners: [],
			});

			await authedContext.mutation(api.products.remove, {
				productId,
				organizationId: org._id,
			});

			const product = await authedContext.query(api.products.get, {
				productId,
				organizationId: org._id,
			});

			expect(product).toBeNull();
		});
	});

	describe("Surface CRUD", () => {
		test("can create a surface for a product", async () => {
			const t = createTestContext();
			const { org, authedContext } = await createTestUserWithOrg(t);

			const productId = await authedContext.mutation(api.products.create, {
				organizationId: org._id,
				name: "Product with Surface",
				criticality: "medium",
				owners: [],
			});

			const surfaceId = await authedContext.mutation(api.products.createSurface, {
				productId,
				organizationId: org._id,
				name: "API Service",
				type: "service",
				location: "https://github.com/org/api-service",
			});

			expect(surfaceId).toBeTruthy();

			const surfaces = await authedContext.query(api.products.listSurfaces, {
				productId,
				organizationId: org._id,
			});

			expect(surfaces).toHaveLength(1);
			expect(surfaces[0]).toMatchObject({
				name: "API Service",
				type: "service",
				location: "https://github.com/org/api-service",
			});
		});

		test("can create surfaces with different types", async () => {
			const t = createTestContext();
			const { org, authedContext } = await createTestUserWithOrg(t);

			const productId = await authedContext.mutation(api.products.create, {
				organizationId: org._id,
				name: "Multi-Surface Product",
				criticality: "high",
				owners: [],
			});

			await authedContext.mutation(api.products.createSurface, {
				productId,
				organizationId: org._id,
				name: "Main Repo",
				type: "repo",
			});

			await authedContext.mutation(api.products.createSurface, {
				productId,
				organizationId: org._id,
				name: "Frontend App",
				type: "webapp",
			});

			await authedContext.mutation(api.products.createSurface, {
				productId,
				organizationId: org._id,
				name: "Background Worker",
				type: "worker",
			});

			const surfaces = await authedContext.query(api.products.listSurfaces, {
				productId,
				organizationId: org._id,
			});

			expect(surfaces).toHaveLength(3);
			const types = surfaces.map((s: { type: string }) => s.type);
			expect(types).toContain("repo");
			expect(types).toContain("webapp");
			expect(types).toContain("worker");
		});

		test("can update a surface", async () => {
			const t = createTestContext();
			const { org, authedContext } = await createTestUserWithOrg(t);

			const productId = await authedContext.mutation(api.products.create, {
				organizationId: org._id,
				name: "Product",
				criticality: "medium",
				owners: [],
			});

			const surfaceId = await authedContext.mutation(api.products.createSurface, {
				productId,
				organizationId: org._id,
				name: "Original Surface",
				type: "repo",
			});

			await authedContext.mutation(api.products.updateSurface, {
				surfaceId,
				organizationId: org._id,
				name: "Updated Surface",
				type: "service",
				location: "https://new-location.com",
			});

			const surfaces = await authedContext.query(api.products.listSurfaces, {
				productId,
				organizationId: org._id,
			});

			expect(surfaces[0]).toMatchObject({
				name: "Updated Surface",
				type: "service",
				location: "https://new-location.com",
			});
		});

		test("can delete a surface", async () => {
			const t = createTestContext();
			const { org, authedContext } = await createTestUserWithOrg(t);

			const productId = await authedContext.mutation(api.products.create, {
				organizationId: org._id,
				name: "Product",
				criticality: "medium",
				owners: [],
			});

			const surfaceId = await authedContext.mutation(api.products.createSurface, {
				productId,
				organizationId: org._id,
				name: "To Delete",
				type: "repo",
			});

			await authedContext.mutation(api.products.removeSurface, {
				surfaceId,
				organizationId: org._id,
			});

			const surfaces = await authedContext.query(api.products.listSurfaces, {
				productId,
				organizationId: org._id,
			});

			expect(surfaces).toHaveLength(0);
		});

		test("deleting product cascades to surfaces", async () => {
			const t = createTestContext();
			const { org, authedContext } = await createTestUserWithOrg(t);

			const productId = await authedContext.mutation(api.products.create, {
				organizationId: org._id,
				name: "Product with Surfaces",
				criticality: "medium",
				owners: [],
			});

			await authedContext.mutation(api.products.createSurface, {
				productId,
				organizationId: org._id,
				name: "Surface 1",
				type: "repo",
			});

			await authedContext.mutation(api.products.createSurface, {
				productId,
				organizationId: org._id,
				name: "Surface 2",
				type: "service",
			});

			await authedContext.mutation(api.products.remove, {
				productId,
				organizationId: org._id,
			});

			const product = await authedContext.query(api.products.get, {
				productId,
				organizationId: org._id,
			});

			expect(product).toBeNull();
		});
	});

	describe("Feature CRUD", () => {
		test("can create a feature for a product", async () => {
			const t = createTestContext();
			const { org, authedContext } = await createTestUserWithOrg(t);

			const productId = await authedContext.mutation(api.products.create, {
				organizationId: org._id,
				name: "Product with Feature",
				criticality: "medium",
				owners: [],
			});

			const featureId = await authedContext.mutation(api.products.createFeature, {
				productId,
				organizationId: org._id,
				title: "User Authentication",
				description: "Implement user auth flow",
				acceptanceCriteria: ["Users can sign up", "Users can log in", "Users can reset password"],
			});

			expect(featureId).toBeTruthy();

			const features = await authedContext.query(api.products.listFeatures, {
				productId,
				organizationId: org._id,
			});

			expect(features).toHaveLength(1);
			expect(features[0]).toMatchObject({
				title: "User Authentication",
				description: "Implement user auth flow",
				acceptanceCriteria: ["Users can sign up", "Users can log in", "Users can reset password"],
				source: "manual",
				status: "draft",
			});
		});

		test("can create feature with different statuses", async () => {
			const t = createTestContext();
			const { org, authedContext } = await createTestUserWithOrg(t);

			const productId = await authedContext.mutation(api.products.create, {
				organizationId: org._id,
				name: "Product",
				criticality: "medium",
				owners: [],
			});

			await authedContext.mutation(api.products.createFeature, {
				productId,
				organizationId: org._id,
				title: "Draft Feature",
				status: "draft",
			});

			await authedContext.mutation(api.products.createFeature, {
				productId,
				organizationId: org._id,
				title: "Ready Feature",
				status: "ready",
			});

			await authedContext.mutation(api.products.createFeature, {
				productId,
				organizationId: org._id,
				title: "In Progress Feature",
				status: "in_progress",
			});

			await authedContext.mutation(api.products.createFeature, {
				productId,
				organizationId: org._id,
				title: "Completed Feature",
				status: "completed",
			});

			const features = await authedContext.query(api.products.listFeatures, {
				productId,
				organizationId: org._id,
			});

			expect(features).toHaveLength(4);
			const statuses = features.map((f: { status: string }) => f.status);
			expect(statuses).toContain("draft");
			expect(statuses).toContain("ready");
			expect(statuses).toContain("in_progress");
			expect(statuses).toContain("completed");
		});

		test("can update a feature", async () => {
			const t = createTestContext();
			const { org, authedContext } = await createTestUserWithOrg(t);

			const productId = await authedContext.mutation(api.products.create, {
				organizationId: org._id,
				name: "Product",
				criticality: "medium",
				owners: [],
			});

			const featureId = await authedContext.mutation(api.products.createFeature, {
				productId,
				organizationId: org._id,
				title: "Original Title",
				status: "draft",
			});

			await authedContext.mutation(api.products.updateFeature, {
				featureId,
				organizationId: org._id,
				title: "Updated Title",
				description: "Now with description",
				status: "in_progress",
				acceptanceCriteria: ["Criterion 1", "Criterion 2"],
			});

			const features = await authedContext.query(api.products.listFeatures, {
				productId,
				organizationId: org._id,
			});

			expect(features[0]).toMatchObject({
				title: "Updated Title",
				description: "Now with description",
				status: "in_progress",
				acceptanceCriteria: ["Criterion 1", "Criterion 2"],
			});
		});

		test("can delete a feature", async () => {
			const t = createTestContext();
			const { org, authedContext } = await createTestUserWithOrg(t);

			const productId = await authedContext.mutation(api.products.create, {
				organizationId: org._id,
				name: "Product",
				criticality: "medium",
				owners: [],
			});

			const featureId = await authedContext.mutation(api.products.createFeature, {
				productId,
				organizationId: org._id,
				title: "To Delete",
			});

			await authedContext.mutation(api.products.removeFeature, {
				featureId,
				organizationId: org._id,
			});

			const features = await authedContext.query(api.products.listFeatures, {
				productId,
				organizationId: org._id,
			});

			expect(features).toHaveLength(0);
		});

		test("deleting product cascades to features", async () => {
			const t = createTestContext();
			const { org, authedContext } = await createTestUserWithOrg(t);

			const productId = await authedContext.mutation(api.products.create, {
				organizationId: org._id,
				name: "Product with Features",
				criticality: "medium",
				owners: [],
			});

			await authedContext.mutation(api.products.createFeature, {
				productId,
				organizationId: org._id,
				title: "Feature 1",
			});

			await authedContext.mutation(api.products.createFeature, {
				productId,
				organizationId: org._id,
				title: "Feature 2",
			});

			await authedContext.mutation(api.products.remove, {
				productId,
				organizationId: org._id,
			});

			const product = await authedContext.query(api.products.get, {
				productId,
				organizationId: org._id,
			});

			expect(product).toBeNull();
		});
	});

	describe("getWithRelations query", () => {
		test("returns product with surfaces and features", async () => {
			const t = createTestContext();
			const { org, authedContext } = await createTestUserWithOrg(t);

			const productId = await authedContext.mutation(api.products.create, {
				organizationId: org._id,
				name: "Full Product",
				description: "With relations",
				criticality: "high",
				owners: ["owner@test.com"],
			});

			await authedContext.mutation(api.products.createSurface, {
				productId,
				organizationId: org._id,
				name: "API Service",
				type: "service",
			});

			await authedContext.mutation(api.products.createSurface, {
				productId,
				organizationId: org._id,
				name: "Web App",
				type: "webapp",
			});

			await authedContext.mutation(api.products.createFeature, {
				productId,
				organizationId: org._id,
				title: "Authentication",
				status: "completed",
			});

			await authedContext.mutation(api.products.createFeature, {
				productId,
				organizationId: org._id,
				title: "Dashboard",
				status: "in_progress",
			});

			const productWithRelations = await authedContext.query(api.products.getWithRelations, {
				productId,
				organizationId: org._id,
			});

			expect(productWithRelations).toMatchObject({
				name: "Full Product",
				description: "With relations",
				criticality: "high",
			});
			expect(productWithRelations?.surfaces).toHaveLength(2);
			expect(productWithRelations?.features).toHaveLength(2);
		});

		test("returns null for non-existent product", async () => {
			const t = createTestContext();
			const { org, authedContext } = await createTestUserWithOrg(t);

			const productId = await authedContext.mutation(api.products.create, {
				organizationId: org._id,
				name: "Temp",
				criticality: "low",
				owners: [],
			});

			await authedContext.mutation(api.products.remove, {
				productId,
				organizationId: org._id,
			});

			const result = await authedContext.query(api.products.getWithRelations, {
				productId,
				organizationId: org._id,
			});

			expect(result).toBeNull();
		});
	});

	describe("Authorization", () => {
		test("throws error when accessing without authentication", async () => {
			const t = createTestContext();

			await expect(
				t.query(api.products.list, { organizationId: "fake-org-id" }),
			).rejects.toThrowError("Unauthorized");
		});

		test("throws error when accessing organization without membership", async () => {
			const t = createTestContext();
			const { authedContext } = await createTestUserWithOrg(t);

			const now = Date.now();
			const otherOrg = await t.mutation(components.betterAuth.adapter.create, {
				input: {
					model: "organization",
					data: {
						name: "Other Org",
						slug: `other-org-${now}`,
						createdAt: now,
					},
				},
			});

			await expect(
				authedContext.query(api.products.list, { organizationId: otherOrg._id }),
			).rejects.toThrowError("Access denied to organization");
		});
	});
});
