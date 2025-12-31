// Extracted to break circular dependency between auth.ts and betterAuth/adapter.ts

import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";
import { organization } from "better-auth/plugins";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import authConfig from "../auth.config";
import authSchema from "../betterAuth/schema";
import { createConvexLogger } from "./log";

const logger = createConvexLogger({ module: "auth-options" });

export const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

export const ORGANIZATION_CONFIG = {
	maxOrganizationsPerUser: 5,
} as const;

export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth, {
	local: {
		schema: authSchema,
	},
});

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
	return {
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		plugins: [
			convex({ authConfig }),
			organization({
				allowUserToCreateOrganization: async () => true,
				organizationLimit: ORGANIZATION_CONFIG.maxOrganizationsPerUser,
				async sendInvitationEmail(data) {
					const inviteLink = `${siteUrl}/invite/${data.id}`;
					logger.info("Invitation email requested", {
						email: data.email,
						organizationId: data.organization.id,
						organizationName: data.organization.name,
						invitedBy: data.inviter.user.email,
						role: data.role,
						inviteLink,
					});
					console.log(
						`\n📧 INVITATION EMAIL\n` +
							`To: ${data.email}\n` +
							`Organization: ${data.organization.name}\n` +
							`Invited by: ${data.inviter.user.email}\n` +
							`Role: ${data.role}\n` +
							`Link: ${inviteLink}\n`,
					);
				},
			}),
		],
	} satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	logger.debug("Creating auth instance", { siteUrl });
	return betterAuth(createAuthOptions(ctx));
};
