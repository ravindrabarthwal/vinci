import type { GenericQueryCtx } from "convex/server";
import type { DataModel } from "../_generated/dataModel";
import { authComponent } from "../lib/auth_options";

type QueryCtx = GenericQueryCtx<DataModel>;

export type AuthUser = Awaited<ReturnType<typeof authComponent.safeGetAuthUser>>;

export async function getAuthenticatedUser(ctx: QueryCtx): Promise<AuthUser> {
	return await authComponent.safeGetAuthUser(ctx);
}

export function isAuthenticated(user: AuthUser): user is NonNullable<AuthUser> {
	return user != null;
}
