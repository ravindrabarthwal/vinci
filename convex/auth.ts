import { query } from "./_generated/server";
import { authComponent, createAuth, createAuthOptions } from "./lib/auth_options";
import { createConvexLogger } from "./lib/log";
import { getAuthenticatedUser, isAuthenticated } from "./model/auth";

const logger = createConvexLogger({ module: "auth" });

export { authComponent, createAuth, createAuthOptions };

export const getCurrentUser = query({
	args: {},
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
