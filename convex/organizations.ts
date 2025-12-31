import { v } from "convex/values";
import { query } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { createConvexLogger } from "./lib/log";

const logger = createConvexLogger({ module: "organizations" });

export const hasOrganizations = query({
	args: {},
	returns: v.boolean(),
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			return false;
		}

		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		const orgsResult = await auth.api.listOrganizations({ headers });

		logger.debug("Checked user organizations", {
			userId: user._id,
			hasOrgs: orgsResult.length > 0,
			count: orgsResult.length,
		});

		return orgsResult.length > 0;
	},
});

export const listUserOrganizations = query({
	args: {},
	returns: v.array(
		v.object({
			id: v.string(),
			name: v.string(),
			slug: v.string(),
		}),
	),
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) {
			return [];
		}

		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		const orgsResult = await auth.api.listOrganizations({ headers });

		return orgsResult.map((org) => ({
			id: org.id,
			name: org.name,
			slug: org.slug,
		}));
	},
});
