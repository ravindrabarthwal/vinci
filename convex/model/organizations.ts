import type { GenericQueryCtx } from "convex/server";
import type { DataModel } from "../_generated/dataModel";
import { components } from "../_generated/api";
import { authComponent } from "../lib/auth_options";

type QueryCtx = GenericQueryCtx<DataModel>;

export type OrganizationInfo = {
	id: string;
	name: string;
	slug: string;
};

export type UserOrganizationsResult = {
	user: Awaited<ReturnType<typeof authComponent.getAuthUser>> | null;
	organizations: Array<OrganizationInfo>;
};

export async function getUserOrganizations(ctx: QueryCtx): Promise<UserOrganizationsResult> {
	const user = await authComponent.safeGetAuthUser(ctx);
	if (!user) {
		return { user: null, organizations: [] };
	}

	const membershipsResult = await ctx.runQuery(components.betterAuth.adapter.findMany, {
		model: "member",
		where: [{ field: "userId", value: user._id }],
		paginationOpts: { numItems: 100, cursor: null },
	});

	const memberships = membershipsResult.page;
	if (memberships.length === 0) {
		return { user, organizations: [] };
	}

	const organizationIds = memberships.map((m: { organizationId: string }) => m.organizationId);

	const organizations: OrganizationInfo[] = [];
	for (const orgId of organizationIds) {
		const org = await ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: "organization",
			where: [{ field: "_id", value: orgId }],
		});
		if (org) {
			organizations.push({
				id: org._id as string,
				name: org.name as string,
				slug: org.slug as string,
			});
		}
	}

	return { user, organizations };
}

export async function hasUserOrganizations(ctx: QueryCtx): Promise<boolean> {
	const { organizations } = await getUserOrganizations(ctx);
	return organizations.length > 0;
}
