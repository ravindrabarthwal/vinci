"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { useActiveOrganization, useListOrganizations, useSession } from "@/lib/auth-client";

interface OrganizationContextValue {
	activeOrganization: ReturnType<typeof useActiveOrganization>["data"];
	organizations: ReturnType<typeof useListOrganizations>["data"];
	isLoading: boolean;
	hasOrganizations: boolean;
	needsOrganization: boolean;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function useOrganization() {
	const context = useContext(OrganizationContext);
	if (!context) {
		throw new Error("useOrganization must be used within OrganizationProvider");
	}
	return context;
}

interface OrganizationProviderProps {
	children: ReactNode;
	requireOrganization?: boolean;
}

export function OrganizationProvider({
	children,
	requireOrganization = false,
}: OrganizationProviderProps) {
	const router = useRouter();
	const { data: session, isPending: sessionPending } = useSession();
	const { data: activeOrganization, isPending: activePending } = useActiveOrganization();
	const { data: organizations, isPending: listPending } = useListOrganizations();

	const [hasRedirected, setHasRedirected] = useState(false);

	const isLoading = sessionPending || activePending || listPending;
	const hasOrganizations = (organizations?.length ?? 0) > 0;
	const needsOrganization = !isLoading && !!session && !hasOrganizations;

	useEffect(() => {
		if (requireOrganization && needsOrganization && !hasRedirected) {
			setHasRedirected(true);
			router.push("/org/new");
		}
	}, [requireOrganization, needsOrganization, hasRedirected, router]);

	const value: OrganizationContextValue = {
		activeOrganization,
		organizations,
		isLoading,
		hasOrganizations,
		needsOrganization,
	};

	return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}
