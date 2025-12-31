import type { GenericQueryCtx } from "convex/server";
import type { DataModel } from "../_generated/dataModel";
import { authComponent, createAuth } from "../lib/auth-options";

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
	const user = await authComponent.getAuthUser(ctx);
	if (!user) {
		return { user: null, organizations: [] };
	}

	const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
	const orgsResult = await auth.api.listOrganizations({ headers });

	const organizations = orgsResult.map((org) => ({
		id: org.id,
		name: org.name,
		slug: org.slug,
	}));

	return { user, organizations };
}

export async function hasUserOrganizations(ctx: QueryCtx): Promise<boolean> {
	const { organizations } = await getUserOrganizations(ctx);
	return organizations.length > 0;
}
