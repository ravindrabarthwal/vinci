"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { useOrganization } from "@/components/providers/organization-provider";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const { data: session, isPending } = useSession();
	const orgContext = useOrganization();

	const orgLoading = orgContext?.isLoading ?? true;
	const hasOrganizations = orgContext?.hasOrganizations ?? false;
	const isOrgNewPage = pathname === "/org/new";

	useEffect(() => {
		if (!isPending && !session) {
			router.push("/login");
		}
	}, [session, isPending, router]);

	useEffect(() => {
		if (!isPending && !orgLoading && session && !hasOrganizations && !isOrgNewPage) {
			router.push("/org/new");
		}
	}, [session, isPending, orgLoading, hasOrganizations, isOrgNewPage, router]);

	if (isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p>Loading...</p>
			</div>
		);
	}

	if (!session) {
		return null;
	}

	if (isOrgNewPage && !hasOrganizations) {
		return <>{children}</>;
	}

	if (orgLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p>Loading...</p>
			</div>
		);
	}

	if (!hasOrganizations) {
		return null;
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-14 items-center gap-2 border-b px-4">
					<SidebarTrigger />
				</header>
				<main className="flex-1 p-4">{children}</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
