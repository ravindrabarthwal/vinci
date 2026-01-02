import { v } from "convex/values";
import { query } from "./_generated/server";
import { authComponent, createAuth, createAuthOptions } from "./lib/auth_options";
import { createConvexLogger } from "./lib/log";
import { getAuthenticatedUser, isAuthenticated } from "./model/auth";

const logger = createConvexLogger({ module: "auth" });

export { authComponent, createAuth, createAuthOptions };

export const getCurrentUser = query({
	args: {},
	returns: v.union(
		v.null(),
		v.object({
			_id: v.string(),
			_creationTime: v.number(),
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
		}),
	),
	handler: async (ctx) => {
		logger.debug("getCurrentUser called");
		const user = await getAuthenticatedUser(ctx);
		if (isAuthenticated(user)) {
			logger.info("User authenticated", { userId: user._id });
		} else {
			logger.debug("No authenticated user");
		}
		return user;
	},
});
