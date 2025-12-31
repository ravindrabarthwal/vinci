"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useActiveOrganization, useListOrganizations, useSession } from "@/lib/auth-client";

interface OrganizationContextValue {
	activeOrganization: ReturnType<typeof useActiveOrganization>["data"];
	organizations: ReturnType<typeof useListOrganizations>["data"];
	isLoading: boolean;
	hasOrganizations: boolean;
	needsOrganization: boolean;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

/**
 * Hook to access organization context.
 * Returns null if used outside of an authenticated context (no provider or no session).
 * This allows components to gracefully handle unauthenticated states.
 */
export function useOrganization(): OrganizationContextValue | null {
	return useContext(OrganizationContext);
}

/**
 * Hook that requires organization context to exist.
 * Throws if used outside OrganizationProvider or when user is not authenticated.
 * Use this only in components that are guaranteed to be within authenticated routes.
 */
export function useRequiredOrganization(): OrganizationContextValue {
	const context = useContext(OrganizationContext);
	if (!context) {
		throw new Error(
			"useRequiredOrganization must be used within OrganizationProvider with an authenticated session",
		);
	}
	return context;
}

interface OrganizationProviderProps {
	children: ReactNode;
	requireOrganization?: boolean;
}

/**
 * Provides organization context only when user is authenticated.
 * This prevents unnecessary API calls (get-session, list, get-full-organization)
 * for unauthenticated users on public pages.
 */
export function OrganizationProvider({
	children,
	requireOrganization = false,
}: OrganizationProviderProps) {
	const { data: session, isPending: sessionPending } = useSession();

	// Only render the inner provider when we have a session
	// This prevents org-related API calls for unauthenticated users
	if (sessionPending) {
		// During session check, render children without org context
		// This allows public pages to render immediately
		return <>{children}</>;
	}

	if (!session) {
		// No session = no org context needed
		// Public pages work fine, protected pages will redirect via their own logic
		return <>{children}</>;
	}

	// User is authenticated - provide full org context
	return (
		<AuthenticatedOrganizationProvider requireOrganization={requireOrganization}>
			{children}
		</AuthenticatedOrganizationProvider>
	);
}

/**
 * Inner provider that only mounts when user is authenticated.
 * This ensures useActiveOrganization and useListOrganizations
 * are only called for authenticated users.
 */
function AuthenticatedOrganizationProvider({
	children,
	requireOrganization,
}: OrganizationProviderProps) {
	const router = useRouter();
	const { data: activeOrganization, isPending: activePending } = useActiveOrganization();
	const { data: organizations, isPending: listPending } = useListOrganizations();

	const [hasRedirected, setHasRedirected] = useState(false);

	const isLoading = activePending || listPending;
	const hasOrganizations = (organizations?.length ?? 0) > 0;
	const needsOrganization = !isLoading && !hasOrganizations;

	useEffect(() => {
		if (requireOrganization && needsOrganization && !hasRedirected) {
			setHasRedirected(true);
			router.push("/org/new");
		}
	}, [requireOrganization, needsOrganization, hasRedirected, router]);

	const value: OrganizationContextValue = useMemo(
		() => ({
			activeOrganization,
			organizations,
			isLoading,
			hasOrganizations,
			needsOrganization,
		}),
		[activeOrganization, organizations, isLoading, hasOrganizations, needsOrganization],
	);

	return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}
