/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import schema from "./schema";
// Use LOCAL betterAuth schema that includes organization tables
import betterAuthSchema from "./betterAuth/schema";

export const modules = import.meta.glob("./**/!(*.*.*)*.*s");

const betterAuthModules = import.meta.glob("./betterAuth/**/!(*.*.*)*.*s");

export function createTestContext() {
	const t = convexTest(schema, modules);
	// Register component with LOCAL schema (includes organization, member, invitation tables)
	// The default @convex-dev/better-auth/test helper only registers base schema without org tables
	t.registerComponent("betterAuth", betterAuthSchema, betterAuthModules);
	return t;
}

export type TestUserData = {
	name: string;
	email: string;
	emailVerified: boolean;
	createdAt: number;
	updatedAt: number;
	image?: string | null;
	username?: string | null;
	displayUsername?: string | null;
};

export type TestSessionData = {
	userId: string;
	token: string;
	expiresAt: number;
	createdAt: number;
	updatedAt: number;
	ipAddress?: string | null;
	userAgent?: string | null;
};

export type TestOrganizationData = {
	name: string;
	slug: string;
	createdAt: number;
	logo?: string | null;
	metadata?: string | null;
};

export type TestMemberData = {
	organizationId: string;
	userId: string;
	role: string;
	createdAt: number;
};
