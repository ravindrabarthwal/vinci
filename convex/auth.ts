import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import { createConvexLogger } from "./lib/log";

const logger = createConvexLogger({ module: "auth" });

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
const authSecret = process.env.BETTER_AUTH_SECRET;

if (!authSecret) {
	throw new Error(
		"BETTER_AUTH_SECRET is required. Set it in your Convex dashboard environment variables.",
	);
}

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	logger.debug("Creating auth instance", { siteUrl });
	return betterAuth({
		baseURL: siteUrl,
		secret: authSecret,
		database: authComponent.adapter(ctx),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		plugins: [convex({ authConfig })],
	});
};

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		logger.debug("getCurrentUser called");
		const user = await authComponent.getAuthUser(ctx);
		if (user) {
			logger.info("User authenticated", { userId: user._id });
		} else {
			logger.debug("No authenticated user");
		}
		return user;
	},
});
