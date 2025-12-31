import { betterAuth } from "better-auth/minimal";
import { organization } from "better-auth/plugins";

// Static auth export for Better Auth CLI schema generation
// This file should ONLY be used for schema generation, not at runtime
export const auth = betterAuth({
	baseURL: "http://localhost:3000",
	secret: "schema-generation-placeholder-secret-32chars",
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
	},
	plugins: [
		organization({
			allowUserToCreateOrganization: async () => true,
			organizationLimit: 5,
		}),
	],
});
