"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { OrganizationProvider } from "./organization-provider";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({
	children,
	initialToken,
	requireOrganization = false,
}: {
	children: ReactNode;
	initialToken?: string | null;
	requireOrganization?: boolean;
}) {
	return (
		<ConvexBetterAuthProvider client={convex} authClient={authClient} initialToken={initialToken}>
			<OrganizationProvider requireOrganization={requireOrganization}>
				{children}
			</OrganizationProvider>
		</ConvexBetterAuthProvider>
	);
}
