import { v } from "convex/values";
import { query } from "./_generated/server";
import { createConvexLogger } from "./lib/log";
import { getUserOrganizations, hasUserOrganizations } from "./model/organizations";

const logger = createConvexLogger({ module: "organizations" });

export const hasOrganizations = query({
	args: {},
	returns: v.boolean(),
	handler: async (ctx) => {
		const hasOrgs = await hasUserOrganizations(ctx);

		logger.debug("Checked user organizations", {
			hasOrgs,
		});

		return hasOrgs;
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
		const { organizations } = await getUserOrganizations(ctx);
		return organizations;
	},
});
